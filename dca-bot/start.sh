#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
source "$DIR/../.env" 2>/dev/null || true
export WALLET_SECRET DCA_SECRET RPC_URL MIN_SWAP_USD
cd "$DIR"

# Find node (launchd doesn't have PATH)
NODE=""
for c in /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node ~/.nvm/versions/node/*/bin/node; do
  [ -x "$c" ] && NODE="$c" && break
done
if [ -z "$NODE" ]; then NODE="node"; fi

echo "Using node: $NODE"
echo "Wallet secret: ${WALLET_SECRET:0:6}..."
echo "DCA secret: ${DCA_SECRET:0:6}..."
echo "Bot dir: $DIR"

case "${1:-run}" in
  run)
    while true; do
      $NODE bot.js
      echo "Bot exited. Restarting in 10s..."
      sleep 10
    done
    ;;
  once)
    $NODE bot.js
    ;;
  restart)
    pkill -f "node bot.js" 2>/dev/null || true
    sleep 1
    nohup $NODE bot.js >> farm.log 2>&1 &
    echo "Bot restarted (PID: $!)"
    tail -f farm.log
    ;;
  *)
    echo "Usage: ./start.sh [run|once|restart]"
    ;;
esac
