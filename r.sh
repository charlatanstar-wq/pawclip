#!/bin/sh
# ASCS direct VLESS-Reality (TCP 443 over IPv6), no Cloudflare
X=$(command -v xray 2>/dev/null); [ -z "$X" ] && for p in /usr/local/bin/xray /usr/bin/xray /root/xray/xray /opt/xray/xray /root/xray; do [ -x "$p" ] && X=$p && break; done
[ -z "$X" ] && X=$(find / -type f -name xray -perm -u+x 2>/dev/null | head -1)
[ -z "$X" ] && { echo "NOXRAY"; exit 1; }
D=/root/rl; mkdir -p $D
if [ ! -f $D/k ]; then $X x25519 > $D/k; cat /proc/sys/kernel/random/uuid > $D/u; head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n' > $D/s; fi
PK=$(grep -i private $D/k | awk '{print $NF}'); PB=$(grep -iE 'public|password' $D/k | awk '{print $NF}'); U=$(cat $D/u); S=$(cat $D/s)
P=${1:-443}
cat > $D/c.json <<J
{"log":{"loglevel":"warning"},"inbounds":[{"listen":"::","port":$P,"protocol":"vless","settings":{"clients":[{"id":"$U","flow":"xtls-rprx-vision"}],"decryption":"none"},"streamSettings":{"network":"tcp","security":"reality","realitySettings":{"dest":"www.apple.com:443","serverNames":["www.apple.com"],"privateKey":"$PK","shortIds":["$S"]}}}],"outbounds":[{"protocol":"freedom"}]}
J
pkill -f "$D/c.json" 2>/dev/null; sleep 1
nohup $X run -c $D/c.json > $D/log 2>&1 &
sleep 2
cat > $D/start.sh <<J
#!/bin/sh
pgrep -f $D/c.json >/dev/null || nohup $X run -c $D/c.json > $D/log 2>&1 &
J
chmod +x $D/start.sh
(crontab -l 2>/dev/null | grep -v rl/start.sh; echo "@reboot $D/start.sh"; echo "*/5 * * * * $D/start.sh") | crontab - 2>/dev/null
pgrep -f $D/c.json >/dev/null && echo RUN || { echo FAIL; tail -3 $D/log; }
IP=$(ip -6 addr show scope global 2>/dev/null | awk '/inet6/{print $2}' | cut -d/ -f1 | head -1)
echo "IP=$IP"; echo "P=$P"; echo "U=$U"; echo "PB=$PB"; echo "S=$S"
