#!/bin/bash
#
# ONE-COMMAND FULL DEPLOYMENT TO BREV
# Deploys complete CarbonShift backend to Brev GPU instance
# Local frontend will connect to Brev backend via WebSocket
#

set -e

echo "=========================================="
echo "🚀 CarbonShift Full Deployment to Brev"
echo "=========================================="

# Configuration
BREV_INSTANCE="fd0pwxkdo"  # Your Brev instance ID
BREV_HOST="ubuntu@${BREV_INSTANCE}.brev.sh"  # Brev hostname format
REMOTE_DIR="carbonshift"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Target: ${BREV_HOST}${NC}"
echo ""

# Step 1: Test connection
echo "📡 Testing Brev connection..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${BREV_HOST}" "echo 'Connected'" 2>/dev/null; then
    echo -e "${GREEN}✓ Brev connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to Brev instance${NC}"
    echo ""
    echo "Try these connection methods:"
    echo "  1. brev shell treehacks-carbonshift"
    echo "  2. ssh ubuntu@fd0pwxkdo.brev.sh"
    echo "  3. Check 'brev ls' for your instance details"
    exit 1
fi

echo ""

# Step 2: Deploy code
echo "📦 Deploying code to Brev..."

# Create remote directory structure
ssh "${BREV_HOST}" "mkdir -p ${REMOTE_DIR}/backend"

# Copy entire backend directory
echo "Copying backend files..."
rsync -avz --progress \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    ./backend/ "${BREV_HOST}:${REMOTE_DIR}/backend/"

echo -e "${GREEN}✓ Code deployed${NC}"
echo ""

# Step 3: Copy .env file from local to Brev
echo "🔐 Copying .env file to Brev..."

if [ -f "./backend/.env" ]; then
    scp ./backend/.env "${BREV_HOST}:${REMOTE_DIR}/backend/.env"
    echo -e "${GREEN}✓ .env file copied${NC}"
else
    echo -e "${RED}❌ Error: backend/.env not found locally${NC}"
    echo "Please make sure backend/.env exists before running this script"
    exit 1
fi

echo ""

# Step 4: Create setup script on Brev
echo "🔧 Creating setup script on Brev..."

ssh "${BREV_HOST}" "cat > ${REMOTE_DIR}/backend/run_backend.sh" << 'SETUP_SCRIPT'
#!/bin/bash
set -e

cd ~/carbonshift/backend

echo "=========================================="
echo "🚀 CarbonShift Backend Setup & Start"
echo "=========================================="

# GPU Check
echo "🔍 GPU Check:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "⚠️  GPU not detected"
echo ""

# Python version
echo "🐍 Python: $(python3 --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing packages..."
pip install --upgrade pip -q
pip install torch torchvision torchaudio -q
pip install -r requirements.txt -q

echo "✓ Dependencies installed"
echo ""

# Verify PyTorch + CUDA
echo "🔥 PyTorch CUDA Check:"
python3 -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"
echo ""

# Start backend
echo "=========================================="
echo "🚀 Starting CarbonShift Backend"
echo "=========================================="
echo "API: http://0.0.0.0:8000"
echo "WebSocket: ws://0.0.0.0:8000/ws"
echo ""
echo "Connect your local frontend to:"
echo "  ws://$(hostname -I | awk '{print $1}'):8000/ws"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

cd api
python3 main.py
SETUP_SCRIPT

ssh "${BREV_HOST}" "chmod +x ${REMOTE_DIR}/backend/run_backend.sh"

echo -e "${GREEN}✓ Setup script created${NC}"
echo ""

# Step 5: Get Brev instance IP
echo "🌐 Getting Brev instance info..."
BREV_IP=$(ssh "${BREV_HOST}" "hostname -I | awk '{print \$1}'" 2>/dev/null || echo "unknown")
echo -e "${GREEN}Brev IP: ${BREV_IP}${NC}"
echo ""

# Final instructions
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1️⃣  Start the backend on Brev:"
echo "   ssh ${BREV_HOST}"
echo "   cd carbonshift/backend"
echo "   bash run_backend.sh"
echo ""
echo "2️⃣  Update your LOCAL frontend to connect to Brev:"
echo "   Backend API: http://${BREV_IP}:8000"
echo "   WebSocket:   ws://${BREV_IP}:8000/ws"
echo ""
echo "3️⃣  Start training via API:"
echo "   curl http://${BREV_IP}:8000/api/start-training -X POST"
echo ""
echo "✅ Your local frontend will see real-time training data!"
echo ""
echo "=========================================="
echo ""
echo "💡 Quick commands:"
echo ""
echo "  # Connect to Brev and start backend"
echo "  ssh ${BREV_HOST} 'cd carbonshift/backend && bash run_backend.sh'"
echo ""
echo "  # Check if backend is running"
echo "  curl http://${BREV_IP}:8000/api/status"
echo ""
echo "  # Start training"
echo "  curl http://${BREV_IP}:8000/api/start-training -X POST"
echo ""
