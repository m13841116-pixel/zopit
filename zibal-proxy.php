<?php
// Enable error reporting only if ?debug=1 is passed
if (isset($_GET['debug']) && $_GET['debug'] === '1') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Validate Secret API Key
$headers = function_exists('getallheaders') ? getallheaders() : [];
$apiKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['x-api-key'] ?? '';

// Also check query param for key if debug is on
if (empty($apiKey) && isset($_GET['key'])) {
    $apiKey = $_GET['key'];
}

const PROXY_SECRET_KEY = 'ZopitPay2026Key';

if ($apiKey !== PROXY_SECRET_KEY) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing X-Api-Key. Received: ' . substr($apiKey, 0, 5) . '...'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Read Request Body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

// If GET request or empty data, allow testing via query parameters
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($data)) {
    $data = $_GET;
}

// 3. Determine Action:
$action = $data['action'] ?? null;

if (empty($action)) {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (stripos($requestUri, 'verify') !== false) {
        $action = 'verify';
    } else {
        $action = 'request';
    }
}

$merchant = !empty($data['merchant']) ? $data['merchant'] : 'zibal';

if ($action === 'verify') {
    $trackId = $data['trackId'] ?? $data['authority'] ?? '';
    $zibalPayload = [
        'merchant' => $merchant,
        'trackId'  => (string)$trackId
    ];
    $zibalUrl = 'https://gateway.zibal.ir/v1/verify';
} elseif ($action === 'checkout') {
    $amount = isset($data['amount']) ? (int)$data['amount'] : 0;
    $iban = $data['iban'] ?? '';
    $description = $data['description'] ?? 'تسویه حساب';
    $zibalPayload = [
        'merchant' => $merchant,
        'amount' => $amount,
        'iban' => $iban,
        'description' => $description
    ];
    $zibalUrl = 'https://api.zibal.ir/v1/checkout';
} else {
    $amount = isset($data['amount']) ? (int)$data['amount'] : 0;
    $callbackUrl = $data['callbackUrl'] ?? '';
    $description = $data['description'] ?? 'پرداخت سفارش';
    $orderId = $data['orderId'] ?? null;

    $zibalPayload = [
        'merchant'    => $merchant,
        'amount'      => $amount,
        'callbackUrl' => $callbackUrl,
        'description' => $description
    ];

    if (!empty($orderId)) {
        $zibalPayload['orderId'] = $orderId;
    }

    $zibalUrl = 'https://gateway.zibal.ir/v1/request';
}

// 4. Send request to Zibal Gateway API (with Curl or file_get_contents fallback)
$responseBody = '';
$httpCode = 0;
$errorMessage = '';

if (function_exists('curl_init')) {
    $ch = curl_init($zibalUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($zibalPayload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL check for compatibility
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errorMessage = curl_error($ch);
    curl_close($ch);
} else {
    // Fallback to file_get_contents
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($zibalPayload),
            'timeout' => 30,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $context  = stream_context_create($options);
    $responseBody = @file_get_contents($zibalUrl, false, $context);
    
    if (isset($http_response_header)) {
        preg_match('{HTTP\/\S*\s(\d+)}', $http_response_header[0], $matches);
        $httpCode = isset($matches[1]) ? intval($matches[1]) : 200;
    } else {
        $httpCode = 500;
        $errorMessage = 'file_get_contents failed to fetch URL';
    }
}

if (empty($responseBody) && !empty($errorMessage)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Proxy Error: ' . $errorMessage
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($responseBody)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Empty response from Zibal gateway.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$decodedResponse = json_decode($responseBody, true) ?: [];

// Add helper fields if request was successful
if (isset($decodedResponse['trackId']) && !isset($decodedResponse['payLink'])) {
    $decodedResponse['payLink'] = 'https://gateway.zibal.ir/start/' . $decodedResponse['trackId'];
}
if (isset($decodedResponse['result']) && (int)$decodedResponse['result'] === 100) {
    $decodedResponse['success'] = true;
}

http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);
echo json_encode($decodedResponse, JSON_UNESCAPED_UNICODE);
