"""
Test Real Fetch.ai Agent Connection
"""
import asyncio
import sys
from uagents import Agent, Context

print("=" * 60)
print("Testing Fetch.ai uAgents SDK Connection")
print("=" * 60)

# Load environment
from dotenv import load_dotenv
import os
load_dotenv()

agent_address = os.getenv("FETCHAI_AGENT_ADDRESS")
api_key = os.getenv("FETCHAI_API_KEY")

print(f"\n✓ Agent Address: {agent_address[:20]}..." if agent_address else "❌ No agent address")
print(f"✓ API Key: {api_key[:20]}..." if api_key else "❌ No API key")

# Create a test agent
try:
    print("\n🔧 Creating Fetch.ai Agent...")

    agent = Agent(
        name="carbonshift_test",
        seed=agent_address if agent_address else "test_seed_12345",
        port=8001,
        endpoint=["http://localhost:8001/submit"]
    )

    print(f"✅ Agent created successfully!")
    print(f"   Name: {agent.name}")
    print(f"   Address: {agent.address}")
    print(f"   Port: 8001")

    # Setup simple handlers
    @agent.on_event("startup")
    async def startup(ctx: Context):
        print(f"\n🤖 Agent started and running!")
        print(f"   Agent address: {ctx.agent.address}")
        print(f"   Agent name: {ctx.agent.name}")

        # Try to get balance
        try:
            # Note: This would require the agent to be registered on testnet
            print("\n📡 Agent is now listening for messages...")
            print("   (Agent will register to Almanac on first run)")
        except Exception as e:
            print(f"   Note: {e}")

    @agent.on_event("shutdown")
    async def shutdown(ctx: Context):
        print("\n🛑 Agent shutting down gracefully")

    print("\n🚀 Starting agent (will run for 10 seconds)...")
    print("   The agent will attempt to register to the Fetch.ai Almanac")
    print("   Check AgentVerse at: https://agentverse.ai")

    # Run agent for a short time
    async def run_test():
        await agent.run_async()

    # Run with timeout
    try:
        asyncio.run(asyncio.wait_for(run_test(), timeout=10.0))
    except asyncio.TimeoutError:
        print("\n✅ Test completed (timed out as expected)")
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")

    print("\n" + "=" * 60)
    print("Test Summary:")
    print(f"  Agent Address: {agent.address}")
    print(f"  Status: Agent created and attempted registration")
    print(f"  Next Steps: Check AgentVerse for registration")
    print("=" * 60)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("   Make sure uagents is installed: pip install uagents")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
