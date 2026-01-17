"""
Stage 1: Trend Lines with Rule 1-2-3-4

Rule 1-2-3-4:
- 1 pivot = unconfirmed (3 strikes to eliminate)
- 2 pivots = confirmed (4 strikes to eliminate)
- New pivot = reset strikes to 0
- Strike = crosses line WITHOUT new pivot
"""

from typing import List, Optional, Tuple
from src.core.models import Candle, TrendLine, LineType, SwingPoint
from src.core.structures import SwingDetector


class TrendLineManager:
    """Manages trend lines following Rule 1-2-3-4."""

    def __init__(self, zone_tolerance: float = 0.005):
        self.zone_tolerance = zone_tolerance
        self.lines: List[TrendLine] = []

    def create_horizontal_line(self, pivot: SwingPoint, timeframe: str) -> TrendLine:
        """Create horizontal line from pivot. Starts UNCONFIRMED."""
        line = TrendLine(
            price=pivot.price,
            line_type=LineType.RESISTANCE if pivot.swing_type == 'HIGH' else LineType.SUPPORT,
            creation_idx=pivot.idx,
            touches=1,
            timeframe=timeframe,
            pivot_type=pivot.swing_type,
        )
        self.lines.append(line)
        return line

    def create_inclined_line(self, p1: SwingPoint, p2: SwingPoint, timeframe: str) -> Optional[TrendLine]:
        """Create inclined line from 2 pivots of SAME type. Starts CONFIRMED."""
        if p1.swing_type != p2.swing_type:
            return None  # PROHIBITED to mix

        dx = p2.idx - p1.idx
        if dx == 0:
            return None

        slope = (p2.price - p1.price) / dx
        intercept = p1.price - slope * p1.idx

        line = TrendLine(
            price=p1.price,
            slope=slope,
            intercept=intercept,
            line_type=LineType.RESISTANCE if p1.swing_type == 'HIGH' else LineType.SUPPORT,
            creation_idx=p1.idx,
            touches=2,  # Already confirmed
            timeframe=timeframe,
            pivot_type=p1.swing_type,
        )
        self.lines.append(line)
        return line

    def analyze_price(self, candle: Candle, idx: int) -> List[dict]:
        """Analyze price against all active lines. Returns events."""
        events = []

        for line in self.lines:
            if not line.active:
                continue

            line_price = line.get_price_at_index(idx)
            zone = line_price * self.zone_tolerance

            # Check if in zone
            in_zone = (candle.low <= line_price + zone) and (candle.high >= line_price - zone)

            if in_zone:
                # Check for reaction (touch) vs strike
                if self._is_reaction(line, candle, line_price):
                    line.add_touch()
                    events.append({'type': 'TOUCH', 'line': line, 'price': candle.close})
                else:
                    line.add_strike()
                    event_type = 'ELIMINATE' if not line.active else 'STRIKE'
                    events.append({'type': event_type, 'line': line, 'strikes': line.strikes})

        return events

    def _is_reaction(self, line: TrendLine, candle: Candle, line_price: float) -> bool:
        """Check if there's a reaction (potential pivot)."""
        if line.line_type == LineType.SUPPORT:
            return candle.is_bullish and candle.low <= line_price * 1.005
        else:
            return candle.is_bearish and candle.high >= line_price * 0.995

    def auto_detect(self, candles: List[Candle], timeframe: str) -> List[TrendLine]:
        """Auto-detect lines from swings."""
        detector = SwingDetector(lookback=2)
        highs, lows = detector.detect_swings(candles)

        created = []
        for swing in highs + lows:
            created.append(self.create_horizontal_line(swing, timeframe))

        # Inclined lines from consecutive same-type swings
        for i in range(1, len(highs)):
            line = self.create_inclined_line(highs[i-1], highs[i], timeframe)
            if line:
                created.append(line)

        for i in range(1, len(lows)):
            line = self.create_inclined_line(lows[i-1], lows[i], timeframe)
            if line:
                created.append(line)

        return created

    def get_active_lines(self, timeframe: Optional[str] = None) -> List[TrendLine]:
        lines = [l for l in self.lines if l.active]
        if timeframe:
            lines = [l for l in lines if l.timeframe == timeframe]
        return lines

    def get_confirmed_lines(self) -> List[TrendLine]:
        return [l for l in self.get_active_lines() if l.confirmed]

    def get_supports(self) -> List[TrendLine]:
        return [l for l in self.get_active_lines() if l.line_type == LineType.SUPPORT]

    def get_resistances(self) -> List[TrendLine]:
        return [l for l in self.get_active_lines() if l.line_type == LineType.RESISTANCE]


# Timeframe colors
TIMEFRAME_COLORS = {
    '1M': '#800080',  # Purple - Monthly
    '1w': '#9932CC',  # Purple - Weekly
    '1d': '#40E0D0',  # Turquoise - Daily
    '4h': '#FFFFFF',  # White - 4H
    '1h': '#0000FF',  # Blue - 1H
    '15m': '#FFA500', # Orange - 15m
    '5m': '#00FF00',  # Green - 5m
}
