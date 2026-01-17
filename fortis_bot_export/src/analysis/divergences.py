"""
Divergence Detection - RSI divergences for confirmation.

Types:
- Regular (Reversal): Price vs RSI in opposite directions
- Hidden (Continuation): In favor of the structure

Classes:
- Class A: Strongest
- Class B: Moderate
- Class C: Weakest

IMPORTANT: Divergences are CONFIRMATION, not independent triggers.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional, Tuple

from src.core.models import Candle, Direction, SwingPoint


class DivergenceType(Enum):
    """Type of divergence."""
    REGULAR_BULLISH = "regular_bullish"    # Price lower low, RSI higher low
    REGULAR_BEARISH = "regular_bearish"    # Price higher high, RSI lower high
    HIDDEN_BULLISH = "hidden_bullish"      # Price higher low, RSI lower low
    HIDDEN_BEARISH = "hidden_bearish"      # Price lower high, RSI higher high


class DivergenceClass(Enum):
    """Strength class of divergence."""
    A = "A"  # Strongest - clear divergence
    B = "B"  # Moderate
    C = "C"  # Weakest


@dataclass
class Divergence:
    """Detected divergence."""
    div_type: DivergenceType
    div_class: DivergenceClass
    direction: Direction
    price_point1: float
    price_point2: float
    rsi_point1: float
    rsi_point2: float
    start_idx: int
    end_idx: int
    timestamp: datetime
    strength: float  # 0-1


class RSICalculator:
    """Calculates RSI values."""

    def __init__(self, period: int = 14):
        self.period = period

    def calculate(self, candles: List[Candle]) -> List[float]:
        """Calculate RSI for candle list."""
        if len(candles) < self.period + 1:
            return []

        rsi_values = []
        gains = []
        losses = []

        # Calculate initial gains/losses
        for i in range(1, len(candles)):
            change = candles[i].close - candles[i - 1].close
            gains.append(max(0, change))
            losses.append(max(0, -change))

        # Initial averages
        avg_gain = sum(gains[:self.period]) / self.period
        avg_loss = sum(losses[:self.period]) / self.period

        # Pad with None for alignment
        rsi_values = [None] * self.period

        for i in range(self.period, len(gains)):
            avg_gain = (avg_gain * (self.period - 1) + gains[i]) / self.period
            avg_loss = (avg_loss * (self.period - 1) + losses[i]) / self.period

            if avg_loss == 0:
                rsi = 100
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))

            rsi_values.append(rsi)

        return rsi_values


class DivergenceDetector:
    """Detects divergences between price and RSI."""

    def __init__(self, rsi_period: int = 14, lookback: int = 20):
        self.rsi_calc = RSICalculator(rsi_period)
        self.lookback = lookback

    def find_swings_in_rsi(self, rsi_values: List[float], lookback: int = 3) -> Tuple[List[Tuple[int, float]], List[Tuple[int, float]]]:
        """Find swing highs and lows in RSI."""
        highs = []
        lows = []

        for i in range(lookback, len(rsi_values) - lookback):
            if rsi_values[i] is None:
                continue

            # Check swing high
            is_high = all(
                rsi_values[j] is not None and rsi_values[j] < rsi_values[i]
                for j in range(i - lookback, i + lookback + 1) if j != i
            )
            if is_high:
                highs.append((i, rsi_values[i]))

            # Check swing low
            is_low = all(
                rsi_values[j] is not None and rsi_values[j] > rsi_values[i]
                for j in range(i - lookback, i + lookback + 1) if j != i
            )
            if is_low:
                lows.append((i, rsi_values[i]))

        return highs, lows

    def detect_divergences(self, candles: List[Candle]) -> List[Divergence]:
        """Detect all divergences in candle data."""
        if len(candles) < self.lookback + 15:
            return []

        rsi_values = self.rsi_calc.calculate(candles)
        if not rsi_values:
            return []

        divergences = []

        # Find price swings
        price_highs = []
        price_lows = []

        for i in range(2, len(candles) - 2):
            c = candles[i]
            is_high = all(candles[j].high < c.high for j in range(i - 2, i + 3) if j != i)
            is_low = all(candles[j].low > c.low for j in range(i - 2, i + 3) if j != i)

            if is_high:
                price_highs.append((i, c.high))
            if is_low:
                price_lows.append((i, c.low))

        # Find RSI swings
        rsi_highs, rsi_lows = self.find_swings_in_rsi(rsi_values)

        # Check for regular bullish divergence (price lower low, RSI higher low)
        for i in range(1, len(price_lows)):
            prev_idx, prev_price = price_lows[i - 1]
            curr_idx, curr_price = price_lows[i]

            if curr_price >= prev_price:
                continue  # Not a lower low

            # Find corresponding RSI lows
            prev_rsi = self._find_nearest_rsi_swing(prev_idx, rsi_lows)
            curr_rsi = self._find_nearest_rsi_swing(curr_idx, rsi_lows)

            if prev_rsi and curr_rsi and curr_rsi[1] > prev_rsi[1]:
                div_class = self._classify_divergence(prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                divergences.append(Divergence(
                    div_type=DivergenceType.REGULAR_BULLISH,
                    div_class=div_class,
                    direction=Direction.BULLISH,
                    price_point1=prev_price,
                    price_point2=curr_price,
                    rsi_point1=prev_rsi[1],
                    rsi_point2=curr_rsi[1],
                    start_idx=prev_idx,
                    end_idx=curr_idx,
                    timestamp=candles[curr_idx].timestamp,
                    strength=self._calculate_strength(div_class, prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                ))

        # Check for regular bearish divergence (price higher high, RSI lower high)
        for i in range(1, len(price_highs)):
            prev_idx, prev_price = price_highs[i - 1]
            curr_idx, curr_price = price_highs[i]

            if curr_price <= prev_price:
                continue  # Not a higher high

            prev_rsi = self._find_nearest_rsi_swing(prev_idx, rsi_highs)
            curr_rsi = self._find_nearest_rsi_swing(curr_idx, rsi_highs)

            if prev_rsi and curr_rsi and curr_rsi[1] < prev_rsi[1]:
                div_class = self._classify_divergence(prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                divergences.append(Divergence(
                    div_type=DivergenceType.REGULAR_BEARISH,
                    div_class=div_class,
                    direction=Direction.BEARISH,
                    price_point1=prev_price,
                    price_point2=curr_price,
                    rsi_point1=prev_rsi[1],
                    rsi_point2=curr_rsi[1],
                    start_idx=prev_idx,
                    end_idx=curr_idx,
                    timestamp=candles[curr_idx].timestamp,
                    strength=self._calculate_strength(div_class, prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                ))

        # Check for hidden bullish divergence (price higher low, RSI lower low)
        for i in range(1, len(price_lows)):
            prev_idx, prev_price = price_lows[i - 1]
            curr_idx, curr_price = price_lows[i]

            if curr_price <= prev_price:
                continue  # Not a higher low

            prev_rsi = self._find_nearest_rsi_swing(prev_idx, rsi_lows)
            curr_rsi = self._find_nearest_rsi_swing(curr_idx, rsi_lows)

            if prev_rsi and curr_rsi and curr_rsi[1] < prev_rsi[1]:
                div_class = self._classify_divergence(prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                divergences.append(Divergence(
                    div_type=DivergenceType.HIDDEN_BULLISH,
                    div_class=div_class,
                    direction=Direction.BULLISH,
                    price_point1=prev_price,
                    price_point2=curr_price,
                    rsi_point1=prev_rsi[1],
                    rsi_point2=curr_rsi[1],
                    start_idx=prev_idx,
                    end_idx=curr_idx,
                    timestamp=candles[curr_idx].timestamp,
                    strength=self._calculate_strength(div_class, prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                ))

        # Check for hidden bearish divergence (price lower high, RSI higher high)
        for i in range(1, len(price_highs)):
            prev_idx, prev_price = price_highs[i - 1]
            curr_idx, curr_price = price_highs[i]

            if curr_price >= prev_price:
                continue  # Not a lower high

            prev_rsi = self._find_nearest_rsi_swing(prev_idx, rsi_highs)
            curr_rsi = self._find_nearest_rsi_swing(curr_idx, rsi_highs)

            if prev_rsi and curr_rsi and curr_rsi[1] > prev_rsi[1]:
                div_class = self._classify_divergence(prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                divergences.append(Divergence(
                    div_type=DivergenceType.HIDDEN_BEARISH,
                    div_class=div_class,
                    direction=Direction.BEARISH,
                    price_point1=prev_price,
                    price_point2=curr_price,
                    rsi_point1=prev_rsi[1],
                    rsi_point2=curr_rsi[1],
                    start_idx=prev_idx,
                    end_idx=curr_idx,
                    timestamp=candles[curr_idx].timestamp,
                    strength=self._calculate_strength(div_class, prev_price, curr_price, prev_rsi[1], curr_rsi[1])
                ))

        return divergences

    def _find_nearest_rsi_swing(self, target_idx: int, swings: List[Tuple[int, float]], tolerance: int = 3) -> Optional[Tuple[int, float]]:
        """Find RSI swing nearest to target index."""
        best = None
        best_dist = float('inf')

        for idx, value in swings:
            dist = abs(idx - target_idx)
            if dist <= tolerance and dist < best_dist:
                best = (idx, value)
                best_dist = dist

        return best

    def _classify_divergence(self, price1: float, price2: float, rsi1: float, rsi2: float) -> DivergenceClass:
        """Classify divergence strength."""
        price_diff = abs(price2 - price1) / price1
        rsi_diff = abs(rsi2 - rsi1)

        # Class A: Strong divergence
        if price_diff > 0.02 and rsi_diff > 10:
            return DivergenceClass.A
        # Class B: Moderate
        elif price_diff > 0.01 or rsi_diff > 5:
            return DivergenceClass.B
        # Class C: Weak
        return DivergenceClass.C

    def _calculate_strength(self, div_class: DivergenceClass, price1: float, price2: float, rsi1: float, rsi2: float) -> float:
        """Calculate divergence strength 0-1."""
        base = {'A': 0.9, 'B': 0.6, 'C': 0.3}[div_class.value]
        price_factor = min(abs(price2 - price1) / price1 * 10, 0.1)
        rsi_factor = min(abs(rsi2 - rsi1) / 100, 0.1)
        return min(base + price_factor + rsi_factor, 1.0)

    def is_confirmation(self, divergence: Divergence, expected_direction: Direction) -> bool:
        """Check if divergence confirms expected direction."""
        if divergence.div_type in [DivergenceType.REGULAR_BULLISH, DivergenceType.HIDDEN_BULLISH]:
            return expected_direction == Direction.BULLISH
        return expected_direction == Direction.BEARISH
