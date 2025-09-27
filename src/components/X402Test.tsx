import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Activity,
  Clock,
  Zap,
} from "lucide-react";

// --- Minimal UI primitives ---
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children }) => (
  <div className={`glass-card-premium p-6 ${className}`}>{children}</div>
);
const CardHeader: React.FC = ({ children }) => <div className="flex items-center justify-between mb-4">{children}</div>;
const CardTitle: React.FC = ({ children }) => <h3 className="text-xl font-semibold text-white">{children}</h3>;
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }> = ({ className = "", variant = "solid", children, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
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

// --- Types ---
type PaymentStatus = "idle" | "requesting" | "payment_required" | "processing" | "success" | "error";

interface PaymentDetails {
  amount: string;
  token: string;
  facilitator: string;
  recipient: string;
  description: string;
}

// --- Mock x402 Payment Flow ---
const MOCK_PAYMENT_DETAILS: PaymentDetails = {
  amount: "0.001",
  token: "MATIC",
  facilitator: "https://facilitator.polygon.technology",
  recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  description: "Test x402 Payment for Resource Access - Polygon Amoy Testnet"
};

export default function X402Test() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const handlePayment = async () => {
    try {
      setStatus("requesting");
      setPaymentDetails(null);
      setTxHash("");

      // Step 1: Simulate requesting resource from seller
      await new Promise((res) => setTimeout(res, 1000));
      setStatus("payment_required");
      setPaymentDetails(MOCK_PAYMENT_DETAILS);

      // Step 2: Simulate wallet interaction and payment processing
      await new Promise((res) => setTimeout(res, 1500));
      setStatus("processing");
      setTxHash("0x" + Math.random().toString(16).substr(2, 64));

      // Step 3: Simulate payment verification and success
      await new Promise((res) => setTimeout(res, 2000));
      setStatus("success");

    } catch (err) {
      setStatus("error");
      console.error("Payment failed:", err);
    }
  };

  const resetTest = () => {
    setStatus("idle");
    setPaymentDetails(null);
    setTxHash("");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "idle":
        return <Wallet className="h-5 w-5 text-purple-400" />;
      case "requesting":
        return <Activity className="h-5 w-5 text-blue-400 animate-pulse" />;
      case "payment_required":
        return <DollarSign className="h-5 w-5 text-yellow-400" />;
      case "processing":
        return <Clock className="h-5 w-5 text-orange-400 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Ready to test x402 payment flow";
      case "requesting":
        return "Requesting resource from seller...";
      case "payment_required":
        return "402 Payment Required - Payment details received";
      case "processing":
        return "Processing payment through facilitator...";
      case "success":
        return "Payment successful! Resource unlocked ✅";
      case "error":
        return "Payment failed - Check console for details";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "text-gray-400";
      case "requesting":
        return "text-blue-400";
      case "payment_required":
        return "text-yellow-400";
      case "processing":
        return "text-orange-400";
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Test Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center neon-glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>x402T Payment Test</CardTitle>
              <p className="text-sm text-gray-400">Test x402 payment flow with your wallet</p>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-6">
          {/* Status Display */}
          <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
            {getStatusIcon()}
            <div className="flex-1">
              <div className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {txHash && (
                <div className="text-xs text-gray-500 mt-1">
                  TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-xl"
            >
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-400" />
                Payment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white ml-2 font-mono">{paymentDetails.amount} {paymentDetails.token}</span>
                </div>
                <div>
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white ml-2 font-mono">{paymentDetails.recipient.slice(0, 10)}...{paymentDetails.recipient.slice(-8)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Description:</span>
                  <span className="text-white ml-2">{paymentDetails.description}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handlePayment} 
              disabled={status === "requesting" || status === "processing"}
              className="flex-1"
            >
              <Wallet className="h-4 w-4" />
              {status === "idle" ? "Test x402 Payment" : 
               status === "requesting" ? "Requesting..." :
               status === "payment_required" ? "Process Payment" :
               status === "processing" ? "Processing..." :
               "Test Again"}
            </Button>
            
            {(status === "success" || status === "error") && (
              <Button variant="outline" onClick={resetTest}>
                Reset Test
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How x402 Works</CardTitle>
        </CardHeader>
        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">1</div>
            <div>
              <div className="font-medium text-white">Request Resource</div>
              <div className="text-gray-400">Client requests a resource from seller endpoint</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">2</div>
            <div>
              <div className="font-medium text-white">402 Payment Required</div>
              <div className="text-gray-400">Seller responds with 402 status and payment details</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">3</div>
            <div>
              <div className="font-medium text-white">Facilitator Payment</div>
              <div className="text-gray-400">Client uses x402 facilitator to process payment</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">4</div>
            <div>
              <div className="font-medium text-white">Resource Unlocked</div>
              <div className="text-gray-400">Payment verified, resource becomes accessible</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="p-3 glass-card rounded-lg">
            <div className="font-medium text-white mb-1">Facilitator Endpoint</div>
            <div className="font-mono text-xs text-gray-400 break-all">
              {MOCK_PAYMENT_DETAILS.facilitator}
            </div>
          </div>
          <div className="p-3 glass-card rounded-lg">
            <div className="font-medium text-white mb-1">Test Network</div>
            <div className="text-gray-400">Polygon Amoy Testnet (Chain ID: 80002)</div>
          </div>
          <div className="p-3 glass-card rounded-lg">
            <div className="font-medium text-white mb-1">Payment Token</div>
            <div className="text-gray-400">MATIC (Amoy Testnet)</div>
          </div>
          <div className="p-3 glass-card rounded-lg">
            <div className="font-medium text-white mb-1">RPC Endpoint</div>
            <div className="text-gray-400 font-mono text-xs">https://rpc-amoy.polygon.technology</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
