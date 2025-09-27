import React, { useState } from 'react';
import { X, Zap, Users, DollarSign, Info, Star, TrendingUp } from 'lucide-react';

interface PublishStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (strategyData: {
    name: string;
    description: string;
    performanceFee: number;
    strategyType: string;
  }) => void;
  selectedAIBot?: string;
}

export const PublishStrategyModal: React.FC<PublishStrategyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  selectedAIBot 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [performanceFee, setPerformanceFee] = useState(5);
  const [strategyType, setStrategyType] = useState(selectedAIBot || 'manual');
  const [useAITemplate, setUseAITemplate] = useState(!!selectedAIBot);

  // AI Bot templates
  const aiTemplates = {
    'grid-trading': {
      name: 'Grid Trading Strategy',
      description: 'Automated grid trading bot that buys low and sells high using predefined price levels. Ideal for ranging markets with consistent profit generation.',
      defaultFee: 3
    },
    'dca-martingale': {
      name: 'DCA Martingale Strategy',
      description: 'Dollar-cost averaging with martingale position sizing. Automatically reinvests and compounds gains while managing risk through systematic buying.',
      defaultFee: 4
    },
    'rebalancing': {
      name: 'Portfolio Rebalancing Strategy',
      description: 'Dynamic portfolio rebalancing strategy that maintains optimal asset allocation ratios. Creates your own index fund with automated rebalancing.',
      defaultFee: 2
    },
    'twap': {
      name: 'TWAP Trading Strategy',
      description: 'Time-Weighted Average Price strategy for large orders. Reduces market impact through systematic order splitting over time intervals.',
      defaultFee: 1.5
    }
  };

  // Load AI template when selected
  React.useEffect(() => {
    if (useAITemplate && selectedAIBot && aiTemplates[selectedAIBot as keyof typeof aiTemplates]) {
      const template = aiTemplates[selectedAIBot as keyof typeof aiTemplates];
      setName(template.name);
      setDescription(template.description);
      setPerformanceFee(template.defaultFee);
      setStrategyType(selectedAIBot);
    }
  }, [useAITemplate, selectedAIBot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    onSubmit({
      name,
      description,
      performanceFee,
      strategyType
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card-premium p-8 max-w-2xl w-full neon-glow relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center neon-glow">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Publish Trading Strategy
              </h2>
              <p className="text-sm text-gray-400">Share your strategy and earn from followers</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strategy Type Selection */}
          {selectedAIBot && (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">AI Strategy Template</h3>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useAITemplate}
                    onChange={(e) => setUseAITemplate(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Use AI template</span>
                </label>
              </div>
              
              {useAITemplate && selectedAIBot && aiTemplates[selectedAIBot as keyof typeof aiTemplates] && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-sm text-gray-300">
                    <strong>Selected AI Bot:</strong> {aiTemplates[selectedAIBot as keyof typeof aiTemplates].name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Template will auto-fill strategy details
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strategy Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Strategy Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Trading Strategy"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Strategy Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Strategy Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your trading strategy, approach, and what makes it unique..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Performance Fee */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Performance Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={performanceFee}
                onChange={(e) => setPerformanceFee(parseFloat(e.target.value) || 0)}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                %
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Fee charged on profitable trades (max 10%)
            </div>
          </div>

          {/* Strategy Preview */}
          <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Strategy Preview</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Strategy Name:</span>
                <span className="text-white font-medium">{name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Performance Fee:</span>
                <span className="text-green-400 font-medium">{performanceFee}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Strategy Type:</span>
                <span className="text-blue-400 font-medium">
                  {useAITemplate && selectedAIBot ? 'AI-Powered' : 'Manual Trading'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Description:</span>
                <p className="text-white text-sm mt-1">
                  {description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Leader Benefits</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Earn Performance Fees</div>
                  <div className="text-gray-400 text-sm">Get paid when your followers profit</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Build Your Following</div>
                  <div className="text-gray-400 text-sm">Attract traders who copy your strategies</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Strategy Analytics</div>
                  <div className="text-gray-400 text-sm">Track performance and follower metrics</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Automated Execution</div>
                  <div className="text-gray-400 text-sm">Your trades are copied automatically</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !description}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};