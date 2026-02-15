"""
Test communication with the AgentVerse hosted agent
"""
import asyncio
from uagents import Agent, Context, Model
from datetime import datetime

# Define the same message models
class GridConditions(Model):
    price: float
    carbon: float
    region: str
    timestamp: str

# Create a test agent to send messages
test_agent = Agent(
    name="test_sender",
    seed="test_sender_seed_12345",
    port=8002,
)

# The target agent address on AgentVerse
TARGET_AGENT = "agent1q2edespuyuta3cmlz25me0xnwnyn4uf5qv57mzftxapu9hydh75x5mu08tq"

print("=" * 60)
print("Testing Communication with AgentVerse Agent")
print("=" * 60)
print(f"Test Agent Address: {test_agent.address}")
print(f"Target Agent: {TARGET_AGENT}")
print()

@test_agent.on_event("startup")
async def send_test_message(ctx: Context):
    ctx.logger.info("🚀 Test agent started")
    ctx.logger.info(f"Sending grid conditions to {TARGET_AGENT}")

    # Send test message
    await ctx.send(
        TARGET_AGENT,
        GridConditions(
            price=42.5,
            carbon=350.0,
            region="CAISO_NORTH",
            timestamp=str(datetime.now())
        )
    )
    ctx.logger.info("✅ Message sent!")

@test_agent.on_message(model=GridConditions)
async def handle_response(ctx: Context, sender: str, msg: GridConditions):
    ctx.logger.info(f"📨 Received response from {sender}")
    ctx.logger.info(f"   Price: ${msg.price}/MWh")
    ctx.logger.info(f"   Carbon: {msg.carbon} gCO2/kWh")
    ctx.logger.info("✅ Communication successful!")

if __name__ == "__main__":
    print("Starting test agent...")
    print("Will attempt to communicate with AgentVerse agent")
    print("Running for 15 seconds...")
    print()

    # Run for limited time
    try:
        test_agent.run()
    except KeyboardInterrupt:
        print("\n✅ Test completed")
