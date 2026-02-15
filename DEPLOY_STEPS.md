# 🚀 Step-by-Step Deployment to Brev

## Current Situation
You're on your **local Mac** right now. You need to switch to your **Brev terminal** to run the training.

---

## ✅ Step 1: Verify You're on Brev

In your **other terminal** (the one SSH'd to Brev), run:

```bash
nvidia-smi
```

**Expected output:** Should show your GPU (e.g., "NVIDIA A100")

**If you see an error:** You're not connected to Brev yet.

---

## ✅ Step 2: Get Your Code on Brev

### Option A: If repo is already on Brev
```bash
cd carbonshift/backend
git pull origin main
```

### Option B: Clone fresh
```bash
git clone https://github.com/YOUR_USERNAME/carbonshift.git
cd carbonshift/backend
```

### Option C: Copy files from local machine
From your **local machine** (this terminal):
```bash
# First, get your Brev instance IP/hostname
# Then copy the files
cd /Users/spartan/Documents/GitHub/carbonshift/backend
scp quick_train.py setup_brev_env.sh ubuntu@YOUR_BREV_IP:~/
```

---

## ✅ Step 3: Setup Environment (First Time Only)

On your **Brev terminal**:

```bash
cd carbonshift/backend  # or wherever you copied the files

# Make scripts executable
chmod +x setup_brev_env.sh quick_train.py

# Run setup (this installs PyTorch with GPU support)
bash setup_brev_env.sh
```

This will:
- Create a Python virtual environment
- Install PyTorch with CUDA
- Verify GPU is working

---

## ✅ Step 4: Run Training

On your **Brev terminal**:

```bash
# Activate the environment
source venv_train/bin/activate

# Start 10-minute training
python3 quick_train.py --duration 10
```

---

## 🎯 Quick Method (If PyTorch is Already Installed)

If PyTorch is already on your Brev instance:

```bash
# On Brev terminal
cd carbonshift/backend
python3 quick_train.py --duration 10
```

---

## 🔍 How to Connect to Brev (If Not Connected)

```bash
# Get your Brev instance info
brev ls

# SSH into your instance
brev shell YOUR_INSTANCE_NAME

# Or use direct SSH
ssh ubuntu@YOUR_BREV_IP
```

---

## 📊 Expected Training Output

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
Epoch   2 | Step    40 | Loss: 2.1891 | Elapsed: 24s | Remaining: 576s
...
----------------------------------------------------------------------
✅ Training Complete!
Total Epochs: 47
Total Steps: 7344
Training Time: 600.0s (10.0 minutes)
Final Loss: 0.4523
💾 Checkpoint saved: model_checkpoint_20260215_123045.pth
======================================================================
```

---

## 🐛 Troubleshooting

### "nvidia-smi not found"
❌ You're on your local Mac, not Brev
✅ Switch to the Brev terminal

### "No module named 'torch'"
```bash
pip3 install torch torchvision torchaudio
```

### "CUDA not available"
Check your Brev instance has a GPU:
```bash
brev ls  # Check GPU_TYPE column
```

### Need to transfer checkpoint back to local?
```bash
# On local machine
scp ubuntu@YOUR_BREV_IP:~/carbonshift/backend/*.pth .
```

---

## 💡 Tips

- **Keep Brev terminal separate** from your local terminal
- Use `tmux` or `screen` on Brev so training continues if you disconnect
- Monitor GPU usage: `watch -n 1 nvidia-smi`
- Stop training early: `Ctrl+C` (checkpoint will still save)

---

## Next Steps After Training

1. ✅ Verify checkpoint file was created
2. ✅ Check GPU memory usage was reasonable
3. ✅ Transfer checkpoint to local if needed
4. ✅ Integrate with full CarbonShift backend
