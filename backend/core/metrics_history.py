"""
Metrics History Tracker
Stores historical data for charts and analysis
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
from collections import deque


class MetricsHistory:
    """
    Tracks historical metrics for frontend charts
    Stores last 24 hours of data points
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Store last 24 hours (1 point per minute = 1440 points max)
        self.max_points = 1440
        self.history = deque(maxlen=self.max_points)

        self.logger.info("Metrics history tracker initialized")

    def add_datapoint(self, datapoint: Dict):
        """
        Add a new datapoint to history

        Args:
            datapoint: {
                "timestamp": ISO timestamp,
                "electricity_price": float,
                "carbon_intensity": float,
                "gpu_power_watts": float,
                "gpu_power_limit_watts": int,
                "orchestrator_state": str,
                "training_status": str,
                "cost_per_second": float,
                "carbon_per_second": float
            }
        """
        self.history.append(datapoint)

    def get_last_n_minutes(self, minutes: int) -> List[Dict]:
        """Get data for last N minutes"""
        if minutes <= 0:
            return []

        cutoff_time = datetime.now() - timedelta(minutes=minutes)

        result = []
        for point in reversed(self.history):
            point_time = datetime.fromisoformat(point["timestamp"].replace('Z', '+00:00'))
            if point_time >= cutoff_time:
                result.append(point)
            else:
                break

        return list(reversed(result))

    def get_last_hour(self) -> List[Dict]:
        """Get data for last 1 hour"""
        return self.get_last_n_minutes(60)

    def get_last_24_hours(self) -> List[Dict]:
        """Get data for last 24 hours"""
        return self.get_last_n_minutes(1440)

    def get_summary_stats(self, time_range: str = "1h") -> Dict:
        """
        Get summary statistics for a time range

        Args:
            time_range: "1h", "24h", or "all"
        """
        if time_range == "1h":
            data = self.get_last_hour()
        elif time_range == "24h":
            data = self.get_last_24_hours()
        else:
            data = list(self.history)

        if not data:
            return {
                "avg_price": 0,
                "min_price": 0,
                "max_price": 0,
                "avg_carbon": 0,
                "avg_gpu_power": 0,
                "state_distribution": {}
            }

        prices = [d["electricity_price"] for d in data]
        carbon = [d["carbon_intensity"] for d in data]
        gpu_power = [d["gpu_power_watts"] for d in data]
        states = [d["orchestrator_state"] for d in data]

        # Count state distribution
        state_counts = {}
        for state in states:
            state_counts[state] = state_counts.get(state, 0) + 1

        return {
            "avg_price": round(sum(prices) / len(prices), 2),
            "min_price": round(min(prices), 2),
            "max_price": round(max(prices), 2),
            "avg_carbon": round(sum(carbon) / len(carbon), 2),
            "avg_gpu_power": round(sum(gpu_power) / len(gpu_power), 2),
            "state_distribution": state_counts,
            "total_datapoints": len(data)
        }


# Global metrics history instance
metrics_history = MetricsHistory()
