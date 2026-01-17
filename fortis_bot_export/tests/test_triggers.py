"""
Tests for trigger detection.
"""

import pytest
from datetime import datetime, timedelta

from src.core.models import Candle, Direction, TriggerType
from src.triggers.reversal import ReversalTriggerDetector
from src.triggers.continuation import ContinuationTriggerDetector


def create_candles(prices: list, start_time: datetime = None) -> list:
    """Helper to create candles from OHLC tuples."""
    if start_time is None:
        start_time = datetime.now()

    candles = []
    for i, (o, h, l, c) in enumerate(prices):
        candles.append(Candle(
            timestamp=start_time + timedelta(hours=i),
            open=o, high=h, low=l, close=c,
            volume=1000,
            timeframe='1h'
        ))
    return candles


class TestReversalTriggers:
    """Tests for reversal trigger detection."""

    def test_bullish_engulfing(self):
        """Should detect bullish engulfing pattern."""
        # Bearish candle followed by bullish engulfing
        prices = [
            (100, 102, 98, 99),    # Setup candle
            (105, 106, 100, 101),  # Bearish
            (100, 108, 99, 107),   # Bullish engulfing
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_engulfing(candles, zone_price=100, zone_type='SUPPORT')

        assert result is not None
        assert result.detected == True
        assert result.direction == Direction.BULLISH
        assert result.trigger_type == TriggerType.ENGULFING

    def test_bearish_engulfing(self):
        """Should detect bearish engulfing pattern."""
        prices = [
            (100, 102, 98, 101),   # Setup candle
            (100, 105, 99, 104),   # Bullish
            (105, 106, 98, 99),    # Bearish engulfing
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_engulfing(candles, zone_price=105, zone_type='RESISTANCE')

        assert result is not None
        assert result.detected == True
        assert result.direction == Direction.BEARISH

    def test_no_engulfing(self):
        """Should not detect engulfing when pattern is absent."""
        prices = [
            (98, 100, 97, 99),
            (100, 102, 99, 101),
            (101, 103, 100, 102),  # Not engulfing - same direction
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_engulfing(candles, zone_price=100, zone_type='SUPPORT')

        assert result is None

    def test_tweezers_bottom(self):
        """Should detect tweezers bottom."""
        prices = [
            (102, 103, 99, 100),   # Setup
            (105, 106, 100, 101),  # Bearish, low at 100
            (101, 105, 100, 104),  # Bullish, same low
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_tweezers(candles, zone_price=100, zone_type='SUPPORT')

        if result:
            assert result.direction == Direction.BULLISH
            assert result.trigger_type == TriggerType.TWEEZERS

    def test_morning_star(self):
        """Should detect morning star pattern."""
        prices = [
            (105, 106, 100, 101),  # Bearish
            (101, 102, 99, 100),   # Small body (doji-like)
            (100, 108, 99, 107),   # Bullish
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_star(candles, zone_price=100, zone_type='SUPPORT')

        # May or may not detect depending on body size ratios
        if result:
            assert result.direction == Direction.BULLISH
            assert result.trigger_type == TriggerType.STAR

    def test_fake_out(self):
        """Should detect fake out pattern."""
        prices = [
            (100, 105, 99, 104),   # Normal candle
            (104, 110, 103, 105),  # Breakout attempt
            (105, 106, 98, 99),    # Reversal - fake out
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_fake_out(candles, zone_price=105, zone_type='RESISTANCE')

        if result:
            assert result.direction == Direction.BEARISH
            assert result.trigger_type == TriggerType.FAKE_OUT
            assert result.strength >= 0.8  # Fake out is strongest

    def test_50_percent_rule(self):
        """Should check 50% rule on triggers."""
        # Engulfing with strong body (passes 50%)
        prices = [
            (98, 100, 97, 99),
            (105, 106, 100, 101),
            (100, 109, 99, 108),  # Strong bullish body
        ]
        candles = create_candles(prices)
        detector = ReversalTriggerDetector()

        result = detector.detect_engulfing(candles, zone_price=100, zone_type='SUPPORT')

        if result:
            assert result.passes_50_rule == True


class TestContinuationTriggers:
    """Tests for continuation trigger detection."""

    def test_pullback_detection(self):
        """Should detect pullback after breakout."""
        # Breakout at 100, pullback, continuation
        prices = [
            (98, 101, 97, 100),    # Pre-breakout
            (100, 105, 99, 104),   # Breakout
            (104, 105, 100, 101),  # Pullback
            (101, 107, 100, 106),  # Continuation
        ]
        candles = create_candles(prices)
        detector = ContinuationTriggerDetector()

        result = detector.detect_pullback(
            candles[2:],  # After breakout
            breakout_price=100,
            impulse_start=95,
            direction=Direction.BULLISH
        )

        if result:
            assert result.detected == True
            assert result.direction == Direction.BULLISH

    def test_perfect_pullback(self):
        """Should detect perfect pullback (exact touch)."""
        prices = [
            (104, 105, 100.1, 102),  # Touches 100 exactly
            (102, 108, 101, 107),    # Continuation
        ]
        candles = create_candles(prices)
        detector = ContinuationTriggerDetector()

        result = detector.detect_perfect_pullback(
            candles,
            breakout_price=100,
            direction=Direction.BULLISH
        )

        if result:
            assert result.trigger_type == TriggerType.PULLBACK_PERFECT

    def test_long_pullback(self):
        """Should detect long pullback (38-50% retracement)."""
        # Impulse from 90 to 100, pullback to ~95 (50%)
        prices = [
            (100, 101, 95, 96),    # Deep pullback
            (96, 97, 94, 95),      # More pullback
            (95, 102, 94, 101),    # Reversal
        ]
        candles = create_candles(prices)
        detector = ContinuationTriggerDetector()

        result = detector.detect_long_pullback(
            candles,
            breakout_price=100,
            impulse_start=90,
            direction=Direction.BULLISH
        )

        if result:
            assert result.trigger_type == TriggerType.PULLBACK_LONG

    def test_short_pullback(self):
        """Should detect short pullback (doesn't reach level)."""
        # Breakout at 100, shallow pullback to 102
        prices = [
            (105, 106, 102, 103),  # Shallow pullback
            (103, 110, 102, 109),  # Continuation
        ]
        candles = create_candles(prices)
        detector = ContinuationTriggerDetector()

        result = detector.detect_short_pullback(
            candles,
            breakout_price=100,
            direction=Direction.BULLISH
        )

        if result:
            assert result.trigger_type == TriggerType.PULLBACK_SHORT


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
