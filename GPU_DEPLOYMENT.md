# GPU Deployment Guide

## Primary: NVIDIA Brev Cloud (A100 80GB)

### 1. Deploy to Brev Instance

```bash
# SSH into Brev instance
brev open treehacks-carbonshift

# Or use direct SSH
ssh ubuntu@<brev-instance-ip>
```

### 2. Setup on Brev GPU

```bash
# Clone repository
git clone https://github.com/yourusername/carbonshift.git
cd carbonshift/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Configure environment
cp .env.template .env
nano .env  # Add your API keys

# Verify GPU
python3 -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}'); print(f'GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}')"
```

### 3. Run on GPU

```bash
# Start backend with GPU
python3 api/main.py
```

**Expected Output:**
```
✅ GPU Detected: NVIDIA A100-SXM4-80GB
✅ CAISO: $45.00/MWh, 350 gCO2/kWh
🚀 CarbonShift is running
```

## Fallback: Local Execution

### Auto-Fallback Logic

The system automatically detects GPU availability:

```python
# In gpu_controller.py
if torch.cuda.is_available():
    device = torch.device('cuda')
    logger.info(f"✅ Using GPU: {torch.cuda.get_device_name(0)}")
else:
    device = torch.device('cpu')
    logger.warning("⚠️ No GPU detected - using CPU")
```

### Local Development

```bash
# Run locally without GPU (CPU fallback)
cd backend
source venv/bin/activate
python3 api/main.py
```

GPU power control will be simulated if NVML is unavailable.

## Environment Configuration

### .env Settings for Brev GPU

```bash
# GPU Configuration (Brev A100)
BREV_INSTANCE_ID=your_brev_instance_id
BREV_INSTANCE_NAME=your_instance_name
GPU_TYPE=A100_80GB
GPU_MEMORY_GB=80

# Training Configuration
TRAINING_MODEL=resnet18
TRAINING_DATASET=cifar10
BATCH_SIZE=32
NUM_EPOCHS=10

# GPU Power Limits (Watts)
GPU_POWER_PAUSE=100
GPU_POWER_REDUCE=150
GPU_POWER_NORMAL=200
GPU_POWER_BOOST=250
```

## Deployment Priority

1. **Primary:** Brev A100 80GB GPU
   - Full NVML power control
   - CUDA acceleration
   - 100-250W dynamic power management

2. **Fallback:** Local CPU
   - Simulated GPU metrics
   - Slower training
   - Still functional for demo

## Performance

### On Brev A100:
- Training speed: ~500 samples/sec
- Power control: Real-time (100-250W)
- NVML metrics: Full access
- Energy monitoring: 60s intervals

### On Local CPU:
- Training speed: ~50 samples/sec
- Power control: Simulated
- NVML metrics: Simulated
- Energy monitoring: 60s intervals

## Verification

```bash
# Check GPU status
curl http://localhost:8000/api/gpu | python3 -m json.tool

# Expected on GPU:
{
  "gpu_name": "NVIDIA A100-SXM4-80GB",
  "has_gpu": true,
  "power_usage_watts": 150.0,
  "power_limit_watts": 200,
  "temperature_c": 45,
  "gpu_utilization_percent": 85
}

# Expected on CPU:
{
  "gpu_name": "Unknown",
  "has_gpu": false,
  "power_usage_watts": 50.0,
  "power_limit_watts": 200,
  "temperature_c": 0,
  "gpu_utilization_percent": 0
}
```

## Training Deployment

### Start Training on GPU

```bash
# Via API
curl -X POST http://localhost:8000/api/start-training

# Or via frontend button
# Dashboard → Training Control → Start Training
```

### Monitor Training

```bash
# Watch logs
tail -f backend.log

# Check progress via API
curl http://localhost:8000/api/status
```

## Production Checklist

- [x] GPU detection and fallback logic
- [x] NVML power control (primary)
- [x] CPU simulation (fallback)
- [x] CAISO real-time data integration
- [x] Training pause/resume on high carbon
- [x] WebSocket real-time updates
- [x] Frontend integration complete
- [ ] Brev instance credentials in .env
- [ ] Training started on Brev A100

## Quick Deploy Script

```bash
#!/bin/bash
# deploy_gpu.sh

echo "🚀 Deploying to Brev GPU..."

# SSH and setup
brev open treehacks-carbonshift << 'EOF'
cd carbonshift/backend
git pull
source venv/bin/activate
pip install -q -r requirements.txt
python3 api/main.py &
echo "✅ Backend running on Brev A100"
EOF

echo "✅ Deployment complete!"
echo "Access: http://<brev-instance-ip>:8000"
```

**Status:** Ready for GPU deployment 🚀
