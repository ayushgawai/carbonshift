# 🚀 Quick GPU Training on Brev

This guide helps you run a quick 10-minute training session on your Brev GPU instance.

## Prerequisites

- Active Brev GPU instance (already running)
- SSH access to the instance (you mentioned you're already connected)
- Git installed on the Brev instance

## Option 1: Quick Deploy (From Brev Instance)

If you're already SSH'd into your Brev instance in a different terminal:

```bash
# 1. Clone the repo (if not already there)
git clone https://github.com/YOUR_USERNAME/carbonshift.git
cd carbonshift/backend

# 2. Run the deployment script
bash deploy_to_brev.sh 10

# That's it! Training will run for 10 minutes
```

## Option 2: Manual Setup

```bash
# 1. Navigate to backend directory
cd carbonshift/backend

# 2. Install dependencies (if not already installed)
pip3 install torch torchvision

# 3. Run training directly
python3 quick_train.py --duration 10
```

## Option 3: Transfer Files via SCP

From your local machine (this terminal):

```bash
# Get your Brev instance address first
# Then copy the training script
scp backend/quick_train.py username@brev-instance:/path/to/destination/

# SSH in and run
ssh username@brev-instance
cd /path/to/destination
python3 quick_train.py --duration 10
```

## What the Training Script Does

- ✅ Detects GPU automatically
- ✅ Creates a ResNet-18 model
- ✅ Trains on synthetic CIFAR-10 data
- ✅ Runs for exactly 10 minutes (or custom duration)
- ✅ Saves checkpoint when complete
- ✅ Shows real-time progress

## Expected Output

```
======================================================================
🚀 Quick Training Session Starting
Device: cuda
GPU: NVIDIA A100-SXM4-80GB
GPU Memory: 80.00 GB
Duration: 10 minutes
======================================================================
Initializing ResNet-18 model...
Creating synthetic dataset: 10000 samples
🔥 Training started!
----------------------------------------------------------------------
Epoch   1 | Step    20 | Loss: 2.3142 | Elapsed: 12s | Remaining: 588s
Epoch   1 | Step    40 | Loss: 2.2891 | Elapsed: 24s | Remaining: 576s
...
```

## Configuration Options

Change training duration:
```bash
python3 quick_train.py --duration 5   # 5 minutes
python3 quick_train.py --duration 20  # 20 minutes
```

## GPU Verification

Check your GPU before training:
```bash
nvidia-smi
```

## Troubleshooting

### No GPU detected
- Verify you're on the Brev GPU instance: `nvidia-smi`
- Check CUDA is available: `python3 -c "import torch; print(torch.cuda.is_available())"`

### Out of memory
- Reduce batch size in `quick_train.py` (line 98: `batch_size = 32`)

### PyTorch not installed
```bash
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## After Training

The script will save a checkpoint:
```
model_checkpoint_20260215_123045.pth
```

You can later load this checkpoint for continued training or inference.

## Next Steps

Once training is complete, you can:
1. Download the checkpoint to your local machine
2. Integrate it with the full CarbonShift backend
3. Run longer training sessions with grid-aware scheduling
