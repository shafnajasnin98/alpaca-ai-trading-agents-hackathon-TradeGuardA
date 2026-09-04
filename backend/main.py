import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from alpaca.trading.client import TradingClient
from alpaca.data.historical.stock import StockHistoricalDataClient
from alpaca.data.historical.option import OptionHistoricalDataClient

from alpaca.data.requests import (
    StockLatestQuoteRequest,
    OptionChainRequest,
)

from alpaca.trading.enums import ContractType

from alpaca.data.requests import (
    StockLatestQuoteRequest,
    OptionChainRequest,
    OptionLatestQuoteRequest,
)
from datetime import datetime, date
from alpaca.trading.requests import LimitOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce, PositionIntent
# -----------------------------
# LOAD ENVIRONMENT
# -----------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)

API_KEY = os.getenv("ALPACA_API_KEY")
SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")

if not API_KEY or not SECRET_KEY:
    raise RuntimeError(
        f"Alpaca credentials not found. Expected .env at: {ENV_FILE}"
    )


# -----------------------------
# APP
# -----------------------------

app = FastAPI(title="TradeGuard AI")


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# ALPACA CLIENTS
# -----------------------------

trading_client = TradingClient(
    api_key=API_KEY,
    secret_key=SECRET_KEY,
    paper=True,
)

stock_client = StockHistoricalDataClient(
    API_KEY,
    SECRET_KEY,
)

option_client = OptionHistoricalDataClient(
    API_KEY,
    SECRET_KEY,
)


# -----------------------------
# HOME
# -----------------------------

@app.get("/")
def root():
    return {
        "app": "TradeGuard AI",
        "status": "online",
        "mode": "paper",
    }


# -----------------------------
# ACCOUNT
# -----------------------------

@app.get("/account")
def account():

    account = trading_client.get_account()

    return {
        "status": str(account.status),
        "cash": account.cash,
        "portfolio_value": account.portfolio_value,
        "buying_power": account.buying_power,
    }


# -----------------------------
# STOCK QUOTE
# -----------------------------

@app.get("/stock/{symbol}")
def stock_quote(symbol: str):

    symbol = symbol.upper()

    request = StockLatestQuoteRequest(
        symbol_or_symbols=symbol
    )

    result = stock_client.get_stock_latest_quote(request)

    quote = result[symbol]

    return {
        "symbol": symbol,
        "bid": float(quote.bid_price),
        "ask": float(quote.ask_price),
    }


# -----------------------------
# OPTIONS CHAIN
# -----------------------------

@app.get("/options/{symbol}")
def options_chain(symbol: str):

    symbol = symbol.upper()

    request = OptionChainRequest(
        underlying_symbol=symbol,
        type=ContractType.CALL,
    )

    result = option_client.get_option_chain(request)

    contracts = []

    for contract_symbol, snapshot in list(result.items())[:20]:

        contracts.append({
            "symbol": contract_symbol,
            "implied_volatility": getattr(
                snapshot,
                "implied_volatility",
                None,
            ),
        })

    return {
        "underlying": symbol,
        "contracts": contracts,
        "count": len(contracts),
    }


# -----------------------------
# TRADEGUARD ANALYSIS
# -----------------------------

@app.get("/opportunity/{symbol}")
def opportunity(symbol: str):

    symbol = symbol.upper()

    return {
        "symbol": symbol,
        "strategy": "Bull Call Spread",
        "direction": "BULLISH",

        "confidence": 84,

        "risk": {
            "status": "PASS",
            "max_loss_defined": True,
            "position_size_ok": True,
            "liquidity_ok": True,
        },

        "decision": "HOLD",

        "stop_loss": -8,
        "profit_target": 15,

        "reasons": [
            "Positive momentum",
            "Defined maximum loss",
            "Liquidity acceptable",
            "Position risk within limit",
        ],
    }


# -----------------------------
# POSITIONS
# -----------------------------

@app.get("/positions")
def positions():

    positions = trading_client.get_all_positions()

    result = []

    for position in positions:

        result.append({
            "symbol": position.symbol,
            "qty": position.qty,
            "market_value": position.market_value,
            "cost_basis": position.cost_basis,
            "unrealized_pl": position.unrealized_pl,
            "unrealized_plpc": position.unrealized_plpc,
            "current_price": position.current_price,
        })

    return {
        "count": len(result),
        "positions": result,
    }# -----------------------------
    @app.get("/orders")
    def orders():orders = trading_client.get_orders()

    result = []

    for order in orders[:10]:
        result.append({
            "id": str(order.id),
            "symbol": order.symbol,
            "qty": order.qty,
            "side": str(order.side),
            "status": str(order.status),
            "type": str(order.type),
            "limit_price": order.limit_price,
            "submitted_at": str(order.submitted_at),
        })

    return {
        "count": len(result),
        "orders": result,
    }
# OPTION CONTRACT PREVIEW
# -----------------------------
@app.get("/option-preview/{symbol}")
def option_preview(symbol: str):

    symbol = symbol.upper()

    # -----------------------------
    # GET STOCK PRICE
    # -----------------------------

    stock_request = StockLatestQuoteRequest(
        symbol_or_symbols=symbol
    )

    stock_result = stock_client.get_stock_latest_quote(
        stock_request
    )

    stock_quote_data = stock_result[symbol]

    stock_bid = float(stock_quote_data.bid_price)
    stock_ask = float(stock_quote_data.ask_price)

    underlying_price = (stock_bid + stock_ask) / 2


    # -----------------------------
    # GET OPTION CHAIN
    # -----------------------------

    request = OptionChainRequest(
        underlying_symbol=symbol,
        type=ContractType.CALL,
    )

    chain = option_client.get_option_chain(request)

    if not chain:
        return {
            "status": "REJECTED",
            "reason": "No option contracts available",
        }


    candidates = []


    for contract_symbol, snapshot in chain.items():

        quote = getattr(snapshot, "latest_quote", None)

        if quote is None:
            continue

        bid = getattr(quote, "bid_price", None)
        ask = getattr(quote, "ask_price", None)

        if bid is None or ask is None:
            continue

        bid = float(bid)
        ask = float(ask)


        # -----------------------------
        # BASIC LIQUIDITY CHECK
        # -----------------------------

        if bid <= 0:
            continue

        if ask <= bid:
            continue

        spread = ask - bid

        if spread > 0.50:
            continue

        spread_percent = spread / ask

        if spread_percent > 0.25:
            continue


        # -----------------------------
        # PARSE OPTION SYMBOL
        # -----------------------------

        try:

            expiration_text = contract_symbol[-15:-9]
            strike_text = contract_symbol[-8:]

            expiration = datetime.strptime(
                expiration_text,
                "%y%m%d"
            ).date()

            strike = int(strike_text) / 1000

        except Exception:
            continue


        # -----------------------------
        # DTE CHECK
        # -----------------------------

        dte = (expiration - date.today()).days

        # Avoid contracts expiring today/very soon
        if dte < 7:
            continue

        # Avoid very long dated contracts
        if dte > 45:
            continue


        # -----------------------------
        # STRIKE DISTANCE
        # -----------------------------

        strike_distance = abs(
            strike - underlying_price
        )

        # -----------------------------
        # PREMIUM CHECK
        # -----------------------------

        estimated_cost = ask * 100

        if estimated_cost > 500:
            continue


        candidates.append({
            "contract": contract_symbol,
            "strike": strike,
            "expiration": str(expiration),
            "dte": dte,
            "bid": round(bid, 2),
            "ask": round(ask, 2),
            "spread": round(spread, 2),
            "spread_percent": round(
                spread_percent * 100,
                2
            ),
            "estimated_cost": round(
                estimated_cost,
                2
            ),
            "implied_volatility": getattr(
                snapshot,
                "implied_volatility",
                None
            ),
            "strike_distance": round(
                strike_distance,
                2
            ),
        })


    # -----------------------------
    # NO SAFE CONTRACT
    # -----------------------------

    if not candidates:

        return {
            "status": "REJECTED",
            "reason": "No liquid option passed TradeGuard risk checks",
            "underlying_price": round(
                underlying_price,
                2
            ),
        }


    # -----------------------------
    # SELECT NEAREST STRIKE
    # -----------------------------

    candidates.sort(
        key=lambda x: x["strike_distance"]
    )

    selected = candidates[0]


    # -----------------------------
    # FINAL RISK RESULT
    # -----------------------------

    return {
        "status": "RISK_CHECK_PASSED",
        "underlying": symbol,
        "underlying_price": round(
            underlying_price,
            2
        ),
        "selected_contract": selected,
        "quantity": 1,
        "max_contracts": 1,
        "max_premium": 500,

        "risk_checks": {
            "minimum_dte": True,
            "bid_positive": True,
            "ask_above_bid": True,
            "spread_acceptable": True,
            "premium_limit": True,
        },
    }
    # -----------------------------
# EXECUTE PAPER OPTION TRADE
# -----------------------------

@app.post("/execute-option/{symbol}")
def execute_option(symbol: str):

    symbol = symbol.upper()

    # HARD RISK LIMITS
    quantity = 1
    max_contracts = 1
    max_premium = 500

    # Get the same risk-approved option
    preview = option_preview(symbol)

    if preview.get("status") != "RISK_CHECK_PASSED":
        return {
            "status": "REJECTED",
            "reason": preview.get(
                "reason",
                "TradeGuard risk check failed"
            ),
        }

    selected = preview["selected_contract"]

    contract = selected["contract"]
    ask = float(selected["ask"])
    estimated_cost = ask * 100 * quantity

    # -----------------------------
    # FINAL RISK CHECK
    # -----------------------------

    if quantity > max_contracts:
        return {
            "status": "REJECTED",
            "reason": "Maximum contract limit exceeded",
        }

    if estimated_cost > max_premium:
        return {
            "status": "REJECTED",
            "reason": "Premium exceeds TradeGuard limit",
            "estimated_cost": estimated_cost,
        }

    # -----------------------------
    # SUBMIT LIMIT ORDER
    # -----------------------------

    order_data = LimitOrderRequest(
        symbol=contract,
        qty=quantity,
        side=OrderSide.BUY,
        type="limit",
        time_in_force=TimeInForce.DAY,
        limit_price=ask,
        position_intent=PositionIntent.BUY_TO_OPEN,
    )

    order = trading_client.submit_order(
        order_data=order_data
    )

    return {
        "status": "SUBMITTED",
        "mode": "PAPER",
        "underlying": symbol,
        "contract": contract,
        "quantity": quantity,
        "limit_price": ask,
        "estimated_cost": estimated_cost,
        "order_id": str(order.id),
        "order_status": str(order.status),
    }
@app.get("/orders")
def get_orders():
    orders = trading_client.get_orders()

    result = []

    for order in orders[:10]:
        result.append({
            "id": str(order.id),
            "symbol": order.symbol,
            "qty": order.qty,
            "side": str(order.side),
            "status": str(order.status),
            "type": str(order.type),
            "limit_price": order.limit_price,
            "submitted_at": str(order.submitted_at),
        })

    return {
        "count": len(result),
        "orders": result,
    }