import { useEffect, useState } from "react";
import "./App.css";

import {
  Activity,
  BarChart3,
  Briefcase,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LineChart,
  Search,
  Settings,
  Shield,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import {
  LineChart as ReLineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";


// -----------------------------
// PERFORMANCE DATA
// -----------------------------

const initialPortfolioValue = 100000;


// -----------------------------
// APP
// -----------------------------

function App() {

  // -----------------------------
  // BACKEND DATA
  // -----------------------------

  const [account, setAccount] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [optionPreview, setOptionPreview] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executeMessage, setExecuteMessage] = useState("");


  // -----------------------------
  // LOAD DATA FROM FASTAPI
  // -----------------------------

  useEffect(() => {

    // Account
    fetch("http://127.0.0.1:8000/account")
      .then((res) => res.json())
      .then((data) => setAccount(data))
      .catch((error) => {
        console.error("Account API error:", error);
      });


    // AI Opportunity
    fetch("http://127.0.0.1:8000/opportunity/AAPL")
      .then((res) => res.json())
      .then((data) => setOpportunity(data))
      .catch((error) => {
        console.error("Opportunity API error:", error);
      });


    // Positions
    fetch("http://127.0.0.1:8000/positions")
      .then((res) => res.json())
      .then((data) => {
        setPositions(data.positions || []);
      })
      .catch((error) => {
        console.error("Positions API error:", error);
      });



    // Real option preview / TradeGuard risk check
    fetch("http://127.0.0.1:8000/option-preview/AAPL")
      .then((res) => res.json())
      .then((data) => setOptionPreview(data))
      .catch((error) => console.error("Option preview API error:", error));

    // Recent Alpaca orders
    fetch("http://127.0.0.1:8000/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((error) => console.error("Orders API error:", error));
  }, []);


  // -----------------------------
  // FORMATTERS
  // -----------------------------

  const portfolioValue = Number(
    account?.portfolio_value || 0
  );

  const cash = Number(
    account?.cash || 0
  );

  const buyingPower = Number(
    account?.buying_power || 0
  );

  const positionCount = positions.length;
  const performanceData = [
    { day: "Start", value: initialPortfolioValue },
    { day: "Current", value: portfolioValue || initialPortfolioValue },
  ];

  const selectedContract = optionPreview?.selected_contract;
  const latestOrder = orders[0];
  const latestOrderStatus = String(latestOrder?.status || "").toUpperCase();
  const orderIsActive =
    latestOrderStatus.includes("NEW") ||
    latestOrderStatus.includes("ACCEPTED") ||
    latestOrderStatus.includes("PENDING") ||
    latestOrderStatus.includes("PARTIALLY_FILLED");

  const executeTrade = async () => {
    setExecuting(true);
    setExecuteMessage("");
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/execute-option/AAPL",
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Trade execution failed");
      setExecuteMessage(`Order ${data.status}: ${data.contract} @ $${data.limit_price}`);

      const ordersResponse = await fetch("http://127.0.0.1:8000/orders");
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders || []);
    } catch (error: any) {
      setExecuteMessage(error.message || "Trade execution failed");
    } finally {
      setExecuting(false);
    }
  };


  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div className="app">


      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Shield size={25} />
          </div>

          <div>
            <h2>TradeGuard AI</h2>
            <p>Autonomous Trading Agent</p>
          </div>

        </div>


        <nav className="navigation">

          <div className="nav-section-title">
            MAIN
          </div>


          <div className="nav-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>


          <div className="nav-item">
            <Search size={18} />
            <span>Opportunities</span>
          </div>


          <div className="nav-item">
            <Briefcase size={18} />
            <span>Positions</span>
          </div>


          <div className="nav-item">
            <ArrowUpRight size={18} />
            <span>Trades</span>
          </div>


          <div className="nav-section-title second">
            ANALYTICS
          </div>


          <div className="nav-item">
            <Shield size={18} />
            <span>Risk Manager</span>
          </div>


          <div className="nav-item">
            <LineChart size={18} />
            <span>Performance</span>
          </div>


          <div className="nav-item">
            <Activity size={18} />
            <span>Activity</span>
          </div>


          <div className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </div>

        </nav>


        {/* PAPER ACCOUNT */}

        <div className="account-card">

          <div className="account-header">

            <span>Paper Account</span>

            <span className="live-status">
              <span className="live-dot"></span>
              LIVE
            </span>

          </div>


          <div className="account-row">
            <span>Buying Power</span>

            <strong>
              ${buyingPower.toLocaleString()}
            </strong>
          </div>


          <div className="account-row">
            <span>Cash</span>

            <strong>
              ${cash.toLocaleString()}
            </strong>
          </div>


          <div className="account-row">
            <span>Portfolio</span>

            <strong className="green">
              ${portfolioValue.toLocaleString()}
            </strong>
          </div>

        </div>


        <div className="market-status">

          <span className="live-dot"></span>

          Market <strong>OPEN</strong>

        </div>

      </aside>



      {/* MAIN CONTENT */}

      <main className="main">


        {/* HEADER */}

        <header className="top-header">

          <div>

            <h1>Dashboard</h1>

            <p>
              Real-time overview of your autonomous trading agent
            </p>

          </div>


          <div className="header-actions">

            <div className="paper-status">

              <span className="live-dot"></span>

              Paper Trading

              <span className="separator">
                •
              </span>

              <span className="green">
                LIVE
              </span>

            </div>


            <div className="profile">

              <div className="profile-avatar">
                TG
              </div>

              <span>
                TradeGuard AI
              </span>

              <ChevronDown size={15} />

            </div>

          </div>

        </header>



        {/* METRICS */}

        <section className="metrics">


          {/* PORTFOLIO */}

          <div className="metric-card">

            <div className="metric-top">

              <span>
                Portfolio Value
              </span>

              <CircleDollarSign size={19} />

            </div>


            <strong>
              ${portfolioValue.toLocaleString()}
            </strong>


            <div className="metric-positive">

              <ArrowUpRight size={14} />

              Live Alpaca account

            </div>

          </div>



          {/* P&L */}

          <div className="metric-card">

            <div className="metric-top">

              <span>
                Account Equity
              </span>

              <BarChart3 size={19} />

            </div>


            <strong className="green">
              ${Number(account?.equity || portfolioValue).toLocaleString()}
            </strong>


            <div className="metric-positive">
              Paper account equity
            </div>

          </div>



          {/* POSITIONS */}

          <div className="metric-card">

            <div className="metric-top">

              <span>
                Open Positions
              </span>

              <Briefcase size={19} />

            </div>


            <strong>
              {positionCount}
            </strong>


            <div className="metric-muted">

              {positionCount === 1
                ? "1 active position"
                : `${positionCount} active positions`
              }

            </div>

          </div>



          {/* RISK */}

          <div className="metric-card">

            <div className="metric-top">

              <span>
                Risk Status
              </span>

              <Shield size={19} />

            </div>


            <strong className="green">
              SAFE
            </strong>


            <div className="metric-muted">
              All systems normal
            </div>

          </div>

        </section>



        {/* MAIN GRID */}

        <section className="content-grid">


          {/* LEFT COLUMN */}

          <div className="left-column">


            {/* AI OPPORTUNITY */}

            <div className="panel opportunity">


              <div className="panel-heading">


                <div className="heading-title">

                  <div className="purple-icon">
                    <Sparkles size={18} />
                  </div>


                  <div>

                    <h2>
                      AI Trade Opportunity
                    </h2>

                    <p>
                      Latest opportunity identified by the agent
                    </p>

                  </div>

                </div>


                <div className="confidence">

                  High Confidence&nbsp;

                  <strong>
                    {opportunity?.confidence || 0}%
                  </strong>

                </div>

              </div>



              <div className="trade-info">


                <div>

                  <span>
                    SYMBOL
                  </span>

                  <strong>
                    {opportunity?.symbol || "AAPL"}
                  </strong>

                </div>


                <div>

                  <span>
                    STRATEGY
                  </span>

                  <strong className="green">
                    Long Call
                  </strong>

                </div>


                <div>

                  <span>
                    CONTRACT
                  </span>

                  <strong>
                    {selectedContract?.contract || "Scanning..."}
                  </strong>

                </div>


                <div>

                  <span>
                    PREMIUM
                  </span>

                  <strong>
                    {selectedContract ? `$${selectedContract.ask.toFixed(2)}` : "—"}
                  </strong>

                </div>

              </div>



              <div className="analysis-grid">


                <div className="market-thesis">

                  <h3>
                    Market Thesis
                  </h3>


                  <p>

                    TradeGuard selected a liquid AAPL call using live Alpaca
                    option data. The risk engine checks DTE, bid/ask quality,
                    spread, and premium before execution.

                  </p>


                  <div className="tags">

                    <span>
                      Live Options Data
                    </span>

                    <span>
                      Liquidity Check
                    </span>

                    <span>
                      Risk Guard
                    </span>

                  </div>

                </div>



                <div className="key-levels">

                  <h3>
                    Key Levels
                  </h3>


                  <div>

                    <span>
                      Entry
                    </span>

                    <strong>
                      {selectedContract ? `$${selectedContract.ask.toFixed(2)}` : "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Max Risk
                    </span>

                    <strong>
                      {selectedContract ? `$${selectedContract.estimated_cost.toFixed(0)}` : "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Max Profit
                    </span>

                    <strong className="green">
                      Defined by TradeGuard risk limits
                    </strong>

                  </div>


                  <div>

                    <span>
                      Risk / Reward
                    </span>

                    <strong>
                      {selectedContract ? `${selectedContract.spread_percent}% spread` : "—"}
                    </strong>

                  </div>

                </div>

              </div>



              <div className="action-row">


                <div className="risk-passed">

                  <CheckCircle2 size={23} />

                  <div>

                    <strong>
                      Risk Check:{" "}
                      {opportunity?.risk?.status || "CHECKING"}
                    </strong>

                    <span>
                      All risk parameters within limits
                    </span>

                  </div>

                </div>


                <button
                  className="execute-button"
                  onClick={executeTrade}
                  disabled={
                    executing ||
                    orderIsActive ||
                    optionPreview?.status !== "RISK_CHECK_PASSED"
                  }
                >
                  <Sparkles size={17} />
                  {executing
                    ? "Submitting..."
                    : orderIsActive
                      ? "Order Submitted"
                      : "Analyze & Execute"}
                </button>

              </div>

              {(executeMessage || latestOrder) && (
                <div className="activity-row" style={{ marginTop: "12px" }}>
                  <span className="activity-dot green-dot"></span>
                  <span>
                    {executeMessage ||
                      `Latest Alpaca order: ${latestOrderStatus} ${latestOrder?.symbol || ""}`}
                  </span>
                </div>
              )}

            </div>



            {/* ACTIVITY */}

            <div className="panel activity-panel">


              <div className="panel-heading">


                <div>

                  <h2>
                    Agent Activity
                  </h2>

                  <p>
                    Real-time activity feed
                  </p>

                </div>


                <button className="view-button">
                  View All Logs
                </button>

              </div>



              <div className="activity-list">


                <div className="activity-row">

                  <span className="activity-time">
                    09:35:12
                  </span>

                  <span className="activity-dot green-dot"></span>

                  <span>
                    Opportunity identified: AAPL Long Call
                  </span>

                  <span className="activity-badge purple">
                    {opportunity?.confidence || 0}% confidence
                  </span>

                </div>


                <div className="activity-row">

                  <span className="activity-time">
                    09:34:45
                  </span>

                  <span className="activity-dot blue-dot"></span>

                  <span>
                    Market scan completed
                  </span>

                  <span className="activity-badge blue">
                    142 opportunities
                  </span>

                </div>


                <div className="activity-row">

                  <span className="activity-time">
                    09:34:20
                  </span>

                  <span className="activity-dot green-dot"></span>

                  <span>
                    Risk validation passed
                  </span>

                  <span className="activity-badge green-badge">
                    All checks clear
                  </span>

                </div>


                <div className="activity-row">

                  <span className="activity-time">
                    09:33:58
                  </span>

                  <span className="activity-dot blue-dot"></span>

                  <span>
                    Market sentiment analysis completed
                  </span>

                  <span className="activity-badge blue">
                    Bullish
                  </span>

                </div>

              </div>

            </div>

          </div>



          {/* RIGHT COLUMN */}

          <div className="right-column">


            {/* TRADEGUARD */}

            <div className="panel tradeguard">


              <div className="panel-heading">


                <div className="heading-title">

                  <div className="guard-icon">
                    <Shield size={18} />
                  </div>


                  <div>

                    <h2>
                      TradeGuard
                    </h2>

                    <p>
                      AI Position Protection
                    </p>

                  </div>

                </div>


                <span className="scanning">

                  <span className="live-dot"></span>

                  SCANNING

                </span>

              </div>



              <div className="current-position">

                <div>

                  <span>
                    Current Position
                  </span>

                  <strong>
                    {positions.length > 0
                      ? positions[0].symbol
                      : selectedContract?.contract || "No active position"
                    }
                  </strong>

                </div>


                <span className="contract-tag">
                  Long 1 Contract
                </span>

              </div>



              <div className="position-stats">


                <div>

                  <span>
                    P&L
                  </span>

                  <strong className="green">
                    {positions.length > 0
                      ? `${(Number(positions[0].unrealized_plpc || 0) * 100).toFixed(2)}%`
                      : "—"}
                  </strong>

                </div>


                <div>

                  <span>
                    DTE
                  </span>

                  <strong>
                    {selectedContract ? `${selectedContract.dte} days` : "—"}
                  </strong>

                </div>


                <div>

                  <span>
                    Risk
                  </span>

                  <strong className="green">
                    LOW ●
                  </strong>

                </div>

              </div>



              <div className="ai-decision">


                <span>
                  AI DECISION
                </span>


                <strong>

                  <span className="decision-dot"></span>

                  {opportunity?.decision || "ANALYZING"}

                </strong>


                <p>

                  {optionPreview?.status === "RISK_CHECK_PASSED"
                    ? "Risk checks passed. TradeGuard is ready for paper execution."
                    : optionPreview?.reason || "Waiting for risk analysis."}

                </p>

              </div>



              <div className="risk-limits">


                <div>

                  <span>
                    Stop Loss
                  </span>

                  <strong className="red">
                    Risk controlled
                  </strong>

                  <small>
                    Defined by TradeGuard
                  </small>

                </div>


                <div>

                  <span>
                    Profit Target
                  </span>

                  <strong className="green">
                    Premium limit
                  </strong>

                  <small>
                    $500 max
                  </small>

                </div>

              </div>



              <button className="exit-button" disabled={positions.length === 0}>

                <XCircle size={16} />

                EXIT POSITION

              </button>

            </div>



            {/* PERFORMANCE */}

            <div className="panel performance">


              <div className="performance-header">


                <div>

                  <h2>
                    Portfolio Performance
                  </h2>

                  <strong>
                    ${portfolioValue.toLocaleString()}
                  </strong>

                  <span className="green">
                    +0.56%
                  </span>

                </div>


                <select defaultValue="7D">

                  <option>
                    7D
                  </option>

                  <option>
                    30D
                  </option>

                  <option>
                    90D
                  </option>

                </select>

              </div>



              <div className="chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <ReLineChart
                    data={performanceData}
                  >

                    <XAxis
                      dataKey="day"
                      hide
                    />

                    <YAxis
                      domain={[
                        "dataMin - 500",
                        "dataMax + 500"
                      ]}
                      hide
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #263244",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#39e58d"
                      strokeWidth={2}
                      dot={false}
                    />

                  </ReLineChart>

                </ResponsiveContainer>

              </div>

            </div>



            {/* RISK SUMMARY */}

            <div className="risk-summary">


              <div>

                <CheckCircle2 size={17} />

                <span>
                  Risk Engine
                </span>

                <strong>
                  Active
                </strong>

              </div>


              <div>

                <AlertTriangle size={17} />

                <span>
                  Max DTE
                </span>

                <strong>
                  {selectedContract ? `${selectedContract.dte} days` : "—"}
                </strong>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


export default App;