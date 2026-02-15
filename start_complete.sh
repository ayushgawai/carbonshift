#!/bin/bash

echo "Stopping all services..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
sleep 3

echo "Starting backend with venv..."
/Users/spartan/Documents/GitHub/carbonshift/backend/venv/bin/python3 /Users/spartan/Documents/GitHub/carbonshift/backend/api/main.py > /Users/spartan/Documents/GitHub/carbonshift/backend/backend.log 2>&1 &

echo "Waiting for backend to start..."
sleep 15

if lsof -ti:8000 > /dev/null; then
    echo "✅ Backend running"

    echo ""
    echo "Checking historical data..."
    curl -s http://localhost:8000/api/history | python3 -c "
import json, sys
d = json.load(sys.stdin)
total = d['summary']['total_datapoints']
print(f'📊 Historical datapoints: {total}')
if total > 100:
    print(f'✅ Charts have full 24h data!')
else:
    print(f'⏳ Collecting... ({total}/288 points)')
"

    echo ""
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:8000"
else
    echo "❌ Backend failed to start"
    tail -20 /Users/spartan/Documents/GitHub/carbonshift/backend/backend.log
fi
