"""
Binance API client for fetching OHLCV data.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from binance import Client
from src.core.models import Candle


TIMEFRAME_MAP = {
    "1M": Client.KLINE_INTERVAL_1MONTH,
    "1w": Client.KLINE_INTERVAL_1WEEK,
    "1d": Client.KLINE_INTERVAL_1DAY,
    "4h": Client.KLINE_INTERVAL_4HOUR,
    "1h": Client.KLINE_INTERVAL_1HOUR,
    "15m": Client.KLINE_INTERVAL_15MINUTE,
}

SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "ZECUSDT"]


class BinanceClient:
    """Client for Binance data. API keys optional for public data."""

    def __init__(self, api_key: str = "", api_secret: str = ""):
        self.client = Client(api_key, api_secret) if api_key else Client()

    def _parse_kline(self, k: list, tf: str) -> Candle:
        return Candle(
            timestamp=datetime.fromtimestamp(k[0] / 1000),
            open=float(k[1]),
            high=float(k[2]),
            low=float(k[3]),
            close=float(k[4]),
            volume=float(k[5]),
            timeframe=tf,
        )

    def get_candles(
        self,
        symbol: str,
        timeframe: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 500,
    ) -> List[Candle]:
        """Fetch historical OHLCV data."""
        interval = TIMEFRAME_MAP.get(timeframe)
        if not interval:
            raise ValueError(f"Unsupported timeframe: {timeframe}")

        try:
            if start and end:
                klines = self.client.get_historical_klines(
                    symbol, interval,
                    start.strftime("%d %b %Y"),
                    end.strftime("%d %b %Y")
                )
            else:
                klines = self.client.get_klines(symbol=symbol, interval=interval, limit=limit)

            return [self._parse_kline(k, timeframe) for k in klines]
        except Exception as e:
            print(f"Binance error: {e}")
            return []

    def get_5_years(self, symbol: str, timeframe: str) -> List[Candle]:
        """Fetch 5 years of data for backtesting."""
        end = datetime.now()
        start = end - timedelta(days=5 * 365)
        return self.get_candles(symbol, timeframe, start, end)

    def get_latest(self, symbol: str, timeframe: str, count: int = 100) -> List[Candle]:
        """Get most recent candles."""
        return self.get_candles(symbol, timeframe, limit=count)


def fetch_candles(symbol: str, timeframe: str, limit: int = 500) -> List[Candle]:
    """Quick helper to fetch candles."""
    return BinanceClient().get_candles(symbol, timeframe, limit=limit)
