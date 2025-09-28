import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  Settings, 
  Brain, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

// Types for strategy configuration
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

interface WorkflowDiagramProps {
  strategy: StrategyConfig;
  isGenerating?: boolean;
  onGenerate?: () => void;
  className?: string;
}

// OpenAI API integration
const generateWorkflowWithAI = async (strategy: StrategyConfig, apiKey: string): Promise<string> => {
  const prompt = `
Generate a Mermaid flowchart for a DeFi trading strategy with the following configuration:
- Strategy: ${strategy.name}
- Type: ${strategy.type}
- Risk Level: ${strategy.riskLevel}
- Time Horizon: ${strategy.timeHorizon}
- Tokens: ${strategy.tokens.join(", ")}
- Amount: ${strategy.amount}
- Slippage: ${strategy.slippage}%
- Gas Price: ${strategy.gasPrice} gwei
- Conditions: ${strategy.conditions.join(", ")}

Create a detailed flowchart showing:
1. Market analysis and signal detection
2. Risk assessment and position sizing
3. Order execution flow
4. Monitoring and rebalancing
5. Exit conditions and profit taking

Use Mermaid syntax with proper node shapes, colors, and connections. Make it comprehensive but readable.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a DeFi trading expert. Generate Mermaid flowcharts for trading strategies. Return only the Mermaid code without any explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || generateFallbackWorkflow(strategy);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackWorkflow(strategy);
  }
};

// Fallback workflow generator (no API needed)
const generateFallbackWorkflow = (strategy: StrategyConfig): string => {
  const strategyType = strategy.type;
  const riskColor = strategy.riskLevel === 'HIGH' ? '#ef4444' : strategy.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
  
  let workflow = `flowchart TD
    Start([🚀 Strategy Start]) --> MarketAnalysis[📊 Market Analysis]
    MarketAnalysis --> SignalDetection{🔍 Signal Detection}
    
    SignalDetection -->|Buy Signal| RiskAssessment[⚖️ Risk Assessment]
    SignalDetection -->|Sell Signal| ExitCheck{🚪 Exit Check}
    SignalDetection -->|Hold| Monitor[👁️ Monitor Position]
    
    RiskAssessment --> PositionSizing[💰 Position Sizing]
    PositionSizing --> GasCheck[⛽ Gas Price Check]
    GasCheck -->|Optimal| ExecuteOrder[⚡ Execute Order]
    GasCheck -->|High| Wait[⏳ Wait for Better Gas]
    Wait --> GasCheck
    
    ExecuteOrder --> OrderConfirmation{✅ Order Confirmation}
    OrderConfirmation -->|Success| Monitor
    OrderConfirmation -->|Failed| Retry[🔄 Retry Order]
    Retry --> ExecuteOrder
    
    Monitor --> RebalanceCheck{🔄 Rebalance Check}
    RebalanceCheck -->|Yes| Rebalance[⚖️ Rebalance Position]
    RebalanceCheck -->|No| ExitCheck
    Rebalance --> Monitor
    
    ExitCheck -->|Exit Conditions Met| ExitOrder[🚪 Exit Order]
    ExitCheck -->|Continue| Monitor
    ExitOrder --> ProfitTaking[💰 Profit Taking]
    ProfitTaking --> End([🏁 Strategy End])
    
    classDef startEnd fill:#8b5cf6,stroke:#a855f7,stroke-width:3px,color:#fff
    classDef process fill:#1e293b,stroke:#334155,stroke-width:2px,color:#e2e8f0
    classDef decision fill:#${riskColor.replace('#', '')},stroke:#${riskColor.replace('#', '')},stroke-width:2px,color:#fff
    classDef action fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    
    class Start,End startEnd
    class MarketAnalysis,SignalDetection,RiskAssessment,PositionSizing,GasCheck,Monitor,RebalanceCheck,ExitCheck process
    class ExecuteOrder,OrderConfirmation,Rebalance,ExitOrder,ProfitTaking action`;

  // Add strategy-specific nodes
  if (strategyType === 'AMM_LP') {
    workflow = workflow.replace('ExecuteOrder[⚡ Execute Order]', `ExecuteOrder[⚡ Add Liquidity<br/>${strategy.tokens.join(' + ')}]`);
  } else if (strategyType === 'TWAP') {
    workflow = workflow.replace('ExecuteOrder[⚡ Execute Order]', 'ExecuteOrder[⚡ TWAP Execution<br/>Time-Weighted Average Price]');
  } else if (strategyType === 'LENDING') {
    workflow = workflow.replace('ExecuteOrder[⚡ Execute Order]', 'ExecuteOrder[⚡ Lending Position<br/>Supply & Borrow]');
  } else if (strategyType === 'PENDLE') {
    workflow = workflow.replace('ExecuteOrder[⚡ Execute Order]', 'ExecuteOrder[⚡ Pendle Yield Trading<br/>Future Yield Token]');
  } else if (strategyType === 'ONEINCH_LOP') {
    workflow = workflow.replace('ExecuteOrder[⚡ Execute Order]', 'ExecuteOrder[⚡ 1inch LOP<br/>Limit Order Protocol]');
  }

  return workflow;
};

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ 
  strategy, 
  isGenerating = false, 
  onGenerate,
  className = "" 
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramContent, setDiagramContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [useAI, setUseAI] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  // Initialize Mermaid
  useEffect(() => {
    const initMermaid = async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#8b5cf6',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#a855f7',
          lineColor: '#64748b',
          sectionBkgColor: '#1e293b',
          altSectionBkgColor: '#334155',
          gridColor: '#475569',
          secondaryColor: '#0ea5e9',
          tertiaryColor: '#10b981'
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        }
      });
    };
    initMermaid();
  }, []);

  // Generate and render diagram
  const generateDiagram = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      let mermaidCode: string;
      
      if (useAI && apiKey) {
        mermaidCode = await generateWorkflowWithAI(strategy, apiKey);
      } else {
        mermaidCode = generateFallbackWorkflow(strategy);
      }
      
      setDiagramContent(mermaidCode);
      
      // Render with Mermaid
      if (diagramRef.current) {
        const mermaid = (await import('mermaid')).default;
        diagramRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render('workflow-diagram', mermaidCode);
        diagramRef.current.innerHTML = svg;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagram');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate on strategy change
  useEffect(() => {
    if (strategy.name) {
      generateDiagram();
    }
  }, [strategy, useAI, apiKey]);

  return (
    <div className={`glass-card-premium p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Strategy Workflow</h3>
            <p className="text-sm text-gray-400">Visual representation of your trading flow</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-ai"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="use-ai" className="text-sm text-gray-300">
              Use AI Generation
            </label>
          </div>
          
          {useAI && (
            <input
              type="password"
              placeholder="OpenAI API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-3 py-1 text-sm bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          )}
          
          <button
            onClick={generateDiagram}
            disabled={isLoading || (useAI && !apiKey)}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-white">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Generating workflow diagram...</span>
            </div>
          </div>
        )}
        
        <div 
          ref={diagramRef}
          className="w-full min-h-[400px] bg-black/20 rounded-lg border border-purple-500/30 p-4 overflow-auto"
        >
          {!diagramContent && !isLoading && (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Configure your strategy to generate workflow diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Strategy: {strategy.name || 'Unnamed'}</span>
          <span>Type: {strategy.type || 'Not Set'}</span>
          <span>Risk: {strategy.riskLevel || 'Not Set'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span>Real-time Updates</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
