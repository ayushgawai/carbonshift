#!/bin/bash

echo "Stopping backend..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
sleep 3

cd /Users/spartan/Documents/GitHub/carbonshift/backend
source venv/bin/activate

echo "Backfilling 24h historical data..."
python3 backfill_history.py

echo "Starting backend..."
python3 api/main.py > backend_with_history.log 2>&1 &

sleep 12

echo ""
echo "Checking history..."
curl -s http://localhost:8000/api/history | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'✅ Historical datapoints: {d[\"summary\"][\"total_datapoints\"]}')
print(f'✅ Avg price: \${d[\"summary\"][\"avg_price\"]:.2f}/MWh')
print(f'✅ Price range: \${d[\"summary\"][\"min_price\"]:.2f} - \${d[\"summary\"][\"max_price\"]:.2f}')
print(f'\n✅ Dashboard now has full 24h of data for charts!')
"
