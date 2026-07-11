#!/bin/bash
source "$(dirname "$0")/../.env" 2>/dev/null || true

case "${1:-run}" in
  run)
    while true; do
      node bot.js
      echo "Sleeping 1 hour..."
      sleep 3600
    done
    ;;
  once)
    node bot.js
    ;;
  *)
    echo "Usage: ./start.sh [run|once]"
    ;;
esac
