#!/bin/bash

# ============================================================================
# CarbonShift - Deploy to Brev A100 GPU
# ============================================================================

echo "=========================================="
echo "🚀 Deploying CarbonShift to Brev A100"
echo "=========================================="

BREV_INSTANCE="fd0pwxkdo"

# Step 1: Create deployment package (excluding venv)
echo "📦 Creating deployment package..."
cd ~/Documents/GitHub
tar -czf carbonshift-deploy.tar.gz \
    --exclude='carbonshift/venv' \
    --exclude='carbonshift/.git' \
    --exclude='carbonshift/**/__pycache__' \
    --exclude='carbonshift/**/*.pyc' \
    carbonshift/backend

echo "✅ Package created: carbonshift-deploy.tar.gz"
echo "   Size: $(du -h carbonshift-deploy.tar.gz | cut -f1)"

# Step 2: Upload to Brev
echo ""
echo "📤 Uploading to Brev..."
echo "   Connecting to instance: $BREV_INSTANCE"

# Check if brev command exists
if ! command -v brev &> /dev/null; then
    echo "⚠️  Brev CLI not found in PATH"
    echo "   Trying to copy via SCP..."
    echo "   Run: scp carbonshift-deploy.tar.gz <brev-host>:/workspace/"
    exit 1
fi

# Upload using brev
brev scp carbonshift-deploy.tar.gz $BREV_INSTANCE:/workspace/

echo ""
echo "✅ Upload complete!"
echo ""
echo "=========================================="
echo "🎯 Next Steps (Run on Brev):"
echo "=========================================="
echo ""
echo "1. SSH into Brev:"
echo "   brev shell $BREV_INSTANCE"
echo ""
echo "2. Extract and setup:"
echo "   cd /workspace"
echo "   tar -xzf carbonshift-deploy.tar.gz"
echo "   cd carbonshift/backend"
echo "   pip install -r requirements.txt"
echo "   pip install 'numpy<2'  # Fix compatibility"
echo ""
echo "3. Copy your .env file:"
echo "   nano .env  # Paste your local .env content"
echo ""
echo "4. Start the server:"
echo "   ./start.sh"
echo ""
echo "5. Get the Brev IP address:"
echo "   curl ifconfig.me"
echo ""
echo "6. Access backend:"
echo "   http://<brev-ip>:8000"
echo "   ws://<brev-ip>:8000/ws"
echo ""
echo "=========================================="
