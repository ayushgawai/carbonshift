"""
CarbonShift - Main FastAPI Server
Grid-Aware AI Training Orchestrator
"""

import logging
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import List
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import config
from core.gpu_controller import gpu_controller
from core.energy_monitor import energy_monitor
from core.decision_engine import decision_engine
from demo_workload.training_engine import training_engine
from core.metrics_history import metrics_history
from core.llm_intelligence import llm_intelligence
from core.fetchai_agent import fetchai_real_agent as fetchai_agent

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global state
class SystemState:
    """Shared system state"""
    def __init__(self):
        self.current_grid_data = {}
        self.current_decision = None
        self.websocket_clients: List[WebSocket] = []
        self.energy_monitor_task = None
        self.metrics_broadcast_task = None
        self.is_running = False

system_state = SystemState()


# ============================================================================
# BACKGROUND TASKS
# ============================================================================

async def energy_monitor_loop():
    """
    Background task: Monitor grid energy every 60 seconds
    Makes orchestrator decisions based on real-time data
    """
    logger.info("🔋 Energy monitor loop started")

    while system_state.is_running:
        try:
            # Fetch grid data
            grid_data = await energy_monitor.fetch_grid_data()
            system_state.current_grid_data = grid_data

            logger.info(
                f"Grid Update - Price: ${grid_data['electricity_price']}/MWh, "
                f"Carbon: {grid_data['carbon_intensity']} gCO2/kWh"
            )

            # Make orchestrator decision
            decision = decision_engine.make_decision(
                grid_data['electricity_price'],
                grid_data['carbon_intensity']
            )
            system_state.current_decision = decision

            logger.info(
                f"Decision: {decision.state} | {decision.action} | "
                f"{decision.power_limit_watts}W | Pause: {decision.should_pause}"
            )
            logger.info(f"Reason: {decision.reason}")

            # Apply decision to hardware
            gpu_controller.set_power_limit(decision.power_limit_watts)

            # Apply decision to training
            if decision.should_pause and training_engine.is_training:
                training_engine.pause_training()
            elif not decision.should_pause and training_engine.is_paused:
                training_engine.resume_training()

            # Store historical data for charts
            gpu_stats = gpu_controller.get_gpu_stats()
            metrics_history.add_datapoint({
                "timestamp": grid_data["timestamp"],
                "electricity_price": grid_data["electricity_price"],
                "carbon_intensity": grid_data["carbon_intensity"],
                "gpu_power_watts": gpu_stats["power_usage_watts"],
                "gpu_power_limit_watts": gpu_stats["power_limit_watts"],
                "orchestrator_state": decision.state,
                "training_status": "paused" if decision.should_pause else "running",
                "cost_per_second": decision.cost_per_second,
                "carbon_per_second": decision.carbon_per_second
            })

            # Broadcast to Fetch.ai network (if active)
            await fetchai_agent.broadcast_grid_conditions(grid_data)

            # Wait before next poll
            await asyncio.sleep(config.ENERGY_POLL_INTERVAL)

        except Exception as e:
            logger.error(f"Energy monitor error: {e}")
            await asyncio.sleep(10)  # Shorter retry on error


async def metrics_broadcast_loop():
    """
    Background task: Broadcast metrics to WebSocket clients every 2 seconds
    """
    logger.info("📡 Metrics broadcast loop started")

    while system_state.is_running:
        try:
            # Collect all metrics
            metrics = await collect_metrics()

            # Broadcast to all connected WebSocket clients
            dead_clients = []
            for client in system_state.websocket_clients:
                try:
                    await client.send_json(metrics)
                except Exception:
                    dead_clients.append(client)

            # Remove disconnected clients
            for client in dead_clients:
                system_state.websocket_clients.remove(client)

            # Wait before next broadcast
            await asyncio.sleep(config.METRICS_BROADCAST_INTERVAL)

        except Exception as e:
            logger.error(f"Metrics broadcast error: {e}")
            await asyncio.sleep(2)


async def collect_metrics() -> dict:
    """Collect all system metrics for frontend"""
    grid_data = system_state.current_grid_data
    decision = system_state.current_decision
    gpu_stats = gpu_controller.get_gpu_stats()
    training_progress = training_engine.get_progress()
    savings = decision_engine.get_savings_summary()

    # Determine training status
    if training_progress["is_paused"]:
        training_status = "paused"
    elif training_progress["is_training"]:
        training_status = "running"
    elif training_progress["progress_percent"] >= 99.9:
        training_status = "completed"
    else:
        training_status = "idle"

    return {
        # Timestamp
        "timestamp": grid_data.get("timestamp", ""),

        # Grid data (frontend format)
        "electricity_price": grid_data.get("electricity_price", 0),
        "carbon_intensity": grid_data.get("carbon_intensity", 0),

        # GPU metrics (frontend format)
        "gpu_power_watts": gpu_stats["power_usage_watts"],
        "gpu_power_limit": gpu_stats["power_limit_watts"],

        # Orchestrator state
        "orchestrator_state": decision.state if decision else "UNKNOWN",
        "orchestrator_action": decision.action if decision else "UNKNOWN",
        "orchestrator_reason": decision.reason if decision else "",

        # Training progress (frontend format)
        "training_status": training_status,
        "training_progress": training_progress["progress_percent"],
        "current_epoch": training_progress["current_epoch"],
        "total_epochs": training_progress["total_epochs"],

        # Savings (frontend format)
        "total_cost_saved": savings["total_cost_saved_usd"],
        "total_carbon_saved": savings["total_carbon_saved_kg"],
        "peaks_avoided": savings["peaks_avoided_count"],

        # Additional backend-specific fields (for API endpoints)
        "gpu_temperature_c": gpu_stats["temperature_c"],
        "gpu_utilization_percent": gpu_stats["gpu_utilization_percent"],
        "training_loss": training_progress["training_loss"],
    }


# ============================================================================
# LIFESPAN MANAGEMENT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("=" * 70)
    logger.info("🚀 CarbonShift Starting Up")
    logger.info("=" * 70)

    # Validate config
    warnings = config.validate()
    for warning in warnings:
        logger.warning(warning)

    # Start Fetch.ai agent
    logger.info("🤖 Starting Fetch.ai Agent...")
    agent_started = fetchai_agent.run_async()
    if agent_started:
        logger.info("✅ Fetch.ai Agent running and connected to network")
    else:
        logger.warning("⚠️  Fetch.ai Agent not started (credentials missing or error)")

    # Backfill 24h historical data for charts
    logger.info("📊 Backfilling 24h historical data from CAISO patterns...")
    try:
        from backfill_history import backfill_24h_history
        await backfill_24h_history(metrics_history)
        logger.info(f"✅ Historical data ready: {len(metrics_history.history)} datapoints")
    except Exception as e:
        logger.warning(f"⚠️  Backfill failed: {e} - charts will populate gradually")

    # Start background tasks
    system_state.is_running = True
    system_state.energy_monitor_task = asyncio.create_task(energy_monitor_loop())
    system_state.metrics_broadcast_task = asyncio.create_task(metrics_broadcast_loop())

    logger.info("✅ CarbonShift is running")
    logger.info(f"📊 API: http://{config.API_HOST}:{config.API_PORT}")
    logger.info(f"📡 WebSocket: ws://{config.API_HOST}:{config.API_PORT}/ws")
    logger.info("=" * 70)

    yield

    # Shutdown
    logger.info("🛑 Shutting down CarbonShift...")
    system_state.is_running = False

    # Stop training
    if training_engine.is_training:
        training_engine.stop_training()

    # Cancel background tasks
    if system_state.energy_monitor_task:
        system_state.energy_monitor_task.cancel()
    if system_state.metrics_broadcast_task:
        system_state.metrics_broadcast_task.cancel()

    # Cleanup GPU
    gpu_controller.shutdown()

    logger.info("✅ Shutdown complete")


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="CarbonShift API",
    description="Grid-Aware AI Training Orchestrator",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {"status": "ok", "service": "CarbonShift"}


@app.get("/api/status")
async def get_status():
    """Get current system status and metrics"""
    metrics = await collect_metrics()
    return JSONResponse(content=metrics)


@app.post("/api/start-training")
async def start_training():
    """Start the training workload"""
    success = training_engine.start_training()
    if success:
        return {"status": "success", "message": "Training started"}
    else:
        return {"status": "error", "message": "Training already running"}


@app.post("/api/stop-training")
async def stop_training():
    """Stop the training workload"""
    training_engine.stop_training()
    return {"status": "success", "message": "Training stopped"}


@app.get("/api/savings")
async def get_savings():
    """Get savings summary"""
    savings = decision_engine.get_savings_summary()
    return JSONResponse(content=savings)


@app.get("/api/gpu")
async def get_gpu_info():
    """Get GPU information and stats"""
    stats = gpu_controller.get_gpu_stats()
    return JSONResponse(content=stats)


@app.get("/api/history")
async def get_history(range: str = "1h"):
    """
    Get historical metrics for charts

    Args:
        range: "1h" for last hour, "24h" for last 24 hours
    """
    if range == "1h":
        data = metrics_history.get_last_hour()
    elif range == "24h":
        data = metrics_history.get_last_24_hours()
    else:
        data = metrics_history.get_last_hour()

    stats = metrics_history.get_summary_stats(range)

    return JSONResponse(content={
        "time_series": data,
        "summary": stats
    })


@app.get("/api/predict")
async def predict_prices():
    """
    Get GPT-4 price prediction and strategy recommendation
    """
    historical_data = metrics_history.get_last_hour()

    if not historical_data:
        return JSONResponse(content={
            "error": "Not enough historical data yet",
            "prediction": "wait",
            "confidence": 0.5
        })

    prediction = await llm_intelligence.predict_price_trend(historical_data)

    return JSONResponse(content=prediction)


@app.get("/api/explanation")
async def get_decision_explanation():
    """
    Get Claude-generated explanation of current orchestrator decision
    """
    decision = system_state.current_decision
    grid_data = system_state.current_grid_data

    if not decision or not grid_data:
        return JSONResponse(content={
            "explanation": "System starting up, no decision made yet"
        })

    decision_data = {
        "state": decision.state,
        "action": decision.action,
        "price": grid_data.get("electricity_price", 0),
        "carbon": grid_data.get("carbon_intensity", 0),
        "power_limit": decision.power_limit_watts,
        "reasoning": decision.reason
    }

    explanation = await llm_intelligence.generate_decision_explanation(decision_data)

    return JSONResponse(content={
        "explanation": explanation,
        "technical_details": decision_data
    })


@app.get("/api/report")
async def generate_savings_report():
    """
    Get Claude-generated savings report
    """
    savings = decision_engine.get_savings_summary()
    training_progress = training_engine.get_progress()

    # Estimate training time
    training_time = training_progress.get("current_step", 0) * 2  # Rough estimate

    savings_data = {
        "cost_saved": savings["total_cost_saved_usd"],
        "carbon_saved": savings["total_carbon_saved_kg"],
        "peaks_avoided": savings["peaks_avoided_count"],
        "training_time": training_time
    }

    report = await llm_intelligence.generate_savings_report(savings_data)

    return JSONResponse(content={
        "report": report,
        "metrics": savings_data
    })


@app.get("/api/fetchai/status")
async def get_fetchai_status():
    """Get Fetch.ai agent status"""
    status = fetchai_agent.get_agent_status()
    return JSONResponse(content=status)


@app.post("/api/fetchai/coordinate")
async def coordinate_training_job():
    """
    Request Fetch.ai AgentVerse agent to coordinate training job
    Autonomous agent capabilities with grid optimization
    """
    job_config = {
        "model": "ResNet-18",
        "dataset": "CIFAR-10",
        "priority": "cost_optimization"
    }

    result = await fetchai_agent.coordinate_training_job(job_config)

    return JSONResponse(content=result)


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time metrics streaming"""
    await websocket.accept()
    system_state.websocket_clients.append(websocket)

    logger.info(f"WebSocket client connected. Total: {len(system_state.websocket_clients)}")

    try:
        # Send initial metrics
        metrics = await collect_metrics()
        await websocket.send_json(metrics)

        # Keep connection alive
        while True:
            # Wait for messages (ping/pong to keep alive)
            data = await websocket.receive_text()
            # Echo back for debugging
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        system_state.websocket_clients.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(system_state.websocket_clients)}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        log_level=config.LOG_LEVEL.lower(),
        reload=False
    )
