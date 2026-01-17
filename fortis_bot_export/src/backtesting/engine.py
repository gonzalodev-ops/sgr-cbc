"""
Backtesting Engine - Simulates trading on historical data.

Features:
- Replay historical candles
- Track simulated trades
- Calculate performance metrics
- Generate reports by block
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Callable
import json

from src.core.models import Candle, Signal, Direction
from src.risk.manager import RiskManager, TradeRecord
from src.signals.generator import SignalGenerator


@dataclass
class BacktestTrade:
    """Record of a backtested trade."""
    signal: Signal
    entry_candle_idx: int
    entry_time: datetime
    entry_price: float
    exit_candle_idx: Optional[int] = None
    exit_time: Optional[datetime] = None
    exit_price: Optional[float] = None
    exit_reason: Optional[str] = None
    pnl: float = 0.0
    pnl_percent: float = 0.0
    bars_held: int = 0


@dataclass
class BacktestResult:
    """Results of a backtest run."""
    symbol: str
    timeframe: str
    start_date: datetime
    end_date: datetime
    initial_capital: float
    final_capital: float
    trades: List[BacktestTrade] = field(default_factory=list)

    @property
    def total_trades(self) -> int:
        return len(self.trades)

    @property
    def closed_trades(self) -> int:
        return len([t for t in self.trades if t.exit_price is not None])

    @property
    def winning_trades(self) -> int:
        return len([t for t in self.trades if t.pnl > 0])

    @property
    def losing_trades(self) -> int:
        return len([t for t in self.trades if t.pnl < 0])

    @property
    def win_rate(self) -> float:
        closed = self.closed_trades
        return self.winning_trades / closed if closed > 0 else 0

    @property
    def total_pnl(self) -> float:
        return sum(t.pnl for t in self.trades)

    @property
    def total_return(self) -> float:
        return (self.final_capital - self.initial_capital) / self.initial_capital

    @property
    def profit_factor(self) -> float:
        gross_profit = sum(t.pnl for t in self.trades if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in self.trades if t.pnl < 0))
        return gross_profit / gross_loss if gross_loss > 0 else 0

    @property
    def max_drawdown(self) -> float:
        if not self.trades:
            return 0
        peak = self.initial_capital
        max_dd = 0
        equity = self.initial_capital
        for trade in self.trades:
            equity += trade.pnl
            if equity > peak:
                peak = equity
            dd = (peak - equity) / peak
            max_dd = max(max_dd, dd)
        return max_dd

    @property
    def avg_trade_pnl(self) -> float:
        return self.total_pnl / self.closed_trades if self.closed_trades > 0 else 0

    @property
    def avg_bars_held(self) -> float:
        closed = [t for t in self.trades if t.exit_price is not None]
        return sum(t.bars_held for t in closed) / len(closed) if closed else 0


class BacktestEngine:
    """Engine for running backtests on historical data."""

    def __init__(
        self,
        initial_capital: float = 10000,
        risk_per_trade: float = 0.01,
        commission: float = 0.001,  # 0.1% per trade
    ):
        self.initial_capital = initial_capital
        self.risk_per_trade = risk_per_trade
        self.commission = commission

        self.risk_manager = RiskManager(initial_capital, risk_per_trade)
        self.signal_generator: Optional[SignalGenerator] = None

        self.open_trades: List[BacktestTrade] = []
        self.closed_trades: List[BacktestTrade] = []
        self.equity_curve: List[float] = []

    def run(
        self,
        candles: List[Candle],
        symbol: str,
        timeframe: str,
        signal_callback: Optional[Callable] = None
    ) -> BacktestResult:
        """
        Run backtest on historical candles.

        Args:
            candles: Historical candle data
            symbol: Trading symbol
            timeframe: Candle timeframe
            signal_callback: Optional callback when signal generated
        """
        if len(candles) < 100:
            raise ValueError("Need at least 100 candles for backtest")

        # Reset state
        self.risk_manager = RiskManager(self.initial_capital, self.risk_per_trade)
        self.signal_generator = SignalGenerator(self.risk_manager, timeframe)
        self.open_trades = []
        self.closed_trades = []
        self.equity_curve = [self.initial_capital]

        current_equity = self.initial_capital

        # Process each candle
        for i in range(50, len(candles)):
            current_candle = candles[i]
            historical = candles[:i + 1]

            # Update open trades
            self._update_open_trades(current_candle, i)

            # Generate signals (every 5 candles to reduce noise)
            if i % 5 == 0:
                analysis = self.signal_generator.analyze_candles(historical, timeframe)
                signals = analysis.get('signals', [])

                for signal in signals:
                    signal.symbol = symbol
                    if signal_callback:
                        signal_callback(signal)

                    # Open trade if we can
                    trade = self._open_trade(signal, current_candle, i)
                    if trade:
                        self.open_trades.append(trade)

            # Update equity curve
            current_equity = self.risk_manager.capital.operative
            unrealized = sum(self._calc_unrealized_pnl(t, current_candle) for t in self.open_trades)
            self.equity_curve.append(current_equity + unrealized)

        # Close any remaining open trades
        for trade in self.open_trades:
            self._close_trade(trade, candles[-1], len(candles) - 1, "end_of_data")
            self.closed_trades.append(trade)
        self.open_trades = []

        return BacktestResult(
            symbol=symbol,
            timeframe=timeframe,
            start_date=candles[50].timestamp,
            end_date=candles[-1].timestamp,
            initial_capital=self.initial_capital,
            final_capital=self.risk_manager.capital.operative,
            trades=self.closed_trades
        )

    def _open_trade(self, signal: Signal, candle: Candle, idx: int) -> Optional[BacktestTrade]:
        """Open a new trade from signal."""
        # Check if we already have max open trades
        if len(self.open_trades) >= 3:
            return None

        # Check if already have trade in same direction
        for trade in self.open_trades:
            if trade.signal.direction == signal.direction:
                return None

        # Calculate position size
        sizing = self.risk_manager.calculate_position_size(
            signal.entry_price,
            signal.stop_loss,
            signal.symbol
        )

        if 'error' in sizing:
            return None

        return BacktestTrade(
            signal=signal,
            entry_candle_idx=idx,
            entry_time=candle.timestamp,
            entry_price=signal.entry_price
        )

    def _update_open_trades(self, candle: Candle, idx: int) -> None:
        """Update open trades - check for SL/TP hits."""
        trades_to_close = []

        for trade in self.open_trades:
            signal = trade.signal

            if signal.direction == Direction.BULLISH:
                # Check stop loss
                if candle.low <= signal.stop_loss:
                    trade.exit_price = signal.stop_loss
                    trade.exit_reason = "stop_loss"
                    trades_to_close.append(trade)
                # Check take profit
                elif candle.high >= signal.take_profit_1:
                    trade.exit_price = signal.take_profit_1
                    trade.exit_reason = "take_profit"
                    trades_to_close.append(trade)
            else:
                # Bearish trade
                if candle.high >= signal.stop_loss:
                    trade.exit_price = signal.stop_loss
                    trade.exit_reason = "stop_loss"
                    trades_to_close.append(trade)
                elif candle.low <= signal.take_profit_1:
                    trade.exit_price = signal.take_profit_1
                    trade.exit_reason = "take_profit"
                    trades_to_close.append(trade)

        for trade in trades_to_close:
            self._close_trade(trade, candle, idx, trade.exit_reason)
            self.open_trades.remove(trade)
            self.closed_trades.append(trade)

    def _close_trade(self, trade: BacktestTrade, candle: Candle, idx: int, reason: str) -> None:
        """Close a trade and calculate PnL."""
        trade.exit_candle_idx = idx
        trade.exit_time = candle.timestamp
        trade.exit_reason = reason

        if trade.exit_price is None:
            trade.exit_price = candle.close

        # Calculate PnL
        if trade.signal.direction == Direction.BULLISH:
            trade.pnl = (trade.exit_price - trade.entry_price) / trade.entry_price
        else:
            trade.pnl = (trade.entry_price - trade.exit_price) / trade.entry_price

        # Apply commission
        trade.pnl -= self.commission * 2  # Entry + Exit

        trade.pnl_percent = trade.pnl
        trade.bars_held = idx - trade.entry_candle_idx

        # Update risk manager
        position_value = self.risk_manager.capital.operative * self.risk_per_trade
        actual_pnl = position_value * trade.pnl
        self.risk_manager.capital.operative += actual_pnl

    def _calc_unrealized_pnl(self, trade: BacktestTrade, candle: Candle) -> float:
        """Calculate unrealized PnL for open trade."""
        if trade.signal.direction == Direction.BULLISH:
            return (candle.close - trade.entry_price) / trade.entry_price
        return (trade.entry_price - candle.close) / trade.entry_price


def generate_report(result: BacktestResult) -> str:
    """Generate human-readable backtest report."""
    lines = [
        "=" * 50,
        "BACKTEST REPORT",
        "=" * 50,
        f"Symbol: {result.symbol}",
        f"Timeframe: {result.timeframe}",
        f"Period: {result.start_date.date()} to {result.end_date.date()}",
        "",
        "PERFORMANCE",
        "-" * 30,
        f"Initial Capital: ${result.initial_capital:,.2f}",
        f"Final Capital: ${result.final_capital:,.2f}",
        f"Total Return: {result.total_return:.2%}",
        f"Total PnL: ${result.total_pnl:,.2f}",
        "",
        "TRADES",
        "-" * 30,
        f"Total Trades: {result.total_trades}",
        f"Winning: {result.winning_trades}",
        f"Losing: {result.losing_trades}",
        f"Win Rate: {result.win_rate:.1%}",
        f"Profit Factor: {result.profit_factor:.2f}",
        "",
        "RISK",
        "-" * 30,
        f"Max Drawdown: {result.max_drawdown:.2%}",
        f"Avg Trade PnL: {result.avg_trade_pnl:.2%}",
        f"Avg Bars Held: {result.avg_bars_held:.1f}",
        "=" * 50,
    ]
    return "\n".join(lines)


def generate_trade_log(result: BacktestResult) -> List[Dict]:
    """Generate detailed trade log as list of dicts."""
    log = []
    for trade in result.trades:
        log.append({
            "entry_time": trade.entry_time.isoformat(),
            "exit_time": trade.exit_time.isoformat() if trade.exit_time else None,
            "direction": trade.signal.direction.value,
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "stop_loss": trade.signal.stop_loss,
            "take_profit": trade.signal.take_profit_1,
            "pnl_percent": trade.pnl_percent,
            "exit_reason": trade.exit_reason,
            "bars_held": trade.bars_held,
            "trigger": trade.signal.trigger_type.value,
        })
    return log
