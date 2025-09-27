import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Copy,
  DollarSign,
  Download,
  Filter,
  Layers,
  LineChart,
  Link2,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

// --- Utility components (quick shadcn-like primitives without imports) ---
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children }) => (
  <div className={`rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-4 ${className}`}>{children}</div>
);
const CardHeader: React.FC = ({ children }) => <div className="flex items-center justify-between mb-3">{children}</div>;
const CardTitle: React.FC = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>;
const Badge: React.FC<{ color?: string }> = ({ color = "zinc", children }) => (
  <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700 dark:bg-${color}-900/40 dark:text-${color}-200`}>{children}</span>
);
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }> = ({
  className = "",
  variant = "solid",
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const map: Record<string, string> = {
    solid:
      "bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-300 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
    outline:
      "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800",
  };
  return (
    <button className={`${base} ${map[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input className={`w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 ${className}`} {...props} />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...props }) => (
  <select className={`w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm ${className}`} {...props}>
    {children}
  </select>
);
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

// --- Types ---
type Chain = "Ethereum" | "Polygon" | "Arbitrum" | "Base";

type MCPBlock =
  | { kind: "AMM_LP"; protocol: string; pair: string; feeTierBps?: number; range?: { lower: number; upper: number } }
  | { kind: "TWAP"; windowSecs: number; maxSlippageBps: number }
  | { kind: "LIMIT_ORDER"; hook: "RANGE" | "DUTCH" | "OPTIONS"; params: Record<string, any> }
  | { kind: "LENDING"; protocol: string; asset: string; targetLTV: number }
  | { kind: "YIELD_TOKENIZE"; protocol: "Pendle"; asset: string; tenorDays: number };

type Strategy = {
  id: string;
  name: string;
  chain: Chain;
  risk: "Conservative" | "Balanced" | "Aggressive";
  blocks: MCPBlock[];
  owner: string; // strategist address
  followers: number;
  tvlUSD: number;
  aprPct: number;
  drawdownPct: number;
  status: "Live" | "Paused" | "Draft";
};

type OrderSignal = {
  ts: string; // ISO
  action: "OPEN" | "REBALANCE" | "CLOSE";
  details: string;
};

// --- Mock data ---
const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "strat-eth-pendle-lop",
    name: "ETH Range LP + Pendle YT + 1inch LOP",
    chain: "Arbitrum",
    risk: "Balanced",
    blocks: [
      { kind: "AMM_LP", protocol: "UniswapV3", pair: "ETH/USDC", feeTierBps: 500, range: { lower: 2200, upper: 3200 } },
      { kind: "LIMIT_ORDER", hook: "RANGE", params: { grid: [[2300, 5], [2600, 5], [3000, 10]] } },
      { kind: "YIELD_TOKENIZE", protocol: "Pendle", asset: "stETH", tenorDays: 90 },
    ],
    owner: "0xAbc…42f",
    followers: 1287,
    tvlUSD: 983452.23,
    aprPct: 17.6,
    drawdownPct: 7.4,
    status: "Live",
  },
  {
    id: "strat-btc-twap",
    name: "BTC TWAP Accumulator + Hedge",
    chain: "Base",
    risk: "Conservative",
    blocks: [
      { kind: "TWAP", windowSecs: 1800, maxSlippageBps: 35 },
      { kind: "LIMIT_ORDER", hook: "DUTCH", params: { start: 1.02, end: 0.98, duration: 3600 } },
    ],
    owner: "0xDeF…9c7",
    followers: 342,
    tvlUSD: 254321.11,
    aprPct: 9.4,
    drawdownPct: 3.1,
    status: "Paused",
  },
];

const MOCK_SIGNALS: Record<string, OrderSignal[]> = {
  "strat-eth-pendle-lop": [
    { ts: new Date().toISOString(), action: "REBALANCE", details: "Shift LP range to 2350–3150; place RANGE LOP asks at 2600/3000" },
    { ts: new Date(Date.now() - 3_600_000).toISOString(), action: "OPEN", details: "Open LP at 2200–3200; mint YT on Pendle stETH 90D" },
  ],
  "strat-btc-twap": [
    { ts: new Date(Date.now() - 2_700_000).toISOString(), action: "REBALANCE", details: "TWAP chunk 1/6 filled; adjust next tranche slippage to 30bps" },
  ],
};

// --- Small helpers ---
const fmtUSD = (v: number) =>
  v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({ icon, label, value, hint }) => (
  <Card className="p-5">
    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
      {icon}
      <div className="text-sm">{label}</div>
    </div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
    {hint && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>}
  </Card>
);

// --- Main Dashboard ---
export default function TradeFlow() {
  const [q, setQ] = useState("");
  const [onlyLive, setOnlyLive] = useState(true);
  const [risk, setRisk] = useState<string>("All");
  const strategies = useMemo(() => {
    return MOCK_STRATEGIES.filter((s) => (!onlyLive || s.status === "Live") && (risk === "All" || s.risk === risk) && s.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, onlyLive, risk]);

  const totalTVL = strategies.reduce((a, b) => a + b.tvlUSD, 0);
  const avgAPR = strategies.length ? strategies.reduce((a, b) => a + b.aprPct, 0) / strategies.length : 0;

  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Sparkles className="h-4 w-4" /> EthGlobal · Social‑DeFi · AI
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold leading-tight">
              MCP AI Automation <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">Dashboard</span>
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300 max-w-2xl">
              Build, test, and deploy AI‑powered copy‑trading strategies. Followers mirror orders; community pools amplify yield.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Download className="h-4 w-4" /> Export Report</Button>
            <Button><Rocket className="h-4 w-4" /> Deploy New Bot</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<DollarSign className="h-5 w-5" />} label="Total TVL (visible)" value={fmtUSD(totalTVL)} hint="Across filtered strategies" />
        <Stat icon={<BarChart3 className="h-5 w-5" />} label="Avg. APR" value={`${avgAPR.toFixed(1)}%`} hint="Last 30 days (simulated)" />
        <Stat icon={<Users className="h-5 w-5" />} label="Total Followers" value={strategies.reduce((a, b) => a + b.followers, 0).toLocaleString()} />
        <Stat icon={<ShieldCheck className="h-5 w-5" />} label="Risk Controls" value="Auto‑hedge ON" hint="Global setting" />
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-5 mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Live only</span>
              <Toggle checked={onlyLive} onChange={setOnlyLive} />
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Search strategies, pairs, owners…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option>All</option>
              <option>Conservative</option>
              <option>Balanced</option>
              <option>Aggressive</option>
            </Select>
            <div className="flex gap-2">
              <Button variant="ghost"><Filter className="h-4 w-4" /> Advanced</Button>
              <Button variant="ghost"><RefreshCw className="h-4 w-4" /> Sync</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Strategy list */}
      <div className="max-w-7xl mx-auto px-5 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {strategies.map((s) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 flex items-center justify-center text-white dark:text-zinc-900">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold flex items-center gap-2">
                      {s.name}
                      <Badge color={s.status === "Live" ? "emerald" : s.status === "Paused" ? "amber" : "zinc"}>{s.status}</Badge>
                    </div>
                    <div className="text-xs text-zinc-500">{s.chain} · {s.risk} · Owner {s.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline"><Copy className="h-4 w-4" /> Follow</Button>
                  <Button variant="solid"><Play className="h-4 w-4" /> Simulate</Button>
                </div>
              </CardHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-sm"><div className="text-zinc-500">TVL</div><div className="font-semibold">{fmtUSD(s.tvlUSD)}</div></div>
                <div className="text-sm"><div className="text-zinc-500">APR</div><div className={`font-semibold ${s.aprPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{s.aprPct.toFixed(1)}%</div></div>
                <div className="text-sm"><div className="text-zinc-500">Max DD</div><div className="font-semibold">{s.drawdownPct.toFixed(1)}%</div></div>
                <div className="text-sm"><div className="text-zinc-500">Followers</div><div className="font-semibold">{s.followers.toLocaleString()}</div></div>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase text-zinc-500 mb-2">MCP Blocks</div>
                <div className="flex flex-wrap gap-2">
                  {s.blocks.map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2">
                      {b.kind === "AMM_LP" && <Layers className="h-4 w-4" />}
                      {b.kind === "TWAP" && <LineChart className="h-4 w-4" />}
                      {b.kind === "LIMIT_ORDER" && <Link2 className="h-4 w-4" />}
                      {b.kind === "LENDING" && <DollarSign className="h-4 w-4" />}
                      {b.kind === "YIELD_TOKENIZE" && <Zap className="h-4 w-4" />} {b.kind}
                      <ChevronRight className="h-3 w-3 opacity-60" />
                      <code className="text-[11px] opacity-80">
                        {b.kind === "AMM_LP" && `${b.protocol}:${(b as any).pair}`}
                        {b.kind === "TWAP" && `win=${(b as any).windowSecs}s · sl=${(b as any).maxSlippageBps}bps`}
                        {b.kind === "LIMIT_ORDER" && `${(b as any).hook} hook`}
                        {b.kind === "LENDING" && `${(b as any).protocol}:${(b as any).asset}@${(b as any).targetLTV}%`}
                        {b.kind === "YIELD_TOKENIZE" && `${(b as any).protocol}:${(b as any).asset}·${(b as any).tenorDays}D`}
                      </code>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2"><Activity className="h-4 w-4" /> Recent Signals</div>
                  <ul className="space-y-2">
                    {(MOCK_SIGNALS[s.id] || []).map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                        <div>
                          <div className="text-xs text-zinc-500">{new Date(sig.ts).toLocaleString()}</div>
                          <div className="text-sm font-medium">{sig.action}</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-300">{sig.details}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2"><Settings className="h-4 w-4" /> Risk Controls</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-zinc-500">Max Slippage</div>
                      <div className="font-semibold">30 bps</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Stop Loss</div>
                      <div className="font-semibold">-6.0%</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Rebalance</div>
                      <div className="font-semibold">volatility‑adaptive</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Order Hooks</div>
                      <div className="font-semibold">RANGE + DUTCH</div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Builder */}
      <div className="max-w-7xl mx-auto px-5 mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle>Strategy Builder (MCP)</CardTitle>
            </div>
            <Button variant="outline"><Plus className="h-4 w-4" /> Add Block</Button>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-zinc-500">Name</label>
              <Input placeholder="My AI LP + TWAP bot" />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Chain</label>
              <Select defaultValue="Arbitrum">
                <option>Ethereum</option>
                <option>Arbitrum</option>
                <option>Polygon</option>
                <option>Base</option>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-500">Risk</label>
              <Select defaultValue="Balanced">
                <option>Conservative</option>
                <option>Balanced</option>
                <option>Aggressive</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full"><Sparkles className="h-4 w-4" /> AI‑Suggest Params</Button>
            </div>
          </div>

          {/* Block palette */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
            {[{ label: "AMM LP", icon: <Layers className="h-4 w-4" /> }, { label: "TWAP", icon: <LineChart className="h-4 w-4" /> }, { label: "Limit Order", icon: <Link2 className="h-4 w-4" /> }, { label: "Lending", icon: <DollarSign className="h-4 w-4" /> }, { label: "Pendle", icon: <Zap className="h-4 w-4" /> }].map((b) => (
              <div key={b.label} className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm"><span>{b.icon}</span>{b.label}</div>
                <Button variant="ghost"><Plus className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-6">
            <div className="text-xs uppercase text-zinc-500 mb-2">Preview</div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 text-sm">
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify({
                name: "My AI LP + TWAP bot",
                chain: "Arbitrum",
                risk: "Balanced",
                blocks: [
                  { kind: "AMM_LP", protocol: "UniswapV3", pair: "ETH/USDC", feeTierBps: 500, range: { lower: 2300, upper: 3150 } },
                  { kind: "LIMIT_ORDER", hook: "RANGE", params: { grid: [[2400, 10], [2800, 10], [3100, 5]] } },
                  { kind: "TWAP", windowSecs: 900, maxSlippageBps: 25 },
                ],
                riskControls: { maxSlippageBps: 30, stopLossPct: -6.0 },
                copyTrading: { feeFollowPct: 5, performanceFeePct: 10 },
              }, null, 2)}</pre>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button><ArrowRight className="h-4 w-4" /> Deploy Bot</Button>
              <Button variant="outline"><CalendarClock className="h-4 w-4" /> Schedule Backtest</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance & Warnings */}
      <div className="max-w-7xl mx-auto px-5 mt-8 mb-16">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /><CardTitle>Compliance, Disclaimers & Controls</CardTitle></div>
          </CardHeader>
          <ul className="text-sm list-disc pl-6 space-y-1 text-zinc-600 dark:text-zinc-300">
            <li>Past performance is not indicative of future results. Strategies may incur losses.</li>
            <li>Copy trading executes orders on your behalf via smart contracts. Review parameters before enabling.</li>
            <li>Set withdraw/kill‑switch permissions. Enable 2FA for strategy edits. Keep approvals minimal.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
