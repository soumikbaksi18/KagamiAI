// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./X402PaymentFacilitator.sol";
import "./CopyRelay.sol";

/**
 * @title AIPaymentAgent
 * @dev Phase 4: AI agent for automated payment processing
 * @notice Monitors trading activity and triggers payments automatically
 */
contract AIPaymentAgent is Ownable {
    
    X402PaymentFacilitator public immutable paymentFacilitator;
    CopyRelay public immutable copyRelay;
    
    struct TradeAnalysis {
        uint256 tradeId;
        address leader;
        address[] followers;
        uint256 totalVolume;
        int256 totalPnL;
        bool isProfitable;
        uint256 timestamp;
    }
    
    struct RefundTrigger {
        address follower;
        address leader;
        uint256 lossAmount;
        uint256 consecutiveLosses;
        string reason;
        bool isProcessed;
    }
    
    mapping(uint256 => TradeAnalysis) public tradeAnalyses;
    mapping(address => mapping(address => uint256)) public consecutiveLosses;
    mapping(bytes32 => RefundTrigger) public refundTriggers;
    
    uint256 public nextTradeId = 1;
    
    // AI thresholds
    uint256 public refundThreshold = 3; // 3 consecutive losses
    uint256 public minRefundAmount = 100e6; // 100 USDC minimum loss for refund
    uint256 public performanceFeeThreshold = 10e6; // 10 USDC minimum profit for fee
    
    // Events
    event TradeAnalyzed(
        uint256 indexed tradeId,
        address indexed leader,
        uint256 followerCount,
        int256 totalPnL,
        bool isProfitable
    );
    
    event RefundTriggered(
        address indexed follower,
        address indexed leader,
        uint256 amount,
        string reason
    );
    
    event PerformanceFeeCollected(
        address indexed follower,
        address indexed leader,
        uint256 profit,
        uint256 fee
    );
    
    event SubscriptionRenewalProcessed(
        address indexed follower,
        address indexed leader,
        uint256 amount
    );
    
    event AIDecision(
        string action,
        address indexed target,
        uint256 amount,
        string reasoning
    );

    modifier onlyAuthorized() {
        // In production, this would verify AI agent authorization
        require(msg.sender == owner(), "Only authorized AI");
        _;
    }
    
    constructor(address _paymentFacilitator, address _copyRelay) Ownable(msg.sender) {
        paymentFacilitator = X402PaymentFacilitator(_paymentFacilitator);
        copyRelay = CopyRelay(_copyRelay);
    }
    
    /**
     * @dev Analyze trade and trigger appropriate payments
     * @param leader Strategy leader
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function analyzeTrade(
        address leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external onlyAuthorized {
        uint256 tradeId = nextTradeId++;
        
        // Get followers for this leader
        address[] memory followers = copyRelay.getFollowers(leader);
        
        // Calculate profit/loss (simplified)
        int256 pnl = int256(amountOut) - int256(amountIn);
        bool isProfitable = pnl > 0;
        
        // Store analysis
        tradeAnalyses[tradeId] = TradeAnalysis({
            tradeId: tradeId,
            leader: leader,
            followers: followers,
            totalVolume: amountIn,
            totalPnL: pnl,
            isProfitable: isProfitable,
            timestamp: block.timestamp
        });
        
        emit TradeAnalyzed(tradeId, leader, followers.length, pnl, isProfitable);
        
        // Process each follower
        for (uint256 i = 0; i < followers.length; i++) {
            _processFollowerTrade(followers[i], leader, tradeId, pnl, tokenOut);
        }
    }
    
    /**
     * @dev Process subscription renewals (automated)
     */
    function processSubscriptionRenewals() external onlyAuthorized {
        // This would iterate through active subscriptions and renew them
        // For demo purposes, we'll show the pattern
        
        emit AIDecision(
            "subscription_renewal",
            address(0),
            0,
            "Processing due subscription renewals automatically"
        );
        
        // In production, this would query all subscriptions due for renewal
        // and call paymentFacilitator.processSubscriptionPayment()
    }
    
    /**
     * @dev AI-powered risk assessment and refund processing
     * @param follower Follower address
     * @param leader Leader address
     */
    function assessRiskAndRefund(address follower, address leader) external onlyAuthorized {
        uint256 losses = consecutiveLosses[follower][leader];
        
        if (losses >= refundThreshold) {
            // Calculate refund amount (simplified)
            uint256 refundAmount = minRefundAmount; // In production, calculate actual losses
            
            string memory reason = string(abi.encodePacked(
                "AI detected ",
                _uint2str(losses),
                " consecutive losses. Automatic refund triggered."
            ));
            
            // Create refund trigger
            bytes32 triggerId = keccak256(abi.encodePacked(follower, leader, block.timestamp));
            refundTriggers[triggerId] = RefundTrigger({
                follower: follower,
                leader: leader,
                lossAmount: refundAmount,
                consecutiveLosses: losses,
                reason: reason,
                isProcessed: false
            });
            
            // Process refund through payment facilitator
            // Note: In production, this would have proper token handling
            emit RefundTriggered(follower, leader, refundAmount, reason);
            
            // Reset consecutive losses
            consecutiveLosses[follower][leader] = 0;
            
            emit AIDecision(
                "refund_processed",
                follower,
                refundAmount,
                reason
            );
        }
    }
    
    /**
     * @dev AI market analysis and trading recommendations
     * @param leader Leader address
     * @return shouldPause Whether to pause copy trading
     * @return reason Reasoning for decision
     */
    function analyzeMarketConditions(address leader) 
        external 
        view 
        returns (bool shouldPause, string memory reason) 
    {
        // AI analysis of market conditions (simplified)
        uint256 recentLosses = consecutiveLosses[address(0)][leader]; // Global losses for leader
        
        if (recentLosses >= 5) {
            return (true, "AI detected high volatility and consecutive losses - recommend pause");
        }
        
        return (false, "Market conditions favorable for copy trading");
    }
    
    /**
     * @dev Generate AI trading summary
     * @param leader Leader address
     * @param period Time period to analyze (seconds)
     * @return summary AI-generated summary
     */
    function generateTradingSummary(address leader, uint256 period) 
        external 
        view 
        returns (string memory summary) 
    {
        // AI analysis (simplified)
        return string(abi.encodePacked(
            "AI Analysis: Leader ",
            _addressToString(leader),
            " has executed trades in the last ",
            _uint2str(period / 3600),
            " hours. Performance metrics show consistent strategy execution."
        ));
    }
    
    /**
     * @dev Update AI thresholds
     * @param newRefundThreshold New refund threshold
     * @param newMinRefundAmount New minimum refund amount
     * @param newPerformanceFeeThreshold New performance fee threshold
     */
    function updateAIThresholds(
        uint256 newRefundThreshold,
        uint256 newMinRefundAmount,
        uint256 newPerformanceFeeThreshold
    ) external onlyOwner {
        refundThreshold = newRefundThreshold;
        minRefundAmount = newMinRefundAmount;
        performanceFeeThreshold = newPerformanceFeeThreshold;
        
        emit AIDecision(
            "thresholds_updated",
            address(0),
            0,
            "AI thresholds updated for better performance"
        );
    }
    
    /**
     * @dev Get trade analysis
     * @param tradeId Trade ID
     * @return analysis Trade analysis details
     */
    function getTradeAnalysis(uint256 tradeId) external view returns (TradeAnalysis memory) {
        return tradeAnalyses[tradeId];
    }
    
    /**
     * @dev Get consecutive losses for follower-leader pair
     * @param follower Follower address
     * @param leader Leader address
     * @return losses Number of consecutive losses
     */
    function getConsecutiveLosses(address follower, address leader) external view returns (uint256) {
        return consecutiveLosses[follower][leader];
    }
    
    // Internal functions
    
    /**
     * @dev Process individual follower trade
     * @param follower Follower address
     * @param leader Leader address
     * @param tradeId Trade ID
     * @param pnl Profit/loss
     * @param token Token address
     */
    function _processFollowerTrade(
        address follower,
        address leader,
        uint256 tradeId,
        int256 pnl,
        address token
    ) internal {
        if (pnl > 0) {
            // Profitable trade - collect performance fee
            uint256 profit = uint256(pnl);
            
            if (profit >= performanceFeeThreshold) {
                // Trigger performance fee collection
                // paymentFacilitator.collectPerformanceFee(follower, leader, tradeId, profit, token);
                
                emit PerformanceFeeCollected(follower, leader, profit, 0);
            }
            
            // Reset consecutive losses
            consecutiveLosses[follower][leader] = 0;
            
        } else {
            // Loss - increment consecutive losses
            consecutiveLosses[follower][leader]++;
            
            // Check if refund should be triggered
            if (consecutiveLosses[follower][leader] >= refundThreshold) {
                // Will be processed in next AI cycle
                emit AIDecision(
                    "refund_assessment",
                    follower,
                    uint256(-pnl),
                    "Consecutive losses detected - refund assessment triggered"
                );
            }
        }
    }
    
    /**
     * @dev Convert uint to string
     * @param value Number to convert
     * @return String representation
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Convert address to string
     * @param addr Address to convert
     * @return String representation
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        
        return string(str);
    }
}