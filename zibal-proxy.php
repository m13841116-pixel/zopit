<?php
/**
 * Zibal Payment Gateway Production Proxy
 * Domain: bankkalaha.ir
 * Secret: ZopitPay2026Key
 */

// Enable error reporting only if ?debug=1 is passed
if (isset($_GET['debug']) && $_GET['debug'] === '1') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// 0. Intercept Zibal Callback Redirect (No API key check needed for browser redirects)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['vercelUrl'])) {
    $vercelUrl = $_GET['vercelUrl'];
    $queryParams = $_GET;
    unset($queryParams['vercelUrl']);
    
    // Construct target URL and redirect user's browser back to Vercel/App
    $separator = (strpos($vercelUrl, '?') !== false) ? '&' : '?';
    $redirectUrl = rtrim($vercelUrl, '/') . $separator . http_build_query($queryParams);
    
    header("Location: " . $redirectUrl);
    exit;
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

// Also check query param for key
if (empty($apiKey) && isset($_GET['key'])) {
    $apiKey = $_GET['key'];
}

const PROXY_SECRET_KEY = 'ZopitPay2026Key';

if ($apiKey !== PROXY_SECRET_KEY) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing X-Api-Key.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Read Request Body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($data)) {
    $data = $_GET;
}

// 3. Determine Action
$action = $data['action'] ?? null;
if (empty($action)) {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (stripos($requestUri, 'verify') !== false) {
        $action = 'verify';
    } else {
        $action = 'request';
    }
}

// 4. Validate Merchant Code (Ensure Production Mode)
$merchant = !empty($data['merchant']) ? trim($data['merchant']) : '';
if (empty($merchant)) {
    // If not provided in body, check environment or fallback to default
    $merchant = 'zibal';
}

// 5. Handle Actions
if ($action === 'verify') {
    $trackId = $data['trackId'] ?? $data['authority'] ?? '';
    if (empty($trackId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'result' => -1,
            'message' => 'شناسه پیگیری (trackId) الزامی است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

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
    // Action: REQUEST
    $amount = isset($data['amount']) ? (int)$data['amount'] : 0;
    $rawCallbackUrl = $data['callbackUrl'] ?? '';
    $description = $data['description'] ?? 'پرداخت سفارش';
    $orderId = $data['orderId'] ?? null;

    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'result' => 113,
            'message' => 'مبلغ پرداختی نامعتبر است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Determine current proxy host and scheme
    $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'https';
    $host = $_SERVER['HTTP_HOST'] ?? 'bankkalaha.ir';
    $proxyBase = $scheme . '://' . $host . '/zibal-proxy.php';

    // Wrap callbackUrl through proxy if not already wrapped to guarantee domain match (fixes error 106)
    $finalCallbackUrl = $rawCallbackUrl;
    if (!empty($rawCallbackUrl)) {
        if (strpos($rawCallbackUrl, 'zibal-proxy.php') === false) {
            $finalCallbackUrl = $proxyBase . '?vercelUrl=' . urlencode($rawCallbackUrl);
        }
    } else {
        $finalCallbackUrl = $proxyBase;
    }

    $zibalPayload = [
        'merchant'    => $merchant,
        'amount'      => $amount,
        'callbackUrl' => $finalCallbackUrl,
        'description' => $description
    ];

    if (!empty($orderId)) {
        $zibalPayload['orderId'] = $orderId;
    }

    if (!empty($data['linkToDirect'])) {
        $zibalPayload['linkToDirect'] = $data['linkToDirect'];
    }

    $zibalUrl = 'https://gateway.zibal.ir/v1/request';
}

// 6. Send Request to Zibal Gateway Production API
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
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errorMessage = curl_error($ch);
    curl_close($ch);
} else {
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
    $context = stream_context_create($options);
    $responseBody = @file_get_contents($zibalUrl, false, $context);
    
    if (isset($http_response_header)) {
        preg_match('{HTTP\/\S*\s(\d+)}', $http_response_header[0], $matches);
        $httpCode = isset($matches[1]) ? intval($matches[1]) : 200;
    } else {
        $httpCode = 500;
        $errorMessage = 'file_get_contents failed to connect to Zibal API';
    }
}

if (empty($responseBody) && !empty($errorMessage)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'result' => -1,
        'error' => 'Proxy Connection Error: ' . $errorMessage
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($responseBody)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'result' => -1,
        'error' => 'Empty response received from Zibal gateway.'
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

