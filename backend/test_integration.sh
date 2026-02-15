#!/bin/bash

echo "=== FRONTEND INTEGRATION TEST ==="
echo ""

# Kill existing servers
lsof -ti:8000 | xargs kill 2>/dev/null
lsof -ti:8001 | xargs kill 2>/dev/null
sleep 2

# Start backend
cd /Users/spartan/Documents/GitHub/carbonshift/backend
source venv/bin/activate
python3 api/main.py > integration_test.log 2>&1 &
SERVER_PID=$!

echo "Backend starting (PID: $SERVER_PID)..."
sleep 10

echo ""
echo "1. Testing API Response Format:"
curl -s http://localhost:8000/api/status | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    required_fields = ['electricity_price', 'carbon_intensity', 'gpu_power_watts', 'gpu_power_limit', 'training_status', 'training_progress', 'current_epoch', 'total_epochs', 'total_cost_saved', 'total_carbon_saved', 'peaks_avoided', 'timestamp']

    print('Required frontend fields:')
    missing = []
    for k in required_fields:
        if k in d:
            print(f'  ✅ {k}: {d[k]}')
        else:
            print(f'  ❌ MISSING: {k}')
            missing.append(k)

    if not missing:
        print('\n✅ All required fields present!')
    else:
        print(f'\n❌ Missing {len(missing)} fields: {missing}')
except Exception as e:
    print(f'Error: {e}')
"

echo ""
echo "2. Testing WebSocket Connection:"
python3 << 'PYEOF'
import asyncio
import websockets
import json

async def test_ws():
    try:
        async with websockets.connect('ws://localhost:8000/ws') as ws:
            print('  ✅ WebSocket connected')

            # Receive first message
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)

            print(f'  ✅ Received data with {len(data)} fields')
            print(f'  Sample: electricity_price={data.get("electricity_price", "MISSING")}')

    except Exception as e:
        print(f'  ❌ WebSocket error: {e}')

asyncio.run(test_ws())
PYEOF

echo ""
echo "3. Backend Log (last 10 lines):"
tail -10 integration_test.log

echo ""
echo "=== TEST COMPLETE ==="
