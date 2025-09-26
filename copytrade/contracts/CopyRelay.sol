// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StrategyNFT.sol";

/**
 * @title CopyRelay
 * @dev Core contract for managing copy trading functionality
 * @notice Handles subscriptions, trade mirroring, and fee collection
 */
contract CopyRelay is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    StrategyNFT public strategyNFT;
    
    struct Subscription {
        address follower;
        address leader;
        uint256 strategyId;
        uint256 subscriptionFee;
        uint256 performanceFee;
        bool isActive;
        uint256 subscribedAt;
        uint256 lastTradeTime;
    }
    
    struct Trade {
        address leader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        bool isExecuted;
    }
    
    mapping(address => mapping(address => Subscription)) public subscriptions;
    mapping(address => address[]) public followerToLeaders;
    mapping(address => address[]) public leaderToFollowers;
    mapping(bytes32 => Trade) public trades;
    
    uint256 public totalSubscriptions;
    uint256 public totalTrades;
    uint256 public platformFee = 50; // 0.5% in basis points
    address public feeRecipient;
    
    event FollowerJoined(
        address indexed follower,
        address indexed leader,
        uint256 indexed strategyId,
        uint256 subscriptionFee,
        uint256 performanceFee
    );
    
    event FollowerLeft(
        address indexed follower,
        address indexed leader,
        uint256 indexed strategyId
    );
    
    event TradeExecuted(
        bytes32 indexed tradeId,
        address indexed leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    
    event TradeMirrored(
        address indexed follower,
        address indexed leader,
        bytes32 indexed tradeId,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event RefundTriggered(
        address indexed follower,
        address indexed leader,
        uint256 amount,
        string reason
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    
    constructor(address _strategyNFT, address _feeRecipient) Ownable(msg.sender) {
        strategyNFT = StrategyNFT(_strategyNFT);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Subscribe to a strategy leader
     * @param leader Leader address
     * @param subscriptionFeePaid Subscription fee paid by follower
     */
    function subscribe(address leader, uint256 subscriptionFeePaid) external payable nonReentrant {
        require(strategyNFT.isStrategyLeader(leader), "Not a valid strategy leader");
        require(leader != msg.sender, "Cannot subscribe to yourself");
        require(!subscriptions[msg.sender][leader].isActive, "Already subscribed");
        
        uint256 strategyId = strategyNFT.leaderToTokenId(leader);
        StrategyNFT.Strategy memory strategy = strategyNFT.getStrategy(strategyId);
        require(strategy.isActive, "Strategy is not active");
        
        // Create subscription
        subscriptions[msg.sender][leader] = Subscription({
            follower: msg.sender,
            leader: leader,
            strategyId: strategyId,
            subscriptionFee: subscriptionFeePaid,
            performanceFee: strategy.performanceFee,
            isActive: true,
            subscribedAt: block.timestamp,
            lastTradeTime: 0
        });
        
        // Update mappings
        followerToLeaders[msg.sender].push(leader);
        leaderToFollowers[leader].push(msg.sender);
        
        // Update strategy NFT
        strategyNFT.updateFollowerCount(strategyId, 1);
        
        totalSubscriptions++;
        
        emit FollowerJoined(msg.sender, leader, strategyId, subscriptionFeePaid, strategy.performanceFee);
    }
    
    /**
     * @dev Unsubscribe from a strategy leader
     * @param leader Leader address
     */
    function unsubscribe(address leader) external nonReentrant {
        require(subscriptions[msg.sender][leader].isActive, "Not subscribed");
        
        uint256 strategyId = subscriptions[msg.sender][leader].strategyId;
        
        // Deactivate subscription
        subscriptions[msg.sender][leader].isActive = false;
        
        // Update strategy NFT
        strategyNFT.updateFollowerCount(strategyId, -1);
        
        // Remove from mappings
        _removeFromArray(followerToLeaders[msg.sender], leader);
        _removeFromArray(leaderToFollowers[leader], msg.sender);
        
        emit FollowerLeft(msg.sender, leader, strategyId);
    }
    
    /**
     * @dev Mirror a trade executed by a leader
     * @param tradeId Unique trade identifier
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function mirrorTrade(
        bytes32 tradeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external nonReentrant {
        require(subscriptions[msg.sender][msg.sender].isActive, "Not subscribed to any leader");
        
        // This is a simplified version - in reality, this would be called by the hook
        // when a leader executes a trade, and it would mirror to all followers
        
        Trade memory trade = Trade({
            leader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            isExecuted: true
        });
        
        trades[tradeId] = trade;
        totalTrades++;
        
        emit TradeExecuted(tradeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);
    }
    
    /**
     * @dev Execute a trade and mirror to followers
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external nonReentrant {
        require(strategyNFT.isStrategyLeader(msg.sender), "Not a strategy leader");
        
        bytes32 tradeId = keccak256(abi.encodePacked(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            block.timestamp
        ));
        
        Trade memory trade = Trade({
            leader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            isExecuted: true
        });
        
        trades[tradeId] = trade;
        totalTrades++;
        
        // Update strategy volume
        uint256 strategyId = strategyNFT.leaderToTokenId(msg.sender);
        strategyNFT.updateVolume(strategyId, amountIn);
        
        emit TradeExecuted(tradeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);
        
        // Mirror to all followers
        _mirrorToFollowers(tradeId, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @dev Mirror trade to all followers of a leader
     * @param tradeId Trade identifier
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function _mirrorToFollowers(
        bytes32 tradeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        address[] memory followers = leaderToFollowers[msg.sender];
        
        for (uint256 i = 0; i < followers.length; i++) {
            address follower = followers[i];
            Subscription memory sub = subscriptions[follower][msg.sender];
            
            if (sub.isActive) {
                // Calculate proportional amount for follower
                uint256 followerAmountIn = (amountIn * sub.subscriptionFee) / 10000; // Assuming subscription fee represents allocation
                uint256 followerAmountOut = (amountOut * sub.subscriptionFee) / 10000;
                
                // In a real implementation, this would execute the actual trade
                // For now, we just emit the event
                emit TradeMirrored(follower, msg.sender, tradeId, followerAmountIn, followerAmountOut);
            }
        }
    }
    
    /**
     * @dev Trigger refund for a follower
     * @param follower Follower address
     * @param leader Leader address
     * @param amount Refund amount
     * @param reason Refund reason
     */
    function triggerRefund(
        address follower,
        address leader,
        uint256 amount,
        string memory reason
    ) external onlyOwner {
        require(subscriptions[follower][leader].isActive, "Subscription not active");
        
        // In a real implementation, this would handle the actual refund
        // For now, we just emit the event
        emit RefundTriggered(follower, leader, amount, reason);
    }
    
    /**
     * @dev Get subscription details
     * @param follower Follower address
     * @param leader Leader address
     * @return Subscription struct
     */
    function getSubscription(address follower, address leader) external view returns (Subscription memory) {
        return subscriptions[follower][leader];
    }
    
    /**
     * @dev Get followers of a leader
     * @param leader Leader address
     * @return Array of follower addresses
     */
    function getFollowers(address leader) external view returns (address[] memory) {
        return leaderToFollowers[leader];
    }
    
    /**
     * @dev Get leaders followed by a follower
     * @param follower Follower address
     * @return Array of leader addresses
     */
    function getLeaders(address follower) external view returns (address[] memory) {
        return followerToLeaders[follower];
    }
    
    /**
     * @dev Update platform fee
     * @param newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    /**
     * @dev Remove item from array
     * @param array Array to remove from
     * @param item Item to remove
     */
    function _removeFromArray(address[] storage array, address item) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == item) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
}