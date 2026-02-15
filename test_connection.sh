#!/bin/bash

echo "========================================="
echo "BACKEND CONNECTION TEST"
echo "========================================="
echo ""

echo "1. Backend Process Check:"
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "  ✅ Backend running on port 8000"
else
    echo "  ❌ Backend NOT running"
    exit 1
fi

echo ""
echo "2. API Response:"
curl -s http://localhost:8000/ || echo "  ❌ API not responding"

echo ""
echo "3. Status Endpoint:"
curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(f'  ✅ Price: \${d[\"electricity_price\"]}/MWh')
    print(f'  ✅ Carbon: {d[\"carbon_intensity\"]} gCO2/kWh')
    print(f'  ✅ Training: {d[\"training_status\"]}')
except Exception as e:
    print(f'  ❌ Error: {e}')
"

echo ""
echo "4. WebSocket Test:"
python3 << 'PYEOF'
import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/ws', open_timeout=5) as ws:
            print("  ✅ WebSocket connected")
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)
            print(f"  ✅ Data received: electricity_price={data.get('electricity_price')}")
            return True
    except Exception as e:
        print(f"  ❌ WebSocket failed: {e}")
        return False

try:
    result = asyncio.run(test())
except Exception as e:
    print(f"  ❌ Test error: {e}")
PYEOF

echo ""
echo "5. Backend Logs (last 10 lines):"
tail -10 /Users/spartan/Documents/GitHub/carbonshift/backend/server_fresh.log 2>/dev/null || echo "  No log file found"

echo ""
echo "========================================="
