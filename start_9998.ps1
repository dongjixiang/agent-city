ssh root@47.77.238.56 "pkill -f 'http.server 9998' 2>/dev/null; sleep 1; cd /root/agent-city/client && nohup python3 -m http.server 9998 > /tmp/3d_9998.log 2>&1 &"
