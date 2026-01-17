"""
Structure Engine - Detects price structures: swings, movements, boxes, impulses, checkpoints.
"""

from typing import List, Optional, Tuple
from src.core.models import Candle, Range, Movement, Box, Impulse, Checkpoint, SwingPoint, Direction


class SwingDetector:
    """Detects swing highs and swing lows."""

    def __init__(self, lookback: int = 2):
        self.lookback = lookback

    def detect_swings(self, candles: List[Candle]) -> Tuple[List[SwingPoint], List[SwingPoint]]:
        swing_highs, swing_lows = [], []

        if len(candles) < (2 * self.lookback + 1):
            return swing_highs, swing_lows

        for i in range(self.lookback, len(candles) - self.lookback):
            current = candles[i]

            # Check swing high
            is_high = all(candles[j].high < current.high
                         for j in range(i - self.lookback, i + self.lookback + 1) if j != i)
            if is_high:
                swing_highs.append(SwingPoint(current.high, i, current.timestamp, 'HIGH', True))

            # Check swing low
            is_low = all(candles[j].low > current.low
                        for j in range(i - self.lookback, i + self.lookback + 1) if j != i)
            if is_low:
                swing_lows.append(SwingPoint(current.low, i, current.timestamp, 'LOW', True))

        return swing_highs, swing_lows


class MovementDetector:
    """Detects movements: succession of ranges in same direction. NOISE = inside previous range."""

    def __init__(self):
        self.current_movement: Optional[Movement] = None
        self.completed_movements: List[Movement] = []

    def reset(self):
        self.current_movement = None
        self.completed_movements = []

    def process_candles(self, candles: List[Candle]) -> List[Movement]:
        self.reset()

        for i, candle in enumerate(candles):
            current_range = Range(candle.high, candle.low, i, candle.timestamp)

            if self.current_movement is None:
                direction = Direction.BULLISH if candle.is_bullish else Direction.BEARISH
                self.current_movement = Movement(direction, i, candle.low if direction == Direction.BULLISH else candle.high, ranges=[current_range])
                continue

            prev_range = self.current_movement.ranges[-1] if self.current_movement.ranges else None
            if prev_range and prev_range.contains(current_range):
                continue  # NOISE

            breaks_high = current_range.high > prev_range.high if prev_range else False
            breaks_low = current_range.low < prev_range.low if prev_range else False

            if breaks_high and not breaks_low:
                new_dir = Direction.BULLISH
            elif breaks_low and not breaks_high:
                new_dir = Direction.BEARISH
            elif breaks_high and breaks_low:
                new_dir = Direction.BULLISH if (current_range.high - prev_range.high) > (prev_range.low - current_range.low) else Direction.BEARISH
            else:
                continue

            if new_dir == self.current_movement.direction:
                self.current_movement.ranges.append(current_range)
            else:
                self.current_movement.end_idx = i - 1
                self.completed_movements.append(self.current_movement)
                self.current_movement = Movement(new_dir, i, prev_range.high if new_dir == Direction.BEARISH else prev_range.low, ranges=[current_range])

        return self.completed_movements


class BoxManager:
    """Manages boxes (ranges of movements). Everything INSIDE a box is NOISE."""

    def __init__(self):
        self.boxes: List[Box] = []
        self.current_box: Optional[Box] = None

    def create_box_from_movement(self, movement: Movement) -> Box:
        if self.current_box:
            self.current_box.is_fixed = True
            self.boxes.append(self.current_box)

        self.current_box = Box(movement.high, movement.low, movement.direction, movement.start_idx, movement.end_idx)
        return self.current_box

    def is_price_noise(self, price: float) -> bool:
        return self.current_box.is_price_inside(price) if self.current_box else False


class CheckpointManager:
    """Manages checkpoints. Bullish: last LOW. Bearish: last HIGH."""

    def __init__(self):
        self.checkpoints: List[Checkpoint] = []
        self.current: Optional[Checkpoint] = None

    def update_from_impulse(self, impulse: Impulse) -> Optional[Checkpoint]:
        if impulse.direction == Direction.BULLISH and impulse.swing_lows:
            last = impulse.swing_lows[-1]
            self.current = Checkpoint(last.price, last.idx, last.timestamp, Direction.BULLISH)
        elif impulse.direction == Direction.BEARISH and impulse.swing_highs:
            last = impulse.swing_highs[-1]
            self.current = Checkpoint(last.price, last.idx, last.timestamp, Direction.BEARISH)

        if self.current:
            self.checkpoints.append(self.current)
        return self.current

    def is_broken(self, price: float) -> bool:
        if not self.current:
            return False
        if self.current.direction == Direction.BULLISH:
            return price < self.current.price
        return price > self.current.price


class StructureEngine:
    """Main engine coordinating all structure detection."""

    def __init__(self, swing_lookback: int = 2):
        self.swing_detector = SwingDetector(swing_lookback)
        self.movement_detector = MovementDetector()
        self.box_manager = BoxManager()
        self.checkpoint_manager = CheckpointManager()

    def analyze(self, candles: List[Candle]) -> dict:
        """Analyze candles and return structure summary."""
        swing_highs, swing_lows = self.swing_detector.detect_swings(candles)
        movements = self.movement_detector.process_candles(candles)

        for m in movements:
            self.box_manager.create_box_from_movement(m)

        return {
            'swing_highs': len(swing_highs),
            'swing_lows': len(swing_lows),
            'movements': len(movements),
            'boxes': len(self.box_manager.boxes),
            'current_box': self.box_manager.current_box,
            'checkpoint': self.checkpoint_manager.current,
        }
