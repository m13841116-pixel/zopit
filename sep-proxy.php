<?php
// sep-proxy.php
// Proxy for Saman Electronic Payment (SEP) to bypass foreign IP restrictions
// Place this file on your Iranian host (e.g. bankkalaha.ir)

ini_set('display_errors', 0);
error_reporting(0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key, X-Proxy-Secret, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

const PROXY_SECRET_KEY = 'ZopitPay2026Key';

// 1. Validate Secret API Key (Header-based authentication only)
$headers = function_exists('getallheaders') ? getallheaders() : [];
$apiKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-Proxy-Secret'] ?? $headers['x-proxy-secret'] ?? $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';

if (empty($apiKey) && !empty($headers['Authorization'])) {
    if (preg_match('/Bearer\s+(.+)/i', $headers['Authorization'], $matches)) {
        $apiKey = trim($matches[1]);
    }
}

if (empty($apiKey) || !hash_equals(PROXY_SECRET_KEY, $apiKey)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing X-Api-Key header.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload'], JSON_UNESCAPED_UNICODE);
    exit();
}

$action = $data['action'] ?? '';

// 1. Create Token (Request Payment)
if ($action === 'token') {
    $url = 'https://sep.shaparak.ir/onlinepg/onlinepg';
    $payload = [
        'action' => 'token',
        'TerminalId' => $data['terminalId'] ?? $data['TerminalId'] ?? '',
        'Amount' => $data['amount'] ?? $data['Amount'] ?? 0,
        'ResNum' => $data['resNum'] ?? $data['ResNum'] ?? (string)time(),
        'RedirectUrl' => $data['callbackUrl'] ?? $data['RedirectUrl'] ?? '',
        'CellNumber' => $data['cellNumber'] ?? $data['CellNumber'] ?? ''
    ];
}
// 2. Verify Transaction
else if ($action === 'verify') {
    $url = 'https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction';
    $payload = [
        'RefNum' => $data['referenceNum'] ?? $data['RefNum'] ?? $data['authority'] ?? '',
        'TerminalNumber' => $data['terminalId'] ?? $data['TerminalNumber'] ?? $data['TerminalId'] ?? ''
    ];
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action'], JSON_UNESCAPED_UNICODE);
    exit();
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    echo json_encode(['error' => 'SEP Proxy cURL error: ' . $error], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);
    echo $response;
}
