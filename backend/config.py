"""
CarbonShift Configuration
All system constants, thresholds, and settings
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Global configuration for CarbonShift system"""

    # ========================================================================
    # GPU & COMPUTE
    # ========================================================================
    BREV_INSTANCE_ID = os.getenv("BREV_INSTANCE_ID", "fd0pwxkdo")
    GPU_TYPE = os.getenv("GPU_TYPE", "A100_80GB")
    GPU_MEMORY_GB = int(os.getenv("GPU_MEMORY_GB", "80"))

    # GPU Power Limits (Watts) - Eco-Pulse Arbitration States
    GPU_POWER_PAUSE = int(os.getenv("GPU_POWER_PAUSE", "100"))      # RED: Critical - pause training
    GPU_POWER_REDUCE = int(os.getenv("GPU_POWER_REDUCE", "150"))    # AMBER: High - reduce power
    GPU_POWER_NORMAL = int(os.getenv("GPU_POWER_NORMAL", "200"))    # NORMAL: Standard operation
    GPU_POWER_BOOST = int(os.getenv("GPU_POWER_BOOST", "250"))      # GREEN: Optimal - max performance
    GPU_POWER_MAX = 300  # A100 PCIe max power cap

    # ========================================================================
    # ENERGY THRESHOLDS (Eco-Pulse Arbitration Algorithm)
    # ========================================================================

    # Electricity Price Thresholds (USD/MWh)
    PRICE_THRESHOLD_CRITICAL = float(os.getenv("PRICE_THRESHOLD_CRITICAL", "70.0"))  # RED
    PRICE_THRESHOLD_HIGH = float(os.getenv("PRICE_THRESHOLD_HIGH", "50.0"))          # AMBER
    PRICE_THRESHOLD_LOW = float(os.getenv("PRICE_THRESHOLD_LOW", "35.0"))            # GREEN

    # Carbon Intensity Thresholds (gCO2/kWh)
    CARBON_THRESHOLD_CRITICAL = float(os.getenv("CARBON_THRESHOLD_CRITICAL", "500"))  # RED
    CARBON_THRESHOLD_HIGH = float(os.getenv("CARBON_THRESHOLD_HIGH", "400"))          # AMBER
    CARBON_THRESHOLD_LOW = float(os.getenv("CARBON_THRESHOLD_LOW", "300"))            # GREEN

    # ========================================================================
    # ENERGY APIS
    # ========================================================================

    # WattTime API (Primary)
    WATTTIME_USERNAME = os.getenv("WATTTIME_USERNAME", "")
    WATTTIME_PASSWORD = os.getenv("WATTTIME_PASSWORD", "")
    WATTTIME_REGION = os.getenv("WATTTIME_REGION", "CAISO_NORTH")
    WATTTIME_API_URL = "https://api.watttime.org/v3"

    # Electricity Maps (Backup)
    ELECTRICITY_MAPS_API_KEY = os.getenv("ELECTRICITY_MAPS_API_KEY", "")
    ELECTRICITY_MAPS_API_URL = "https://api.electricitymap.org/v3"

    # Grid Configuration
    GRID_REGION = os.getenv("GRID_REGION", "CAISO_NORTH")
    TIMEZONE = os.getenv("TIMEZONE", "America/Los_Angeles")

    # ========================================================================
    # DEMO WORKLOAD (Training Configuration)
    # ========================================================================

    # Model Selection
    TRAINING_MODEL = os.getenv("TRAINING_MODEL", "resnet18")  # Options: resnet18, distilbert
    DEMO_DATASET = os.getenv("DEMO_DATASET", "cifar10")  # Options: cifar10, imdb

    # Training Hyperparameters
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
    NUM_EPOCHS = int(os.getenv("NUM_EPOCHS", "10"))
    LEARNING_RATE = float(os.getenv("LEARNING_RATE", "0.001"))
    DATASET_SIZE = int(os.getenv("DATASET_SIZE", "5000"))  # Training dataset size

    # Checkpointing
    CHECKPOINT_DIR = os.getenv("CHECKPOINT_DIR", "./checkpoints")
    CHECKPOINT_INTERVAL_STEPS = int(os.getenv("CHECKPOINT_INTERVAL_STEPS", "50"))

    # Hugging Face
    HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

    # ========================================================================
    # LLM INTEGRATIONS (Optional Intelligence Layer)
    # ========================================================================

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")

    # Anthropic Claude
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")

    # LLM Features
    USE_LLM_DECISION_ENHANCEMENT = os.getenv("USE_LLM_DECISION_ENHANCEMENT", "false").lower() == "true"

    # ========================================================================
    # FETCH.AI (Autonomous Agent Orchestration)
    # ========================================================================

    FETCHAI_API_KEY = os.getenv("FETCHAI_API_KEY", "")
    FETCHAI_AGENT_ADDRESS = os.getenv("FETCHAI_AGENT_ADDRESS", "")
    USE_FETCHAI = os.getenv("USE_FETCHAI", "false").lower() == "true"

    # ========================================================================
    # SYSTEM SETTINGS
    # ========================================================================

    # Update Intervals
    ENERGY_POLL_INTERVAL = int(os.getenv("ENERGY_POLL_INTERVAL", "60"))  # seconds
    METRICS_BROADCAST_INTERVAL = int(os.getenv("METRICS_BROADCAST_INTERVAL", "2"))  # seconds

    # API Server
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # ========================================================================
    # COST CALCULATIONS
    # ========================================================================

    AVG_OFFPEAK_PRICE = float(os.getenv("AVG_OFFPEAK_PRICE", "30.0"))  # USD/MWh
    AVG_PEAK_PRICE = float(os.getenv("AVG_PEAK_PRICE", "70.0"))  # USD/MWh

    # ========================================================================
    # ORCHESTRATOR STATES
    # ========================================================================

    STATE_GREEN = "GREEN"    # Optimal - cheap & clean energy
    STATE_AMBER = "AMBER"    # Caution - expensive or dirty
    STATE_RED = "RED"        # Critical - pause training
    STATE_NORMAL = "NORMAL"  # Normal operation

    # ========================================================================
    # VALIDATION
    # ========================================================================

    @classmethod
    def validate(cls):
        """Validate configuration and print warnings for missing keys"""
        warnings = []

        if not cls.WATTTIME_USERNAME or not cls.WATTTIME_PASSWORD:
            warnings.append("⚠️  WattTime credentials missing - will use CAISO as primary source")

        if not cls.HUGGINGFACE_TOKEN:
            warnings.append("⚠️  Hugging Face token missing - may fail to download models")

        if not cls.OPENAI_API_KEY and not cls.ANTHROPIC_API_KEY:
            warnings.append("ℹ️  No LLM API keys - running without LLM enhancement")

        return warnings


# Create global config instance
config = Config()

# Print configuration on import
if __name__ == "__main__":
    print("CarbonShift Configuration")
    print("=" * 50)
    print(f"GPU: {config.GPU_TYPE} ({config.GPU_MEMORY_GB}GB)")
    print(f"Power Limits: {config.GPU_POWER_PAUSE}W - {config.GPU_POWER_MAX}W")
    print(f"Training Model: {config.TRAINING_MODEL}")
    print(f"Energy Poll Interval: {config.ENERGY_POLL_INTERVAL}s")
    print("=" * 50)

    warnings = Config.validate()
    for warning in warnings:
        print(warning)
