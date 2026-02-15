#!/bin/bash

echo "========================================="
echo "CARBONSHIFT VERIFICATION"
echo "========================================="
echo ""

echo "Backend (Port 8000):"
curl -s http://localhost:8000/ | grep -q "CarbonShift" && echo "  ✅ Running" || echo "  ❌ Not responding"

echo ""
echo "Frontend (Port 5173):"
curl -s http://localhost:5173 2>&1 | head -5 | grep -q "html" && echo "  ✅ Running" || echo "  ❌ Not responding"

echo ""
echo "API Data Test:"
curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  Electricity: \${d[\"electricity_price\"]}/MWh')
print(f'  Carbon: {d[\"carbon_intensity\"]} gCO2/kWh')
print(f'  Status: {d[\"training_status\"]}')
"

echo ""
echo "========================================="
echo "✅ Open http://localhost:5173 in browser"
echo "========================================="
