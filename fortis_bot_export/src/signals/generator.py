"""
Signal Generator - Validates and generates trading signals.

The Trinity (3 mandatory requirements):
1. Valid zone (Stage 1 or Stage 2)
2. Valid trigger with 50% rule
3. Risk:Reward >= 1:1

Signal is only valid when ALL THREE are present.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
import uuid

from src.core.models import Candle, Direction, Signal, TrendLine, TriggerType
from src.stages.stage1 import TrendLineManager
from src.stages.stage2 import PatternDetector, ChartPattern, PatternStatus
from src.triggers.reversal import ReversalTriggerDetector, TriggerResult
from src.triggers.continuation import ContinuationTriggerDetector, PullbackResult
from src.analysis.divergences import DivergenceDetector, Divergence
from src.analysis.convergences import ConvergenceAnalyzer, ConvergenceZone
from src.risk.manager import RiskManager


class SignalStatus(Enum):
    """Signal status."""
    PENDING = "pending"           # Waiting for trigger
    TRIGGERED = "triggered"       # Trigger fired
    VALIDATED = "validated"       # Passes Trinity
    REJECTED = "rejected"         # Failed validation
    EXPIRED = "expired"           # Zone no longer valid


@dataclass
class SignalCandidate:
    """Candidate signal before full validation."""
    zone_price: float
    zone_type: str  # 'stage1' or 'stage2'
    direction: Direction
    timeframe: str
    source_line: Optional[TrendLine] = None
    source_pattern: Optional[ChartPattern] = None
    trigger: Optional[TriggerResult] = None
    pullback: Optional[PullbackResult] = None
    divergence: Optional[Divergence] = None
    convergence: Optional[ConvergenceZone] = None
    status: SignalStatus = SignalStatus.PENDING


class SignalGenerator:
    """Generates and validates trading signals."""

    def __init__(
        self,
        risk_manager: RiskManager,
        default_timeframe: str = '4h'
    ):
        self.risk_manager = risk_manager
        self.default_tf = default_timeframe

        # Initialize components
        self.line_manager = TrendLineManager()
        self.pattern_detector = PatternDetector()
        self.reversal_detector = ReversalTriggerDetector()
        self.continuation_detector = ContinuationTriggerDetector()
        self.divergence_detector = DivergenceDetector()
        self.convergence_analyzer = ConvergenceAnalyzer()

        # Track candidates and signals
        self.candidates: List[SignalCandidate] = []
        self.validated_signals: List[Signal] = []

    def analyze_candles(self, candles: List[Candle], timeframe: str) -> Dict[str, Any]:
        """
        Full analysis pipeline on candle data.

        Returns analysis summary with:
        - Active zones
        - Patterns detected
        - Triggers found
        - Validated signals
        """
        if len(candles) < 50:
            return {"error": "Insufficient candle data (need 50+)"}

        # Stage 1: Detect trend lines
        lines = self.line_manager.auto_detect(candles, timeframe)
        active_lines = self.line_manager.get_active_lines(timeframe)

        # Stage 2: Detect chart patterns
        patterns = self.pattern_detector.detect_all_patterns(candles)
        active_patterns = [p for p in patterns if p.status != PatternStatus.INVALIDATED]

        # Detect divergences
        divergences = self.divergence_detector.detect_divergences(candles)

        # Check for triggers on latest candles
        recent_candles = candles[-5:]
        reversal_triggers = self._check_reversal_triggers(recent_candles)
        continuation_triggers = self._check_continuation_triggers(recent_candles, active_lines)

        # Generate candidates from zones + triggers
        self._generate_candidates(
            candles[-1],
            active_lines,
            active_patterns,
            reversal_triggers,
            continuation_triggers,
            divergences,
            timeframe
        )

        # Validate candidates against Trinity
        validated = self._validate_candidates(candles[-1])

        return {
            "timeframe": timeframe,
            "candle_count": len(candles),
            "active_lines": len(active_lines),
            "confirmed_lines": len([l for l in active_lines if l.confirmed]),
            "patterns_detected": len(patterns),
            "active_patterns": len(active_patterns),
            "divergences": len(divergences),
            "reversal_triggers": len(reversal_triggers),
            "continuation_triggers": len(continuation_triggers),
            "candidates": len(self.candidates),
            "validated_signals": len(validated),
            "signals": validated
        }

    def _check_reversal_triggers(self, candles: List[Candle]) -> List[TriggerResult]:
        """Check for reversal triggers in recent candles."""
        triggers = []

        # Check each reversal pattern
        engulfing = self.reversal_detector.detect_engulfing(candles)
        if engulfing:
            triggers.append(engulfing)

        tweezers = self.reversal_detector.detect_tweezers(candles)
        if tweezers:
            triggers.append(tweezers)

        star = self.reversal_detector.detect_star(candles)
        if star:
            triggers.append(star)

        fake_out = self.reversal_detector.detect_fake_out(candles)
        if fake_out:
            triggers.append(fake_out)

        return triggers

    def _check_continuation_triggers(
        self,
        candles: List[Candle],
        lines: List[TrendLine]
    ) -> List[PullbackResult]:
        """Check for continuation triggers (pullbacks)."""
        triggers = []

        for line in lines:
            if not line.confirmed:
                continue

            # Determine direction based on line type
            direction = Direction.BULLISH if line.line_type.value == 'support' else Direction.BEARISH

            # Check for pullback
            result = self.continuation_detector.detect_pullback(
                candles,
                breakout_price=line.price,
                impulse_start=line.price * (0.95 if direction == Direction.BULLISH else 1.05),
                direction=direction
            )

            if result and result.detected:
                triggers.append(result)

        return triggers

    def _generate_candidates(
        self,
        current_candle: Candle,
        lines: List[TrendLine],
        patterns: List[ChartPattern],
        reversal_triggers: List[TriggerResult],
        continuation_triggers: List[PullbackResult],
        divergences: List[Divergence],
        timeframe: str
    ) -> None:
        """Generate signal candidates from zones and triggers."""
        current_price = current_candle.close

        # From Stage 1 lines
        for line in lines:
            if not line.active:
                continue

            # Check if price is near line
            distance = abs(line.price - current_price) / current_price
            if distance > 0.02:  # More than 2% away
                continue

            direction = Direction.BULLISH if line.line_type.value == 'support' else Direction.BEARISH

            # Match with trigger
            matching_trigger = None
            for trigger in reversal_triggers:
                if trigger.direction == direction:
                    matching_trigger = trigger
                    break

            if not matching_trigger:
                for trigger in continuation_triggers:
                    if trigger.direction == direction:
                        matching_trigger = trigger
                        break

            # Find matching divergence
            matching_div = None
            for div in divergences:
                if div.direction == direction:
                    matching_div = div
                    break

            candidate = SignalCandidate(
                zone_price=line.price,
                zone_type='stage1',
                direction=direction,
                timeframe=timeframe,
                source_line=line,
                trigger=matching_trigger if isinstance(matching_trigger, TriggerResult) else None,
                pullback=matching_trigger if isinstance(matching_trigger, PullbackResult) else None,
                divergence=matching_div,
                status=SignalStatus.TRIGGERED if matching_trigger else SignalStatus.PENDING
            )

            self.candidates.append(candidate)

        # From Stage 2 patterns
        for pattern in patterns:
            if pattern.status not in [PatternStatus.PULLBACK_WAIT, PatternStatus.ACTIVE]:
                continue

            candidate = SignalCandidate(
                zone_price=pattern.entry_price or pattern.neckline,
                zone_type='stage2',
                direction=pattern.direction,
                timeframe=timeframe,
                source_pattern=pattern,
                status=SignalStatus.PENDING
            )

            self.candidates.append(candidate)

    def _validate_candidates(self, current_candle: Candle) -> List[Signal]:
        """
        Validate candidates against The Trinity.

        The Trinity:
        1. Valid zone ✓ (already have zone from candidate)
        2. Valid trigger with 50% rule
        3. R:R >= 1:1
        """
        validated = []
        current_price = current_candle.close

        for candidate in self.candidates:
            if candidate.status == SignalStatus.REJECTED:
                continue

            # Check 1: Has zone (already satisfied by being a candidate)
            has_zone = candidate.source_line is not None or candidate.source_pattern is not None

            # Check 2: Has trigger with 50% rule
            has_trigger = False
            passes_50_rule = False

            if candidate.trigger:
                has_trigger = True
                passes_50_rule = candidate.trigger.passes_50_rule
            elif candidate.pullback:
                has_trigger = True
                passes_50_rule = candidate.pullback.passes_50_rule

            # Check 3: Calculate potential R:R
            entry = candidate.zone_price
            if candidate.direction == Direction.BULLISH:
                stop_loss = entry * 0.98  # 2% default stop
                take_profit = entry * 1.04  # 4% target (2:1)
            else:
                stop_loss = entry * 1.02
                take_profit = entry * 0.96

            validation = self.risk_manager.validate_trade(
                entry, stop_loss, take_profit, candidate.direction.value
            )

            # Trinity check
            trinity_pass = has_zone and has_trigger and passes_50_rule and validation['valid']

            if trinity_pass:
                candidate.status = SignalStatus.VALIDATED

                signal = Signal(
                    id=str(uuid.uuid4())[:8],
                    timestamp=current_candle.timestamp,
                    symbol="",  # Set by caller
                    timeframe=candidate.timeframe,
                    direction=candidate.direction,
                    zone_price=candidate.zone_price,
                    trigger_type=candidate.trigger.trigger_type if candidate.trigger else (
                        candidate.pullback.trigger_type if candidate.pullback else TriggerType.ENGULFING
                    ),
                    entry_price=entry,
                    stop_loss=stop_loss,
                    take_profit_1=take_profit,
                    risk_reward=validation['ratio'],
                    convergence_score=candidate.convergence.total_strength if candidate.convergence else 0.5,
                    is_valid=True
                )

                validated.append(signal)
                self.validated_signals.append(signal)
            else:
                candidate.status = SignalStatus.REJECTED

        return validated

    def get_pending_candidates(self) -> List[SignalCandidate]:
        """Get candidates waiting for triggers."""
        return [c for c in self.candidates if c.status == SignalStatus.PENDING]

    def get_active_signals(self) -> List[Signal]:
        """Get validated signals that haven't expired."""
        return [s for s in self.validated_signals if s.is_valid]

    def invalidate_signal(self, signal_id: str) -> bool:
        """Mark a signal as invalid/expired."""
        for signal in self.validated_signals:
            if signal.id == signal_id:
                signal.is_valid = False
                return True
        return False

    def clear_old_candidates(self, max_age_candles: int = 10) -> int:
        """Remove old candidates that haven't triggered."""
        initial = len(self.candidates)
        self.candidates = [
            c for c in self.candidates
            if c.status not in [SignalStatus.PENDING, SignalStatus.REJECTED]
        ]
        return initial - len(self.candidates)


def create_signal_summary(signal: Signal) -> str:
    """Create human-readable signal summary."""
    emoji = "🟢" if signal.direction == Direction.BULLISH else "🔴"

    lines = [
        f"{emoji} SIGNAL: {signal.direction.value.upper()}",
        f"Timeframe: {signal.timeframe}",
        f"Zone: {signal.zone_price:.2f}",
        f"Trigger: {signal.trigger_type.value}",
        f"Entry: {signal.entry_price:.2f}",
        f"Stop Loss: {signal.stop_loss:.2f}",
        f"Take Profit: {signal.take_profit_1:.2f}",
        f"R:R: 1:{signal.risk_reward:.1f}",
        f"Convergence: {signal.convergence_score:.0%}",
    ]

    return "\n".join(lines)
