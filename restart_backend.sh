#!/bin/bash

echo "Stopping existing backend..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
sleep 3

echo "Starting backend..."
cd /Users/spartan/Documents/GitHub/carbonshift/backend
source venv/bin/activate
python3 api/main.py > backend_live.log 2>&1 &

sleep 12

echo ""
echo "Checking services..."
if lsof -ti:8000 > /dev/null; then
    echo "✅ Backend API on port 8000"
else
    echo "❌ Backend failed to start"
    tail -20 backend_live.log
    exit 1
fi

if lsof -ti:8001 > /dev/null; then
    echo "✅ Fetch.ai agent on port 8001"
fi

echo ""
echo "Testing WebSocket..."
curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'✅ Real CAISO data: \${d[\"electricity_price\"]}/MWh, {d[\"carbon_intensity\"]} gCO2/kWh')
"

echo ""
echo "Backend ready for frontend connection!"
