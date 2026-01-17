"""
Reversal Triggers - Operate at candle CLOSE.

Types:
- Engulfing: Second candle body engulfs first candle range
- Tweezers: Similar ranges with rejection
- Morning/Evening Star: 3-candle U-shape pattern
- Fake Out: False breakout in single candle (most powerful)

All require:
- Valid working zone
- 50% rule: at least 50% of pattern in favor direction
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from src.core.models import Candle, Direction, TriggerType


@dataclass
class TriggerResult:
    """Result of trigger detection."""
    detected: bool
    trigger_type: Optional[TriggerType]
    direction: Direction
    entry_price: float
    candles: List[Candle]
    passes_50_rule: bool
    strength: float = 0  # 0-1, higher is stronger


class ReversalTriggerDetector:
    """Detects reversal triggers at working zones."""

    def __init__(self):
        self.last_trigger: Optional[TriggerResult] = None

    def detect_all(self, candles: List[Candle], zone_price: float, zone_type: str) -> Optional[TriggerResult]:
        """
        Detect any reversal trigger in the last candles.
        Zone type: 'SUPPORT' or 'RESISTANCE'
        """
        if len(candles) < 3:
            return None

        # Try each trigger type in order of strength
        result = self.detect_fake_out(candles, zone_price, zone_type)
        if result and result.detected:
            return result

        result = self.detect_engulfing(candles, zone_price, zone_type)
        if result and result.detected:
            return result

        result = self.detect_star(candles, zone_price, zone_type)
        if result and result.detected:
            return result

        result = self.detect_tweezers(candles, zone_price, zone_type)
        if result and result.detected:
            return result

        return None

    def detect_engulfing(self, candles: List[Candle], zone_price: float, zone_type: str) -> TriggerResult:
        """
        Engulfing: Second candle body completely engulfs first candle RANGE.
        """
        c1, c2 = candles[-2], candles[-1]

        # Expected direction based on zone
        expected_dir = Direction.BULLISH if zone_type == 'SUPPORT' else Direction.BEARISH

        # Check basic engulfing structure
        if expected_dir == Direction.BULLISH:
            is_engulfing = (
                c1.is_bearish and
                c2.is_bullish and
                c2.body_size > c1.range_size and
                c2.close > c1.high and
                c2.open < c1.low
            )
            in_zone = c2.low <= zone_price * 1.005
        else:
            is_engulfing = (
                c1.is_bullish and
                c2.is_bearish and
                c2.body_size > c1.range_size and
                c2.close < c1.low and
                c2.open > c1.high
            )
            in_zone = c2.high >= zone_price * 0.995

        if not is_engulfing or not in_zone:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        # 50% rule: at least 50% of engulfing candle should be in favor
        passes_50 = c2.body_size > c2.range_size * 0.5

        return TriggerResult(
            detected=True,
            trigger_type=TriggerType.ENGULFING,
            direction=expected_dir,
            entry_price=c2.close,
            candles=[c1, c2],
            passes_50_rule=passes_50,
            strength=0.7
        )

    def detect_tweezers(self, candles: List[Candle], zone_price: float, zone_type: str) -> TriggerResult:
        """
        Tweezers: Two candles with similar ranges showing rejection.
        Less powerful than engulfing.
        """
        c1, c2 = candles[-2], candles[-1]
        expected_dir = Direction.BULLISH if zone_type == 'SUPPORT' else Direction.BEARISH

        # Check similar ranges
        range_diff = abs(c1.range_size - c2.range_size) / max(c1.range_size, c2.range_size)
        similar_ranges = range_diff < 0.2  # Within 20%

        if not similar_ranges:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        if expected_dir == Direction.BULLISH:
            # Tweezers bottom: similar lows with second candle bullish
            similar_lows = abs(c1.low - c2.low) / c1.low < 0.005
            is_tweezers = similar_lows and c1.is_bearish and c2.is_bullish
            in_zone = min(c1.low, c2.low) <= zone_price * 1.005
        else:
            # Tweezers top: similar highs with second candle bearish
            similar_highs = abs(c1.high - c2.high) / c1.high < 0.005
            is_tweezers = similar_highs and c1.is_bullish and c2.is_bearish
            in_zone = max(c1.high, c2.high) >= zone_price * 0.995

        if not is_tweezers or not in_zone:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        passes_50 = c2.body_size > c2.range_size * 0.4

        return TriggerResult(
            detected=True,
            trigger_type=TriggerType.TWEEZERS,
            direction=expected_dir,
            entry_price=c2.close,
            candles=[c1, c2],
            passes_50_rule=passes_50,
            strength=0.5
        )

    def detect_star(self, candles: List[Candle], zone_price: float, zone_type: str) -> TriggerResult:
        """
        Morning/Evening Star: 3-candle U-shape pattern.
        - First candle: strong in previous direction
        - Second candle: small body (indecision)
        - Third candle: strong reversal, close past 50% of first candle
        """
        if len(candles) < 3:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        c1, c2, c3 = candles[-3], candles[-2], candles[-1]
        expected_dir = Direction.BULLISH if zone_type == 'SUPPORT' else Direction.BEARISH

        # Second candle should be small (doji-like)
        is_small_body = c2.body_size < c2.range_size * 0.3

        if not is_small_body:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        if expected_dir == Direction.BULLISH:  # Morning Star
            structure_ok = (
                c1.is_bearish and
                c3.is_bullish and
                c3.close > (c1.open + c1.close) / 2  # Close past 50% of c1
            )
            in_zone = c2.low <= zone_price * 1.005
            trigger_type = TriggerType.MORNING_STAR
        else:  # Evening Star
            structure_ok = (
                c1.is_bullish and
                c3.is_bearish and
                c3.close < (c1.open + c1.close) / 2
            )
            in_zone = c2.high >= zone_price * 0.995
            trigger_type = TriggerType.EVENING_STAR

        if not structure_ok or not in_zone:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        passes_50 = c3.body_size > c3.range_size * 0.5

        return TriggerResult(
            detected=True,
            trigger_type=trigger_type,
            direction=expected_dir,
            entry_price=c3.close,
            candles=[c1, c2, c3],
            passes_50_rule=passes_50,
            strength=0.6
        )

    def detect_fake_out(self, candles: List[Candle], zone_price: float, zone_type: str) -> TriggerResult:
        """
        Fake Out: Single candle breaks zone but reverses aggressively.
        MOST POWERFUL trigger.
        """
        c = candles[-1]
        expected_dir = Direction.BULLISH if zone_type == 'SUPPORT' else Direction.BEARISH

        if expected_dir == Direction.BULLISH:
            # Breaks below support but closes above
            broke_zone = c.low < zone_price * 0.995
            recovered = c.close > zone_price
            strong_reversal = c.is_bullish and c.body_size > c.range_size * 0.6
            is_fake_out = broke_zone and recovered and strong_reversal
        else:
            # Breaks above resistance but closes below
            broke_zone = c.high > zone_price * 1.005
            recovered = c.close < zone_price
            strong_reversal = c.is_bearish and c.body_size > c.range_size * 0.6
            is_fake_out = broke_zone and recovered and strong_reversal

        if not is_fake_out:
            return TriggerResult(False, None, Direction.NEUTRAL, 0, [], False)

        passes_50 = c.body_size > c.range_size * 0.5

        return TriggerResult(
            detected=True,
            trigger_type=TriggerType.FAKE_OUT,
            direction=expected_dir,
            entry_price=c.close,
            candles=[c],
            passes_50_rule=passes_50,
            strength=0.9  # Highest strength
        )


# Example usage
if __name__ == "__main__":
    from datetime import timedelta

    # Create sample candles for engulfing at support
    candles = [
        Candle(datetime.now() - timedelta(hours=2), 102, 103, 100, 101, 1000, "1h"),  # Bearish
        Candle(datetime.now() - timedelta(hours=1), 99, 105, 98, 104, 1500, "1h"),   # Bullish engulfing
    ]

    detector = ReversalTriggerDetector()
    result = detector.detect_engulfing(candles, zone_price=100, zone_type='SUPPORT')

    if result.detected:
        print(f"Detected: {result.trigger_type.value}")
        print(f"Direction: {result.direction.value}")
        print(f"Entry: {result.entry_price}")
        print(f"50% Rule: {result.passes_50_rule}")
        print(f"Strength: {result.strength}")
