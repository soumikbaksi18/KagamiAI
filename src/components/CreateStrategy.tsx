import React, { useState } from 'react';
import { Plus, X, Target, Users } from 'lucide-react';

interface CreateStrategyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (strategy: {
    name: string;
    description: string;
    performanceFee: number;
  }) => void;
}

export const CreateStrategy: React.FC<CreateStrategyProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    performanceFee: 250 // 2.5% default
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', description: '', performanceFee: 250 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card-premium p-8 max-w-lg w-full neon-glow relative">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create Strategy
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Strategy Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., DeFi Yield Hunter"
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your trading strategy and approach..."
              rows={4}
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Performance Fee
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.performanceFee}
                onChange={(e) => setFormData({ ...formData, performanceFee: Number(e.target.value) })}
                min="0"
                max="1000"
                step="25"
                className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 pr-12 text-white"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                bps
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              <span className="font-semibold text-purple-400">{(formData.performanceFee / 100).toFixed(1)}%</span> fee from profits (max 10%)
            </p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center neon-glow">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-lg">Strategy Benefits</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>Earn fees from followers' profits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>Build reputation and following</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>Automatic trade mirroring</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600 hover:border-gray-500 hover:scale-[1.02]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-0.5"
            >
              Create Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};