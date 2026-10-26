#!/bin/sh
# Usage: hy2.sh <password>   -- Hysteria2 server on UDP 443 (IPv4/IPv6)
PW="$1"; [ -z "$PW" ] && { echo "need password"; exit 1; }
B=/usr/local/bin/hysteria; D=/etc/hysteria; mkdir -p $D
get(){ (curl -fsSL -m 60 "$1" || wget -qO- -T 60 "$1") 2>/dev/null; }
if [ ! -x $B ]; then
  get https://github.com/apernet/hysteria/releases/latest/download/hysteria-linux-amd64 > $B.tmp
  if [ ! -s $B.tmp ] || ! head -c4 $B.tmp | grep -q ELF; then
    get https://cdn.jsdelivr.net/gh/charlatanstar-wq/hy2-ipv6@main/hy.gz | gunzip > $B.tmp
  fi
  head -c4 $B.tmp | grep -q ELF || { echo "DOWNLOAD FAILED"; exit 1; }
  mv $B.tmp $B; chmod +x $B
fi
command -v openssl >/dev/null || (apt-get update -qq && apt-get install -y -qq openssl) >/dev/null 2>&1
[ -f $D/server.key ] || openssl req -x509 -nodes -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -keyout $D/server.key -out $D/server.crt -subj "/CN=www.bing.com" -days 36500 >/dev/null 2>&1
cat > $D/config.yaml <<EOF
listen: :443
tls:
  cert: $D/server.crt
  key: $D/server.key
auth:
  type: password
  password: $PW
masquerade:
  type: proxy
  proxy:
    url: https://www.bing.com
    rewriteHost: true
EOF
if pidof systemd >/dev/null 2>&1; then
  cat > /etc/systemd/system/hy2.service <<EOF
[Unit]
After=network-online.target
[Service]
ExecStart=$B server -c $D/config.yaml
Restart=always
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload; systemctl enable --now hy2; systemctl restart hy2
else
  pkill -f "hysteria server" ; nohup $B server -c $D/config.yaml > $D/log 2>&1 &
  (crontab -l 2>/dev/null | grep -v hysteria; echo "@reboot $B server -c $D/config.yaml > $D/log 2>&1") | crontab - 2>/dev/null
fi
sleep 3
if pgrep -f "hysteria server" >/dev/null; then echo "HY2-OK"; else echo "HY2-FAIL"; tail -5 $D/log 2>/dev/null; fi
ip -6 addr show scope global | grep inet6
