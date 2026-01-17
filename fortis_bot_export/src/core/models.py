"""
Core data models for the Fortis Trading System.
Hierarchy: Candle -> Range -> Movement -> Box -> Impulse -> Trend
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class Direction(Enum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


class LineType(Enum):
    SUPPORT = "SUPPORT"
    RESISTANCE = "RESISTANCE"


class TriggerType(Enum):
    # Reversal (operate at candle close)
    ENGULFING = "ENGULFING"
    TWEEZERS = "TWEEZERS"
    MORNING_STAR = "MORNING_STAR"
    EVENING_STAR = "EVENING_STAR"
    FAKE_OUT = "FAKE_OUT"
    # Continuation (operate at zone breakout)
    PULLBACK_PERFECT = "PULLBACK_PERFECT"
    PULLBACK_LONG = "PULLBACK_LONG"
    PULLBACK_SHORT = "PULLBACK_SHORT"


@dataclass
class Candle:
    """The minimum unit of analysis."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    timeframe: str = "1h"

    @property
    def range_size(self) -> float:
        return self.high - self.low

    @property
    def body_size(self) -> float:
        return abs(self.close - self.open)

    @property
    def is_bullish(self) -> bool:
        return self.close > self.open

    @property
    def is_bearish(self) -> bool:
        return self.close < self.open

    @property
    def direction(self) -> Direction:
        if self.close > self.open:
            return Direction.BULLISH
        elif self.close < self.open:
            return Direction.BEARISH
        return Direction.NEUTRAL


@dataclass
class Range:
    """Range of a single candle (high - low)."""
    high: float
    low: float
    candle_idx: int
    timestamp: datetime

    @property
    def size(self) -> float:
        return self.high - self.low

    def contains(self, other: "Range") -> bool:
        return self.high >= other.high and self.low <= other.low


@dataclass
class Movement:
    """Succession of ranges in the SAME direction."""
    direction: Direction
    start_idx: int
    start_price: float
    end_idx: Optional[int] = None
    end_price: Optional[float] = None
    ranges: List[Range] = field(default_factory=list)

    @property
    def high(self) -> float:
        if not self.ranges:
            return self.start_price
        return max(r.high for r in self.ranges)

    @property
    def low(self) -> float:
        if not self.ranges:
            return self.start_price
        return min(r.low for r in self.ranges)


@dataclass
class Box:
    """Range of the last valid movement. Everything INSIDE is NOISE."""
    high: float
    low: float
    direction: Direction
    start_idx: int
    end_idx: Optional[int] = None
    is_fixed: bool = False

    @property
    def size(self) -> float:
        return self.high - self.low

    def is_price_inside(self, price: float) -> bool:
        return self.low <= price <= self.high


@dataclass
class SwingPoint:
    """A swing high or swing low point."""
    price: float
    idx: int
    timestamp: datetime
    swing_type: str  # 'HIGH' or 'LOW'
    confirmed: bool = False


@dataclass
class Impulse:
    """2+ movements with zig-zag structure. MUST break checkpoint."""
    direction: Direction
    movements: List[Movement] = field(default_factory=list)
    swing_highs: List[SwingPoint] = field(default_factory=list)
    swing_lows: List[SwingPoint] = field(default_factory=list)
    checkpoint_price: Optional[float] = None
    is_valid: bool = False

    def validate(self, checkpoint: float) -> dict:
        """Validate impulse: structure + checkpoint break."""
        if self.direction == Direction.BULLISH:
            has_structure = self._has_higher_highs_lows()
            breaks_check = self.high > checkpoint
        else:
            has_structure = self._has_lower_highs_lows()
            breaks_check = self.low < checkpoint

        if has_structure and breaks_check:
            self.is_valid = True
            return {'valid': True, 'type': 'CONFIRMED_IMPULSE'}
        return {'valid': False, 'reason': 'Missing structure or checkpoint break'}

    def _has_higher_highs_lows(self) -> bool:
        if len(self.swing_highs) < 2 or len(self.swing_lows) < 2:
            return False
        for i in range(1, len(self.swing_highs)):
            if self.swing_highs[i].price <= self.swing_highs[i-1].price:
                return False
        for i in range(1, len(self.swing_lows)):
            if self.swing_lows[i].price <= self.swing_lows[i-1].price:
                return False
        return True

    def _has_lower_highs_lows(self) -> bool:
        if len(self.swing_highs) < 2 or len(self.swing_lows) < 2:
            return False
        for i in range(1, len(self.swing_highs)):
            if self.swing_highs[i].price >= self.swing_highs[i-1].price:
                return False
        for i in range(1, len(self.swing_lows)):
            if self.swing_lows[i].price >= self.swing_lows[i-1].price:
                return False
        return True

    @property
    def high(self) -> float:
        return max(s.price for s in self.swing_highs) if self.swing_highs else 0

    @property
    def low(self) -> float:
        return min(s.price for s in self.swing_lows) if self.swing_lows else float('inf')


@dataclass
class Checkpoint:
    """Control point. Bullish: last LOW. Bearish: last HIGH."""
    price: float
    idx: int
    timestamp: datetime
    direction: Direction


@dataclass
class TrendLine:
    """Trend line following Rule 1-2-3-4."""
    price: float
    slope: float = 0
    intercept: float = 0
    line_type: LineType = LineType.SUPPORT
    creation_idx: int = 0
    touches: int = 1
    strikes: int = 0
    active: bool = True
    timeframe: str = "1h"
    pivot_type: str = "LOW"

    @property
    def confirmed(self) -> bool:
        return self.touches >= 2

    @property
    def strikes_to_eliminate(self) -> int:
        return 4 if self.confirmed else 3

    def should_eliminate(self) -> bool:
        return self.strikes >= self.strikes_to_eliminate

    def get_price_at_index(self, idx: int) -> float:
        if self.slope == 0:
            return self.price
        return self.slope * idx + self.intercept

    def add_touch(self):
        self.touches += 1
        self.strikes = 0  # Reset strikes on new touch

    def add_strike(self):
        self.strikes += 1
        if self.should_eliminate():
            self.active = False


@dataclass
class Signal:
    """Trading signal generated by the system."""
    timestamp: datetime
    symbol: str
    timeframe: str
    direction: Direction
    zone_price: float
    trigger_type: TriggerType
    entry_price: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: Optional[float] = None
    risk_reward_ratio: float = 0
    is_valid: bool = False

    def validate(self) -> bool:
        """Validate using THE TRINITY: zone + trigger + ratio >= 1."""
        if self.zone_price is None:
            return False
        if self.risk_reward_ratio < 1.0:
            return False
        self.is_valid = True
        return True
