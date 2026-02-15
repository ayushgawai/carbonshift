#!/bin/bash

sleep 3

echo "Checking historical data..."
curl -s http://localhost:8000/api/history | python3 -c "
import json, sys
d = json.load(sys.stdin)
total = d['summary']['total_datapoints']
print(f'✅ Historical datapoints: {total}')
print(f'✅ Price range: \${d[\"summary\"][\"min_price\"]:.2f} - \${d[\"summary\"][\"max_price\"]:.2f}/MWh')
print(f'✅ Avg carbon: {d[\"summary\"][\"avg_carbon\"]:.1f} gCO2/kWh')

if total > 100:
    print(f'\n🎉 Dashboard has full 24h data for charts!')
else:
    print(f'\n⏳ Still collecting... ({total}/288)')
"
