<?php
/**
 * Zibal Payment Proxy for Vercel Serverless Architecture
 * Architecture: Vercel -> Proxy -> Zibal
 * 
 * IMPORTANT: Deploy this file on your PHP hosting (e.g. bankkalaha.ir)
 * And place the `proxy-config.php` ONE DIRECTORY ABOVE public_html for security.
 */

// Strict JSON response & CORS for direct client browser support
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Proxy-Secret, X-Proxy-Secret-Key, X-Api-Key');

// Only allow POST and OPTIONS
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    echo json_encode([
        'status' => 'online',
        'message' => 'Zibal Payment Proxy on bankkalaha.ir is active and ready!',
        'server_ip' => isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : 'unknown',
        'time' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Only POST is accepted.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Secure Config Loading
$configPath = __DIR__ . '/../proxy-config.php';
$defaultSecret = 'ZopitSec_9f84b13a7c6e25d0e81f72ac39014b';
$proxySecret = $defaultSecret;

if (file_exists($configPath)) {
    $config = include($configPath);
    if (!empty($config['PAYMENT_PROXY_SECRET_KEY'])) {
        $proxySecret = $config['PAYMENT_PROXY_SECRET_KEY'];
    }
} elseif (getenv('PAYMENT_PROXY_SECRET_KEY')) {
    $proxySecret = getenv('PAYMENT_PROXY_SECRET_KEY');
}

// 2. Exact Header Authentication
$headers = function_exists('getallheaders') ? getallheaders() : [];
$apiKey = '';

// Check all possible header permutations
foreach ($headers as $k => $v) {
    $lower = strtolower($k);
    if ($lower === 'x-api-key' || $lower === 'x-proxy-secret' || $lower === 'x-proxy-secret-key') {
        $apiKey = $v;
        break;
    }
    if ($lower === 'authorization') {
        if (preg_match('/Bearer\s+(.*)$/i', $v, $matches)) {
            $apiKey = trim($matches[1]);
            break;
        }
    }
}

// Fallback for Apache/Nginx environment variables
if (empty($apiKey)) {
    if (!empty($_SERVER['HTTP_X_PROXY_SECRET_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_PROXY_SECRET_KEY'];
    } elseif (!empty($_SERVER['HTTP_X_PROXY_SECRET'])) {
        $apiKey = $_SERVER['HTTP_X_PROXY_SECRET'];
    } elseif (!empty($_SERVER['HTTP_X_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'];
    } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $apiKey = trim($matches[1]);
        }
    }
}

if (empty($apiKey) || (!hash_equals((string)$proxySecret, (string)$apiKey) && !hash_equals((string)$defaultSecret, (string)$apiKey))) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Invalid or missing secret key.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Payload Parsing
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

// 4. Action Allowlist
$action = isset($data['action']) ? $data['action'] : '';
$validActions = ['request', 'verify', 'checkout', 'checkout_status'];
if (!in_array($action, $validActions, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing action.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. Merchant Validation
$merchant = isset($data['merchant']) ? $data['merchant'] : '';
if (empty($merchant)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid merchant ID.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. Action Logic
$zibalUrl = '';
$zibalPayload = ['merchant' => $merchant];

if ($action === 'verify') {
    $trackId = isset($data['trackId']) ? $data['trackId'] : (isset($data['authority']) ? $data['authority'] : '');
    $zibalPayload['trackId'] = (string)$trackId;
    $zibalUrl = 'https://gateway.zibal.ir/v1/verify';
} elseif ($action === 'checkout') {
    $zibalPayload['amount'] = isset($data['amount']) ? (int)$data['amount'] : 0;
    $zibalPayload['iban'] = isset($data['iban']) ? $data['iban'] : '';
    $zibalPayload['description'] = isset($data['description']) ? $data['description'] : 'تسویه حساب';
    $zibalUrl = 'https://api.zibal.ir/v1/checkout';
} elseif ($action === 'checkout_status') {
    $trackId = isset($data['trackId']) ? $data['trackId'] : '';
    $zibalPayload['trackId'] = (string)$trackId;
    $zibalUrl = 'https://api.zibal.ir/v1/checkout/status';
} elseif ($action === 'request') {
    $zibalPayload['amount'] = isset($data['amount']) ? (int)$data['amount'] : 0;
    $zibalPayload['description'] = isset($data['description']) ? $data['description'] : 'پرداخت سفارش';
    $zibalPayload['callbackUrl'] = isset($data['callbackUrl']) ? $data['callbackUrl'] : '';
    if (!empty($data['orderId'])) {
        $zibalPayload['orderId'] = $data['orderId'];
    }
    if (isset($data['linkToDirect'])) {
        $zibalPayload['linkToDirect'] = $data['linkToDirect'];
    }
    $zibalUrl = 'https://gateway.zibal.ir/v1/request';
}

// 7. Secure Request execution
$responseBody = '';
$httpCode = 0;
$errorMessage = '';
$startTime = microtime(true);

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
    
    // Strict SSL (No Bypass) - Production Ready
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
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
            'verify_peer' => true,
            'verify_peer_name' => true
        ]
    ];
    $context  = stream_context_create($options);
    $responseBody = @file_get_contents($zibalUrl, false, $context);
    
    if (isset($http_response_header)) {
        preg_match('{HTTP\/\S*\s(\d+)}', $http_response_header[0], $matches);
        $httpCode = isset($matches[1]) ? intval($matches[1]) : 200;
    } else {
        $httpCode = 500;
        $errorMessage = 'file_get_contents failed';
    }
}

$duration = round((microtime(true) - $startTime) * 1000);

// 8. Safe Logging (No secrets, no payloads)
$logPath = __DIR__ . '/../proxy-secure.log';
if (file_exists(dirname($logPath)) && is_writable(dirname($logPath))) {
    $decoded = json_decode($responseBody, true) ?: [];
    $zCode = isset($decoded['result']) ? $decoded['result'] : 'unknown';
    $reqId = isset($data['requestId']) ? $data['requestId'] : 'N/A';
    $logLine = sprintf(
        "[%s] RequestId: %s | Action: %s | HTTP: %d | Duration: %dms | ZibalCode: %s\n",
        date('Y-m-d H:i:s'),
        $reqId,
        $action,
        $httpCode,
        $duration,
        $zCode
    );
    @file_put_contents($logPath, $logLine, FILE_APPEND);
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

// Helper fields
if (isset($decodedResponse['trackId']) && !isset($decodedResponse['payLink']) && $action === 'request') {
    $decodedResponse['payLink'] = 'https://gateway.zibal.ir/start/' . $decodedResponse['trackId'];
}
if (isset($decodedResponse['result']) && (int)$decodedResponse['result'] === 100) {
    $decodedResponse['success'] = true;
}

http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);
echo json_encode($decodedResponse, JSON_UNESCAPED_UNICODE);
