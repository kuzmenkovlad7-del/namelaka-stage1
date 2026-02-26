#!/usr/bin/env bash
set -euo pipefail

ROOT="$HOME/projects/namelaka-stage1"
APP="$ROOT/app"
ADMIN="$HOME/projects/namelaka-admin"

# ports
VITE_PORT=3000
ADAPTER_PORT=3010
ADMIN_PORT=9000
PROXY_PORT=8080

SESSION="namelaka_demo"

# kill old session if exists
tmux has-session -t "$SESSION" 2>/dev/null && tmux kill-session -t "$SESSION" || true

# prechecks
[[ -d "$APP" ]] || { echo "ERROR: $APP not found"; exit 1; }
[[ -f "$APP/package.json" ]] || { echo "ERROR: $APP/package.json not found"; exit 1; }

# create tmux session with 5 panes (all background)
tmux new-session -d -s "$SESSION" -n demo

# pane 0: adapter
tmux send-keys -t "$SESSION:demo.0" "cd '$APP' && mkdir -p .local-data && if [ -f namelaka_fallback_data_restore.zip ]; then unzip -o namelaka_fallback_data_restore.zip -d .local-data; fi && PORT=$ADAPTER_PORT DATA_DIR='$APP/.local-data' node server/adapter-server.mjs" C-m

# pane 1: vite
tmux split-window -h -t "$SESSION:demo"
tmux send-keys -t "$SESSION:demo.1" "cd '$APP' && npm i && npm run dev -- --host 0.0.0.0 --port $VITE_PORT" C-m

# pane 2: admin (optional)
tmux split-window -v -t "$SESSION:demo.1"
tmux send-keys -t "$SESSION:demo.2" "if [ -d '$ADMIN' ]; then cd '$ADMIN' && npm i && npm run dev; else echo 'NO ADMIN REPO: $ADMIN'; fi" C-m

# pane 3: proxy (one domain for both)
tmux split-window -v -t "$SESSION:demo.0"
tmux send-keys -t "$SESSION:demo.3" "node -e \"const http=require('http');const {createProxyServer}=require('http-proxy');const proxy=createProxyServer({});const server=http.createServer((req,res)=>{const u=req.url||'/'; if(u.startsWith('/admin')||u.startsWith('/app')){ proxy.web(req,res,{target:'http://127.0.0.1:$ADMIN_PORT'}); } else { proxy.web(req,res,{target:'http://127.0.0.1:$VITE_PORT'}); } }); server.listen($PROXY_PORT,'0.0.0.0',()=>console.log('[proxy] http://localhost:$PROXY_PORT -> / -> :$VITE_PORT | /admin,/app -> :$ADMIN_PORT'));\" " C-m

# pane 4: tunnel (public url)
tmux split-window -h -t "$SESSION:demo.3"
tmux send-keys -t "$SESSION:demo.4" "cloudflared tunnel --url http://localhost:$PROXY_PORT" C-m

echo
echo "== STARTED =="
echo "Local (single domain): http://localhost:$PROXY_PORT/ua"
echo "Local admin:           http://localhost:$PROXY_PORT/admin  (or /app)"
echo
echo "Public URL will appear in the tmux window (cloudflared pane)."
echo "To view logs: tmux attach -t $SESSION"
echo "To stop:      tmux kill-session -t $SESSION"
