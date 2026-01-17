"""
Multiframe Analysis - Hierarchical timeframe analysis.

Rules:
- Rules are fractal (apply at all timeframes)
- Lines operate in their frame or ONE lower
- Strikes only count in the frame where line was drawn
- Higher timeframe zones have priority
- Process: Higher → last pivot → descend
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from src.core.models import TrendLine, Direction, LineType


# Timeframe hierarchy (highest to lowest)
TIMEFRAME_HIERARCHY = ['1M', '1w', '1d', '4h', '1h', '15m', '5m']

TIMEFRAME_MINUTES = {
    '1M': 43200,  # ~30 days
    '1w': 10080,  # 7 days
    '1d': 1440,   # 1 day
    '4h': 240,
    '1h': 60,
    '15m': 15,
    '5m': 5,
}


@dataclass
class MultiframeZone:
    """Zone identified across multiple timeframes."""
    price: float
    timeframes: List[str]  # All timeframes where this zone exists
    line_type: LineType
    strength: float  # 0-1 based on timeframe count and hierarchy
    priority: int  # Lower = higher priority


@dataclass
class MultiframeContext:
    """Complete multiframe context for a price level."""
    current_price: float
    higher_tf_bias: Optional[Direction]  # Bias from higher timeframes
    nearest_resistance: Optional[MultiframeZone]
    nearest_support: Optional[MultiframeZone]
    convergent_zones: List[MultiframeZone]
    active_timeframe: str


class MultiframeAnalyzer:
    """Analyzes price across multiple timeframes."""

    def __init__(self, primary_timeframe: str = '4h'):
        self.primary_tf = primary_timeframe
        self.lines_by_tf: Dict[str, List[TrendLine]] = {tf: [] for tf in TIMEFRAME_HIERARCHY}

    def get_higher_timeframes(self, timeframe: str) -> List[str]:
        """Get all timeframes higher than the given one."""
        idx = TIMEFRAME_HIERARCHY.index(timeframe) if timeframe in TIMEFRAME_HIERARCHY else -1
        return TIMEFRAME_HIERARCHY[:idx] if idx > 0 else []

    def get_lower_timeframe(self, timeframe: str) -> Optional[str]:
        """Get the next lower timeframe (where lines can be operated)."""
        idx = TIMEFRAME_HIERARCHY.index(timeframe) if timeframe in TIMEFRAME_HIERARCHY else -1
        if idx < len(TIMEFRAME_HIERARCHY) - 1:
            return TIMEFRAME_HIERARCHY[idx + 1]
        return None

    def can_operate_line(self, line_tf: str, operation_tf: str) -> bool:
        """Check if a line can be operated in the given timeframe."""
        line_idx = TIMEFRAME_HIERARCHY.index(line_tf) if line_tf in TIMEFRAME_HIERARCHY else -1
        op_idx = TIMEFRAME_HIERARCHY.index(operation_tf) if operation_tf in TIMEFRAME_HIERARCHY else -1
        # Can operate in same frame or ONE lower
        return op_idx == line_idx or op_idx == line_idx + 1

    def register_lines(self, timeframe: str, lines: List[TrendLine]) -> None:
        """Register lines for a timeframe."""
        self.lines_by_tf[timeframe] = lines

    def find_convergent_zones(self, price: float, tolerance: float = 0.02) -> List[MultiframeZone]:
        """Find zones where multiple timeframe lines converge."""
        zones: Dict[float, MultiframeZone] = {}

        for tf_idx, tf in enumerate(TIMEFRAME_HIERARCHY):
            for line in self.lines_by_tf.get(tf, []):
                if not line.active:
                    continue

                line_price = line.price
                # Check if within tolerance of existing zone
                matched = False
                for zone_price in list(zones.keys()):
                    if abs(zone_price - line_price) / zone_price < tolerance:
                        zones[zone_price].timeframes.append(tf)
                        zones[zone_price].strength += (len(TIMEFRAME_HIERARCHY) - tf_idx) / len(TIMEFRAME_HIERARCHY)
                        matched = True
                        break

                if not matched:
                    zones[line_price] = MultiframeZone(
                        price=line_price,
                        timeframes=[tf],
                        line_type=line.line_type,
                        strength=(len(TIMEFRAME_HIERARCHY) - tf_idx) / len(TIMEFRAME_HIERARCHY),
                        priority=tf_idx
                    )

        # Filter for actual convergence (2+ timeframes)
        return sorted(
            [z for z in zones.values() if len(z.timeframes) >= 2],
            key=lambda x: x.priority
        )

    def get_higher_tf_bias(self, timeframe: str) -> Optional[Direction]:
        """Determine bias from higher timeframes."""
        higher_tfs = self.get_higher_timeframes(timeframe)
        if not higher_tfs:
            return None

        bullish_score = 0
        bearish_score = 0

        for tf_idx, tf in enumerate(higher_tfs):
            weight = len(higher_tfs) - tf_idx  # Higher TF = more weight
            lines = self.lines_by_tf.get(tf, [])

            for line in lines:
                if not line.active or not line.confirmed:
                    continue

                if line.line_type == LineType.SUPPORT:
                    bullish_score += weight
                else:
                    bearish_score += weight

        if bullish_score > bearish_score * 1.5:
            return Direction.BULLISH
        elif bearish_score > bullish_score * 1.5:
            return Direction.BEARISH
        return None

    def analyze(self, current_price: float, timeframe: str) -> MultiframeContext:
        """Complete multiframe analysis for current price."""
        convergent = self.find_convergent_zones(current_price)

        # Find nearest support and resistance
        supports = [z for z in convergent if z.line_type == LineType.SUPPORT and z.price < current_price]
        resistances = [z for z in convergent if z.line_type == LineType.RESISTANCE and z.price > current_price]

        nearest_support = max(supports, key=lambda x: x.price) if supports else None
        nearest_resistance = min(resistances, key=lambda x: x.price) if resistances else None

        return MultiframeContext(
            current_price=current_price,
            higher_tf_bias=self.get_higher_tf_bias(timeframe),
            nearest_resistance=nearest_resistance,
            nearest_support=nearest_support,
            convergent_zones=convergent,
            active_timeframe=timeframe
        )

    def get_zone_strength(self, zone: MultiframeZone) -> str:
        """Get human-readable zone strength."""
        if zone.strength >= 0.8:
            return "VERY_STRONG"
        elif zone.strength >= 0.6:
            return "STRONG"
        elif zone.strength >= 0.4:
            return "MODERATE"
        return "WEAK"

    def should_operate(self, line: TrendLine, operation_tf: str, price: float) -> Tuple[bool, str]:
        """Determine if a line should be operated given multiframe context."""
        if not self.can_operate_line(line.timeframe, operation_tf):
            return False, f"Cannot operate {line.timeframe} line in {operation_tf}"

        # Check for conflicting higher TF zones
        higher_tfs = self.get_higher_timeframes(operation_tf)
        for tf in higher_tfs:
            for higher_line in self.lines_by_tf.get(tf, []):
                if not higher_line.active:
                    continue

                # If higher TF line conflicts, don't operate
                distance = abs(higher_line.price - price) / price
                if distance < 0.01:  # Within 1%
                    if higher_line.line_type != line.line_type:
                        return False, f"Conflicting {tf} zone at {higher_line.price:.2f}"

        return True, "OK"


# Timeframe colors for visualization
TIMEFRAME_COLORS = {
    '1M': '#800080',  # Purple - Monthly
    '1w': '#9932CC',  # Purple - Weekly
    '1d': '#40E0D0',  # Turquoise - Daily
    '4h': '#FFFFFF',  # White - 4H
    '1h': '#0000FF',  # Blue - 1H
    '15m': '#FFA500',  # Orange - 15m
    '5m': '#00FF00',  # Green - 5m
}
