// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/types/BeforeSwapDelta.sol";
import "./CopyRelay.sol";

/**
 * @title CopyTradingHook
 * @dev Real Uniswap v4 Hook for automatic copy trading
 * @notice This hook intercepts swaps and triggers copy trading for strategy leaders
 */
contract CopyTradingHook is BaseHook {
    using BeforeSwapDeltaLibrary for BeforeSwapDelta;
    
    CopyRelay public immutable copyRelay;
    
    // Events
    event LeaderTradeDetected(
        address indexed leader,
        PoolKey indexed key,
        IPoolManager.SwapParams params
    );
    
    event CopyTradeExecuted(
        address indexed leader,
        address indexed follower,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(IPoolManager _poolManager, address _copyRelay) BaseHook(_poolManager) {
        copyRelay = CopyRelay(_copyRelay);
    }
    
    /**
     * @dev Returns the hook permissions
     * We want to hook into beforeSwap and afterSwap
     */
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,  // We want to detect swaps before they happen
            afterSwap: true,   // We want to execute copy trades after swaps
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
    
    /**
     * @dev Called before each swap
     * We use this to detect if a strategy leader is about to trade
     */
    function beforeSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        // Get the swap originator (this requires some additional logic in practice)
        address trader = _getSwapOriginator(params);
        
        // Check if this trader is a strategy leader
        if (copyRelay.strategyNFT().isStrategyLeader(trader)) {
            emit LeaderTradeDetected(trader, key, params);
        }
        
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
    
    /**
     * @dev Called after each swap
     * We use this to execute copy trades for followers
     */
    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) external override returns (bytes4, int128) {
        // Get the swap originator
        address trader = _getSwapOriginator(params);
        
        // Only proceed if this is a strategy leader
        if (!copyRelay.strategyNFT().isStrategyLeader(trader)) {
            return (BaseHook.afterSwap.selector, 0);
        }
        
        // Extract trade details
        address tokenIn = address(key.currency0);
        address tokenOut = address(key.currency1);
        
        // Determine amounts from the delta
        uint256 amountIn;
        uint256 amountOut;
        
        if (params.zeroForOne) {
            // Swapping token0 for token1
            amountIn = uint256(uint128(-delta.amount0()));
            amountOut = uint256(uint128(delta.amount1()));
        } else {
            // Swapping token1 for token0
            amountIn = uint256(uint128(-delta.amount1()));
            amountOut = uint256(uint128(delta.amount0()));
            tokenIn = address(key.currency1);
            tokenOut = address(key.currency0);
        }
        
        // Execute copy trades through CopyRelay
        _executeCopyTrades(trader, tokenIn, tokenOut, amountIn, amountOut);
        
        return (BaseHook.afterSwap.selector, 0);
    }
    
    /**
     * @dev Execute copy trades for all followers of a leader
     * @param leader Strategy leader address
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function _executeCopyTrades(
        address leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        try copyRelay.executeTrade(tokenIn, tokenOut, amountIn, amountOut) {
            // Get followers for this leader
            address[] memory followers = copyRelay.getFollowers(leader);
            
            // Emit events for each follower
            for (uint256 i = 0; i < followers.length; i++) {
                emit CopyTradeExecuted(leader, followers[i], amountIn, amountOut);
            }
        } catch {
            // If copy trade execution fails, we don't want to revert the original swap
            // Just continue silently
        }
    }
    
    /**
     * @dev Get the originator of a swap (simplified version)
     * In practice, this would need more sophisticated logic to track the original caller
     * @param params Swap parameters
     * @return trader The address of the trader
     */
    function _getSwapOriginator(IPoolManager.SwapParams calldata params) internal view returns (address) {
        // This is a simplified version - in practice you'd need to track
        // the original caller through the call stack or use msg.sender tracking
        return msg.sender;
    }
}