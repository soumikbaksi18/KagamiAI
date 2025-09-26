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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">Create Strategy</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Strategy Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., DeFi Yield Hunter"
              className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your trading strategy and approach..."
              rows={3}
              className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all resize-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 bg-white/60 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all pr-12"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                bps
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(formData.performanceFee / 100).toFixed(1)}% fee from profits (max 10%)
            </p>
          </div>
          
          <div className="bg-blue-50/50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Strategy Benefits</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Earn fees from followers' profits</li>
                  <li>• Build reputation and following</li>
                  <li>• Automatic trade mirroring</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3"
            >
              Create Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};