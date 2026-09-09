#!/usr/bin/env bash
# 同 run-web.sh
exec "$(cd "$(dirname "$0")" && pwd)/run-web.sh" "$@"
