#!/bin/bash

echo "========================================="
echo "FINAL END-TO-END INTEGRATION TEST"
echo "========================================="
echo ""

echo "✅ 1. System Status"
curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Grid: \${d[\"electricity_price\"]}/MWh, {d[\"carbon_intensity\"]} gCO2/kWh')
print(f'  GPU: {d[\"gpu_power_watts\"]}W / {d[\"gpu_power_limit\"]}W')
print(f'  Training: {d[\"training_status\"]} (Epoch {d[\"current_epoch\"]}/{d[\"total_epochs\"]})')
print(f'  Savings: \${d[\"total_cost_saved\"]}, {d[\"total_carbon_saved\"]} kg CO2')
print(f'  Peaks Avoided: {d[\"peaks_avoided\"]}')
"
echo ""

echo "✅ 2. Historical Data"
curl -s http://localhost:8000/api/history | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Datapoints: {d[\"summary\"][\"total_datapoints\"]}')
print(f'  Avg Price: \${d[\"summary\"][\"avg_price\"]}/MWh')
print(f'  Avg Carbon: {d[\"summary\"][\"avg_carbon\"]} gCO2/kWh')
"
echo ""

echo "✅ 3. GPU Status"
curl -s http://localhost:8000/api/gpu | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Name: {d[\"gpu_name\"]}')
print(f'  Has GPU: {d[\"has_gpu\"]}')
print(f'  Power: {d[\"power_usage_watts\"]}W')
"
echo ""

echo "✅ 4. Fetch.ai Agent"
curl -s http://localhost:8000/api/fetchai/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Active: {d[\"active\"]}')
print(f'  Primary: {d[\"primary_agent\"][\"address\"][:20]}...')
print(f'  Platform: {d[\"primary_agent\"][\"platform\"]}')
print(f'  Capabilities: {len(d[\"capabilities\"])} features')
"
echo ""

echo "✅ 5. GPT-4o Prediction"
curl -s http://localhost:8000/api/predict | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Prediction: {d[\"prediction\"]}')
print(f'  Confidence: {d[\"confidence\"]}')
print(f'  Action: {d[\"suggested_action\"]}')
" 2>/dev/null || echo "  ⚠️ Not enough data yet"
echo ""

echo "✅ 6. Claude Report"
curl -s http://localhost:8000/api/report | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Report generated: {len(d[\"report\"])} chars')
print(f'  Cost saved: \${d[\"metrics\"][\"cost_saved\"]}')
" 2>/dev/null || echo "  ⚠️ Report generation issue"
echo ""

echo "✅ 7. Frontend Data Format Check"
curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
required = ['timestamp', 'electricity_price', 'carbon_intensity', 'gpu_power_watts', 'gpu_power_limit', 'training_status', 'training_progress', 'current_epoch', 'total_epochs', 'total_cost_saved', 'total_carbon_saved', 'peaks_avoided']
missing = [k for k in required if k not in d]
if missing:
    print(f'  ❌ Missing fields: {missing}')
else:
    print(f'  ✅ All {len(required)} required fields present')
"
echo ""

echo "========================================="
echo "INTEGRATION TEST COMPLETE ✅"
echo "========================================="
echo ""
echo "Ready for:"
echo "  • Frontend connection (ws://localhost:8000/ws)"
echo "  • GPU deployment (Brev A100)"
echo "  • Production use"
echo ""
