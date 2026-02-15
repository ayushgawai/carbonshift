#!/bin/bash
#
# Setup Script for Brev GPU Instance
# Run this ONCE on your Brev instance to set up the environment
#

set -e

echo "=========================================="
echo "🔧 Brev Instance Environment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "quick_train.py" ]; then
    echo "❌ Error: quick_train.py not found"
    echo "Please run this script from the backend directory"
    exit 1
fi

echo "📋 System Information:"
echo "  OS: $(uname -s)"
echo "  Python: $(python3 --version)"
echo ""

# Check GPU
echo "🔍 GPU Check:"
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo "✓ GPU detected"
else
    echo "⚠️  nvidia-smi not found"
    echo "Note: Training will run on CPU (much slower)"
fi
echo ""

# Create virtual environment (optional but recommended)
echo "🐍 Python Environment:"
if [ ! -d "venv_train" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv_train
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate venv
source venv_train/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "📦 Updating pip..."
pip install --upgrade pip

# Install PyTorch
echo ""
echo "🔥 Installing PyTorch..."
if command -v nvidia-smi &> /dev/null; then
    echo "Installing PyTorch with CUDA support..."
    pip3 install torch torchvision torchaudio
else
    echo "Installing PyTorch (CPU version)..."
    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
fi

# Verify installation
echo ""
echo "✅ Verifying installation..."
python3 -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA version: {torch.version.cuda if torch.cuda.is_available() else \"N/A\"}')"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To run training:"
echo "  1. source venv_train/bin/activate"
echo "  2. python3 quick_train.py --duration 10"
echo ""
