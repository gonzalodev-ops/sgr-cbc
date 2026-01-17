"""
Tests for risk management.
"""

import pytest
from datetime import datetime

from src.risk.manager import RiskManager, PyramidalManager, TradeRecord


class TestRiskManager:
    """Tests for risk management."""

    def test_initial_capital_split(self):
        """Should split capital into cushion and operative."""
        manager = RiskManager(initial_capital=10000)

        assert manager.capital.total_capital == 10000
        assert manager.capital.cushion == 5000  # 50%
        assert manager.capital.operative == 5000  # 50%

    def test_position_sizing(self):
        """Should calculate correct position size."""
        manager = RiskManager(initial_capital=10000, risk_per_trade=0.01)

        result = manager.calculate_position_size(
            entry_price=100,
            stop_loss=98,  # 2% stop
            symbol="BTCUSDT"
        )

        # Risk 1% of operative (5000) = $50
        # Stop distance = $2
        # Position size = 50 / 2 = 25 units
        assert result['risk_amount'] == 50
        assert result['position_size'] == 25
        assert result['risk_percent'] == 0.01

    def test_trade_validation_passes(self):
        """Should validate trade with good R:R."""
        manager = RiskManager(initial_capital=10000)

        result = manager.validate_trade(
            entry_price=100,
            stop_loss=98,
            take_profit=106,  # 3:1 R:R
            direction='long'
        )

        assert result['valid'] == True
        assert result['ratio'] == 3.0

    def test_trade_validation_fails(self):
        """Should reject trade with bad R:R."""
        manager = RiskManager(initial_capital=10000)

        result = manager.validate_trade(
            entry_price=100,
            stop_loss=95,   # Risk = 5
            take_profit=102,  # Reward = 2 (0.4:1)
            direction='long'
        )

        assert result['valid'] == False
        assert result['ratio'] < 1.0

    def test_block_tracking(self):
        """Should track trades in blocks of 10."""
        manager = RiskManager(initial_capital=10000)

        assert manager.current_block.block_number == 1
        assert manager.current_block.trade_count == 0

        # Register a trade
        trade = manager.register_trade(
            trade_id="test1",
            symbol="BTCUSDT",
            direction="long",
            entry_price=100,
            stop_loss=98,
            take_profit=106,
            position_size=10
        )

        assert manager.current_block.trade_count == 1

    def test_close_trade_updates_capital(self):
        """Should update capital when trade closes."""
        manager = RiskManager(initial_capital=10000)

        # Register and close a winning trade
        trade = manager.register_trade(
            trade_id="test1",
            symbol="BTCUSDT",
            direction="long",
            entry_price=100,
            stop_loss=98,
            take_profit=106,
            position_size=10
        )

        # Close at profit
        closed = manager.close_trade("test1", exit_price=105, exit_reason="take_profit")

        assert closed.pnl > 0
        assert manager.capital.operative > 5000  # Increased from profit

    def test_block_risk_limit(self):
        """Should respect block risk limit."""
        manager = RiskManager(
            initial_capital=10000,
            risk_per_trade=0.05,  # 5% per trade
            max_block_risk=0.10   # 10% max per block
        )

        # First trade uses 5%
        result1 = manager.calculate_position_size(100, 98, "BTC")
        assert result1['risk_percent'] == 0.05

        # After registering first trade
        manager.register_trade("t1", "BTC", "long", 100, 98, 106, result1['position_size'])

        # Second trade should be limited to remaining 5%
        result2 = manager.calculate_position_size(100, 98, "BTC")
        assert result2['risk_percent'] <= 0.05

    def test_stats_calculation(self):
        """Should calculate correct statistics."""
        manager = RiskManager(initial_capital=10000)

        # Register and close some trades
        manager.register_trade("t1", "BTC", "long", 100, 98, 106, 10)
        manager.close_trade("t1", 105, "profit")

        manager.register_trade("t2", "BTC", "short", 100, 102, 94, 10)
        manager.close_trade("t2", 102, "stop_loss")

        stats = manager.get_stats()

        assert stats['total_trades'] == 2
        assert stats['closed_trades'] == 2
        assert 'win_rate' in stats
        assert 'total_pnl' in stats


class TestPyramidalManager:
    """Tests for pyramidal position management."""

    def test_add_position_to_pyramid(self):
        """Should add positions to pyramid."""
        risk_manager = RiskManager(initial_capital=10000)
        pyramid = PyramidalManager(risk_manager)

        trade = TradeRecord(
            id="t1",
            symbol="BTCUSDT",
            direction="long",
            entry_price=100,
            stop_loss=95,
            take_profit=110,
            position_size=10,
            risk_amount=50,
            risk_percent=0.01,
            entry_time=datetime.now()
        )

        pyramid.add_position(trade, new_checkpoint=95)

        assert len(pyramid.pyramid_positions) == 1
        assert pyramid.unified_stop == 95

    def test_update_unified_stop(self):
        """Should update unified stop for all positions."""
        risk_manager = RiskManager(initial_capital=10000)
        pyramid = PyramidalManager(risk_manager)

        trade = TradeRecord(
            id="t1", symbol="BTC", direction="long",
            entry_price=100, stop_loss=95, take_profit=110,
            position_size=10, risk_amount=50, risk_percent=0.01,
            entry_time=datetime.now()
        )

        pyramid.add_position(trade, new_checkpoint=95)
        pyramid.update_stop(98)  # New checkpoint higher

        assert pyramid.unified_stop == 98

    def test_max_pyramid_positions(self):
        """Should limit pyramid to 4 positions."""
        risk_manager = RiskManager(initial_capital=10000)
        pyramid = PyramidalManager(risk_manager)

        for i in range(4):
            trade = TradeRecord(
                id=f"t{i}", symbol="BTC", direction="long",
                entry_price=100+i, stop_loss=95, take_profit=110,
                position_size=10, risk_amount=50, risk_percent=0.01,
                entry_time=datetime.now()
            )
            pyramid.add_position(trade, new_checkpoint=95+i)

        assert len(pyramid.pyramid_positions) == 4
        assert pyramid.can_add_position() == False

    def test_close_pyramid(self):
        """Should close all pyramid positions."""
        risk_manager = RiskManager(initial_capital=10000)
        pyramid = PyramidalManager(risk_manager)

        # Add 2 positions
        for i in range(2):
            trade = risk_manager.register_trade(
                f"t{i}", "BTC", "long", 100+i, 95, 110, 10
            )
            pyramid.add_position(trade, 95)

        closed = pyramid.close_pyramid(exit_price=105, reason="checkpoint_break")

        assert len(closed) == 2
        assert len(pyramid.pyramid_positions) == 0
        assert pyramid.unified_stop is None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
