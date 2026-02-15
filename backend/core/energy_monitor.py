"""
Energy Monitor - Real-time Grid Data Fetcher
Primary: CAISO OASIS (California ISO official data)
Backup: WattTime API → Electricity Maps API
"""

import logging
import httpx
import asyncio
import os
from datetime import datetime, timezone
from typing import Dict, Optional
from config import config
# CAISO import will be added after caiso_api.py is created
try:
    from core.caiso_api import caiso_api
    CAISO_AVAILABLE = True
except ImportError:
    CAISO_AVAILABLE = False


class EnergyMonitor:
    """
    Fetches real-time grid energy data

    Data Sources (Priority Order):
    1. CAISO OASIS API (primary) - Official California ISO data
    2. WattTime API (backup) - Real-time carbon intensity
    3. Electricity Maps API (backup)
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.watttime_token = None
        self.token_expires_at = None

    async def _get_watttime_token(self) -> Optional[str]:
        """
        Authenticate with WattTime and get access token

        Returns:
            str: Access token or None if failed
        """
        if not config.WATTTIME_USERNAME or not config.WATTTIME_PASSWORD:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{config.WATTTIME_API_URL}/login",
                    auth=(config.WATTTIME_USERNAME, config.WATTTIME_PASSWORD),
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    self.watttime_token = data.get("token")
                    self.logger.info("✅ WattTime authenticated successfully")
                    return self.watttime_token
                else:
                    self.logger.error(f"WattTime auth failed: {response.status_code}")
                    return None

        except Exception as e:
            self.logger.error(f"WattTime auth error: {e}")
            return None

    async def _fetch_watttime_data(self) -> Optional[Dict]:
        """
        Fetch carbon intensity from WattTime

        Returns:
            dict: {"carbon_intensity": float, "timestamp": str} or None
        """
        # Get token if we don't have one
        if not self.watttime_token:
            token = await self._get_watttime_token()
            if not token:
                return None

        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.watttime_token}"}

                # Fetch current carbon intensity for region
                response = await client.get(
                    f"{config.WATTTIME_API_URL}/carbon-intensity/current",
                    headers=headers,
                    params={"region": config.WATTTIME_REGION},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "carbon_intensity": data.get("carbonIntensity", 350),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                elif response.status_code == 401:
                    # Token expired, retry
                    self.watttime_token = None
                    return await self._fetch_watttime_data()
                else:
                    self.logger.error(f"WattTime fetch failed: {response.status_code}")
                    return None

        except Exception as e:
            self.logger.error(f"WattTime fetch error: {e}")
            return None

    async def _fetch_electricity_maps_data(self) -> Optional[Dict]:
        """
        Fetch carbon intensity from Electricity Maps (backup)

        Returns:
            dict: {"carbon_intensity": float, "timestamp": str} or None
        """
        if not config.ELECTRICITY_MAPS_API_KEY:
            return None

        try:
            async with httpx.AsyncClient() as client:
                headers = {"auth-token": config.ELECTRICITY_MAPS_API_KEY}

                # Fetch carbon intensity for zone
                response = await client.get(
                    f"{config.ELECTRICITY_MAPS_API_URL}/carbon-intensity/latest",
                    headers=headers,
                    params={"zone": "US-CAL-CISO"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "carbon_intensity": data.get("carbonIntensity", 350),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                else:
                    self.logger.error(f"Electricity Maps failed: {response.status_code}")
                    return None

        except Exception as e:
            self.logger.error(f"Electricity Maps error: {e}")
            return None


    async def fetch_grid_data(self) -> Dict:
        """
        Fetch current grid energy data
        Priority: CAISO OASIS (primary) → WattTime → Electricity Maps

        Returns:
            dict: {
                "electricity_price": float,  # USD/MWh
                "carbon_intensity": float,   # gCO2/kWh
                "timestamp": str,
                "source": str
            }
        """
        # Try CAISO OASIS first (PRIMARY - Official California ISO data)
        if CAISO_AVAILABLE:
            try:
                caiso_data = await caiso_api.get_grid_status()
                if caiso_data:
                    self.logger.info(f"✅ CAISO: ${caiso_data['electricity_price']:.2f}/MWh, {caiso_data['carbon_intensity']:.0f} gCO2/kWh")
                    return caiso_data
            except Exception as e:
                self.logger.warning(f"CAISO unavailable, trying backup: {e}")

        # Try WattTime as first backup
        watttime_data = await self._fetch_watttime_data()
        if watttime_data:
            # WattTime only provides carbon intensity
            # Estimate price based on California grid correlation: carbon * 0.15 ≈ price
            carbon = watttime_data["carbon_intensity"]
            estimated_price = carbon * 0.15

            self.logger.info(f"✅ WattTime: ${estimated_price:.2f}/MWh (estimated), {carbon:.0f} gCO2/kWh")
            return {
                "electricity_price": round(estimated_price, 2),
                "carbon_intensity": carbon,
                "timestamp": watttime_data["timestamp"],
                "source": "watttime",
            }

        # Try Electricity Maps as final backup
        emap_data = await self._fetch_electricity_maps_data()
        if emap_data:
            carbon = emap_data["carbon_intensity"]
            estimated_price = carbon * 0.15

            self.logger.info(f"✅ Electricity Maps: ${estimated_price:.2f}/MWh (estimated), {carbon:.0f} gCO2/kWh")
            return {
                "electricity_price": round(estimated_price, 2),
                "carbon_intensity": carbon,
                "timestamp": emap_data["timestamp"],
                "source": "electricity_maps",
            }

        # All APIs failed - log error and return None
        self.logger.error("❌ All grid data APIs failed (CAISO, WattTime, Electricity Maps)")
        raise Exception("No grid data available from any API source")


# Global energy monitor instance
energy_monitor = EnergyMonitor()


if __name__ == "__main__":
    # Test energy monitor
    logging.basicConfig(level=logging.INFO)

    print("Energy Monitor Test")
    print("=" * 50)

    async def test():
        for i in range(5):
            data = await energy_monitor.fetch_grid_data()
            print(f"\nReading {i+1}:")
            print(f"  Price: ${data['electricity_price']:.2f}/MWh")
            print(f"  Carbon: {data['carbon_intensity']:.2f} gCO2/kWh")
            print(f"  Source: {data['source']}")
            print(f"  Time: {data['timestamp']}")
            await asyncio.sleep(2)

    asyncio.run(test())
