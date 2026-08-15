<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Validate Secret API Key
$headers = function_exists('getallheaders') ? getallheaders() : [];
$apiKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';

const PROXY_SECRET_KEY = 'ZopitPay2026Key';

if ($apiKey !== PROXY_SECRET_KEY) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing X-Api-Key'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Read Request Body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

// 3. Determine Action:
// If action is not in body, detect from REQUEST_URI: if contains 'verify' -> 'verify', else -> 'request'
$action = $data['action'] ?? null;

if (empty($action)) {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    if (stripos($requestUri, 'verify') !== false) {
        $action = 'verify';
    } else {
        $action = 'request';
    }
}

// Default fallback merchant if not provided
$merchant = !empty($data['merchant']) ? $data['merchant'] : 'zibal';

if ($action === 'verify') {
    // ----------------------------------------------------
    // VERIFY PAYMENT
    // ----------------------------------------------------
    $trackId = $data['trackId'] ?? $data['authority'] ?? '';
    
    $zibalPayload = [
        'merchant' => $merchant,
        'trackId'  => (string)$trackId
    ];

    $zibalUrl = 'https://gateway.zibal.ir/v1/verify';
} else {
    // ----------------------------------------------------
    // REQUEST PAYMENT
    // ----------------------------------------------------
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

// 4. Send request to Zibal Gateway API
$ch = curl_init($zibalUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($zibalPayload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'cURL Error: ' . $curlError
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$decodedResponse = json_decode($result, true) ?: [];

// Add helper fields if request was successful
if (isset($decodedResponse['trackId']) && !isset($decodedResponse['payLink'])) {
    $decodedResponse['payLink'] = 'https://gateway.zibal.ir/start/' . $decodedResponse['trackId'];
}
if (isset($decodedResponse['result']) && (int)$decodedResponse['result'] === 100) {
    $decodedResponse['success'] = true;
}

http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);
echo json_encode($decodedResponse, JSON_UNESCAPED_UNICODE);
