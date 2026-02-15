# 🚀 Deploy CarbonShift to Brev A100 GPU

**Quick deployment guide for running on your A100 80GB instance**

---

## **Why Deploy to Brev?**

- ✅ Real NVIDIA A100 80GB GPU
- ✅ Real GPU power control (100-300W via pynvml)
- ✅ Better performance for demo
- ✅ You already paid for it!

---

## **Option 1: Automated Deployment (Recommended)**

### **Run the deployment script:**

```bash
cd ~/Documents/GitHub/carbonshift
./deploy-to-brev.sh
```

This will:
1. Package the backend code
2. Upload to Brev
3. Show you the remaining manual steps

---

## **Option 2: Manual Deployment (If Script Fails)**

### **Step 1: Package the Code**

```bash
cd ~/Documents/GitHub
tar -czf carbonshift-deploy.tar.gz \
    --exclude='carbonshift/venv' \
    --exclude='carbonshift/.git' \
    carbonshift/backend
```

### **Step 2: SSH into Brev**

```bash
brev shell fd0pwxkdo
```

### **Step 3: Upload Code (In Another Terminal)**

**Method A: Using brev scp**
```bash
brev scp carbonshift-deploy.tar.gz fd0pwxkdo:/workspace/
```

**Method B: Using regular scp (if brev scp doesn't work)**
```bash
# First, get the SSH connection info from brev
brev ls
# Then use scp with the hostname shown
scp carbonshift-deploy.tar.gz <brev-hostname>:/workspace/
```

### **Step 4: Setup on Brev (Inside SSH Session)**

```bash
# Extract
cd /workspace
tar -xzf carbonshift-deploy.tar.gz
cd carbonshift/backend

# Install dependencies
pip install -r requirements.txt
pip install 'numpy<2'  # Fix PyTorch compatibility

# Create .env file
nano .env
# Paste your .env content from local machine
# Save with Ctrl+O, Enter, Ctrl+X
```

### **Step 5: Start the Backend**

```bash
cd /workspace/carbonshift/backend

# Make sure start.sh is executable
chmod +x start.sh

# Start the server
./start.sh
```

You should see:
```
========================================
🚀 CarbonShift Starting Up
========================================
✅ GPU initialized: NVIDIA A100-PCIE-80GB
Current power limit: 300.0W
✅ CarbonShift is running
📊 API: http://0.0.0.0:8000
📡 WebSocket: ws://0.0.0.0:8000/ws
========================================
```

### **Step 6: Get Your Brev IP Address**

```bash
# In the Brev SSH session
curl ifconfig.me
```

This will show your public IP (e.g., `12.34.56.78`)

### **Step 7: Access Backend**

- **API**: http://YOUR_BREV_IP:8000
- **WebSocket**: ws://YOUR_BREV_IP:8000/ws
- **Docs**: http://YOUR_BREV_IP:8000/docs

---

## **Testing the Deployment**

### **From Your Mac:**

```bash
# Replace with your Brev IP
BREV_IP="12.34.56.78"

# Test health check
curl http://$BREV_IP:8000/

# Get system status
curl http://$BREV_IP:8000/api/status | python3 -m json.tool

# Start training
curl -X POST http://$BREV_IP:8000/api/start-training

# Watch GPU with nvidia-smi
# (In Brev SSH session)
watch -n 1 nvidia-smi
```

You should see the GPU power limit changing based on the orchestrator state!

---

## **Troubleshooting**

### **Port 8000 Already in Use**

```bash
# Kill any process on port 8000
lsof -ti:8000 | xargs kill -9

# Restart
./start.sh
```

### **NVML Error (GPU Not Found)**

```bash
# Check if GPU is visible
nvidia-smi

# If not visible, restart the instance
# On your Mac:
brev stop fd0pwxkdo
brev start fd0pwxkdo
```

### **Dependencies Missing**

```bash
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
pip install 'numpy<2'
```

### **Can't Access from Browser**

1. Check firewall: Port 8000 might be blocked
2. Try using SSH tunnel:
   ```bash
   # On your Mac
   ssh -L 8000:localhost:8000 <brev-hostname>
   # Then access: http://localhost:8000
   ```

---

## **Monitoring the System**

### **Watch GPU Power Changes**

```bash
# In Brev SSH session
watch -n 1 'nvidia-smi | grep -A 2 "GPU  Name"'
```

You'll see power limit changing:
- GREEN: 250W
- NORMAL: 200W
- AMBER: 150W
- RED: 100W

### **Watch Backend Logs**

```bash
# If using start.sh
tail -f /workspace/carbonshift/backend/api/logs/*.log

# Or just watch the terminal output
```

---

## **Stopping the Server**

```bash
# In Brev SSH session
# Press Ctrl+C to stop

# Or kill it
lsof -ti:8000 | xargs kill -9
```

---

## **Cost Management**

Your Brev instance costs ~$1.44/hour.

**To save credits:**
```bash
# From your Mac - stop when not using
brev stop fd0pwxkdo

# Start again when needed
brev start fd0pwxkdo
```

---

## **Next Steps After Deployment**

1. ✅ Verify backend is running on Brev
2. ✅ Test all API endpoints
3. ✅ Watch GPU power control in action
4. ✅ Share the Brev IP with frontend team
5. ✅ Update frontend to use Brev backend URL

---

## **Quick Reference**

```bash
# On Your Mac
brev shell fd0pwxkdo          # SSH into instance
brev stop fd0pwxkdo           # Stop instance
brev start fd0pwxkdo          # Start instance
brev ls                       # List instances

# On Brev
cd /workspace/carbonshift/backend
./start.sh                    # Start backend
nvidia-smi                    # Check GPU
curl ifconfig.me              # Get IP address
```

---

**Ready to deploy? Run:** `./deploy-to-brev.sh` 🚀
