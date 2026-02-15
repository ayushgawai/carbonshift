"""
GPU Controller - Hardware Power Management
Controls NVIDIA A100 GPU power limits based on orchestrator decisions
"""

import logging
from typing import Optional, Dict
from config import config

try:
    import pynvml
    NVML_AVAILABLE = True
except ImportError:
    NVML_AVAILABLE = False
    logging.warning("pynvml not available - GPU control features disabled")


class GPUController:
    """
    Manages GPU power limits for the A100 80GB

    Power States (Eco-Pulse Arbitration):
    - PAUSE (RED):   100W - Minimal power, training paused
    - REDUCE (AMBER): 150W - Reduced power, training continues
    - NORMAL:         200W - Standard operation
    - BOOST (GREEN):  250W - Maximum performance
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.has_gpu = False
        self.handle = None
        self.gpu_name = "Unknown"
        self.current_power_limit = 0
        self.max_power_limit = config.GPU_POWER_MAX

        # Initialize NVML
        self._initialize_nvml()

    def _initialize_nvml(self):
        """Initialize NVIDIA Management Library"""
        if not NVML_AVAILABLE:
            self.logger.warning("NVML not available - running in simulation mode")
            return

        try:
            pynvml.nvmlInit()
            self.handle = pynvml.nvmlDeviceGetHandleByIndex(0)  # First GPU
            self.has_gpu = True

            # Get GPU info
            self.gpu_name = pynvml.nvmlDeviceGetName(self.handle)
            self.logger.info(f"✅ GPU initialized: {self.gpu_name}")

            # Get current power limit
            current_limit_mw = pynvml.nvmlDeviceGetPowerManagementLimit(self.handle)
            self.current_power_limit = current_limit_mw / 1000  # Convert to watts

            self.logger.info(f"Current power limit: {self.current_power_limit}W")

        except Exception as e:
            self.logger.error(f"Failed to initialize NVML: {e}")
            self.has_gpu = False

    def get_power_usage(self) -> float:
        """
        Get current GPU power usage in watts

        Returns:
            float: Current power draw in watts
        """
        if not self.has_gpu:
            # Simulate power usage
            return 50.0

        try:
            power_mw = pynvml.nvmlDeviceGetPowerUsage(self.handle)
            power_w = power_mw / 1000.0
            return power_w
        except Exception as e:
            self.logger.error(f"Failed to get power usage: {e}")
            return 0.0

    def get_power_limit(self) -> float:
        """
        Get current GPU power limit in watts

        Returns:
            float: Current power limit in watts
        """
        if not self.has_gpu:
            return self.current_power_limit

        try:
            limit_mw = pynvml.nvmlDeviceGetPowerManagementLimit(self.handle)
            limit_w = limit_mw / 1000.0
            return limit_w
        except Exception as e:
            self.logger.error(f"Failed to get power limit: {e}")
            return self.current_power_limit

    def set_power_limit(self, watts: int) -> bool:
        """
        Set GPU power limit

        Args:
            watts: Power limit in watts (100-300 for A100)

        Returns:
            bool: True if successful, False otherwise
        """
        # Clamp to safe range
        watts = max(config.GPU_POWER_PAUSE, min(watts, self.max_power_limit))

        self.logger.info(f"Setting GPU power limit to {watts}W")

        if not self.has_gpu:
            # Simulate power limit change
            self.current_power_limit = watts
            self.logger.info(f"✅ [SIMULATED] Power limit set to {watts}W")
            return True

        try:
            # Convert to milliwatts
            power_mw = watts * 1000

            # Set power limit
            pynvml.nvmlDeviceSetPowerManagementLimit(self.handle, power_mw)

            # Verify
            actual_limit = self.get_power_limit()
            self.current_power_limit = actual_limit

            self.logger.info(f"✅ Power limit set to {actual_limit}W")
            return True

        except Exception as e:
            self.logger.error(f"❌ Failed to set power limit: {e}")
            return False

    def get_gpu_stats(self) -> Dict:
        """
        Get comprehensive GPU statistics

        Returns:
            dict: GPU statistics including power, temp, utilization, memory
        """
        stats = {
            "gpu_name": self.gpu_name,
            "has_gpu": self.has_gpu,
            "power_usage_watts": self.get_power_usage(),
            "power_limit_watts": self.get_power_limit(),
            "temperature_c": 0,
            "gpu_utilization_percent": 0,
            "memory_used_mb": 0,
            "memory_total_mb": config.GPU_MEMORY_GB * 1024,
        }

        if not self.has_gpu:
            return stats

        try:
            # Temperature
            temp = pynvml.nvmlDeviceGetTemperature(self.handle, pynvml.NVML_TEMPERATURE_GPU)
            stats["temperature_c"] = temp

            # Utilization
            util = pynvml.nvmlDeviceGetUtilizationRates(self.handle)
            stats["gpu_utilization_percent"] = util.gpu

            # Memory
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(self.handle)
            stats["memory_used_mb"] = mem_info.used / (1024 ** 2)
            stats["memory_total_mb"] = mem_info.total / (1024 ** 2)

        except Exception as e:
            self.logger.error(f"Failed to get GPU stats: {e}")

        return stats

    def shutdown(self):
        """Cleanup NVML resources"""
        if self.has_gpu and NVML_AVAILABLE:
            try:
                pynvml.nvmlShutdown()
                self.logger.info("NVML shut down successfully")
            except Exception as e:
                self.logger.error(f"Error shutting down NVML: {e}")


# Global GPU controller instance
gpu_controller = GPUController()


if __name__ == "__main__":
    # Test GPU controller
    logging.basicConfig(level=logging.INFO)

    print("GPU Controller Test")
    print("=" * 50)

    stats = gpu_controller.get_gpu_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")

    print("\nTesting power limits...")
    for power in [100, 150, 200, 250]:
        gpu_controller.set_power_limit(power)
        print(f"Set: {power}W, Actual: {gpu_controller.get_power_limit()}W")
