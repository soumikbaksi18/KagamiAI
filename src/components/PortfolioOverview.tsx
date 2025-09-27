import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface PortfolioOverviewProps {
  account?: string;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = () => {
  // Mock portfolio data
  const portfolioData = [
    { name: 'DeFi Yield Hunter', value: 45, color: '#d4a8ff' },
    { name: 'ETH Momentum', value: 30, color: '#a8d8ff' },
    { name: 'Safe Blue Chip', value: 25, color: '#b3ffcc' }
  ];

  const performanceData = [
    { date: '1D', value: 2.3 },
    { date: '1W', value: 8.1 },
    { date: '1M', value: 15.4 },
    { date: '3M', value: 28.7 },
    { date: '1Y', value: 45.2 }
  ];

  const totalValue = 15750; // Mock total portfolio value
  const totalPnL = 2340; // Mock P&L
  const totalPnLPercent = 17.4;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="glass-card-premium p-6 neon-glow">
        <h3 className="text-2xl font-bold text-white mb-6">Portfolio Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 p-4 rounded-xl neon-glow">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 p-4 rounded-xl neon-glow">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-300">Total P&L</span>
            </div>
            <p className="text-2xl font-bold text-white">+${totalPnL.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-4 rounded-xl neon-glow">
            <div className="flex items-center space-x-2 mb-2">
              <Percent className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Return</span>
            </div>
            <p className="text-2xl font-bold text-white">+{totalPnLPercent}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Allocation Pie Chart */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Strategy Allocation</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Allocation']}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.9)', 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2 mt-4">
              {portfolioData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-white">{item.name}</span>
                  </div>
                  <span className="font-medium text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Performance Timeline</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Return']}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.9)',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#d4a8ff" 
                    strokeWidth={3}
                    dot={{ fill: '#d4a8ff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};