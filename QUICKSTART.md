# ⚡ FASTEST WAY TO RUN CARBONSHIFT

## 🎯 Goal
Run training on Brev GPU → See real-time data on local frontend

---

## 🚀 ONE COMMAND DEPLOYMENT

From your **local machine** (this terminal):

```bash
cd /Users/spartan/Documents/GitHub/carbonshift
bash deploy_to_brev_full.sh
```

This script:
- ✅ Copies all backend code to Brev
- ✅ Sets up environment with your API keys
- ✅ Installs PyTorch with CUDA
- ✅ Gives you the connection URL

---

## 📡 HOW IT WORKS

```
┌─────────────┐         WebSocket         ┌──────────────┐
│   LOCAL     │◄─────────────────────────►│     BREV     │
│  Frontend   │   ws://BREV_IP:8000/ws    │   Backend    │
│ (Port 3000) │                            │  + Training  │
│             │         REST API           │   on GPU     │
│             │◄─────────────────────────►│ (Port 8000)  │
└─────────────┘                            └──────────────┘
     Mac                                      GPU Instance
```

---

## ⚡ STEPS (After Running Deploy Script)

### 1️⃣ Start Backend on Brev

```bash
# Connect to Brev and start backend (one command)
ssh ubuntu@fd0pwxkdo.brev.sh 'cd carbonshift/backend && bash run_backend.sh'
```

**Or in two steps:**
```bash
# Connect to Brev
ssh ubuntu@fd0pwxkdo.brev.sh

# Start backend
cd carbonshift/backend
bash run_backend.sh
```

### 2️⃣ Get Brev Backend URL

The script will show you:
```
Backend API: http://BREV_IP:8000
WebSocket:   ws://BREV_IP:8000/ws
```

### 3️⃣ Update Local Frontend

In your frontend config, change the backend URL to point to Brev:

**frontend/.env.local** or **frontend/src/config.js**:
```javascript
// Change from:
const BACKEND_URL = "http://localhost:8000"
const WS_URL = "ws://localhost:8000/ws"

// To:
const BACKEND_URL = "http://BREV_IP:8000"
const WS_URL = "ws://BREV_IP:8000/ws"
```

### 4️⃣ Start Local Frontend

```bash
cd frontend
npm run dev
```

### 5️⃣ Start Training

From your local machine:
```bash
curl http://BREV_IP:8000/api/start-training -X POST
```

Or click "Start Training" in the frontend!

---

## 🎯 ULTRA-FAST VERSION (All in One)

Run these commands in sequence:

```bash
# 1. Deploy to Brev
cd /Users/spartan/Documents/GitHub/carbonshift
bash deploy_to_brev_full.sh

# 2. Start Brev backend (in background)
ssh ubuntu@fd0pwxkdo.brev.sh 'cd carbonshift/backend && nohup bash run_backend.sh > backend.log 2>&1 &'

# 3. Wait 10 seconds for backend to start
sleep 10

# 4. Get Brev IP
BREV_IP=$(ssh ubuntu@fd0pwxkdo.brev.sh "hostname -I | awk '{print \$1}'")
echo "Backend running at: http://${BREV_IP}:8000"

# 5. Test backend
curl http://${BREV_IP}:8000/api/status

# 6. Start training
curl http://${BREV_IP}:8000/api/start-training -X POST

# 7. Start local frontend (in new terminal)
# cd frontend && npm run dev
```

---

## 🔍 VERIFICATION

### Check backend is running:
```bash
curl http://BREV_IP:8000/api/status
```

### Check training is running:
```bash
curl http://BREV_IP:8000/api/status | grep training_status
```

### Check GPU usage on Brev:
```bash
ssh ubuntu@fd0pwxkdo.brev.sh "nvidia-smi"
```

---

## 💡 WHY THIS IS THE FASTEST WAY

1. ✅ **Full backend runs on GPU instance** - No need to copy data back/forth
2. ✅ **WebSocket streams data** - Real-time updates to local frontend
3. ✅ **One deployment script** - Everything configured automatically
4. ✅ **No code changes needed** - Just update frontend URL
5. ✅ **Training on GPU** - Fast training on A100

---

## 🐛 TROUBLESHOOTING

### Can't connect to Brev?
```bash
# Check Brev instances
brev ls

# Try alternative connection
brev shell treehacks-carbonshift
```

### Backend not starting?
```bash
# SSH to Brev and check logs
ssh ubuntu@fd0pwxkdo.brev.sh
cd carbonshift/backend
tail -f backend.log
```

### Frontend can't connect?
```bash
# Check firewall - Brev usually has port 8000 open by default
# If not, open the port:
ssh ubuntu@fd0pwxkdo.brev.sh "sudo ufw allow 8000"
```

### Get the Brev IP:
```bash
ssh ubuntu@fd0pwxkdo.brev.sh "hostname -I"
```

---

## 📊 EXPECTED FLOW

1. Deploy script runs → **~2 minutes**
2. Backend starts on Brev → **~30 seconds**
3. Frontend connects → **instant**
4. Start training → Training begins on GPU
5. Frontend shows real-time metrics via WebSocket

**Total setup time: ~3 minutes** ⚡

---

## 🎉 SUCCESS CHECKLIST

- [ ] Deploy script completed
- [ ] Backend running on Brev (curl test passes)
- [ ] Frontend updated with Brev IP
- [ ] Frontend started locally
- [ ] Training started
- [ ] Frontend shows real-time data

---

## 🚀 YOU'RE DONE!

Your frontend will now show:
- ✅ Real-time GPU metrics
- ✅ Training progress
- ✅ Grid conditions
- ✅ Cost/carbon savings

All while training runs on the GPU on Brev! 🔥
