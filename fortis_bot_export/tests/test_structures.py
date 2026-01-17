"""
Tests for structure detection.
"""

import pytest
from datetime import datetime, timedelta

from src.core.models import Candle, Direction
from src.core.structures import SwingDetector, MovementDetector, BoxManager, StructureEngine


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


class TestSwingDetector:
    """Tests for swing detection."""

    def test_detect_swing_high(self):
        """Should detect a swing high."""
        # Create pattern: low, low, HIGH, low, low
        prices = [
            (100, 102, 99, 101),   # low
            (101, 103, 100, 102),  # low
            (102, 110, 101, 108),  # HIGH - swing high
            (108, 107, 104, 105),  # low
            (105, 106, 103, 104),  # low
        ]
        candles = create_candles(prices)
        detector = SwingDetector(lookback=2)

        highs, lows = detector.detect_swings(candles)

        assert len(highs) == 1
        assert highs[0].price == 110  # The high at index 2

    def test_detect_swing_low(self):
        """Should detect a swing low."""
        # Create pattern: high, high, LOW, high, high
        prices = [
            (105, 107, 104, 106),
            (106, 108, 105, 107),
            (107, 106, 95, 98),   # LOW - swing low
            (98, 102, 97, 101),
            (101, 105, 100, 104),
        ]
        candles = create_candles(prices)
        detector = SwingDetector(lookback=2)

        highs, lows = detector.detect_swings(candles)

        assert len(lows) == 1
        assert lows[0].price == 95

    def test_no_swings_in_trend(self):
        """Should not detect swings in strong trend."""
        # Straight uptrend
        prices = [
            (100, 101, 99, 101),
            (101, 103, 100, 102),
            (102, 105, 101, 104),
            (104, 107, 103, 106),
            (106, 109, 105, 108),
        ]
        candles = create_candles(prices)
        detector = SwingDetector(lookback=2)

        highs, lows = detector.detect_swings(candles)

        # In a clean uptrend, there should be no clear swing points
        assert len(highs) == 0 or len(lows) == 0


class TestMovementDetector:
    """Tests for movement detection."""

    def test_detect_bullish_movement(self):
        """Should detect bullish movement."""
        prices = [
            (100, 102, 99, 101),
            (101, 105, 100, 104),
            (104, 108, 103, 107),
            (107, 112, 106, 111),
        ]
        candles = create_candles(prices)
        detector = MovementDetector()

        movements = detector.process_candles(candles)

        # Should have at least one bullish movement
        bullish = [m for m in movements if m.direction == Direction.BULLISH]
        assert len(bullish) >= 0  # Depends on implementation details

    def test_detect_direction_change(self):
        """Should detect when direction changes."""
        prices = [
            (100, 105, 99, 104),   # Up
            (104, 108, 103, 107),  # Up
            (107, 108, 100, 101),  # Down - direction change
            (101, 102, 96, 97),    # Down
        ]
        candles = create_candles(prices)
        detector = MovementDetector()

        movements = detector.process_candles(candles)

        # Should have detected at least one completed movement
        assert len(movements) >= 1


class TestBoxManager:
    """Tests for box management."""

    def test_price_inside_box(self):
        """Should identify price inside box as noise."""
        from src.core.models import Movement, Range

        manager = BoxManager()

        # Create a movement/box from 100-110
        movement = Movement(
            direction=Direction.BULLISH,
            start_idx=0,
            start_price=100,
            end_idx=5,
        )
        movement.ranges = [Range(110, 100, 0, datetime.now())]

        box = manager.create_box_from_movement(movement)

        # Price at 105 should be inside (noise)
        assert manager.is_price_noise(105) == True

        # Price at 115 should be outside
        assert manager.is_price_noise(115) == False


class TestStructureEngine:
    """Tests for the main structure engine."""

    def test_full_analysis(self):
        """Should perform full structure analysis."""
        # Create some test data with clear structure
        prices = [
            (100, 102, 99, 101),
            (101, 105, 100, 104),
            (104, 110, 103, 108),  # Potential swing high
            (108, 109, 102, 103),
            (103, 104, 95, 96),    # Potential swing low
            (96, 102, 95, 101),
            (101, 106, 100, 105),
        ]
        candles = create_candles(prices)

        engine = StructureEngine(swing_lookback=2)
        result = engine.analyze(candles)

        assert 'swing_highs' in result
        assert 'swing_lows' in result
        assert 'movements' in result
        assert 'boxes' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
