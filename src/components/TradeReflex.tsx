import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Copy,
  DollarSign,
  Layers,
  Play,
  Plus,
  Users,
} from "lucide-react";

// --- Minimal in-file UI primitives (shadcn-like) ---
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children }) => (
  <div className={`glass-card-premium p-4 ${className}`}>{children}</div>
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
  {
    id: "strat-eth-lending",
    name: "ETH Lending + Yield Farming",
    chain: "Ethereum",
    risk: "Conservative",
    blocks: [
      { kind: "LENDING", protocol: "Aave", asset: "ETH", targetLTV: 70 },
      { kind: "AMM_LP", protocol: "UniswapV3", pair: "ETH/USDC", feeTierBps: 300, range: { lower: 2000, upper: 4000 } },
    ],
    owner: "0x123…abc",
    followers: 892,
    tvlUSD: 456789.12,
    aprPct: 12.3,
    drawdownPct: 4.2,
    status: "Live",
  },
];

const fmtUSD = (v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

// ===================== TradeReflex (for followers/newbies) =====================
export default function TradeReflex() {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("All");
  const visible = useMemo(() => MOCK_STRATEGIES.filter((s) => (risk === "All" || s.risk === risk) && s.name.toLowerCase().includes(q.toLowerCase())), [q, risk]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-400" /><CardTitle className="text-white">Discover Workflows (Subscribe to Copy)</CardTitle></div>
          <div className="flex gap-2">
            <Input placeholder="Search workflows…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-40"><option>All</option><option>Conservative</option><option>Balanced</option><option>Aggressive</option></Select>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="glass-card-premium p-4 neon-glow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-400">{s.chain} · {s.risk}</div>
                    <div className="font-semibold mt-1 text-white">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-1">by {s.owner}</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center neon-glow"><Bot className="h-4 w-4" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                  <div><div className="text-gray-400">APR</div><div className="font-semibold text-green-400">{s.aprPct.toFixed(1)}%</div></div>
                  <div><div className="text-gray-400">TVL</div><div className="font-semibold text-white">{fmtUSD(s.tvlUSD)}</div></div>
                  <div><div className="text-gray-400">DD</div><div className="font-semibold text-white">{s.drawdownPct.toFixed(1)}%</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline"><Copy className="h-4 w-4" /> Subscribe</Button>
                  <Button variant="ghost"><Play className="h-4 w-4" /> Backtest</Button>
                </div>
                <div className="mt-3 text-xs text-gray-400">Includes: {s.blocks.map((b) => b.kind).join(" · ")}</div>
                <div className="mt-2 text-xs text-gray-500">{s.followers.toLocaleString()} followers</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Community Pools */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Layers className="h-5 w-5 text-pink-400" /><CardTitle className="text-white">Community Pools</CardTitle></div>
          <Button variant="outline"><Plus className="h-4 w-4" /> Create Pool</Button>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_STRATEGIES.slice(0,2).map((s, i) => (
            <motion.div key={s.id + "pool"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.1 }}>
              <div className="glass-card-premium p-4 neon-glow-pink">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Pool #{i+1} · {s.name}</div>
                    <div className="text-xs text-gray-400">Owner {s.owner} · Shares ERC‑4626</div>
                    <div className="text-xs text-gray-500 mt-1">{s.followers} participants</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">TVL</div>
                    <div className="font-semibold text-white">{fmtUSD(s.tvlUSD/3)}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button><DollarSign className="h-4 w-4" /> Deposit</Button>
                  <Button variant="outline">Withdraw</Button>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  Pool APR: {s.aprPct.toFixed(1)}% · Max DD: {s.drawdownPct.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Featured Strategies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-purple-400" /><CardTitle className="text-white">Featured Strategies</CardTitle></div>
        </CardHeader>
        <div className="space-y-6">
          {MOCK_STRATEGIES.slice(0, 2).map((s, i) => (
            <motion.div key={s.id + "featured"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.1 }}>
              <div className="flex items-center justify-between p-4 glass-card-premium neon-glow">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center neon-glow">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-sm text-gray-400">{s.chain} · {s.risk} · {s.followers.toLocaleString()} followers</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">{s.aprPct.toFixed(1)}% APR</div>
                    <div className="text-xs text-gray-400">{fmtUSD(s.tvlUSD)} TVL</div>
                  </div>
                  <Button><Copy className="h-4 w-4" /> Copy Trade</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-400" /><CardTitle className="text-white">Disclaimers</CardTitle></div>
        </CardHeader>
        <ul className="text-sm list-disc pl-6 space-y-1 text-gray-300">
          <li>Subscribing creates a follower vault that mirrors strategist orders; review params before enabling.</li>
          <li>Community pools distribute profits proportionally to share tokens; redemption may incur slippage and gas.</li>
          <li>Past performance is not indicative of future results. Strategies may incur losses.</li>
          <li>Set withdraw/kill‑switch permissions. Enable 2FA for strategy edits. Keep approvals minimal.</li>
        </ul>
      </Card>
    </div>
  );
}
