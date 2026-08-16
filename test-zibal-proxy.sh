curl -X POST https://bankkalaha.ir/zibal-proxy.php \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ZopitPay2026Key" \
  -d '{"action":"request","merchant":"zibal","amount":10000,"callbackUrl":"https://zopit.ir/callback","description":"test"}' \
  -v
