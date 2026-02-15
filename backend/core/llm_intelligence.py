"""
LLM Intelligence Layer
Uses OpenAI GPT-4 and Anthropic Claude for enhanced decision making
"""

import logging
import os
from typing import Dict, List, Optional
from datetime import datetime
from config import config

# Import LLM SDKs
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class LLMIntelligence:
    """
    Adds LLM-powered intelligence to the orchestrator
    - OpenAI GPT-4: Price prediction, pattern analysis, strategy suggestions
    - Anthropic Claude: Report generation, decision explanations
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Initialize OpenAI
        self.openai_client = None
        if OPENAI_AVAILABLE and config.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=config.OPENAI_API_KEY)
                self.logger.info("✅ OpenAI GPT-4 initialized")
            except Exception as e:
                self.logger.error(f"OpenAI initialization failed: {e}")

        # Initialize Anthropic Claude
        self.anthropic_client = None
        if ANTHROPIC_AVAILABLE and config.ANTHROPIC_API_KEY:
            try:
                self.anthropic_client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
                self.logger.info("✅ Anthropic Claude initialized")
            except Exception as e:
                self.logger.error(f"Anthropic initialization failed: {e}")

    async def predict_price_trend(self, historical_data: List[Dict]) -> Dict:
        """
        Use GPT-4 to predict price trends and suggest optimal timing

        Args:
            historical_data: List of recent price/carbon datapoints

        Returns:
            {
                "prediction": "prices_will_drop" | "prices_will_rise" | "prices_stable",
                "confidence": float (0-1),
                "reasoning": str,
                "suggested_action": str,
                "optimal_start_time": str (ISO timestamp or "now")
            }
        """
        if not self.openai_client or not historical_data:
            return self._default_prediction()

        try:
            # Prepare data summary for GPT-4
            recent_prices = [d["electricity_price"] for d in historical_data[-10:]]
            recent_carbon = [d["carbon_intensity"] for d in historical_data[-10:]]
            current_price = recent_prices[-1] if recent_prices else 45.0
            current_carbon = recent_carbon[-1] if recent_carbon else 380.0

            prompt = f"""You are an energy market analyst for an AI training orchestrator.

Current grid conditions:
- Electricity price: ${current_price:.2f}/MWh
- Carbon intensity: {current_carbon:.0f} gCO2/kWh

Recent price trend (last 10 readings):
Prices: {[f"${p:.1f}" for p in recent_prices]}
Carbon: {[f"{c:.0f}g" for c in recent_carbon]}

Based on typical electricity market patterns:
- Peak hours: 4-9 PM (expensive)
- Off-peak: 2-6 AM (cheap)
- Current time: {datetime.now().strftime('%I:%M %p')}

Predict:
1. Will prices drop, rise, or stay stable in the next 1-2 hours?
2. What's your confidence level (0-100%)?
3. Should we start GPU training NOW or WAIT?
4. When is the optimal time to start?

Respond in JSON format:
{{
    "prediction": "drop" | "rise" | "stable",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation",
    "suggested_action": "start_now" | "wait",
    "optimal_time": "now" | "in_X_hours"
}}"""

            response = self.openai_client.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert energy market analyst. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )

            # Parse response
            import json
            import re

            content = response.choices[0].message.content

            # Strip markdown code blocks if present (GPT-4o wraps JSON in ```json ... ```)
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            content = content.strip()

            result = json.loads(content)

            self.logger.info(f"🤖 GPT-4 Prediction: {result['prediction']} (confidence: {result['confidence']})")
            return result

        except Exception as e:
            self.logger.error(f"GPT-4 prediction error: {e}")
            return self._default_prediction()

    async def generate_decision_explanation(self, decision_data: Dict) -> str:
        """
        Use Claude to generate natural language explanation of orchestrator decision

        Args:
            decision_data: {
                "state": "GREEN" | "AMBER" | "RED" | "NORMAL",
                "action": str,
                "price": float,
                "carbon": float,
                "power_limit": int,
                "reasoning": str
            }

        Returns:
            Natural language explanation
        """
        if not self.anthropic_client:
            return decision_data.get("reasoning", "No explanation available")

        try:
            prompt = f"""Explain this AI training orchestrator decision to a non-technical audience:

Grid Conditions:
- Electricity Price: ${decision_data['price']:.2f}/MWh
- Carbon Intensity: {decision_data['carbon']:.0f} gCO2/kWh

Orchestrator Decision:
- State: {decision_data['state']}
- Action: {decision_data['action']}
- GPU Power Limit: {decision_data['power_limit']}W

Technical Reason: {decision_data['reasoning']}

Write a clear, engaging 2-3 sentence explanation that:
1. States what the system decided to do
2. Explains why this saves money and carbon
3. Uses simple language

Keep it concise and positive."""

            message = self.anthropic_client.messages.create(
                model=config.ANTHROPIC_MODEL,
                max_tokens=200,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            explanation = message.content[0].text
            self.logger.info(f"🤖 Claude explanation generated")
            return explanation

        except Exception as e:
            self.logger.error(f"Claude explanation error: {e}")
            return decision_data.get("reasoning", "Decision made based on grid conditions")

    async def generate_savings_report(self, savings_data: Dict) -> str:
        """
        Use Claude to generate a compelling savings report

        Args:
            savings_data: {
                "cost_saved": float,
                "carbon_saved": float,
                "peaks_avoided": int,
                "training_time": int (seconds)
            }

        Returns:
            Natural language report
        """
        if not self.anthropic_client:
            return f"Saved ${savings_data['cost_saved']:.2f} and {savings_data['carbon_saved']:.2f}kg CO2"

        try:
            prompt = f"""Generate an impressive sustainability report for this AI training session:

Results:
- Money Saved: ${savings_data['cost_saved']:.2f}
- Carbon Emissions Avoided: {savings_data['carbon_saved']:.2f} kg CO2
- Peak Demand Periods Avoided: {savings_data['peaks_avoided']}
- Total Training Time: {savings_data['training_time'] // 60} minutes

Write a compelling 3-4 sentence report that:
1. Highlights the environmental impact
2. Puts carbon savings in relatable terms (e.g., "equivalent to...")
3. Emphasizes the smart energy use
4. Conveys the technical achievement

Make it engaging and quantifiable."""

            message = self.anthropic_client.messages.create(
                model=config.ANTHROPIC_MODEL,
                max_tokens=250,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            report = message.content[0].text
            self.logger.info(f"🤖 Claude report generated")
            return report

        except Exception as e:
            self.logger.error(f"Claude report error: {e}")
            return f"Successfully saved ${savings_data['cost_saved']:.2f} and avoided {savings_data['carbon_saved']:.2f}kg of CO2 emissions through intelligent energy orchestration."

    def _default_prediction(self) -> Dict:
        """Default prediction when GPT-4 is unavailable"""
        return {
            "prediction": "stable",
            "confidence": 0.5,
            "reasoning": "GPT-4 unavailable, using default analysis",
            "suggested_action": "start_now",
            "optimal_time": "now"
        }


# Global LLM intelligence instance
llm_intelligence = LLMIntelligence()
