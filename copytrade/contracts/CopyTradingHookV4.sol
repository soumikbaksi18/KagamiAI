// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CopyRelay.sol";

/**
 * @title CopyTradingHookV4
 * @dev Phase 3: Real Uniswap v4 Hook for automatic copy trading
 * @notice This hook intercepts swaps and triggers copy trading for strategy leaders
 * 
 * NOTE: This is a conceptual implementation showing the v4 integration pattern.
 * The actual v4 interfaces are still evolving, so this demonstrates the approach.
 */
contract CopyTradingHookV4 {
    
    CopyRelay public immutable copyRelay;
    address public immutable poolManager;
    
    // Mapping to track which pools have copy trading enabled
    mapping(bytes32 => bool) public copyTradingPools;
    
    // Events
    event LeaderTradeDetected(
        address indexed leader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event CopyTradeExecuted(
        address indexed leader,
        address indexed follower,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event PoolRegistered(bytes32 indexed poolId, bool copyTradingEnabled);
    
    modifier onlyPoolManager() {
        require(msg.sender == poolManager, "Only PoolManager can call");
        _;
    }
    
    constructor(address _poolManager, address _copyRelay) {
        poolManager = _poolManager;
        copyRelay = CopyRelay(_copyRelay);
    }
    
    /**
     * @dev Register a pool for copy trading
     * @param poolId Unique pool identifier
     * @param enabled Whether copy trading is enabled for this pool
     */
    function registerPool(bytes32 poolId, bool enabled) external {
        require(msg.sender == address(copyRelay), "Only CopyRelay can register pools");
        copyTradingPools[poolId] = enabled;
        emit PoolRegistered(poolId, enabled);
    }
    
    /**
     * @dev Hook function called before swap (conceptual v4 interface)
     * @param trader Address of the trader
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     */
    function beforeSwap(
        address trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external onlyPoolManager returns (bool shouldProceed) {
        // Generate pool ID
        bytes32 poolId = keccak256(abi.encodePacked(tokenIn, tokenOut));
        
        // Check if copy trading is enabled for this pool
        if (!copyTradingPools[poolId]) {
            return true; // Proceed with normal swap
        }
        
        // Check if trader is a strategy leader
        bool isLeader = copyRelay.strategyNFT().isStrategyLeader(trader);
        
        if (isLeader) {
            emit LeaderTradeDetected(trader, tokenIn, tokenOut, amountIn, 0);
            // Store the trade details for afterSwap processing
            _pendingTrades[trader] = PendingTrade({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: amountIn,
                timestamp: block.timestamp
            });
        }
        
        return true; // Always proceed with the swap
    }
    
    /**
     * @dev Hook function called after swap (conceptual v4 interface)
     * @param trader Address of the trader
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Actual input amount
     * @param amountOut Actual output amount
     */
    function afterSwap(
        address trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external onlyPoolManager {
        // Check if this was a leader trade
        if (!copyRelay.strategyNFT().isStrategyLeader(trader)) {
            return;
        }
        
        // Clean up pending trade
        delete _pendingTrades[trader];
        
        // Trigger copy trading through CopyRelay
        try copyRelay.executeTrade(tokenIn, tokenOut, amountIn, amountOut) {
            // Get followers for this leader
            address[] memory followers = copyRelay.getFollowers(trader);
            
            // Emit events for each follower
            for (uint256 i = 0; i < followers.length; i++) {
                emit CopyTradeExecuted(trader, followers[i], amountIn, amountOut);
            }
        } catch {
            // If copy trade execution fails, don't revert the original swap
            // This ensures the leader's trade always succeeds
        }
    }
    
    // Struct to store pending trade details
    struct PendingTrade {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 timestamp;
    }
    
    mapping(address => PendingTrade) private _pendingTrades;
    
    /**
     * @dev Manual trigger for copy trading (fallback method)
     * @param leader Strategy leader address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function triggerCopyTrade(
        address leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external {
        require(copyRelay.strategyNFT().isStrategyLeader(leader), "Not a strategy leader");
        require(msg.sender == leader, "Only leader can trigger");
        
        // Execute copy trading
        copyRelay.executeTrade(tokenIn, tokenOut, amountIn, amountOut);
        
        emit LeaderTradeDetected(leader, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @dev Get pending trade for a trader
     * @param trader Trader address
     * @return Pending trade details
     */
    function getPendingTrade(address trader) external view returns (PendingTrade memory) {
        return _pendingTrades[trader];
    }
    
    /**
     * @dev Check if copy trading is enabled for a pool
     * @param tokenA First token in the pool
     * @param tokenB Second token in the pool
     * @return Whether copy trading is enabled
     */
    function isCopyTradingEnabled(address tokenA, address tokenB) external view returns (bool) {
        bytes32 poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        return copyTradingPools[poolId];
    }
    
    /**
     * @dev Emergency function to pause copy trading for a pool
     * @param poolId Pool identifier
     */
    function pauseCopyTrading(bytes32 poolId) external {
        require(msg.sender == address(copyRelay), "Only CopyRelay can pause");
        copyTradingPools[poolId] = false;
        emit PoolRegistered(poolId, false);
    }
}