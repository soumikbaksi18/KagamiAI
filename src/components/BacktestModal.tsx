import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  Clock,
  Activity,
  Shield,
  Layers,
  LineChart,
  Link2,
  Bot,
  Users,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StrategyConfig {
  name: string;
  type: "AMM_LP" | "TWAP" | "LENDING" | "PENDLE" | "ONEINCH_LOP";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timeHorizon: "SHORT" | "MEDIUM" | "LONG";
  tokens: string[];
  amount: string;
  slippage: string;
  gasPrice: string;
  conditions: string[];
}

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyConfig;
}

interface BacktestResult {
  strategyName: string;
  strategyType: string;
  riskLevel: string;
  timePeriod: string;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  profitData: number[];
  benchmarkData: number[];
  labels: string[];
  monthlyReturns: number[];
  riskMetrics: {
    volatility: number;
    beta: number;
    alpha: number;
    informationRatio: number;
  };
  performance: {
    bestMonth: number;
    worstMonth: number;
    avgMonthlyReturn: number;
    consistency: number;
  };
}

// Strategy-specific backtest data generators
const generateBacktestData = (strategy: StrategyConfig): BacktestResult => {
  const initialAmount = parseFloat(strategy.amount) || 1000;
  const days = 90; // 90-day backtest
  const labels = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Strategy-specific parameters with unique characteristics for each strategy
  const strategyProfiles = {
    "ETH Range LP + Pendle YT + 1inch LOP": {
      baseReturn: 0.22,
      volatility: 0.15,
      winRate: 0.76,
      color: "#8b5cf6",
      description: "Multi-strategy approach combining liquidity provision, yield tokenization, and limit orders",
      characteristics: {
        hasYieldTokenization: true,
        hasLiquidityProvision: true,
        hasLimitOrders: true,
        marketExposure: "High",
        complexity: "Advanced"
      }
    },
    "BTC TWAP Accumulator + Hedge": {
      baseReturn: 0.11,
      volatility: 0.06,
      winRate: 0.88,
      color: "#10b981",
      description: "Conservative time-weighted average price strategy with hedging mechanisms",
      characteristics: {
        hasHedging: true,
        hasTWAP: true,
        marketExposure: "Low",
        complexity: "Intermediate"
      }
    },
    "ETH Lending + Yield Farming": {
      baseReturn: 0.15,
      volatility: 0.09,
      winRate: 0.84,
      color: "#0ea5e9",
      description: "DeFi lending strategy with additional yield farming opportunities",
      characteristics: {
        hasLending: true,
        hasYieldFarming: true,
        marketExposure: "Medium",
        complexity: "Intermediate"
      }
    }
  };

  // Use strategy name to get profile, fallback to type-based
  const profile = strategyProfiles[strategy.name as keyof typeof strategyProfiles] || {
    baseReturn: 0.15,
    volatility: 0.10,
    winRate: 0.80,
    color: "#8b5cf6",
    description: "Custom trading strategy"
  };

  // Risk adjustments
  const riskMultipliers = {
    LOW: { return: 0.7, volatility: 0.6 },
    MEDIUM: { return: 1.0, volatility: 1.0 },
    HIGH: { return: 1.4, volatility: 1.5 }
  };

  const risk = riskMultipliers[strategy.riskLevel];
  const adjustedReturn = profile.baseReturn * risk.return;
  const adjustedVolatility = profile.volatility * risk.volatility;

  // Generate realistic backtest data with strategy-specific patterns
  const profitData: number[] = [];
  const benchmarkData: number[] = [];
  const monthlyReturns: number[] = [];
  
  let currentAmount = initialAmount;
  let benchmarkAmount = initialAmount;
  let maxAmount = initialAmount;
  let maxDrawdown = 0;
  let monthlyReturn = 0;
  let monthCount = 0;

  // Strategy-specific market behavior patterns
  const getStrategyPattern = (day: number, strategyName: string) => {
    const basePattern = Math.sin(day / 30) * 0.02; // Monthly market cycles
    
    switch (strategyName) {
      case "ETH Range LP + Pendle YT + 1inch LOP":
        // More volatile with yield tokenization spikes
        const yieldSpike = Math.sin(day / 7) * 0.01; // Weekly yield cycles
        const lpVolatility = Math.sin(day / 14) * 0.008; // Bi-weekly LP rebalancing
        return basePattern + yieldSpike + lpVolatility;
        
      case "BTC TWAP Accumulator + Hedge":
        // Smoother with hedging dampening volatility
        const hedgeDampening = -Math.abs(Math.sin(day / 21)) * 0.005; // Hedging effect
        const twapSmoothing = Math.sin(day / 45) * 0.003; // TWAP smoothing
        return basePattern + hedgeDampening + twapSmoothing;
        
      case "ETH Lending + Yield Farming":
        // Steady with occasional yield farming boosts
        const lendingStability = Math.sin(day / 60) * 0.004; // Lending stability
        const yieldBoost = Math.random() < 0.1 ? 0.008 : 0; // Occasional yield farming boosts
        return basePattern + lendingStability + yieldBoost;
        
      default:
        return basePattern;
    }
  };

  for (let i = 0; i < days; i++) {
    // Strategy-specific market behavior
    const strategyPattern = getStrategyPattern(i, strategy.name);
    const randomFactor = (Math.random() - 0.5) * 2;
    const dailyReturn = (adjustedReturn / 365) + strategyPattern + (randomFactor * adjustedVolatility / Math.sqrt(365));
    
    // Strategy-specific win/loss behavior
    let isWin = Math.random() < profile.winRate;
    
    // Adjust win rate based on strategy characteristics
    if (strategy.name === "ETH Range LP + Pendle YT + 1inch LOP") {
      // More complex strategy, slightly lower win rate but higher returns when winning
      isWin = Math.random() < (profile.winRate - 0.02);
    } else if (strategy.name === "BTC TWAP Accumulator + Hedge") {
      // Hedging improves win rate
      isWin = Math.random() < (profile.winRate + 0.03);
    } else if (strategy.name === "ETH Lending + Yield Farming") {
      // Lending provides stability
      isWin = Math.random() < (profile.winRate + 0.01);
    }
    
    const actualReturn = isWin ? dailyReturn : -Math.abs(dailyReturn) * 0.4;
    
    // Benchmark (simple buy & hold) - same for all strategies
    const benchmarkReturn = (0.08 / 365) + (randomFactor * 0.15 / Math.sqrt(365));
    
    currentAmount *= (1 + actualReturn);
    benchmarkAmount *= (1 + benchmarkReturn);
    
    profitData.push(currentAmount);
    benchmarkData.push(benchmarkAmount);
    
    // Track monthly returns
    monthlyReturn += actualReturn;
    if ((i + 1) % 30 === 0) {
      monthlyReturns.push(monthlyReturn * 100);
      monthlyReturn = 0;
      monthCount++;
    }
    
    // Track max drawdown
    if (currentAmount > maxAmount) {
      maxAmount = currentAmount;
    }
    const currentDrawdown = (maxAmount - currentAmount) / maxAmount;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  }

  const totalReturn = (currentAmount - initialAmount) / initialAmount;
  const benchmarkReturn = (benchmarkAmount - initialAmount) / initialAmount;
  const excessReturn = totalReturn - benchmarkReturn;
  const volatility = adjustedVolatility * Math.sqrt(365/90);
  const sharpeRatio = totalReturn / volatility;
  const alpha = excessReturn;
  
  // Strategy-specific beta calculations
  let beta = 0.8;
  if (strategy.name === "ETH Range LP + Pendle YT + 1inch LOP") {
    beta = 1.2 + (strategy.riskLevel === 'HIGH' ? 0.4 : strategy.riskLevel === 'MEDIUM' ? 0.2 : 0.1);
  } else if (strategy.name === "BTC TWAP Accumulator + Hedge") {
    beta = 0.6 + (strategy.riskLevel === 'HIGH' ? 0.2 : strategy.riskLevel === 'MEDIUM' ? 0.1 : 0.0);
  } else if (strategy.name === "ETH Lending + Yield Farming") {
    beta = 0.7 + (strategy.riskLevel === 'HIGH' ? 0.3 : strategy.riskLevel === 'MEDIUM' ? 0.15 : 0.05);
  } else {
    beta = 0.8 + (strategy.riskLevel === 'HIGH' ? 0.3 : strategy.riskLevel === 'MEDIUM' ? 0.1 : -0.1);
  }
  
  const informationRatio = alpha / (volatility * 0.8);
  
  // Strategy-specific trade frequency
  let totalTrades = Math.floor(days * 2.2);
  if (strategy.name === "ETH Range LP + Pendle YT + 1inch LOP") {
    totalTrades = Math.floor(days * 3.5); // More active due to multiple strategies
  } else if (strategy.name === "BTC TWAP Accumulator + Hedge") {
    totalTrades = Math.floor(days * 1.8); // Less active due to TWAP smoothing
  } else if (strategy.name === "ETH Lending + Yield Farming") {
    totalTrades = Math.floor(days * 2.0); // Moderate activity
  }

  return {
    strategyName: strategy.name,
    strategyType: strategy.type,
    riskLevel: strategy.riskLevel,
    timePeriod: "90 Days",
    totalReturn: totalReturn * 100,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio: sharpeRatio,
    winRate: profile.winRate * 100,
    totalTrades: totalTrades,
    profitData: profitData,
    benchmarkData: benchmarkData,
    labels: labels,
    monthlyReturns: monthlyReturns,
    riskMetrics: {
      volatility: volatility * 100,
      beta: beta,
      alpha: alpha * 100,
      informationRatio: informationRatio
    },
    performance: {
      bestMonth: Math.max(...monthlyReturns),
      worstMonth: Math.min(...monthlyReturns),
      avgMonthlyReturn: monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length,
      consistency: 85 + Math.random() * 10 // 85-95% consistency
    }
  };
};

const BacktestModal: React.FC<BacktestModalProps> = ({ isOpen, onClose, strategy }) => {
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [selectedChart, setSelectedChart] = useState<"performance" | "monthly" | "drawdown">("performance");

  // Chart configurations
  const performanceChartData = useMemo(() => {
    if (!backtestResult) return null;

    return {
      labels: backtestResult.labels,
      datasets: [
        {
          label: 'Strategy Performance',
          data: backtestResult.profitData,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Benchmark (Buy & Hold)',
          data: backtestResult.benchmarkData,
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ],
    };
  }, [backtestResult]);

  const monthlyChartData = useMemo(() => {
    if (!backtestResult) return null;

    return {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      datasets: [
        {
          label: 'Monthly Returns (%)',
          data: backtestResult.monthlyReturns,
          backgroundColor: backtestResult.monthlyReturns.map(val => 
            val >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
          ),
          borderColor: backtestResult.monthlyReturns.map(val => 
            val >= 0 ? '#10b981' : '#ef4444'
          ),
          borderWidth: 2,
        }
      ],
    };
  }, [backtestResult]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const profit = value - (parseFloat(strategy.amount) || 1000);
            const profitPercent = ((profit / (parseFloat(strategy.amount) || 1000)) * 100).toFixed(2);
            return `${context.dataset.label}: $${value.toFixed(2)} (${profitPercent}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: { color: '#9ca3af', maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          }
        },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Return: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: { color: '#9ca3af' },
      },
      y: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toFixed(1) + '%';
          }
        },
      },
    },
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    
    // Simulate backtest processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = generateBacktestData(strategy);
    setBacktestResult(result);
    setIsBacktesting(false);
  };

  const resetBacktest = () => {
    setBacktestResult(null);
  };

  useEffect(() => {
    if (isOpen && !backtestResult) {
      runBacktest();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden glass-card-premium"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Strategy Backtest Analysis</h2>
                  <p className="text-sm text-gray-400">{strategy.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedChart("performance")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedChart === "performance"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setSelectedChart("monthly")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedChart === "monthly"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedChart("drawdown")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedChart === "drawdown"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Risk
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              {isBacktesting ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Running Backtest Analysis...</h3>
                    <p className="text-gray-400">Analyzing historical performance and risk metrics</p>
                  </div>
                </div>
              ) : backtestResult ? (
                <div className="space-y-6">
                  {/* Key Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Total Return</div>
                          <div className={`text-lg font-semibold ${backtestResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {backtestResult.totalReturn >= 0 ? '+' : ''}{backtestResult.totalReturn.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Max Drawdown</div>
                          <div className="text-lg font-semibold text-red-400">
                            -{backtestResult.maxDrawdown.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Target className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Sharpe Ratio</div>
                          <div className="text-lg font-semibold text-blue-400">
                            {backtestResult.sharpeRatio.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Win Rate</div>
                          <div className="text-lg font-semibold text-purple-400">
                            {backtestResult.winRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Section */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedChart === "performance" && "Performance vs Benchmark"}
                        {selectedChart === "monthly" && "Monthly Returns Breakdown"}
                        {selectedChart === "drawdown" && "Risk Analysis"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={runBacktest}
                          className="btn-primary flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Re-run Backtest
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      {selectedChart === "performance" && performanceChartData && (
                        <Line data={performanceChartData} options={chartOptions} />
                      )}
                      {selectedChart === "monthly" && monthlyChartData && (
                        <Bar data={monthlyChartData} options={barChartOptions} />
                      )}
                      {selectedChart === "drawdown" && (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-white mb-2">Risk Metrics</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="glass-card p-3">
                                <div className="text-gray-400">Volatility</div>
                                <div className="text-white font-semibold">{backtestResult.riskMetrics.volatility.toFixed(2)}%</div>
                              </div>
                              <div className="glass-card p-3">
                                <div className="text-gray-400">Beta</div>
                                <div className="text-white font-semibold">{backtestResult.riskMetrics.beta.toFixed(2)}</div>
                              </div>
                              <div className="glass-card p-3">
                                <div className="text-gray-400">Alpha</div>
                                <div className="text-white font-semibold">{backtestResult.riskMetrics.alpha.toFixed(2)}%</div>
                              </div>
                              <div className="glass-card p-3">
                                <div className="text-gray-400">Info Ratio</div>
                                <div className="text-white font-semibold">{backtestResult.riskMetrics.informationRatio.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategy Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-4">
                      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Strategy Analysis
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Strategy Type:</span>
                          <span className="text-white">{backtestResult.strategyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Risk Level:</span>
                          <span className="text-white">{backtestResult.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time Period:</span>
                          <span className="text-white">{backtestResult.timePeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Trades:</span>
                          <span className="text-white">{backtestResult.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Best Month:</span>
                          <span className="text-green-400">+{backtestResult.performance.bestMonth.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Worst Month:</span>
                          <span className="text-red-400">{backtestResult.performance.worstMonth.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Performance Summary
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Initial Investment:</span>
                          <span className="text-white">${strategy.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Final Value:</span>
                          <span className="text-white">
                            ${backtestResult.profitData[backtestResult.profitData.length - 1].toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Profit/Loss:</span>
                          <span className={backtestResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${(backtestResult.profitData[backtestResult.profitData.length - 1] - parseFloat(strategy.amount)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Monthly Return:</span>
                          <span className="text-white">{backtestResult.performance.avgMonthlyReturn.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Consistency:</span>
                          <span className="text-white">{backtestResult.performance.consistency.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Outperformance:</span>
                          <span className="text-green-400">
                            {((backtestResult.profitData[backtestResult.profitData.length - 1] / backtestResult.benchmarkData[backtestResult.benchmarkData.length - 1] - 1) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Recommendations */}
                  <div className="glass-card p-4">
                    <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Strategy-Specific Insights & Recommendations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="font-semibold text-green-400">Strengths</span>
                        </div>
                        <ul className="text-gray-300 space-y-1">
                          {backtestResult.strategyName === "ETH Range LP + Pendle YT + 1inch LOP" && (
                            <>
                              <li>• High yield from multiple strategies</li>
                              <li>• Diversified income streams</li>
                              <li>• Advanced DeFi integration</li>
                            </>
                          )}
                          {backtestResult.strategyName === "BTC TWAP Accumulator + Hedge" && (
                            <>
                              <li>• Excellent risk management</li>
                              <li>• Smooth, consistent returns</li>
                              <li>• Low volatility exposure</li>
                            </>
                          )}
                          {backtestResult.strategyName === "ETH Lending + Yield Farming" && (
                            <>
                              <li>• Stable lending returns</li>
                              <li>• Additional yield opportunities</li>
                              <li>• Lower market correlation</li>
                            </>
                          )}
                        </ul>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="font-semibold text-yellow-400">Considerations</span>
                        </div>
                        <ul className="text-gray-300 space-y-1">
                          {backtestResult.strategyName === "ETH Range LP + Pendle YT + 1inch LOP" && (
                            <>
                              <li>• Higher complexity risk</li>
                              <li>• Monitor impermanent loss</li>
                              <li>• Gas cost optimization</li>
                            </>
                          )}
                          {backtestResult.strategyName === "BTC TWAP Accumulator + Hedge" && (
                            <>
                              <li>• Lower absolute returns</li>
                              <li>• Hedging costs</li>
                              <li>• Market timing sensitivity</li>
                            </>
                          )}
                          {backtestResult.strategyName === "ETH Lending + Yield Farming" && (
                            <>
                              <li>• Smart contract risks</li>
                              <li>• Liquidation thresholds</li>
                              <li>• Yield farming volatility</li>
                            </>
                          )}
                        </ul>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-blue-400">Optimizations</span>
                        </div>
                        <ul className="text-gray-300 space-y-1">
                          {backtestResult.strategyName === "ETH Range LP + Pendle YT + 1inch LOP" && (
                            <>
                              <li>• Optimize LP ranges</li>
                              <li>• Dynamic yield allocation</li>
                              <li>• Gas-efficient execution</li>
                            </>
                          )}
                          {backtestResult.strategyName === "BTC TWAP Accumulator + Hedge" && (
                            <>
                              <li>• Adjust TWAP windows</li>
                              <li>• Optimize hedge ratios</li>
                              <li>• Reduce trading frequency</li>
                            </>
                          )}
                          {backtestResult.strategyName === "ETH Lending + Yield Farming" && (
                            <>
                              <li>• Optimize LTV ratios</li>
                              <li>• Diversify yield sources</li>
                              <li>• Monitor lending rates</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Backtest Data</h3>
                    <p className="text-gray-400 mb-4">Click the button below to run a comprehensive backtest analysis</p>
                    <button
                      onClick={runBacktest}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <Play className="w-4 h-4" />
                      Run Backtest
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BacktestModal;
