"""
CarbonShift Agent for AgentVerse
Paste this entire code into AgentVerse to create a hosted agent
"""

from uagents import Agent, Context, Model
from datetime import datetime

# Define message models
class GridConditions(Model):
    price: float
    carbon: float
    region: str
    timestamp: str

class ComputeRequest(Model):
    gpu_type: str
    duration_hours: int
    max_price: float

class ComputeOffer(Model):
    available: bool
    gpu_type: str
    price: float
    location: str

# Create agent
# AgentVerse will handle the address automatically
agent = Agent(
    name="carbonshift_orchestrator",
    port=8000,
    seed="carbonshift_treehacks_2024_secure_seed_12345",  # Use this for consistent address
    endpoint=["https://agentverse.ai/carbonshift/submit"],  # AgentVerse will set this
)

print(f"CarbonShift Agent Address: {agent.address}")

# Startup handler
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("🚀 CarbonShift Agent started on AgentVerse!")
    ctx.logger.info(f"Agent address: {ctx.agent.address}")
    ctx.logger.info("Monitoring grid conditions for optimal AI training...")

# Interval handler - Runs every 30 seconds
@agent.on_interval(period=30.0)
async def monitor_grid(ctx: Context):
    """Simulate grid monitoring - in production would fetch real data"""
    ctx.logger.info("📊 Monitoring grid conditions...")
    ctx.logger.info("Agent ready to coordinate training jobs")

# Message handler for grid conditions
@agent.on_message(model=GridConditions)
async def handle_grid_update(ctx: Context, sender: str, msg: GridConditions):
    ctx.logger.info(f"📡 Grid update from {sender}")
    ctx.logger.info(f"   Price: ${msg.price}/MWh")
    ctx.logger.info(f"   Carbon: {msg.carbon} gCO2/kWh")
    ctx.logger.info(f"   Region: {msg.region}")

    # Make decision based on conditions
    if msg.price < 35 and msg.carbon < 300:
        ctx.logger.info("✅ GREEN state - Optimal for training!")
        response = "Training recommended - excellent conditions"
    elif msg.price > 70 or msg.carbon > 500:
        ctx.logger.info("⛔ RED state - Training should pause")
        response = "Training should pause - critical conditions"
    else:
        ctx.logger.info("⚠️  AMBER/NORMAL - Proceed with caution")
        response = "Training proceeding normally"

    # Send response back
    await ctx.send(sender, GridConditions(
        price=msg.price,
        carbon=msg.carbon,
        region=msg.region,
        timestamp=str(datetime.now())
    ))

# Message handler for compute requests
@agent.on_message(model=ComputeRequest)
async def handle_compute_request(ctx: Context, sender: str, msg: ComputeRequest):
    ctx.logger.info(f"🔍 Compute request from {sender}")
    ctx.logger.info(f"   GPU: {msg.gpu_type}")
    ctx.logger.info(f"   Duration: {msg.duration_hours}h")
    ctx.logger.info(f"   Max price: ${msg.max_price}/MWh")

    # Simulate resource availability check
    offer = ComputeOffer(
        available=True,
        gpu_type=msg.gpu_type,
        price=45.0,  # Competitive price
        location="US-California"
    )

    ctx.logger.info(f"✅ Sending offer: ${offer.price}/MWh")
    await ctx.send(sender, offer)

# Shutdown handler
@agent.on_event("shutdown")
async def shutdown(ctx: Context):
    ctx.logger.info("🛑 CarbonShift Agent shutting down")

# This is required for AgentVerse
if __name__ == "__main__":
    agent.run()
