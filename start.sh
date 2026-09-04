#!/bin/sh
# 本地启动「今天」原型
cd "$(dirname "$0")"
PORT="${PORT:-8080}"
echo "▶ http://localhost:$PORT"
python3 -m http.server "$PORT"
