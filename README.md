# TradeGuard AI

### Autonomous, Risk-Aware Options Trading Agent

TradeGuard AI is an autonomous options trading agent that combines live Alpaca market data with deterministic risk controls before submitting paper trades.

## What It Does

TradeGuard AI follows a simple trading workflow:

**Find → Analyze → Risk Check → Execute → Monitor**

The agent:

- Retrieves live stock and options market data through Alpaca
- Selects an options contract based on liquidity and pricing
- Checks expiration (DTE)
- Validates bid/ask quality
- Checks option spread
- Enforces a maximum premium limit
- Controls position size
- Rejects trades that fail risk checks
- Submits approved trades to Alpaca Paper Trading
- Displays order status and portfolio information

## 🛡️ TradeGuard Risk Engine

Before execution, TradeGuard checks:

| Risk Check | Rule |
|---|---|
| Minimum DTE | At least 7 days |
| Bid | Must be greater than $0 |
| Ask | Must be above bid |
| Spread | Must remain within limit |
| Premium | Maximum $500 |
| Position Size | Maximum 1 contract |

Only contracts that pass the risk gate can be submitted.

## 🏗️ Architecture

```text
React + TypeScript
        ↓
   FastAPI Backend
        ↓
TradeGuard Risk Engine
        ↓
 Alpaca Market Data
        ↓
 Risk Check
     ↓       ↓
   PASS    REJECT
     ↓
Alpaca Paper Trading
        ↓
    Order Status
