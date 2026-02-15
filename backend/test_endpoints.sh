#!/bin/bash

echo "========================================="
echo "END-TO-END API TESTING"
echo "========================================="
echo ""

echo "✅ 1. Root Endpoint"
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""

echo "✅ 2. System Status (Grid Data, GPU, Orchestrator)"
curl -s http://localhost:8000/api/status | python3 -m json.tool
echo ""

echo "✅ 3. GPU Status"
curl -s http://localhost:8000/api/gpu | python3 -m json.tool
echo ""

echo "✅ 4. Metrics History (24h data)"
curl -s http://localhost:8000/api/history | python3 -m json.tool
echo ""

echo "✅ 5. Fetch.ai Agent Status (AgentVerse Primary)"
curl -s http://localhost:8000/api/fetchai/status | python3 -m json.tool
echo ""

echo "✅ 6. GPT-4o Price Prediction"
curl -s http://localhost:8000/api/predict | python3 -m json.tool
echo ""

echo "✅ 7. Claude Summary Report"
curl -s http://localhost:8000/api/report | python3 -m json.tool
echo ""

echo "✅ 8. Fetch.ai Coordination"
curl -s -X POST http://localhost:8000/api/fetchai/coordinate | python3 -m json.tool
echo ""

echo "========================================="
echo "ALL TESTS COMPLETE"
echo "========================================="
