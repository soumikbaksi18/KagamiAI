// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CopyRelay.sol";

/**
 * @title X402PaymentFacilitator
 * @dev Phase 4: x402 agentic payment system for copy trading
 * @notice Handles automatic subscription payments, performance fees, and AI-triggered refunds
 */
contract X402PaymentFacilitator is Ownable {
    using SafeERC20 for IERC20;

    CopyRelay public immutable copyRelay;
    
    // Payment tokens supported
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    struct PaymentRequest {
        bytes32 requestId;
        address payer;
        address payee;
        address token;
        uint256 amount;
        string serviceType; // "subscription", "performance_fee", "refund"
        bytes32 resourceId; // strategy ID or trade ID
        uint256 timestamp;
        bool isPaid;
        bool isSettled;
    }
    
    struct Subscription {
        address follower;
        address leader;
        address paymentToken;
        uint256 monthlyFee;
        uint256 lastPayment;
        uint256 nextPayment;
        bool isActive;
        bool autoRenew;
    }
    
    struct PerformanceFee {
        address follower;
        address leader;
        uint256 tradeId;
        uint256 profit;
        uint256 feeAmount;
        address token;
        bool isPaid;
    }
    
    mapping(bytes32 => PaymentRequest) public paymentRequests;
    mapping(address => mapping(address => Subscription)) public subscriptions; // follower => leader => subscription
    mapping(bytes32 => PerformanceFee) public performanceFees;
    
    uint256 public nextRequestId = 1;
    
    // Events (x402 standard)
    event PaymentRequired(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address token,
        string serviceType
    );
    
    event PaymentVerified(
        bytes32 indexed requestId,
        address indexed payer,
        bool isValid
    );
    
    event PaymentSettled(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed payee,
        uint256 amount
    );
    
    event SubscriptionCreated(
        address indexed follower,
        address indexed leader,
        uint256 monthlyFee,
        address token
    );
    
    event SubscriptionPayment(
        address indexed follower,
        address indexed leader,
        uint256 amount,
        uint256 nextPayment
    );
    
    event PerformanceFeeTriggered(
        address indexed follower,
        address indexed leader,
        uint256 tradeId,
        uint256 profit,
        uint256 fee
    );
    
    event RefundProcessed(
        address indexed follower,
        address indexed leader,
        uint256 amount,
        string reason
    );

    modifier onlyAIAgent() {
        // In production, this would verify AI agent authorization
        // For now, allow contract owner and CopyRelay
        require(
            msg.sender == owner() || 
            msg.sender == address(copyRelay) ||
            msg.sender == address(this),
            "Only authorized AI agents"
        );
        _;
    }
    
    constructor(address _copyRelay, address[] memory _supportedTokens) Ownable(msg.sender) {
        copyRelay = CopyRelay(_copyRelay);
        
        // Add supported payment tokens
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
            tokenList.push(_supportedTokens[i]);
        }
    }
    
    /**
     * @dev Create subscription payment request (x402 flow)
     * @param follower Follower address
     * @param leader Leader address
     * @param monthlyFee Monthly subscription fee
     * @param paymentToken Token for payments
     * @return requestId Payment request ID
     */
    function createSubscription(
        address follower,
        address leader,
        uint256 monthlyFee,
        address paymentToken
    ) external returns (bytes32 requestId) {
        require(supportedTokens[paymentToken], "Unsupported payment token");
        require(copyRelay.strategyNFT().isStrategyLeader(leader), "Not a strategy leader");
        
        requestId = bytes32(nextRequestId++);
        
        // Create payment request (x402 standard)
        paymentRequests[requestId] = PaymentRequest({
            requestId: requestId,
            payer: follower,
            payee: leader,
            token: paymentToken,
            amount: monthlyFee,
            serviceType: "subscription",
            resourceId: bytes32(uint256(uint160(leader))), // leader address as resource
            timestamp: block.timestamp,
            isPaid: false,
            isSettled: false
        });
        
        emit PaymentRequired(requestId, follower, leader, monthlyFee, paymentToken, "subscription");
        
        return requestId;
    }
    
    /**
     * @dev Verify payment (x402 /verify endpoint)
     * @param requestId Payment request ID
     * @param paymentProof Payment proof data
     * @return isValid Whether payment is valid
     */
    function verifyPayment(
        bytes32 requestId,
        bytes calldata paymentProof
    ) external returns (bool isValid) {
        PaymentRequest storage request = paymentRequests[requestId];
        require(request.requestId != bytes32(0), "Invalid request ID");
        require(!request.isPaid, "Already paid");
        
        // Verify payment proof (simplified - in production would verify blockchain tx)
        isValid = _verifyPaymentProof(request, paymentProof);
        
        if (isValid) {
            request.isPaid = true;
        }
        
        emit PaymentVerified(requestId, request.payer, isValid);
        return isValid;
    }
    
    /**
     * @dev Settle payment (x402 /settle endpoint)
     * @param requestId Payment request ID
     */
    function settlePayment(bytes32 requestId) external {
        PaymentRequest storage request = paymentRequests[requestId];
        require(request.isPaid && !request.isSettled, "Cannot settle");
        
        // Transfer payment
        IERC20(request.token).safeTransferFrom(
            request.payer,
            request.payee,
            request.amount
        );
        
        request.isSettled = true;
        
        // Handle subscription activation
        if (keccak256(bytes(request.serviceType)) == keccak256(bytes("subscription"))) {
            _activateSubscription(request);
        }
        
        emit PaymentSettled(requestId, request.payer, request.payee, request.amount);
    }
    
    /**
     * @dev AI-triggered automatic subscription payment
     * @param follower Follower address
     * @param leader Leader address
     */
    function processSubscriptionPayment(
        address follower,
        address leader
    ) external onlyAIAgent {
        Subscription storage sub = subscriptions[follower][leader];
        require(sub.isActive, "Subscription not active");
        require(block.timestamp >= sub.nextPayment, "Payment not due");
        require(sub.autoRenew, "Auto-renew disabled");
        
        // Create payment request
        bytes32 requestId = bytes32(nextRequestId++);
        
        paymentRequests[requestId] = PaymentRequest({
            requestId: requestId,
            payer: follower,
            payee: leader,
            token: sub.paymentToken,
            amount: sub.monthlyFee,
            serviceType: "subscription",
            resourceId: bytes32(uint256(uint160(leader))),
            timestamp: block.timestamp,
            isPaid: false,
            isSettled: false
        });
        
        // Auto-execute payment (AI agent has pre-authorization)
        _executeAutomaticPayment(requestId);
        
        // Update subscription
        sub.lastPayment = block.timestamp;
        sub.nextPayment = block.timestamp + 30 days;
        
        emit SubscriptionPayment(follower, leader, sub.monthlyFee, sub.nextPayment);
    }
    
    /**
     * @dev AI-triggered performance fee collection
     * @param follower Follower address
     * @param leader Leader address
     * @param tradeId Trade identifier
     * @param profit Profit amount
     */
    function collectPerformanceFee(
        address follower,
        address leader,
        uint256 tradeId,
        uint256 profit,
        address token
    ) external onlyAIAgent {
        require(profit > 0, "No profit to charge fee on");
        
        // Get strategy performance fee rate
        uint256 strategyId = copyRelay.strategyNFT().leaderToTokenId(leader);
        (,,,uint256 performanceFeeRate,,,,) = copyRelay.strategyNFT().strategies(strategyId);
        
        uint256 feeAmount = (profit * performanceFeeRate) / 10000; // basis points
        
        bytes32 feeId = keccak256(abi.encodePacked(follower, leader, tradeId));
        performanceFees[feeId] = PerformanceFee({
            follower: follower,
            leader: leader,
            tradeId: tradeId,
            profit: profit,
            feeAmount: feeAmount,
            token: token,
            isPaid: false
        });
        
        // Create payment request
        bytes32 requestId = bytes32(nextRequestId++);
        
        paymentRequests[requestId] = PaymentRequest({
            requestId: requestId,
            payer: follower,
            payee: leader,
            token: token,
            amount: feeAmount,
            serviceType: "performance_fee",
            resourceId: feeId,
            timestamp: block.timestamp,
            isPaid: false,
            isSettled: false
        });
        
        // Auto-execute performance fee
        _executeAutomaticPayment(requestId);
        
        performanceFees[feeId].isPaid = true;
        
        emit PerformanceFeeTriggered(follower, leader, tradeId, profit, feeAmount);
    }
    
    /**
     * @dev AI-triggered refund processing
     * @param follower Follower address
     * @param leader Leader address
     * @param amount Refund amount
     * @param token Refund token
     * @param reason Refund reason
     */
    function processRefund(
        address follower,
        address leader,
        uint256 amount,
        address token,
        string calldata reason
    ) external onlyAIAgent {
        require(amount > 0, "Invalid refund amount");
        
        // Transfer refund from leader to follower
        IERC20(token).safeTransferFrom(leader, follower, amount);
        
        // Create refund record
        bytes32 requestId = bytes32(nextRequestId++);
        
        paymentRequests[requestId] = PaymentRequest({
            requestId: requestId,
            payer: leader,
            payee: follower,
            token: token,
            amount: amount,
            serviceType: "refund",
            resourceId: bytes32(uint256(uint160(follower))),
            timestamp: block.timestamp,
            isPaid: true,
            isSettled: true
        });
        
        emit RefundProcessed(follower, leader, amount, reason);
    }
    
    /**
     * @dev Get payment request details (x402 standard)
     * @param requestId Request ID
     * @return request Payment request details
     */
    function getPaymentRequest(bytes32 requestId) external view returns (PaymentRequest memory) {
        return paymentRequests[requestId];
    }
    
    /**
     * @dev Get subscription details
     * @param follower Follower address
     * @param leader Leader address
     * @return subscription Subscription details
     */
    function getSubscription(address follower, address leader) 
        external 
        view 
        returns (Subscription memory) 
    {
        return subscriptions[follower][leader];
    }
    
    /**
     * @dev Add supported payment token
     * @param token Token address
     */
    function addSupportedToken(address token) external onlyOwner {
        if (!supportedTokens[token]) {
            supportedTokens[token] = true;
            tokenList.push(token);
        }
    }
    
    /**
     * @dev Get all supported tokens
     * @return tokens Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    // Internal functions
    
    /**
     * @dev Activate subscription after payment
     * @param request Payment request
     */
    function _activateSubscription(PaymentRequest memory request) internal {
        address follower = request.payer;
        address leader = request.payee;
        
        subscriptions[follower][leader] = Subscription({
            follower: follower,
            leader: leader,
            paymentToken: request.token,
            monthlyFee: request.amount,
            lastPayment: block.timestamp,
            nextPayment: block.timestamp + 30 days,
            isActive: true,
            autoRenew: true
        });
        
        // Subscribe in CopyRelay
        // Note: This would need additional integration
        
        emit SubscriptionCreated(follower, leader, request.amount, request.token);
    }
    
    /**
     * @dev Execute automatic payment (AI agent authorized)
     * @param requestId Request ID
     */
    function _executeAutomaticPayment(bytes32 requestId) internal {
        PaymentRequest storage request = paymentRequests[requestId];
        
        // In production, AI agent would have pre-authorized token allowances
        // For now, assume payment is valid
        request.isPaid = true;
        request.isSettled = true;
        
        // Transfer would happen here in production
        // IERC20(request.token).safeTransferFrom(request.payer, request.payee, request.amount);
        
        emit PaymentSettled(requestId, request.payer, request.payee, request.amount);
    }
    
    /**
     * @dev Verify payment proof (simplified)
     * @param request Payment request
     * @param proof Payment proof
     * @return isValid Whether proof is valid
     */
    function _verifyPaymentProof(
        PaymentRequest memory request,
        bytes calldata proof
    ) internal pure returns (bool isValid) {
        // In production, this would verify blockchain transaction proof
        // For now, return true if proof is not empty
        return proof.length > 0;
    }
}