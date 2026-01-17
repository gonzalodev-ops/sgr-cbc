"""
Stage 2: Chart Patterns

Key rules:
- Operated by CONTEXT (removed when completed/invalidated)
- ALWAYS operate with PULLBACK after breakout
- Target: 75% of pattern (not 100%)

Pattern types:
- Reversal: Double Top/Bottom, Head & Shoulders, Wedges
- Continuation: Flags, Channels
- Neutral: Triangles
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional

from src.core.models import Candle, Direction, SwingPoint
from src.core.structures import SwingDetector


class PatternType(Enum):
    DOUBLE_TOP = "DOUBLE_TOP"
    DOUBLE_BOTTOM = "DOUBLE_BOTTOM"
    HEAD_SHOULDERS = "HEAD_SHOULDERS"
    INV_HEAD_SHOULDERS = "INV_HEAD_SHOULDERS"
    RISING_WEDGE = "RISING_WEDGE"
    FALLING_WEDGE = "FALLING_WEDGE"
    SYMMETRIC_TRIANGLE = "SYMMETRIC_TRIANGLE"
    ASCENDING_TRIANGLE = "ASCENDING_TRIANGLE"
    DESCENDING_TRIANGLE = "DESCENDING_TRIANGLE"


class PatternStatus(Enum):
    FORMING = "FORMING"
    BREAKOUT = "BREAKOUT"
    PULLBACK_WAIT = "PULLBACK_WAIT"
    ACTIVE = "ACTIVE"
    INVALIDATED = "INVALIDATED"
    TARGET_HIT = "TARGET_HIT"


@dataclass
class ChartPattern:
    """A detected chart pattern."""
    pattern_type: PatternType
    direction: Direction
    status: PatternStatus
    neckline: float
    target: float  # 75% of pattern
    invalidation: float
    points: List[SwingPoint] = field(default_factory=list)
    pattern_height: float = 0
    pullback_zone_high: float = 0
    pullback_zone_low: float = 0

    def is_breakout_valid(self, close: float) -> bool:
        if self.direction == Direction.BULLISH:
            return close > self.neckline
        return close < self.neckline

    def is_pullback_valid(self, candle: Candle) -> bool:
        in_zone = candle.low <= self.pullback_zone_high and candle.high >= self.pullback_zone_low
        if not in_zone:
            return False
        if self.direction == Direction.BULLISH:
            return candle.is_bullish
        return candle.is_bearish


class PatternDetector:
    """Detects chart patterns from price data."""

    def __init__(self, swing_lookback: int = 3):
        self.swing_detector = SwingDetector(lookback=swing_lookback)
        self.patterns: List[ChartPattern] = []

    def detect_patterns(self, candles: List[Candle]) -> List[ChartPattern]:
        highs, lows = self.swing_detector.detect_swings(candles)

        detected = []
        detected.extend(self._detect_double_tops(highs, lows))
        detected.extend(self._detect_double_bottoms(highs, lows))
        detected.extend(self._detect_head_shoulders(highs, lows))
        detected.extend(self._detect_triangles(highs, lows))
        detected.extend(self._detect_wedges(highs, lows))

        self.patterns.extend(detected)
        return detected

    def _detect_double_tops(self, highs: List[SwingPoint], lows: List[SwingPoint]) -> List[ChartPattern]:
        patterns = []
        for i in range(len(highs) - 1):
            p1, p2 = highs[i], highs[i + 1]
            avg = (p1.price + p2.price) / 2
            if abs(p1.price - p2.price) / avg > 0.01:
                continue

            valley = next((l for l in lows if p1.idx < l.idx < p2.idx), None)
            if not valley:
                continue

            height = avg - valley.price
            patterns.append(ChartPattern(
                pattern_type=PatternType.DOUBLE_TOP,
                direction=Direction.BEARISH,
                status=PatternStatus.FORMING,
                neckline=valley.price,
                target=valley.price - height * 0.75,
                invalidation=max(p1.price, p2.price) * 1.01,
                points=[p1, valley, p2],
                pattern_height=height,
                pullback_zone_high=valley.price * 1.005,
                pullback_zone_low=valley.price * 0.995,
            ))
        return patterns

    def _detect_double_bottoms(self, highs: List[SwingPoint], lows: List[SwingPoint]) -> List[ChartPattern]:
        patterns = []
        for i in range(len(lows) - 1):
            b1, b2 = lows[i], lows[i + 1]
            avg = (b1.price + b2.price) / 2
            if abs(b1.price - b2.price) / avg > 0.01:
                continue

            peak = next((h for h in highs if b1.idx < h.idx < b2.idx), None)
            if not peak:
                continue

            height = peak.price - avg
            patterns.append(ChartPattern(
                pattern_type=PatternType.DOUBLE_BOTTOM,
                direction=Direction.BULLISH,
                status=PatternStatus.FORMING,
                neckline=peak.price,
                target=peak.price + height * 0.75,
                invalidation=min(b1.price, b2.price) * 0.99,
                points=[b1, peak, b2],
                pattern_height=height,
                pullback_zone_high=peak.price * 1.005,
                pullback_zone_low=peak.price * 0.995,
            ))
        return patterns

    def _detect_head_shoulders(self, highs: List[SwingPoint], lows: List[SwingPoint]) -> List[ChartPattern]:
        patterns = []
        for i in range(len(highs) - 2):
            ls, head, rs = highs[i], highs[i+1], highs[i+2]

            if not (head.price > ls.price and head.price > rs.price):
                continue
            if abs(ls.price - rs.price) / ls.price > 0.05:
                continue

            left_low = next((l for l in lows if ls.idx < l.idx < head.idx), None)
            right_low = next((l for l in lows if head.idx < l.idx < rs.idx), None)
            if not left_low or not right_low:
                continue

            neckline = (left_low.price + right_low.price) / 2
            height = head.price - neckline

            patterns.append(ChartPattern(
                pattern_type=PatternType.HEAD_SHOULDERS,
                direction=Direction.BEARISH,
                status=PatternStatus.FORMING,
                neckline=neckline,
                target=neckline - height * 0.75,
                invalidation=head.price * 1.01,
                points=[ls, left_low, head, right_low, rs],
                pattern_height=height,
                pullback_zone_high=neckline * 1.005,
                pullback_zone_low=neckline * 0.995,
            ))
        return patterns

    def _detect_triangles(self, highs: List[SwingPoint], lows: List[SwingPoint]) -> List[ChartPattern]:
        patterns = []
        if len(highs) < 2 or len(lows) < 2:
            return patterns

        h_slope = (highs[-1].price - highs[-2].price) / max(1, highs[-1].idx - highs[-2].idx)
        l_slope = (lows[-1].price - lows[-2].price) / max(1, lows[-1].idx - lows[-2].idx)
        height = highs[-1].price - lows[-1].price

        # Symmetric
        if h_slope < 0 and l_slope > 0:
            patterns.append(ChartPattern(
                pattern_type=PatternType.SYMMETRIC_TRIANGLE,
                direction=Direction.NEUTRAL,
                status=PatternStatus.FORMING,
                neckline=(highs[-1].price + lows[-1].price) / 2,
                target=0,
                invalidation=0,
                pattern_height=height,
            ))
        # Ascending
        elif abs(h_slope) < 0.0001 and l_slope > 0:
            patterns.append(ChartPattern(
                pattern_type=PatternType.ASCENDING_TRIANGLE,
                direction=Direction.BULLISH,
                status=PatternStatus.FORMING,
                neckline=highs[-1].price,
                target=highs[-1].price + height * 0.75,
                invalidation=lows[-1].price * 0.99,
                pattern_height=height,
            ))
        # Descending
        elif h_slope < 0 and abs(l_slope) < 0.0001:
            patterns.append(ChartPattern(
                pattern_type=PatternType.DESCENDING_TRIANGLE,
                direction=Direction.BEARISH,
                status=PatternStatus.FORMING,
                neckline=lows[-1].price,
                target=lows[-1].price - height * 0.75,
                invalidation=highs[-1].price * 1.01,
                pattern_height=height,
            ))
        return patterns

    def _detect_wedges(self, highs: List[SwingPoint], lows: List[SwingPoint]) -> List[ChartPattern]:
        patterns = []
        if len(highs) < 2 or len(lows) < 2:
            return patterns

        h_slope = (highs[-1].price - highs[-2].price) / max(1, highs[-1].idx - highs[-2].idx)
        l_slope = (lows[-1].price - lows[-2].price) / max(1, lows[-1].idx - lows[-2].idx)
        height = highs[-1].price - lows[-1].price

        # Rising wedge (bearish)
        if h_slope > 0 and l_slope > 0:
            patterns.append(ChartPattern(
                pattern_type=PatternType.RISING_WEDGE,
                direction=Direction.BEARISH,
                status=PatternStatus.FORMING,
                neckline=lows[-1].price,
                target=lows[-1].price - height * 0.5,
                invalidation=highs[-1].price * 1.01,
                pattern_height=height,
            ))
        # Falling wedge (bullish)
        elif h_slope < 0 and l_slope < 0:
            patterns.append(ChartPattern(
                pattern_type=PatternType.FALLING_WEDGE,
                direction=Direction.BULLISH,
                status=PatternStatus.FORMING,
                neckline=highs[-1].price,
                target=highs[-1].price + height * 0.5,
                invalidation=lows[-1].price * 0.99,
                pattern_height=height,
            ))
        return patterns

    def update_patterns(self, candle: Candle) -> List[ChartPattern]:
        """Update pattern status with new candle."""
        changed = []
        for p in self.patterns:
            if p.status in [PatternStatus.INVALIDATED, PatternStatus.TARGET_HIT]:
                continue

            old = p.status

            # Check invalidation
            if p.direction == Direction.BULLISH and candle.close < p.invalidation:
                p.status = PatternStatus.INVALIDATED
            elif p.direction == Direction.BEARISH and candle.close > p.invalidation:
                p.status = PatternStatus.INVALIDATED

            # Check breakout
            if p.status == PatternStatus.FORMING and p.is_breakout_valid(candle.close):
                p.status = PatternStatus.PULLBACK_WAIT

            # Check pullback
            if p.status == PatternStatus.PULLBACK_WAIT and p.is_pullback_valid(candle):
                p.status = PatternStatus.ACTIVE

            # Check target
            if p.status == PatternStatus.ACTIVE:
                if p.direction == Direction.BULLISH and candle.high >= p.target:
                    p.status = PatternStatus.TARGET_HIT
                elif p.direction == Direction.BEARISH and candle.low <= p.target:
                    p.status = PatternStatus.TARGET_HIT

            if p.status != old:
                changed.append(p)

        return changed

    def get_active(self) -> List[ChartPattern]:
        return [p for p in self.patterns if p.status == PatternStatus.ACTIVE]

    def get_forming(self) -> List[ChartPattern]:
        return [p for p in self.patterns if p.status == PatternStatus.FORMING]
