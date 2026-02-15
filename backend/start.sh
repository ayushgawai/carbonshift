#!/bin/bash

# CarbonShift Startup Script
# Starts the FastAPI backend server

echo "=========================================="
echo "🚀 CarbonShift Backend Starting..."
echo "=========================================="

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    echo "Activating virtual environment..."
    source ../venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Please create .env from .env.template and add your API keys"
    exit 1
fi

# Check Python dependencies
echo "Checking dependencies..."
python3 -c "import fastapi" 2>/dev/null || {
    echo "Installing dependencies..."
    pip install -r requirements.txt
}

# Start the server
echo "Starting FastAPI server..."
echo "API: http://0.0.0.0:8000"
echo "Docs: http://0.0.0.0:8000/docs"
echo "WebSocket: ws://0.0.0.0:8000/ws"
echo "=========================================="

cd api && python3 main.py
