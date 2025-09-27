import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  timeframe: string;
  currentPrice?: string;
}

// Custom Candlestick component
const CandleStick: React.FC<any> = (props) => {
  const { payload, x, y, width, height } = props;
  
  if (!payload || !payload.open) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444'; // Green for up, red for down
  const fillColor = isGreen ? '#10b981' : '#ef4444';
  
  // Calculate positions
  const bodyHeight = Math.abs(close - open);
  const bodyY = Math.min(close, open);
  const wickTop = high;
  const wickBottom = low;
  
  // Scale factors (simplified)
  const priceRange = Math.max(high - low, 0.00001);
  const pixelPerPrice = height / priceRange;
  
  const bodyPixelHeight = bodyHeight * pixelPerPrice;
  const bodyPixelY = y + (wickTop - bodyY) * pixelPerPrice;
  
  const wickX = x + width / 2;
  const wickTopY = y;
  const wickBottomY = y + height;
  
  return (
    <g>
      {/* High-Low Wick */}
      <line
        x1={wickX}
        y1={wickTopY}
        x2={wickX}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={1}
      />
      
      {/* Open-Close Body */}
      <rect
        x={x + width * 0.25}
        y={bodyPixelY}
        width={width * 0.5}
        height={Math.max(bodyPixelHeight, 1)}
        fill={fillColor}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom tooltip
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload;
  const isGreen = data.close >= data.open;
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
      <p className="text-white text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Open:</span>
          <span className="text-white">{data.open?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">High:</span>
          <span className="text-green-400">{data.high?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Low:</span>
          <span className="text-red-400">{data.low?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Close:</span>
          <span className={isGreen ? 'text-green-400' : 'text-red-400'}>
            {data.close?.toFixed(5)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Volume:</span>
          <span className="text-blue-400">{data.volume?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data, 
  timeframe, 
  currentPrice 
}) => {
  console.log('🕯️ CandlestickChart received data:', data?.length, 'candles');
  console.log('🕯️ Sample data:', data?.slice(0, 2));
  
  if (!data || data.length === 0) {
    console.log('❌ No candlestick data available');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Prepare data for recharts
  const chartData = data.map((candle, index) => ({
    ...candle,
    index,
    // Add derived values for easier rendering
    body: Math.abs(candle.close - candle.open),
    isGreen: candle.close >= candle.open,
    wick: candle.high - candle.low
  }));

  // Calculate price range for better Y-axis scaling
  const allPrices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1; // 10% padding

  return (
    <div className="h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm">
            📊 {timeframe.toUpperCase()} Candlestick Chart
          </span>
          {currentPrice && (
            <span className="text-blue-400 text-sm font-mono">
              Current: {parseFloat(currentPrice).toFixed(5)}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {data.length} candles • Live updates every {timeframe}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={10}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                // Show only time for better readability
                const parts = value.split(' ');
                return parts[1] || parts[0];
              }}
            />
            <YAxis 
              yAxisId="price"
              stroke="#9ca3af"
              fontSize={10}
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={(value) => value.toFixed(5)}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="#9ca3af"
              fontSize={10}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* High line (top of candle) */}
            <Line
              type="monotone"
              dataKey="high"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="High"
              yAxisId="price"
            />
            
            {/* Low line (bottom of candle) */}
            <Line
              type="monotone"
              dataKey="low"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Low"
              yAxisId="price"
            />
            
            {/* Open line */}
            <Line
              type="monotone"
              dataKey="open"
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              name="Open"
              yAxisId="price"
            />
            
            {/* Close line (main price) */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={true}
              dotFill="#3b82f6"
              name="Close"
              yAxisId="price"
            />
            
            {/* Volume bars (scaled down and at bottom) */}
            <Bar 
              dataKey="volume" 
              fill="#3b82f6" 
              fillOpacity={0.2}
              yAxisId="volume"
              name="Volume"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-400">Bullish (Green)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-400">Bearish (Red)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded opacity-50"></div>
          <span className="text-gray-400">Volume</span>
        </div>
      </div>
    </div>
  );
};