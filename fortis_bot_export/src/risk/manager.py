"""
Risk Manager - Implements the 3-role system and position sizing.

3 Roles:
- Analyst: Identifies zones, patterns, triggers
- Manager: Calculates risk, position size, blocks
- Operator: Executes and monitors trades

Capital System:
- Cushion (50%): Untouchable safety net
- Operative Capital (50%): For trading

Blocks:
- 10 operations per block
- 0.5%-1% risk per trade initially
- Max 10% total risk per block
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict


class Role(Enum):
    """The 3 roles in trading."""
    ANALYST = "analyst"
    MANAGER = "manager"
    OPERATOR = "operator"


@dataclass
class TradeRecord:
    """Record of a single trade."""
    id: str
    symbol: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    position_size: float
    risk_amount: float
    risk_percent: float
    entry_time: datetime
    exit_time: Optional[datetime] = None
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    exit_reason: Optional[str] = None


@dataclass
class Block:
    """Block of 10 operations."""
    block_number: int
    start_capital: float
    trades: List[TradeRecord] = field(default_factory=list)
    target_return: float = 0.10  # 10% target
    max_risk: float = 0.10      # 10% max risk for block

    @property
    def trade_count(self) -> int:
        return len(self.trades)

    @property
    def is_complete(self) -> bool:
        return self.trade_count >= 10

    @property
    def total_pnl(self) -> float:
        return sum(t.pnl or 0 for t in self.trades)

    @property
    def total_pnl_percent(self) -> float:
        return self.total_pnl / self.start_capital if self.start_capital > 0 else 0

    @property
    def win_rate(self) -> float:
        closed = [t for t in self.trades if t.pnl is not None]
        if not closed:
            return 0
        wins = sum(1 for t in closed if t.pnl > 0)
        return wins / len(closed)

    @property
    def remaining_risk(self) -> float:
        used_risk = sum(t.risk_percent for t in self.trades if t.exit_time is None)
        return max(0, self.max_risk - used_risk)


@dataclass
class CapitalState:
    """Current capital state."""
    total_capital: float
    cushion: float           # 50% - untouchable
    operative: float         # 50% - for trading
    current_drawdown: float = 0.0
    max_drawdown_allowed: float = 0.20  # 20% max drawdown


class RiskManager:
    """Manages risk according to Fortis system."""

    def __init__(
        self,
        initial_capital: float,
        risk_per_trade: float = 0.01,  # 1% default
        cushion_ratio: float = 0.50,
        max_block_risk: float = 0.10,
    ):
        self.initial_capital = initial_capital
        self.risk_per_trade = risk_per_trade
        self.cushion_ratio = cushion_ratio
        self.max_block_risk = max_block_risk

        # Initialize capital state
        cushion = initial_capital * cushion_ratio
        operative = initial_capital - cushion

        self.capital = CapitalState(
            total_capital=initial_capital,
            cushion=cushion,
            operative=operative
        )

        # Blocks tracking
        self.blocks: List[Block] = []
        self.current_block: Optional[Block] = None
        self._start_new_block()

    def _start_new_block(self) -> Block:
        """Start a new block of 10 trades."""
        block_num = len(self.blocks) + 1
        self.current_block = Block(
            block_number=block_num,
            start_capital=self.capital.operative
        )
        return self.current_block

    def calculate_position_size(
        self,
        entry_price: float,
        stop_loss: float,
        symbol: str,
    ) -> Dict:
        """
        Calculate position size based on risk.

        Returns dict with:
        - position_size: Units to buy/sell
        - risk_amount: Dollar amount at risk
        - risk_percent: Percentage of operative capital
        """
        if self.current_block and self.current_block.is_complete:
            self._start_new_block()

        # Calculate distance to stop
        stop_distance = abs(entry_price - stop_loss)
        if stop_distance == 0:
            return {"error": "Stop loss equals entry price"}

        stop_percent = stop_distance / entry_price

        # Check remaining block risk
        remaining = self.current_block.remaining_risk if self.current_block else self.max_block_risk
        actual_risk = min(self.risk_per_trade, remaining)

        if actual_risk <= 0:
            return {"error": "Block risk limit reached"}

        # Calculate risk amount
        risk_amount = self.capital.operative * actual_risk

        # Calculate position size
        position_size = risk_amount / stop_distance

        # Calculate notional value
        notional = position_size * entry_price

        return {
            "position_size": position_size,
            "risk_amount": risk_amount,
            "risk_percent": actual_risk,
            "stop_distance": stop_distance,
            "stop_percent": stop_percent,
            "notional_value": notional,
            "remaining_block_risk": remaining - actual_risk,
        }

    def validate_trade(
        self,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        direction: str,
    ) -> Dict:
        """
        Validate trade meets The Trinity requirements.

        The Trinity:
        1. Valid zone (handled elsewhere)
        2. Valid trigger with 50% rule (handled elsewhere)
        3. Risk:Reward >= 1:1
        """
        # Calculate risk and reward
        if direction.lower() in ['long', 'bullish', 'buy']:
            risk = entry_price - stop_loss
            reward = take_profit - entry_price
        else:
            risk = stop_loss - entry_price
            reward = entry_price - take_profit

        if risk <= 0:
            return {"valid": False, "reason": "Invalid stop loss placement"}

        ratio = reward / risk

        return {
            "valid": ratio >= 1.0,
            "risk": risk,
            "reward": reward,
            "ratio": ratio,
            "reason": "OK" if ratio >= 1.0 else f"R:R {ratio:.2f} < 1:1"
        }

    def register_trade(
        self,
        trade_id: str,
        symbol: str,
        direction: str,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        position_size: float,
    ) -> TradeRecord:
        """Register a new trade in the current block."""
        if self.current_block and self.current_block.is_complete:
            self._start_new_block()

        sizing = self.calculate_position_size(entry_price, stop_loss, symbol)

        trade = TradeRecord(
            id=trade_id,
            symbol=symbol,
            direction=direction,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size=position_size,
            risk_amount=sizing.get("risk_amount", 0),
            risk_percent=sizing.get("risk_percent", 0),
            entry_time=datetime.now()
        )

        if self.current_block:
            self.current_block.trades.append(trade)

        return trade

    def close_trade(
        self,
        trade_id: str,
        exit_price: float,
        exit_reason: str,
    ) -> Optional[TradeRecord]:
        """Close a trade and calculate PnL."""
        trade = self._find_trade(trade_id)
        if not trade:
            return None

        trade.exit_time = datetime.now()
        trade.exit_price = exit_price
        trade.exit_reason = exit_reason

        # Calculate PnL
        if trade.direction.lower() in ['long', 'bullish', 'buy']:
            trade.pnl = (exit_price - trade.entry_price) * trade.position_size
        else:
            trade.pnl = (trade.entry_price - exit_price) * trade.position_size

        trade.pnl_percent = trade.pnl / self.capital.operative if self.capital.operative > 0 else 0

        # Update capital
        self.capital.operative += trade.pnl
        self.capital.total_capital = self.capital.cushion + self.capital.operative

        # Update drawdown
        if trade.pnl < 0:
            self.capital.current_drawdown += abs(trade.pnl_percent)

        return trade

    def _find_trade(self, trade_id: str) -> Optional[TradeRecord]:
        """Find trade by ID."""
        for block in self.blocks + ([self.current_block] if self.current_block else []):
            if block:
                for trade in block.trades:
                    if trade.id == trade_id:
                        return trade
        return None

    def get_stats(self) -> Dict:
        """Get current risk management statistics."""
        all_trades = []
        for block in self.blocks + ([self.current_block] if self.current_block else []):
            if block:
                all_trades.extend(block.trades)

        closed = [t for t in all_trades if t.pnl is not None]
        wins = [t for t in closed if t.pnl > 0]
        losses = [t for t in closed if t.pnl <= 0]

        total_pnl = sum(t.pnl for t in closed)
        avg_win = sum(t.pnl for t in wins) / len(wins) if wins else 0
        avg_loss = sum(t.pnl for t in losses) / len(losses) if losses else 0

        return {
            "total_trades": len(all_trades),
            "closed_trades": len(closed),
            "open_trades": len(all_trades) - len(closed),
            "win_rate": len(wins) / len(closed) if closed else 0,
            "total_pnl": total_pnl,
            "total_pnl_percent": total_pnl / self.initial_capital,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "profit_factor": abs(sum(t.pnl for t in wins) / sum(t.pnl for t in losses)) if losses and sum(t.pnl for t in losses) != 0 else 0,
            "current_drawdown": self.capital.current_drawdown,
            "current_block": self.current_block.block_number if self.current_block else 0,
            "block_trades": self.current_block.trade_count if self.current_block else 0,
            "capital": {
                "total": self.capital.total_capital,
                "cushion": self.capital.cushion,
                "operative": self.capital.operative,
            }
        }

    def should_stop_trading(self) -> tuple[bool, str]:
        """Check if trading should stop due to risk limits."""
        if self.capital.current_drawdown >= self.capital.max_drawdown_allowed:
            return True, f"Max drawdown reached: {self.capital.current_drawdown:.1%}"

        if self.capital.operative <= 0:
            return True, "Operative capital depleted"

        return False, "OK"


# Pyramidal Strategy Support
class PyramidalManager:
    """
    Manages pyramidal positions.

    Strategy:
    - Open positions as impulses confirm
    - Unified stop loss under most recent checkpoint
    - Exit when price breaks checkpoint
    """

    def __init__(self, risk_manager: RiskManager):
        self.risk_manager = risk_manager
        self.pyramid_positions: List[TradeRecord] = []
        self.unified_stop: Optional[float] = None

    def can_add_position(self) -> bool:
        """Check if we can add to pyramid."""
        # Max 4 positions in pyramid
        return len(self.pyramid_positions) < 4

    def add_position(self, trade: TradeRecord, new_checkpoint: float) -> None:
        """Add position to pyramid and update unified stop."""
        self.pyramid_positions.append(trade)
        self.unified_stop = new_checkpoint

    def update_stop(self, new_checkpoint: float) -> None:
        """Update unified stop loss to new checkpoint."""
        self.unified_stop = new_checkpoint

    def close_pyramid(self, exit_price: float, reason: str) -> List[TradeRecord]:
        """Close all pyramid positions."""
        closed = []
        for trade in self.pyramid_positions:
            result = self.risk_manager.close_trade(trade.id, exit_price, reason)
            if result:
                closed.append(result)
        self.pyramid_positions = []
        self.unified_stop = None
        return closed

    def get_total_exposure(self) -> float:
        """Get total notional exposure of pyramid."""
        return sum(t.position_size * t.entry_price for t in self.pyramid_positions)

    def get_pyramid_pnl(self, current_price: float) -> float:
        """Calculate unrealized PnL for pyramid."""
        total = 0
        for t in self.pyramid_positions:
            if t.direction.lower() in ['long', 'bullish', 'buy']:
                total += (current_price - t.entry_price) * t.position_size
            else:
                total += (t.entry_price - current_price) * t.position_size
        return total
