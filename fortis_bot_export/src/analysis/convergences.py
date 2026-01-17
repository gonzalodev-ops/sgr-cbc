"""
Convergence Detection - Multiple zones/signals aligning.

A convergence occurs when:
- Multiple timeframe lines meet at same level
- Pattern + trigger align
- Stage 1 + Stage 2 signals coincide
- Divergence confirms structure

More convergences = stronger signal
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional

from src.core.models import TrendLine, Direction, LineType, Signal
from src.stages.stage2 import ChartPattern, PatternType


class ConvergenceType(Enum):
    """Types of convergence."""
    MULTIFRAME_ZONE = "multiframe_zone"        # Multiple TF lines at same level
    PATTERN_TRIGGER = "pattern_trigger"         # Pattern breakout + trigger
    STAGE_ALIGNMENT = "stage_alignment"         # Stage 1 + Stage 2 agree
    DIVERGENCE_CONFIRM = "divergence_confirm"   # Divergence confirms direction
    VOLUME_CONFIRM = "volume_confirm"           # Volume confirms move


@dataclass
class ConvergenceItem:
    """Individual convergence factor."""
    conv_type: ConvergenceType
    description: str
    weight: float  # 0-1, contribution to total strength
    source: str    # What generated this (e.g., "4h_support", "RSI_div_A")


@dataclass
class ConvergenceZone:
    """Zone where multiple factors converge."""
    price: float
    direction: Direction
    items: List[ConvergenceItem] = field(default_factory=list)
    total_strength: float = 0.0
    timestamp: Optional[datetime] = None

    def add_item(self, item: ConvergenceItem) -> None:
        """Add convergence item and recalculate strength."""
        self.items.append(item)
        self.total_strength = min(sum(i.weight for i in self.items), 1.0)

    @property
    def convergence_count(self) -> int:
        return len(self.items)

    @property
    def is_tradeable(self) -> bool:
        """Minimum 2 convergences for trade consideration."""
        return self.convergence_count >= 2


class ConvergenceAnalyzer:
    """Analyzes and scores convergences."""

    # Weights for different convergence types
    WEIGHTS = {
        ConvergenceType.MULTIFRAME_ZONE: 0.25,
        ConvergenceType.PATTERN_TRIGGER: 0.30,
        ConvergenceType.STAGE_ALIGNMENT: 0.25,
        ConvergenceType.DIVERGENCE_CONFIRM: 0.15,
        ConvergenceType.VOLUME_CONFIRM: 0.10,
    }

    def __init__(self, price_tolerance: float = 0.01):
        self.price_tolerance = price_tolerance

    def analyze_zone(
        self,
        price: float,
        direction: Direction,
        lines: List[TrendLine],
        patterns: Optional[List[ChartPattern]] = None,
        has_trigger: bool = False,
        has_divergence: bool = False,
        divergence_class: Optional[str] = None,
        volume_confirms: bool = False,
    ) -> ConvergenceZone:
        """Analyze all convergences at a price level."""
        zone = ConvergenceZone(price=price, direction=direction, timestamp=datetime.now())

        # Check multiframe zone convergence
        tf_lines = self._check_multiframe_convergence(price, lines)
        if len(tf_lines) >= 2:
            weight = self.WEIGHTS[ConvergenceType.MULTIFRAME_ZONE] * (len(tf_lines) / 5)
            zone.add_item(ConvergenceItem(
                conv_type=ConvergenceType.MULTIFRAME_ZONE,
                description=f"Lines from {len(tf_lines)} timeframes converge",
                weight=min(weight, 0.35),
                source=",".join(tf_lines)
            ))

        # Check pattern convergence
        if patterns:
            matching = self._check_pattern_convergence(price, direction, patterns)
            if matching:
                zone.add_item(ConvergenceItem(
                    conv_type=ConvergenceType.PATTERN_TRIGGER,
                    description=f"Pattern {matching.pattern_type.value} at zone",
                    weight=self.WEIGHTS[ConvergenceType.PATTERN_TRIGGER],
                    source=matching.pattern_type.value
                ))

        # Check if trigger exists at this level
        if has_trigger:
            zone.add_item(ConvergenceItem(
                conv_type=ConvergenceType.STAGE_ALIGNMENT,
                description="Trigger confirmed at zone",
                weight=self.WEIGHTS[ConvergenceType.STAGE_ALIGNMENT],
                source="trigger"
            ))

        # Check divergence confirmation
        if has_divergence:
            div_weight = self.WEIGHTS[ConvergenceType.DIVERGENCE_CONFIRM]
            if divergence_class == 'A':
                div_weight *= 1.5
            elif divergence_class == 'C':
                div_weight *= 0.7
            zone.add_item(ConvergenceItem(
                conv_type=ConvergenceType.DIVERGENCE_CONFIRM,
                description=f"RSI divergence class {divergence_class or 'B'}",
                weight=min(div_weight, 0.25),
                source=f"div_{divergence_class or 'B'}"
            ))

        # Check volume confirmation
        if volume_confirms:
            zone.add_item(ConvergenceItem(
                conv_type=ConvergenceType.VOLUME_CONFIRM,
                description="Volume confirms move",
                weight=self.WEIGHTS[ConvergenceType.VOLUME_CONFIRM],
                source="volume"
            ))

        return zone

    def _check_multiframe_convergence(self, price: float, lines: List[TrendLine]) -> List[str]:
        """Find lines from different timeframes near the price."""
        matching_tfs = []
        seen_tfs = set()

        for line in lines:
            if not line.active:
                continue

            distance = abs(line.price - price) / price
            if distance <= self.price_tolerance and line.timeframe not in seen_tfs:
                matching_tfs.append(line.timeframe)
                seen_tfs.add(line.timeframe)

        return matching_tfs

    def _check_pattern_convergence(
        self,
        price: float,
        direction: Direction,
        patterns: List[ChartPattern]
    ) -> Optional[ChartPattern]:
        """Find pattern that aligns with price and direction."""
        for pattern in patterns:
            if pattern.direction != direction:
                continue

            # Check if pattern target or entry is near price
            if pattern.entry_price:
                distance = abs(pattern.entry_price - price) / price
                if distance <= self.price_tolerance:
                    return pattern

        return None

    def score_signal(self, signal: Signal, zone: ConvergenceZone) -> float:
        """Score a signal based on its convergences."""
        base_score = 0.5  # Minimum for a valid signal

        # Add convergence bonus
        convergence_bonus = zone.total_strength * 0.4

        # Add factor for number of convergences
        count_bonus = min(zone.convergence_count * 0.05, 0.15)

        # Reduce score if key factors missing
        penalties = 0
        conv_types = {item.conv_type for item in zone.items}

        if ConvergenceType.STAGE_ALIGNMENT not in conv_types:
            penalties += 0.1
        if ConvergenceType.MULTIFRAME_ZONE not in conv_types:
            penalties += 0.05

        final_score = base_score + convergence_bonus + count_bonus - penalties
        return max(min(final_score, 1.0), 0.0)

    def get_convergence_summary(self, zone: ConvergenceZone) -> str:
        """Generate human-readable convergence summary."""
        if zone.convergence_count == 0:
            return "No convergences detected"

        lines = [f"Convergence Zone at {zone.price:.2f} ({zone.direction.value})"]
        lines.append(f"Total Strength: {zone.total_strength:.1%}")
        lines.append(f"Factors ({zone.convergence_count}):")

        for item in zone.items:
            lines.append(f"  - {item.description} [{item.source}]")

        if zone.is_tradeable:
            lines.append("✓ Tradeable (2+ convergences)")
        else:
            lines.append("✗ Insufficient convergences")

        return "\n".join(lines)


def find_best_convergence_zones(
    lines: List[TrendLine],
    patterns: List[ChartPattern],
    current_price: float,
    direction: Direction,
) -> List[ConvergenceZone]:
    """Find and rank the best convergence zones."""
    analyzer = ConvergenceAnalyzer()
    zones = []

    # Collect all potential price levels
    price_levels = set()

    for line in lines:
        if line.active:
            price_levels.add(line.price)

    for pattern in patterns:
        if pattern.entry_price:
            price_levels.add(pattern.entry_price)

    # Analyze each level
    for price in price_levels:
        zone = analyzer.analyze_zone(
            price=price,
            direction=direction,
            lines=lines,
            patterns=patterns,
        )

        if zone.convergence_count >= 1:
            zones.append(zone)

    # Sort by strength
    return sorted(zones, key=lambda z: z.total_strength, reverse=True)
