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
  Users,
  Zap,
  Code,
  GitBranch,
} from "lucide-react";
import WorkflowDiagram from "./WorkflowDiagram";
import SimulationModal from "./SimulationModal";

// --- Minimal in-file UI primitives (shadcn-like) ---
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children }) => (
  <div className={`glass-card p-4 ${className}`}>{children}</div>
);
const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="flex items-center justify-between mb-3">{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <h3 className={`text-lg font-semibold ${className || ''}`}>{children}</h3>;
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }> = ({ className = "", variant = "solid", children, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  const map: Record<string, string> = {
    solid: "btn-primary",
    ghost: "hover:bg-purple-500/10 text-white hover:text-purple-300",
    outline: "btn-secondary",
  };
  return (
    <button className={`${base} ${map[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input className={`w-full rounded-xl border border-purple-500/30 bg-black/50 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 placeholder-gray-400 ${className}`} {...props} />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...props }) => (
  <select className={`w-full rounded-xl border border-purple-500/30 bg-black/50 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 ${className}`} {...props}>
    {children}
  </select>
);
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-700"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
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

type OrderSignal = { ts: string; action: "OPEN" | "REBALANCE" | "CLOSE"; details: string };

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

const fmtUSD = (v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({ icon, label, value, hint }) => (
  <div className="glass-card-premium p-5 neon-glow">
    <div className="flex items-center gap-3 text-gray-300">{icon}<div className="text-sm">{label}</div></div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
  </div>
);

// ===================== TradeFlow (for strategists/pros) =====================
export default function TradeFlow() {
  const [q, setQ] = useState("");
  const [onlyLive, setOnlyLive] = useState(true);
  const [risk, setRisk] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"workflow" | "json">("workflow");
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  
  // Strategy configuration state
  const [strategyConfig, setStrategyConfig] = useState({
    name: "My AI LP + TWAP bot",
    type: "AMM_LP" as "AMM_LP" | "TWAP" | "LENDING" | "PENDLE" | "ONEINCH_LOP",
    riskLevel: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    timeHorizon: "MEDIUM" as "SHORT" | "MEDIUM" | "LONG",
    tokens: ["ETH", "USDC"],
    amount: "1000",
    slippage: "0.5",
    gasPrice: "20",
    conditions: ["Price above 2000", "Volume > 1M", "RSI < 70"]
  });
  const strategies = useMemo(() => MOCK_STRATEGIES.filter((s) => (!onlyLive || s.status === "Live") && (risk === "All" || s.risk === risk) && s.name.toLowerCase().includes(q.toLowerCase())), [q, onlyLive, risk]);
  const totalTVL = strategies.reduce((a, b) => a + b.tvlUSD, 0);
  const avgAPR = strategies.length ? strategies.reduce((a, b) => a + b.aprPct, 0) / strategies.length : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat icon={<DollarSign className="h-5 w-5 text-purple-400" />} label="Total TVL (visible)" value={fmtUSD(totalTVL)} hint="Across filtered strategies" />
        <Stat icon={<BarChart3 className="h-5 w-5 text-pink-400" />} label="Avg. APR" value={`${avgAPR.toFixed(1)}%`} hint="Last 30 days (simulated)" />
        <Stat icon={<Users className="h-5 w-5 text-purple-400" />} label="Total Followers" value={strategies.reduce((a, b) => a + b.followers, 0).toLocaleString()} />
        <Stat icon={<ShieldCheck className="h-5 w-5 text-pink-400" />} label="Risk Controls" value="Auto‑hedge ON" hint="Global setting" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-purple-400" /><CardTitle className="text-white">Filters</CardTitle></div>
          <div className="flex items-center gap-3"><span className="text-sm text-gray-300">Live only</span><Toggle checked={onlyLive} onChange={setOnlyLive} /></div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Search strategies, pairs, owners…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option>All</option><option>Conservative</option><option>Balanced</option><option>Aggressive</option>
          </Select>
          <div className="flex gap-2"><Button variant="ghost"><Filter className="h-4 w-4" /> Advanced</Button><Button variant="ghost"><RefreshCw className="h-4 w-4" /> Sync</Button></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {strategies.map((s) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="glass-card-premium">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white neon-glow"><Brain className="h-5 w-5" /></div>
                  <div>
                    <div className="text-base font-semibold flex items-center gap-2 text-white">{s.name}<span className={`text-xs px-2 py-1 rounded-full ${s.status === "Live" ? "bg-green-500/20 text-green-400 border border-green-500/30" : s.status === "Paused" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>{s.status}</span></div>
                    <div className="text-xs text-gray-400">{s.chain} · {s.risk} · Owner {s.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline"><Play className="h-4 w-4" /> Simulate</Button>
                  <Button variant="solid"><Rocket className="h-4 w-4" /> Deploy</Button>
                </div>
              </CardHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-sm"><div className="text-gray-400">TVL</div><div className="font-semibold text-white">{fmtUSD(s.tvlUSD)}</div></div>
                <div className="text-sm"><div className="text-gray-400">APR</div><div className={`font-semibold ${s.aprPct >= 0 ? "text-green-400" : "text-red-400"}`}>{s.aprPct.toFixed(1)}%</div></div>
                <div className="text-sm"><div className="text-gray-400">Max DD</div><div className="font-semibold text-white">{s.drawdownPct.toFixed(1)}%</div></div>
                <div className="text-sm"><div className="text-gray-400">Followers</div><div className="font-semibold text-white">{s.followers.toLocaleString()}</div></div>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase text-gray-400 mb-2">MCP Blocks</div>
                <div className="flex flex-wrap gap-2">
                  {s.blocks.map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-2 text-xs border border-purple-500/30 bg-black/30 rounded-xl px-3 py-2 text-white">
                      {b.kind === "AMM_LP" && <Layers className="h-4 w-4 text-purple-400" />}
                      {b.kind === "TWAP" && <LineChart className="h-4 w-4 text-pink-400" />}
                      {b.kind === "LIMIT_ORDER" && <Link2 className="h-4 w-4 text-purple-400" />}
                      {b.kind === "LENDING" && <DollarSign className="h-4 w-4 text-pink-400" />}
                      {b.kind === "YIELD_TOKENIZE" && <Zap className="h-4 w-4 text-purple-400" />} {b.kind}
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

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-white"><Activity className="h-4 w-4 text-purple-400" /> Recent Signals</div>
                  <ul className="space-y-2">
                    {(MOCK_SIGNALS[s.id] || []).map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-green-400" /></div>
                        <div>
                          <div className="text-xs text-gray-400">{new Date(sig.ts).toLocaleString()}</div>
                          <div className="text-sm font-medium text-white">{sig.action}</div>
                          <div className="text-sm text-gray-300">{sig.details}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-white"><Settings className="h-4 w-4 text-pink-400" /> Risk Controls</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-gray-400">Max Slippage</div><div className="font-semibold text-white">30 bps</div></div>
                    <div><div className="text-gray-400">Stop Loss</div><div className="font-semibold text-white">-6.0%</div></div>
                    <div><div className="text-gray-400">Rebalance</div><div className="font-semibold text-white">volatility‑adaptive</div></div>
                    <div><div className="text-gray-400">Order Hooks</div><div className="font-semibold text-white">RANGE + DUTCH</div></div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-purple-400" /><CardTitle className="text-white">Strategy Builder (TradeFlow)</CardTitle></div>
          <Button variant="outline"><Plus className="h-4 w-4" /> Add Block</Button>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400">Name</label>
            <Input 
              placeholder="My AI LP + TWAP bot" 
              value={strategyConfig.name}
              onChange={(e) => setStrategyConfig(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Strategy Type</label>
            <Select 
              value={strategyConfig.type}
              onChange={(e) => setStrategyConfig(prev => ({ ...prev, type: e.target.value as any }))}
            >
              <option value="AMM_LP">AMM LP</option>
              <option value="TWAP">TWAP</option>
              <option value="LENDING">Lending</option>
              <option value="PENDLE">Pendle</option>
              <option value="ONEINCH_LOP">1inch LOP</option>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Risk Level</label>
            <Select 
              value={strategyConfig.riskLevel}
              onChange={(e) => setStrategyConfig(prev => ({ ...prev, riskLevel: e.target.value as any }))}
            >
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => {
              // AI suggestion logic could go here
              setStrategyConfig(prev => ({
                ...prev,
                riskLevel: prev.riskLevel === "LOW" ? "MEDIUM" : prev.riskLevel === "MEDIUM" ? "HIGH" : "LOW"
              }));
            }}>
              <Sparkles className="h-4 w-4" /> AI‑Suggest Params
            </Button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          {[{ label: "AMM LP", icon: <Layers className="h-4 w-4" /> }, { label: "TWAP", icon: <LineChart className="h-4 w-4" /> }, { label: "Limit Order", icon: <Link2 className="h-4 w-4" /> }, { label: "Lending", icon: <DollarSign className="h-4 w-4" /> }, { label: "Pendle", icon: <Zap className="h-4 w-4" /> }].map((b) => (
            <div key={b.label} className="rounded-xl border border-dashed border-purple-500/30 bg-black/20 p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-white"><span className="text-purple-400">{b.icon}</span>{b.label}</div><Button variant="ghost"><Plus className="h-4 w-4" /></Button></div>
          ))}
        </div>
        <div className="mt-6">
          <div className="text-xs uppercase text-gray-400 mb-2">Preview</div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-4 p-1 bg-black/30 rounded-lg border border-purple-500/30">
            <button
              onClick={() => setActiveTab("workflow")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "workflow"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Workflow Diagram
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "json"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Code className="w-4 h-4" />
              JSON Config
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "workflow" ? (
            <WorkflowDiagram 
              strategy={strategyConfig}
              className="mb-4"
            />
          ) : (
            <div className="rounded-2xl bg-black/50 border border-purple-500/30 p-4 text-sm mb-4">
              <pre className="whitespace-pre-wrap text-xs text-gray-300">{JSON.stringify({
                name: strategyConfig.name,
                type: strategyConfig.type,
                riskLevel: strategyConfig.riskLevel,
                timeHorizon: strategyConfig.timeHorizon,
                tokens: strategyConfig.tokens,
                amount: strategyConfig.amount,
                slippage: strategyConfig.slippage,
                gasPrice: strategyConfig.gasPrice,
                conditions: strategyConfig.conditions,
                blocks: [
                  { kind: "AMM_LP", protocol: "UniswapV3", pair: "ETH/USDC", feeTierBps: 500, range: { lower: 2300, upper: 3150 } },
                  { kind: "LIMIT_ORDER", hook: "RANGE", params: { grid: [[2400, 10], [2800, 10], [3100, 5]] } },
                  { kind: "TWAP", windowSecs: 900, maxSlippageBps: 25 },
                ],
                riskControls: { maxSlippageBps: 30, stopLossPct: -6.0 },
                copyTrading: { feeFollowPct: 5, performanceFeePct: 10 },
              }, null, 2)}</pre>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsSimulationOpen(true)}>
              <BarChart3 className="h-4 w-4" /> Simulate Strategy
            </Button>
            <Button><ArrowRight className="h-4 w-4" /> Deploy Bot</Button>
            <Button variant="outline"><CalendarClock className="h-4 w-4" /> Schedule Backtest</Button>
          </div>
        </div>
      </Card>
      
      {/* Simulation Modal */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        strategy={strategyConfig}
      />
    </div>
  );
}