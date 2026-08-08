node dist/server.cjs > test.log 2>&1 &
sleep 2
cat test.log
