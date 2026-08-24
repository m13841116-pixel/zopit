async function test() {
  const res = await fetch('https://bankkalaha.ir/zibal-proxy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log(res.status);
}
test().catch(console.error);
