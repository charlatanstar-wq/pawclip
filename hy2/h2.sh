#!/bin/sh
# h2.sh <password> <src-url>  : install HY2 using files served from SRC (hysteria, c.crt, c.key)
PW="$1"; S="$2"; B=/usr/local/bin/hysteria; D=/etc/hysteria; mkdir -p $D
wget -qO $B "$S/hysteria" && chmod +x $B || { echo DL-FAIL; exit 1; }
wget -qO $D/server.crt "$S/c.crt"; wget -qO $D/server.key "$S/c.key"
printf 'listen: :443\ntls:\n  cert: %s/server.crt\n  key: %s/server.key\nauth:\n  type: password\n  password: %s\nmasquerade:\n  type: proxy\n  proxy:\n    url: https://www.bing.com\n    rewriteHost: true\n' $D $D "$PW" > $D/config.yaml
if pidof systemd >/dev/null 2>&1; then
printf '[Unit]\nAfter=network-online.target\n[Service]\nExecStart=%s server -c %s/config.yaml\nRestart=always\n[Install]\nWantedBy=multi-user.target\n' $B $D > /etc/systemd/system/hy2.service
systemctl daemon-reload; systemctl enable --now hy2; systemctl restart hy2
else nohup $B server -c $D/config.yaml > $D/log 2>&1 & fi
sleep 3; pgrep -f "hysteria server" >/dev/null && echo HY2-OK || { echo HY2-FAIL; journalctl -u hy2 -n 5 --no-pager 2>/dev/null; tail -5 $D/log 2>/dev/null; }
