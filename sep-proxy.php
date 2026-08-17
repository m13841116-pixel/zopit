<?php
// sep-proxy.php
// Proxy for Saman Electronic Payment (SEP) to bypass foreign IP restrictions
// Place this file on your Iranian host (e.g. bankkalaha.ir)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['key'] ?? '';
// Optional: Security check
// if ($apiKey !== 'ZopitPay2026Key') {
//     http_response_code(401);
//     echo json_encode(['error' => 'Unauthorized']);
//     exit();
// }

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

$action = $data['action'] ?? '';

// 1. Create Token (Request Payment)
if ($action === 'token') {
    $url = 'https://sep.shaparak.ir/onlinepg/onlinepg';
    $payload = [
        'action' => 'token',
        'TerminalId' => $data['terminalId'] ?? '',
        'Amount' => $data['amount'] ?? 0,
        'ResNum' => $data['resNum'] ?? '',
        'RedirectUrl' => $data['callbackUrl'] ?? '',
        'CellNumber' => $data['cellNumber'] ?? ''
    ];
}
// 2. Verify Transaction
else if ($action === 'verify') {
    $url = 'https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction';
    $payload = [
        'RefNum' => $data['referenceNum'] ?? '',
        'TerminalNumber' => $data['terminalId'] ?? ''
    ];
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
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
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Proxy cURL error: ' . $error]);
} else {
    http_response_code($httpCode);
    echo $response;
}
