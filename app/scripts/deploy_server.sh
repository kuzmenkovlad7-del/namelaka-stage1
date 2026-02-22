#!/usr/bin/env bash
set -euo pipefail
SERVER="${1:-dachatv}"
APP_DIR="/var/www/namelaka-react-app"
LOCAL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== build locally =="
cd "$LOCAL_ROOT"
if [[ -f ./scripts/import_mirror_assets.sh ]]; then
  ./scripts/import_mirror_assets.sh || true
fi
npm install
npm run build

echo "== upload app =="
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  "$LOCAL_ROOT/" "$SERVER:$APP_DIR/"

echo "== configure server =="
ssh "$SERVER" bash <<'REMOTE'
set -euo pipefail
APP_DIR=/var/www/namelaka-react-app
DIST="$APP_DIR/dist"

sudo mkdir -p "$APP_DIR"
sudo find /var/www -maxdepth 2 -type d -name 'namelaka-react-app' -exec chmod 755 {} \; || true
sudo find "$DIST" -type d -exec chmod 755 {} \; || true
sudo find "$DIST" -type f -exec chmod 644 {} \; || true
sudo chmod 755 /var /var/www "$APP_DIR" || true

sudo cp "$APP_DIR/server/adapter-server.mjs" "$APP_DIR/server/adapter-server.mjs"
sudo cp "$APP_DIR/server/namelaka-react.service" /etc/systemd/system/namelaka-react.service
sudo systemctl daemon-reload
sudo systemctl enable namelaka-react.service >/dev/null 2>&1 || true
sudo systemctl restart namelaka-react.service

for f in /etc/nginx/sites-enabled/namelaka-stage1 /etc/nginx/sites-enabled/namelaka-react; do
  [[ -e "$f" ]] && sudo rm -f "$f"
done
sudo cp "$APP_DIR/server/nginx.namelaka-react.conf" /etc/nginx/sites-available/namelaka-react
sudo ln -sf /etc/nginx/sites-available/namelaka-react /etc/nginx/sites-enabled/namelaka-react
sudo nginx -t
sudo systemctl reload nginx

echo '== checks =='
curl -sI http://127.0.0.1/ua/ | head -n 8
curl -sI http://127.0.0.1/en/ | head -n 8
curl -s http://127.0.0.1/_health; echo
curl -s http://127.0.0.1/api/categories | head -c 200; echo
REMOTE

echo "DONE"
echo "Open: http://46.62.234.91/ua/ and /en/"
