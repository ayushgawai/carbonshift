# CarbonShift Backend

**Energy-Aware AI Training Orchestrator**  
Real-time grid monitoring with intelligent GPU power management for sustainable AI training.

---

## 🎯 System Overview

CarbonShift monitors real-time California grid conditions and intelligently orchestrates AI training workloads using the Eco-Pulse Arbitration algorithm to maximize sustainability while minimizing costs.

### Key Components
- **CAISO OASIS Integration**: Real California grid data (5-min intervals)
- **Eco-Pulse Algorithm**: 4-state orchestration (GREEN/NORMAL/AMBER/RED)
- **GPU Power Control**: Dynamic adjustment (100W-250W)
- **Fetch.ai Agent**: Network-registered autonomous coordinator
- **LLM Intelligence**: GPT-4o predictions + Claude reports

---

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.template .env
# Add your API keys to .env

# Run
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

**Access:** http://localhost:8000

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Current system state |
| `/api/history?range=1h\|24h` | GET | Historical data |
| `/api/start-training` | POST | Start training |
| `/api/predict` | GET | GPT-4o predictions |
| `/api/fetchai/status` | GET | Agent status |
| `/ws` | WebSocket | Real-time streaming |

---

## 🤖 Fetch.ai Agent

**Primary:** `agent1q2edespuyuta3cmlz25me0xnwnyn4uf5qv57mzftxapu9hydh75x5mu08tq`  
**Location:** AgentVerse (publicly visible)  
**Status:** Active on network

---

## 📊 Data Sources

**Priority Order:**
1. CAISO OASIS (California ISO - Primary)
2. WattTime API (Fallback)
3. Electricity Maps (Fallback)

All data stored in 24-hour rolling buffer (1440 points).

---

## 🎯 Eco-Pulse Arbitration

| State | Condition | GPU Power | Action |
|-------|-----------|-----------|--------|
| **GREEN** | Price<$35, Carbon<300 | 250W | Boost |
| **NORMAL** | Moderate | 200W | Continue |
| **AMBER** | Price $50-70, Carbon 400-500 | 150W | Reduce |
| **RED** | Price>$70, Carbon>500 | 100W | Pause |

---

## 🏗️ Architecture

```
CAISO API → Energy Monitor → Decision Engine → GPU Controller
     ↓            ↓               ↓                  ↓
Historical Storage ← Metrics History ← Training Engine
     ↓
WebSocket → Frontend
```

---

## 📦 Tech Stack

- **FastAPI** + **Python 3.9+**
- **PyTorch 2.1.0** (Training)
- **CAISO OASIS API** (Grid data)
- **OpenAI GPT-4o** (Predictions)
- **Anthropic Claude** (Reports)
- **Fetch.ai uAgents** (Agent network)
- **NVIDIA NVML** (GPU control)

---

## 📄 Project Structure

```
backend/
├── api/main.py                    # FastAPI app
├── core/
│   ├── caiso_api.py              # California grid data
│   ├── energy_monitor.py         # Data fetching
│   ├── decision_engine.py        # Orchestration algorithm
│   ├── gpu_controller.py         # Power management
│   ├── fetchai_agent_real.py    # Network agent
│   └── llm_intelligence.py       # AI integrations
├── demo_workload/training_engine.py
├── config.py
└── requirements.txt
```

---

## 🔧 Configuration

Key settings in `.env`:
```bash
# Thresholds
PRICE_THRESHOLD_LOW=35.0
PRICE_THRESHOLD_HIGH=50.0  
PRICE_THRESHOLD_CRITICAL=70.0

# GPU Power
GPU_POWER_BOOST=250
GPU_POWER_NORMAL=200
GPU_POWER_REDUCE=150
GPU_POWER_PAUSE=100

# Intervals
ENERGY_POLL_INTERVAL=60
METRICS_BROADCAST_INTERVAL=2
```

---

## 🏆 Production Features

✅ Real-time CAISO grid data  
✅ 4-state intelligent orchestration  
✅ 24-hour historical storage  
✅ WebSocket streaming  
✅ Network-registered agent  
✅ AI-powered insights  
✅ Cost & carbon tracking  
✅ Comprehensive API  

---

**Status:** Production-Ready  
**Version:** 1.0.0  
**Built for:** TreeHacks 2024
