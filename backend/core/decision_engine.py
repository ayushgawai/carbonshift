"""
Decision Engine - Eco-Pulse Arbitration Algorithm
Grid-Aware Agentic Orchestrator that decides training behavior based on energy conditions
"""

import logging
from typing import Dict, Tuple
from dataclasses import dataclass
from config import config


@dataclass
class DecisionResult:
    """Result of orchestrator decision"""
    state: str              # GREEN, AMBER, RED, NORMAL
    action: str             # BOOST, CONTINUE, REDUCE, PAUSE
    power_limit_watts: int  # GPU power limit to set
    should_pause: bool      # Whether to pause training
    reason: str             # Human-readable explanation
    cost_per_second: float  # Current cost in USD/second
    carbon_per_second: float  # Current carbon in gCO2/second


class DecisionEngine:
    """
    Eco-Pulse Arbitration Algorithm

    State Machine:
    - GREEN:  price < 35 AND carbon < 300 → BOOST (250W, max performance)
    - AMBER:  price 50-70 OR carbon 400-500 → REDUCE (150W, throttle)
    - RED:    price > 70 OR carbon > 500 → PAUSE (100W, save checkpoint)
    - NORMAL: Otherwise → NORMAL (200W, standard operation)

    This implements "Threshold-Based Control" with "Binary Checkpointing"
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.total_cost_saved = 0.0
        self.total_carbon_saved = 0.0
        self.peaks_avoided = 0
        self.decision_history = []

    def make_decision(
        self,
        electricity_price: float,
        carbon_intensity: float
    ) -> DecisionResult:
        """
        Core arbitration logic - decides GPU power and training state

        Args:
            electricity_price: Current price in USD/MWh
            carbon_intensity: Current carbon in gCO2/kWh

        Returns:
            DecisionResult: Complete decision with state, action, and metrics
        """
        # Calculate current costs (for savings calculation)
        cost_per_second, carbon_per_second = self._calculate_costs(
            electricity_price, carbon_intensity, config.GPU_POWER_NORMAL
        )

        # ====================================================================
        # STATE 1: RED (CRITICAL) - PAUSE TRAINING
        # ====================================================================
        if (electricity_price > config.PRICE_THRESHOLD_CRITICAL or
            carbon_intensity > config.CARBON_THRESHOLD_CRITICAL):

            self.peaks_avoided += 1

            reason = self._build_reason(
                "CRITICAL", electricity_price, carbon_intensity
            )

            # Calculate savings vs running at peak power
            peak_cost, peak_carbon = self._calculate_costs(
                config.AVG_PEAK_PRICE,
                config.CARBON_THRESHOLD_CRITICAL,
                config.GPU_POWER_MAX
            )
            minimal_cost, minimal_carbon = self._calculate_costs(
                electricity_price,
                carbon_intensity,
                config.GPU_POWER_PAUSE
            )

            self.total_cost_saved += (peak_cost - minimal_cost)
            self.total_carbon_saved += (peak_carbon - minimal_carbon)

            return DecisionResult(
                state=config.STATE_RED,
                action="PAUSE",
                power_limit_watts=config.GPU_POWER_PAUSE,
                should_pause=True,
                reason=reason,
                cost_per_second=minimal_cost,
                carbon_per_second=minimal_carbon
            )

        # ====================================================================
        # STATE 2: AMBER (HIGH) - REDUCE POWER
        # ====================================================================
        elif (
            (config.PRICE_THRESHOLD_HIGH <= electricity_price < config.PRICE_THRESHOLD_CRITICAL) or
            (config.CARBON_THRESHOLD_HIGH <= carbon_intensity < config.CARBON_THRESHOLD_CRITICAL)
        ):

            reason = self._build_reason(
                "HIGH", electricity_price, carbon_intensity
            )

            # Calculate savings vs normal operation
            normal_cost, normal_carbon = self._calculate_costs(
                electricity_price,
                carbon_intensity,
                config.GPU_POWER_NORMAL
            )
            reduced_cost, reduced_carbon = self._calculate_costs(
                electricity_price,
                carbon_intensity,
                config.GPU_POWER_REDUCE
            )

            self.total_cost_saved += (normal_cost - reduced_cost)
            self.total_carbon_saved += (normal_carbon - reduced_carbon)

            return DecisionResult(
                state=config.STATE_AMBER,
                action="REDUCE",
                power_limit_watts=config.GPU_POWER_REDUCE,
                should_pause=False,
                reason=reason,
                cost_per_second=reduced_cost,
                carbon_per_second=reduced_carbon
            )

        # ====================================================================
        # STATE 3: GREEN (OPTIMAL) - BOOST PERFORMANCE
        # ====================================================================
        elif (electricity_price < config.PRICE_THRESHOLD_LOW and
              carbon_intensity < config.CARBON_THRESHOLD_LOW):

            reason = self._build_reason(
                "OPTIMAL", electricity_price, carbon_intensity
            )

            # No savings here - we're boosting performance!
            # But we're taking advantage of cheap/clean energy
            boosted_cost, boosted_carbon = self._calculate_costs(
                electricity_price,
                carbon_intensity,
                config.GPU_POWER_BOOST
            )

            return DecisionResult(
                state=config.STATE_GREEN,
                action="BOOST",
                power_limit_watts=config.GPU_POWER_BOOST,
                should_pause=False,
                reason=reason,
                cost_per_second=boosted_cost,
                carbon_per_second=boosted_carbon
            )

        # ====================================================================
        # STATE 4: NORMAL - STANDARD OPERATION
        # ====================================================================
        else:
            reason = self._build_reason(
                "NORMAL", electricity_price, carbon_intensity
            )

            return DecisionResult(
                state=config.STATE_NORMAL,
                action="CONTINUE",
                power_limit_watts=config.GPU_POWER_NORMAL,
                should_pause=False,
                reason=reason,
                cost_per_second=cost_per_second,
                carbon_per_second=carbon_per_second
            )

    def _calculate_costs(
        self,
        price: float,
        carbon: float,
        power_watts: int
    ) -> Tuple[float, float]:
        """
        Calculate cost and carbon per second

        Args:
            price: USD/MWh
            carbon: gCO2/kWh
            power_watts: GPU power in watts

        Returns:
            (cost_per_second, carbon_per_second)
        """
        # Convert power to kW
        power_kw = power_watts / 1000.0

        # Cost per second = (price/MWh) * (power_kW) / 3600
        # $70/MWh = $0.070/kWh = $0.0000194/kWh/second
        cost_per_kwh = price / 1000.0  # USD/MWh → USD/kWh
        cost_per_second = cost_per_kwh * power_kw / 3600.0

        # Carbon per second = (carbon/kWh) * (power_kW) / 3600
        carbon_per_second = carbon * power_kw / 3600.0

        return cost_per_second, carbon_per_second

    def _build_reason(
        self,
        severity: str,
        price: float,
        carbon: float
    ) -> str:
        """Build human-readable explanation for decision"""

        if severity == "CRITICAL":
            if price > config.PRICE_THRESHOLD_CRITICAL:
                return f"⛔ CRITICAL: Price ${price:.1f}/MWh exceeds ${config.PRICE_THRESHOLD_CRITICAL}/MWh threshold. Training paused."
            else:
                return f"⛔ CRITICAL: Carbon {carbon:.0f} gCO2/kWh exceeds {config.CARBON_THRESHOLD_CRITICAL} threshold. Training paused."

        elif severity == "HIGH":
            reasons = []
            if price >= config.PRICE_THRESHOLD_HIGH:
                reasons.append(f"price ${price:.1f}/MWh")
            if carbon >= config.CARBON_THRESHOLD_HIGH:
                reasons.append(f"carbon {carbon:.0f} gCO2/kWh")
            return f"⚠️  HIGH: {', '.join(reasons)} elevated. Power reduced to conserve resources."

        elif severity == "OPTIMAL":
            return f"🟢 OPTIMAL: Price ${price:.1f}/MWh, Carbon {carbon:.0f} gCO2/kWh. Perfect conditions for training!"

        else:
            return f"▶️  NORMAL: Price ${price:.1f}/MWh, Carbon {carbon:.0f} gCO2/kWh. Standard operation."

    def get_savings_summary(self) -> Dict:
        """Get cumulative savings statistics"""
        return {
            "total_cost_saved_usd": round(self.total_cost_saved, 4),
            "total_carbon_saved_kg": round(self.total_carbon_saved / 1000, 3),  # g → kg
            "peaks_avoided_count": self.peaks_avoided,
        }

    def reset_savings(self):
        """Reset savings counters (for new training session)"""
        self.total_cost_saved = 0.0
        self.total_carbon_saved = 0.0
        self.peaks_avoided = 0
        self.decision_history = []
        self.logger.info("Savings counters reset")


# Global decision engine instance
decision_engine = DecisionEngine()


if __name__ == "__main__":
    # Test decision engine
    logging.basicConfig(level=logging.INFO)

    print("Decision Engine Test - Eco-Pulse Arbitration")
    print("=" * 70)

    test_scenarios = [
        (30.0, 250.0, "Off-peak, clean"),
        (45.0, 380.0, "Normal conditions"),
        (60.0, 450.0, "High price/carbon"),
        (75.0, 520.0, "Critical - peak demand"),
    ]

    for price, carbon, desc in test_scenarios:
        result = decision_engine.make_decision(price, carbon)
        print(f"\n{desc}:")
        print(f"  Price: ${price}/MWh, Carbon: {carbon} gCO2/kWh")
        print(f"  State: {result.state}")
        print(f"  Action: {result.action}")
        print(f"  Power: {result.power_limit_watts}W")
        print(f"  Pause: {result.should_pause}")
        print(f"  Reason: {result.reason}")

    print("\n" + "=" * 70)
    print("Savings Summary:")
    summary = decision_engine.get_savings_summary()
    print(f"  Cost Saved: ${summary['total_cost_saved_usd']:.4f}")
    print(f"  Carbon Saved: {summary['total_carbon_saved_kg']:.3f} kg")
    print(f"  Peaks Avoided: {summary['peaks_avoided_count']}")
