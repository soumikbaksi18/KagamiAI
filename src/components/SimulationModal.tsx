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
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyConfig;
}

interface SimulationResult {
  timePeriod: string;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  profitData: number[];
  labels: string[];
}

// Simulation logic based on strategy type and risk
const generateSimulationData = (strategy: StrategyConfig): SimulationResult => {
  const initialAmount = parseFloat(strategy.amount) || 1000;
  const days = 30; // 30-day simulation
  const labels = Array.from({ length: days }, (_, i) => `Day ${i + 1}`);
  
  // Base parameters by strategy type
  const strategyParams = {
    AMM_LP: { baseReturn: 0.15, volatility: 0.08, winRate: 0.75 },
    TWAP: { baseReturn: 0.12, volatility: 0.06, winRate: 0.80 },
    LENDING: { baseReturn: 0.08, volatility: 0.03, winRate: 0.90 },
    PENDLE: { baseReturn: 0.20, volatility: 0.12, winRate: 0.70 },
    ONEINCH_LOP: { baseReturn: 0.10, volatility: 0.05, winRate: 0.85 }
  };

  // Risk multipliers
  const riskMultipliers = {
    LOW: { return: 0.7, volatility: 0.5 },
    MEDIUM: { return: 1.0, volatility: 1.0 },
    HIGH: { return: 1.5, volatility: 1.8 }
  };

  const params = strategyParams[strategy.type];
  const risk = riskMultipliers[strategy.riskLevel];
  
  // Calculate adjusted parameters
  const adjustedReturn = params.baseReturn * risk.return;
  const adjustedVolatility = params.volatility * risk.volatility;
  const adjustedWinRate = params.winRate * (strategy.riskLevel === 'HIGH' ? 0.9 : 1.0);

  // Generate profit data using Monte Carlo simulation
  const profitData: number[] = [];
  let currentAmount = initialAmount;
  let maxAmount = initialAmount;
  let maxDrawdown = 0;

  for (let i = 0; i < days; i++) {
    // Daily return calculation
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const dailyReturn = (adjustedReturn / 365) + (randomFactor * adjustedVolatility / Math.sqrt(365));
    
    // Win/loss probability
    const isWin = Math.random() < adjustedWinRate;
    const actualReturn = isWin ? dailyReturn : -Math.abs(dailyReturn) * 0.5;
    
    currentAmount *= (1 + actualReturn);
    profitData.push(currentAmount);
    
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
  const sharpeRatio = totalReturn / (adjustedVolatility * Math.sqrt(365/30));
  const totalTrades = Math.floor(days * 2.5); // Assume 2.5 trades per day on average

  return {
    timePeriod: "30 Days",
    totalReturn: totalReturn * 100,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio: sharpeRatio,
    winRate: adjustedWinRate * 100,
    totalTrades: totalTrades,
    profitData: profitData,
    labels: labels
  };
};

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, strategy }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  // Chart configuration
  const chartData = useMemo(() => {
    if (!simulationResult) return null;

    return {
      labels: simulationResult.labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: simulationResult.profitData,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Initial Investment',
          data: Array(simulationResult.labels.length).fill(parseFloat(strategy.amount) || 1000),
          borderColor: 'rgb(107, 114, 128)',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ],
    };
  }, [simulationResult, strategy.amount]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12
          }
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
        grid: {
          color: 'rgba(107, 114, 128, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = generateSimulationData(strategy);
    setSimulationResult(result);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSimulationResult(null);
  };

  useEffect(() => {
    if (isOpen && !simulationResult) {
      runSimulation();
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
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden glass-card-premium"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Strategy Simulation</h2>
                  <p className="text-sm text-gray-400">{strategy.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTimeframe("7d")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeframe === "7d"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setSelectedTimeframe("30d")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeframe === "30d"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    30D
                  </button>
                  <button
                    onClick={() => setSelectedTimeframe("90d")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeframe === "90d"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    90D
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isSimulating ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Running Simulation...</h3>
                    <p className="text-gray-400">Analyzing market conditions and strategy performance</p>
                  </div>
                </div>
              ) : simulationResult ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Total Return</div>
                          <div className={`text-lg font-semibold ${simulationResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {simulationResult.totalReturn >= 0 ? '+' : ''}{simulationResult.totalReturn.toFixed(2)}%
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
                            -{simulationResult.maxDrawdown.toFixed(2)}%
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
                            {simulationResult.sharpeRatio.toFixed(2)}
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
                            {simulationResult.winRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Profit Projection</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={runSimulation}
                          className="btn-primary flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Re-run
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      {chartData && <Line data={chartData} options={chartOptions} />}
                    </div>
                  </div>

                  {/* Strategy Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-4">
                      <h4 className="text-md font-semibold text-white mb-3">Strategy Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white">{strategy.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Risk Level:</span>
                          <span className="text-white">{strategy.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Initial Amount:</span>
                          <span className="text-white">${strategy.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tokens:</span>
                          <span className="text-white">{strategy.tokens.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card p-4">
                      <h4 className="text-md font-semibold text-white mb-3">Simulation Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time Period:</span>
                          <span className="text-white">{simulationResult.timePeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Trades:</span>
                          <span className="text-white">{simulationResult.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Final Value:</span>
                          <span className="text-white">
                            ${simulationResult.profitData[simulationResult.profitData.length - 1].toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Profit/Loss:</span>
                          <span className={simulationResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${(simulationResult.profitData[simulationResult.profitData.length - 1] - parseFloat(strategy.amount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Simulation Data</h3>
                    <p className="text-gray-400 mb-4">Click the button below to run a simulation</p>
                    <button
                      onClick={runSimulation}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <Play className="w-4 h-4" />
                      Run Simulation
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

export default SimulationModal;
