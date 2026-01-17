"""
Continuation Triggers - Operate at zone BREAKOUT (not at close).

Types:
- Pullback Perfect: Breaks, retests exactly, continues
- Pullback Long: Retraces up to 50% of impulse
- Pullback Short: Doesn't reach line, similar space to retracement

All require valid working zone and 50% rule.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from src.core.models import Candle, Direction, TriggerType


@dataclass
class PullbackResult:
    """Result of pullback detection."""
    detected: bool
    trigger_type: Optional[TriggerType]
    direction: Direction
    entry_price: float  # Price to enter (breakout level)
    candles: List[Candle]
    passes_50_rule: bool
    pullback_depth: float  # 0-1, how deep the pullback was


class ContinuationTriggerDetector:
    """Detects continuation triggers (pullbacks) after breakouts."""

    def __init__(self):
        self.last_trigger: Optional[PullbackResult] = None

    def detect_pullback(
        self,
        candles: List[Candle],
        breakout_price: float,
        impulse_start: float,
        direction: Direction,
    ) -> Optional[PullbackResult]:
        """
        Detect pullback after a breakout.

        Args:
            candles: Recent candles after breakout
            breakout_price: The price level that was broken
            impulse_start: Where the impulse started (for measuring depth)
            direction: Direction of the breakout
        """
        if len(candles) < 2:
            return None

        # Calculate impulse size
        if direction == Direction.BULLISH:
            impulse_size = breakout_price - impulse_start
        else:
            impulse_size = impulse_start - breakout_price

        if impulse_size <= 0:
            return None

        # Find the pullback depth
        if direction == Direction.BULLISH:
            pullback_low = min(c.low for c in candles)
            pullback_depth = (breakout_price - pullback_low) / impulse_size
            returned_to_zone = pullback_low <= breakout_price * 1.005
            showing_continuation = candles[-1].is_bullish
        else:
            pullback_high = max(c.high for c in candles)
            pullback_depth = (pullback_high - breakout_price) / impulse_size
            returned_to_zone = pullback_high >= breakout_price * 0.995
            showing_continuation = candles[-1].is_bearish

        # Classify pullback type
        if pullback_depth <= 0.1 and returned_to_zone:
            trigger_type = TriggerType.PULLBACK_PERFECT
        elif 0.1 < pullback_depth <= 0.5:
            trigger_type = TriggerType.PULLBACK_LONG
        elif pullback_depth < 0.1 and not returned_to_zone:
            trigger_type = TriggerType.PULLBACK_SHORT
        else:
            return None  # Too deep or invalid

        if not showing_continuation:
            return None

        # 50% rule for continuation: body should show commitment
        passes_50 = candles[-1].body_size > candles[-1].range_size * 0.4

        return PullbackResult(
            detected=True,
            trigger_type=trigger_type,
            direction=direction,
            entry_price=breakout_price,
            candles=candles[-3:] if len(candles) >= 3 else candles,
            passes_50_rule=passes_50,
            pullback_depth=pullback_depth
        )

    def detect_perfect_pullback(
        self,
        candles: List[Candle],
        breakout_price: float,
        direction: Direction,
    ) -> Optional[PullbackResult]:
        """
        Perfect pullback: Price returns exactly to breakout level and bounces.
        """
        if len(candles) < 2:
            return None

        tolerance = 0.003  # 0.3%

        for i, c in enumerate(candles):
            if direction == Direction.BULLISH:
                # Look for candle that touches breakout level and closes above
                touches_level = abs(c.low - breakout_price) / breakout_price < tolerance
                valid_reaction = c.is_bullish and c.close > breakout_price
            else:
                touches_level = abs(c.high - breakout_price) / breakout_price < tolerance
                valid_reaction = c.is_bearish and c.close < breakout_price

            if touches_level and valid_reaction:
                passes_50 = c.body_size > c.range_size * 0.5

                return PullbackResult(
                    detected=True,
                    trigger_type=TriggerType.PULLBACK_PERFECT,
                    direction=direction,
                    entry_price=breakout_price,
                    candles=candles[max(0, i-1):i+1],
                    passes_50_rule=passes_50,
                    pullback_depth=0.0
                )

        return None

    def detect_long_pullback(
        self,
        candles: List[Candle],
        breakout_price: float,
        impulse_start: float,
        direction: Direction,
    ) -> Optional[PullbackResult]:
        """
        Long pullback: Retraces 38-50% of the impulse.
        """
        if len(candles) < 3:
            return None

        impulse_size = abs(breakout_price - impulse_start)

        if direction == Direction.BULLISH:
            pullback_low = min(c.low for c in candles)
            depth = (breakout_price - pullback_low) / impulse_size

            fib_38 = breakout_price - impulse_size * 0.382
            fib_50 = breakout_price - impulse_size * 0.5

            in_fib_zone = fib_50 <= pullback_low <= fib_38
            showing_reversal = candles[-1].is_bullish and candles[-1].close > pullback_low
        else:
            pullback_high = max(c.high for c in candles)
            depth = (pullback_high - breakout_price) / impulse_size

            fib_38 = breakout_price + impulse_size * 0.382
            fib_50 = breakout_price + impulse_size * 0.5

            in_fib_zone = fib_38 <= pullback_high <= fib_50
            showing_reversal = candles[-1].is_bearish and candles[-1].close < pullback_high

        if not in_fib_zone or not showing_reversal:
            return None

        passes_50 = candles[-1].body_size > candles[-1].range_size * 0.4

        return PullbackResult(
            detected=True,
            trigger_type=TriggerType.PULLBACK_LONG,
            direction=direction,
            entry_price=candles[-1].close,
            candles=candles[-3:],
            passes_50_rule=passes_50,
            pullback_depth=depth
        )

    def detect_short_pullback(
        self,
        candles: List[Candle],
        breakout_price: float,
        direction: Direction,
    ) -> Optional[PullbackResult]:
        """
        Short pullback: Doesn't reach the breakout level.
        Shows strength but requires confirmation.
        """
        if len(candles) < 2:
            return None

        buffer = 0.01  # 1% buffer

        if direction == Direction.BULLISH:
            pullback_low = min(c.low for c in candles)
            # Should stay above breakout level + buffer
            is_short = pullback_low > breakout_price * (1 + buffer)
            showing_continuation = candles[-1].is_bullish
        else:
            pullback_high = max(c.high for c in candles)
            is_short = pullback_high < breakout_price * (1 - buffer)
            showing_continuation = candles[-1].is_bearish

        if not is_short or not showing_continuation:
            return None

        passes_50 = candles[-1].body_size > candles[-1].range_size * 0.5

        return PullbackResult(
            detected=True,
            trigger_type=TriggerType.PULLBACK_SHORT,
            direction=direction,
            entry_price=candles[-1].close,
            candles=candles[-2:],
            passes_50_rule=passes_50,
            pullback_depth=0.05  # Minimal depth
        )


# Example usage
if __name__ == "__main__":
    from datetime import timedelta

    # Create sample candles for a pullback scenario
    # Breakout at 100, pullback to 101-102, continuation
    candles = [
        Candle(datetime.now() - timedelta(hours=4), 98, 101, 97, 100.5, 1000, "1h"),
        Candle(datetime.now() - timedelta(hours=3), 100, 105, 99, 104, 1500, "1h"),  # Breakout
        Candle(datetime.now() - timedelta(hours=2), 104, 105, 100, 101, 1200, "1h"),  # Pullback
        Candle(datetime.now() - timedelta(hours=1), 101, 106, 100, 105, 1400, "1h"),  # Continuation
    ]

    detector = ContinuationTriggerDetector()
    result = detector.detect_pullback(
        candles[2:],
        breakout_price=100,
        impulse_start=95,
        direction=Direction.BULLISH
    )

    if result and result.detected:
        print(f"Detected: {result.trigger_type.value}")
        print(f"Direction: {result.direction.value}")
        print(f"Entry: {result.entry_price}")
        print(f"Pullback Depth: {result.pullback_depth:.1%}")
        print(f"50% Rule: {result.passes_50_rule}")
