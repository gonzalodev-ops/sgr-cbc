"""
FORTIS BOT - Main Entry Point

Usage:
    python main.py --mode live --symbol BTCUSDT --timeframe 4h
    python main.py --mode backtest --symbol BTCUSDT --days 365
    python main.py --mode scan --symbols BTCUSDT,ETHUSDT
"""

import argparse
import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import List, Optional

from dotenv import load_dotenv

from src.core.models import Candle, Signal
from src.data.binance_client import BinanceClient, SYMBOLS
from src.data.supabase_client import SupabaseClient
from src.signals.generator import SignalGenerator, create_signal_summary
from src.risk.manager import RiskManager
from src.backtesting.engine import BacktestEngine, generate_report
from src.alerts.telegram import AlertManager, TelegramConfig, format_signal_for_console

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FortisBot:
    """Main FORTIS trading bot."""

    def __init__(
        self,
        symbols: List[str],
        timeframes: List[str],
        initial_capital: float = 10000,
    ):
        self.symbols = symbols
        self.timeframes = timeframes

        # Initialize clients
        self.binance = BinanceClient(
            api_key=os.getenv('BINANCE_API_KEY', ''),
            api_secret=os.getenv('BINANCE_API_SECRET', '')
        )

        supabase_url = os.getenv('SUPABASE_URL', '')
        supabase_key = os.getenv('SUPABASE_KEY', '')
        self.supabase = SupabaseClient(supabase_url, supabase_key) if supabase_url else None

        # Initialize components
        self.risk_manager = RiskManager(initial_capital)
        self.signal_generators = {
            tf: SignalGenerator(self.risk_manager, tf)
            for tf in timeframes
        }

        # Initialize alerts
        telegram_config = TelegramConfig(
            bot_token=os.getenv('TELEGRAM_BOT_TOKEN', ''),
            chat_id=os.getenv('TELEGRAM_CHAT_ID', ''),
            enabled=bool(os.getenv('TELEGRAM_ENABLED', False))
        )
        self.alerts = AlertManager(telegram_config)

        # State
        self.running = False
        self.last_signals: List[Signal] = []

    async def start(self) -> None:
        """Start the bot."""
        logger.info("Starting FORTIS BOT...")
        await self.alerts.initialize()
        self.running = True

        while self.running:
            try:
                await self.scan_all()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(10)

    def stop(self) -> None:
        """Stop the bot."""
        logger.info("Stopping FORTIS BOT...")
        self.running = False

    async def scan_all(self) -> List[Signal]:
        """Scan all symbols and timeframes for signals."""
        all_signals = []

        for symbol in self.symbols:
            for timeframe in self.timeframes:
                try:
                    signals = await self._scan_symbol(symbol, timeframe)
                    all_signals.extend(signals)
                except Exception as e:
                    logger.error(f"Error scanning {symbol} {timeframe}: {e}")

        # Alert new signals
        for signal in all_signals:
            if signal not in self.last_signals:
                logger.info(f"New signal: {signal.symbol} {signal.direction.value}")
                await self.alerts.alert_signal(signal)
                print(format_signal_for_console(signal))

        self.last_signals = all_signals
        return all_signals

    async def _scan_symbol(self, symbol: str, timeframe: str) -> List[Signal]:
        """Scan single symbol/timeframe for signals."""
        # Fetch candles
        candles = self.binance.get_latest(symbol, timeframe, count=200)
        if not candles:
            return []

        # Check cache
        if self.supabase:
            cached = self.supabase.get_candles(symbol, timeframe, limit=200)
            if cached:
                # Merge with fresh data
                pass

        # Analyze
        generator = self.signal_generators.get(timeframe)
        if not generator:
            return []

        analysis = generator.analyze_candles(candles, timeframe)
        signals = analysis.get('signals', [])

        # Set symbol on signals
        for signal in signals:
            signal.symbol = symbol

        # Cache signals
        if self.supabase and signals:
            for signal in signals:
                self.supabase.save_signal({
                    'timestamp': signal.timestamp.isoformat(),
                    'symbol': signal.symbol,
                    'timeframe': signal.timeframe,
                    'direction': signal.direction.value,
                    'zone_price': float(signal.zone_price),
                    'trigger_type': signal.trigger_type.value,
                    'entry_price': float(signal.entry_price),
                    'is_valid': signal.is_valid,
                })

        return signals

    def run_backtest(self, symbol: str, timeframe: str, days: int = 365) -> None:
        """Run backtest on historical data."""
        logger.info(f"Running backtest: {symbol} {timeframe} for {days} days")

        # Fetch historical data
        end = datetime.now()
        start = end - timedelta(days=days)
        candles = self.binance.get_candles(symbol, timeframe, start, end)

        if len(candles) < 100:
            logger.error("Insufficient candle data for backtest")
            return

        # Run backtest
        engine = BacktestEngine(
            initial_capital=self.risk_manager.capital.total_capital,
            risk_per_trade=0.01
        )

        result = engine.run(candles, symbol, timeframe)

        # Print report
        print(generate_report(result))

        # Save results
        if self.supabase:
            # Could save to database
            pass


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='FORTIS Trading Bot')
    parser.add_argument('--mode', choices=['live', 'backtest', 'scan'], default='scan',
                        help='Operation mode')
    parser.add_argument('--symbol', type=str, default='BTCUSDT',
                        help='Trading symbol')
    parser.add_argument('--symbols', type=str, default=None,
                        help='Comma-separated list of symbols')
    parser.add_argument('--timeframe', type=str, default='4h',
                        help='Primary timeframe')
    parser.add_argument('--timeframes', type=str, default='4h,1h',
                        help='Comma-separated list of timeframes')
    parser.add_argument('--capital', type=float, default=10000,
                        help='Initial capital')
    parser.add_argument('--days', type=int, default=365,
                        help='Days for backtest')

    args = parser.parse_args()

    # Parse symbols and timeframes
    symbols = args.symbols.split(',') if args.symbols else [args.symbol]
    timeframes = args.timeframes.split(',')

    # Create bot
    bot = FortisBot(
        symbols=symbols,
        timeframes=timeframes,
        initial_capital=args.capital
    )

    if args.mode == 'live':
        print("=" * 50)
        print("FORTIS BOT - LIVE MODE")
        print("=" * 50)
        print(f"Symbols: {symbols}")
        print(f"Timeframes: {timeframes}")
        print(f"Capital: ${args.capital:,.2f}")
        print("=" * 50)
        asyncio.run(bot.start())

    elif args.mode == 'backtest':
        print("=" * 50)
        print("FORTIS BOT - BACKTEST MODE")
        print("=" * 50)
        bot.run_backtest(args.symbol, args.timeframe, args.days)

    elif args.mode == 'scan':
        print("=" * 50)
        print("FORTIS BOT - SCAN MODE")
        print("=" * 50)
        signals = asyncio.run(bot.scan_all())
        print(f"\nFound {len(signals)} signals")
        for signal in signals:
            print(create_signal_summary(signal))


if __name__ == '__main__':
    main()
