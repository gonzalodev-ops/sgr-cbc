"""
Supabase client for caching and persistence.
"""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from supabase import create_client, Client


class SupabaseClient:
    """Client for Supabase database operations."""

    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)

    def cache_candles(self, symbol: str, tf: str, candles: List[Dict]) -> bool:
        """Cache candles to database."""
        try:
            for c in candles:
                data = {
                    "symbol": symbol, "timeframe": tf,
                    "timestamp": c["timestamp"].isoformat() if isinstance(c["timestamp"], datetime) else c["timestamp"],
                    "open": c["open"], "high": c["high"], "low": c["low"], "close": c["close"], "volume": c["volume"],
                }
                self.client.table("candles").upsert(data, on_conflict="symbol,timeframe,timestamp").execute()
            return True
        except Exception as e:
            print(f"Error caching: {e}")
            return False

    def get_candles(self, symbol: str, tf: str, limit: int = 1000) -> List[Dict]:
        """Get cached candles."""
        try:
            return self.client.table("candles").select("*").eq("symbol", symbol).eq("timeframe", tf).order("timestamp").limit(limit).execute().data
        except Exception as e:
            print(f"Error fetching: {e}")
            return []

    def save_trade(self, trade: Dict) -> Optional[str]:
        """Save trade to trading book."""
        try:
            res = self.client.table("trades").insert(self._serialize(trade)).execute()
            return res.data[0].get("id") if res.data else None
        except Exception as e:
            print(f"Error saving trade: {e}")
            return None

    def update_trade(self, trade_id: str, updates: Dict) -> bool:
        """Update trade record."""
        try:
            self.client.table("trades").update(self._serialize(updates)).eq("id", trade_id).execute()
            return True
        except Exception as e:
            print(f"Error updating: {e}")
            return False

    def get_trades(self, symbol: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get trades from trading book."""
        try:
            q = self.client.table("trades").select("*")
            if symbol:
                q = q.eq("symbol", symbol)
            return q.order("timestamp", desc=True).limit(limit).execute().data
        except Exception as e:
            print(f"Error: {e}")
            return []

    def save_signal(self, signal: Dict) -> Optional[str]:
        """Save a signal."""
        try:
            res = self.client.table("signals").insert(self._serialize(signal)).execute()
            return res.data[0].get("id") if res.data else None
        except Exception as e:
            print(f"Error: {e}")
            return None

    def _serialize(self, data: Dict) -> Dict:
        result = {}
        for k, v in data.items():
            if isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, (list, dict)):
                result[k] = json.dumps(v)
            else:
                result[k] = v
        return result


# SQL to create tables in Supabase
SETUP_SQL = """
CREATE TABLE IF NOT EXISTS candles (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(20,8), high DECIMAL(20,8), low DECIMAL(20,8), close DECIMAL(20,8), volume DECIMAL(30,8),
    UNIQUE(symbol, timeframe, timestamp)
);

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ, symbol VARCHAR(20), timeframe VARCHAR(10), direction VARCHAR(10),
    entry_price DECIMAL(20,8), stop_loss DECIMAL(20,8), take_profit_1 DECIMAL(20,8),
    pnl DECIMAL(20,8), exit_reason VARCHAR(20), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ, symbol VARCHAR(20), timeframe VARCHAR(10), direction VARCHAR(10),
    zone_price DECIMAL(20,8), trigger_type VARCHAR(30), entry_price DECIMAL(20,8),
    is_valid BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);
"""
