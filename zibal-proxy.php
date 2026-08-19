<?php
/**
 * Zibal Payment Gateway Production Proxy with Diagnostic & Logging Engine
 * Domain: bankkalaha.ir
 * Secret: ZopitPay2026Key
 */

ini_set('display_errors', 0);
error_reporting(0);

const PROXY_SECRET_KEY = 'ZopitPay2026Key';
$logFile = __DIR__ . '/zibal-debug.log';

function logZibalDebug($tag, $data) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $content = is_array($data) || is_object($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) : $data;
    $entry = "[{$timestamp}] [{$tag}]\n{$content}\n" . str_repeat('-', 60) . "\n";
    @file_put_contents($logFile, $entry, FILE_APPEND);
}

function extractApiKey() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $apiKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-Proxy-Secret'] ?? $headers['x-proxy-secret'] ?? $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';
    
    if (empty($apiKey) && !empty($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.+)/i', $headers['Authorization'], $matches)) {
            $apiKey = trim($matches[1]);
        }
    }
    return $apiKey;
}

function isAllowedRedirectUrl($url) {
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) return false;
    $host = strtolower($host);
    return (
        $host === 'zopit.ir' ||
        substr($host, -9) === '.zopit.ir' ||
        substr($host, -11) === '.vercel.app' ||
        substr($host, -11) === '.run.app' ||
        $host === 'localhost' ||
        $host === '127.0.0.1'
    );
}

// 0. Intercept Zibal Callback Redirect (Allowlist protected)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['vercelUrl'])) {
    $vercelUrl = $_GET['vercelUrl'];
    
    if (!isAllowedRedirectUrl($vercelUrl)) {
        http_response_code(400);
        echo "Invalid or unauthorized redirect URL.";
        exit;
    }
    
    $queryParams = $_GET;
    unset($queryParams['vercelUrl']);
    
    $separator = (strpos($vercelUrl, '?') !== false) ? '&' : '?';
    $redirectUrl = rtrim($vercelUrl, '/') . $separator . http_build_query($queryParams);
    
    logZibalDebug('CALLBACK_REDIRECT', [
        'vercelUrl' => $vercelUrl,
        'finalRedirect' => $redirectUrl,
        'params' => $queryParams
    ]);

    header("Location: " . $redirectUrl);
    exit;
}

// 0.1 Log Viewer (Protected by Header-based API Key)
if (isset($_GET['action']) && $_GET['action'] === 'get_logs') {
    $apiKey = extractApiKey();
    if (empty($apiKey) || !hash_equals(PROXY_SECRET_KEY, $apiKey)) {
        http_response_code(403);
        echo 'Access Denied: Invalid or missing authentication header.';
        exit;
    }
    header('Content-Type: text/plain; charset=utf-8');
    if (file_exists($logFile)) {
        echo file_get_contents($logFile);
    } else {
        echo "هنوز لاگی ثبت نشده است.";
    }
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, X-Proxy-Secret, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Validate Secret API Key (Strict Header Authentication)
$apiKey = extractApiKey();

if (empty($apiKey) || !hash_equals(PROXY_SECRET_KEY, $apiKey)) {
    logZibalDebug('UNAUTHORIZED_ATTEMPT', [
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'receivedKeyLength' => strlen($apiKey)
    ]);
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing X-Api-Key header.'
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
    $merchant = 'zibal';
}

logZibalDebug('INCOMING_REQUEST', [
    'action' => $action,
    'merchant' => $merchant,
    'merchant_length' => strlen($merchant),
    'is_sandbox' => ($merchant === 'zibal'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'raw_payload' => $data
]);

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

    $finalCallbackUrl = !empty($rawCallbackUrl) ? $rawCallbackUrl : 'https://zopit.ir/api/public/checkout/callback';

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
$curlInfo = [];

logZibalDebug('SENDING_TO_ZIBAL', [
    'target_url' => $zibalUrl,
    'outgoing_payload' => $zibalPayload
]);

if (function_exists('curl_init')) {
    $ch = curl_init($zibalUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($zibalPayload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errorMessage = curl_error($ch);
    $curlInfo = [
        'primary_ip' => curl_getinfo($ch, CURLINFO_PRIMARY_IP),
        'total_time' => curl_getinfo($ch, CURLINFO_TOTAL_TIME),
        'http_code'  => $httpCode
    ];
    curl_close($ch);
} else {
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($zibalPayload),
            'timeout' => 10,
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

logZibalDebug('RECEIVED_FROM_ZIBAL', [
    'http_code' => $httpCode,
    'curl_info' => $curlInfo,
    'error_message' => $errorMessage,
    'raw_response' => $responseBody
]);

if (empty($responseBody) && !empty($errorMessage)) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'result' => -1,
        'error' => 'Proxy Connection Error: ' . $errorMessage,
        'debug' => [
            'merchant_sent' => $merchant,
            'curl_info' => $curlInfo
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($responseBody)) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'result' => -1,
        'error' => 'Empty response received from Zibal gateway.',
        'debug' => [
            'merchant_sent' => $merchant,
            'http_code' => $httpCode
        ]
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

// Attach debug telemetry
$decodedResponse['_debug'] = [
    'merchant_used' => $merchant,
    'is_sandbox' => ($merchant === 'zibal'),
    'zibal_http_status' => $httpCode
];

http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);
echo json_encode($decodedResponse, JSON_UNESCAPED_UNICODE);

