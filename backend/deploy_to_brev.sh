#!/bin/bash
#
# Brev GPU Deployment Script
# Deploys and runs training on Brev GPU instance
#

set -e  # Exit on error

echo "=========================================="
echo "🚀 CarbonShift GPU Training Deploy"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DURATION=${1:-10}  # Default 10 minutes

echo "Duration: ${DURATION} minutes"
echo ""

# Check if we're on a GPU instance
echo "🔍 Checking GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    echo -e "${GREEN}✓ GPU detected!${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: nvidia-smi not found. Is this a GPU instance?${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Check Python
echo "🐍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found!${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"

echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."
if ! python3 -c "import torch" 2>/dev/null; then
    echo "PyTorch not found. Installing..."
    echo "Trying standard PyTorch installation..."

    # Try multiple installation methods
    if pip3 install torch torchvision torchaudio 2>/dev/null; then
        echo -e "${GREEN}✓ PyTorch installed successfully${NC}"
    elif pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118 2>/dev/null; then
        echo -e "${GREEN}✓ PyTorch installed successfully (CUDA)${NC}"
    elif pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cpu 2>/dev/null; then
        echo -e "${YELLOW}⚠️  PyTorch installed (CPU only)${NC}"
    else
        echo -e "${RED}❌ Failed to install PyTorch${NC}"
        echo "Please install manually: pip3 install torch torchvision"
        exit 1
    fi
else
    echo -e "${GREEN}✓ PyTorch already installed${NC}"
    python3 -c "import torch; print(f'  Version: {torch.__version__}'); print(f'  CUDA available: {torch.cuda.is_available()}')"
fi

echo ""

# Make script executable
chmod +x quick_train.py

# Run training
echo "=========================================="
echo "🔥 Starting Training Session"
echo "=========================================="
echo ""

python3 quick_train.py --duration ${DURATION}

echo ""
echo "=========================================="
echo "✅ Training session complete!"
echo "=========================================="
