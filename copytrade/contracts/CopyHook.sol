// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CopyRelay.sol";

/**
 * @title CopyHook
 * @dev Simplified hook for copy trading functionality
 * @notice This hook provides basic copy trading functionality without Uniswap v4 complexity
 */
contract CopyHook {
    CopyRelay public copyRelay;
    
    event HookInitialized(address indexed copyRelay);
    event TradeDetected(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _copyRelay) {
        copyRelay = CopyRelay(_copyRelay);
        emit HookInitialized(_copyRelay);
    }
    
    /**
     * @dev Detect and process a trade
     * @param trader Address of the trader
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOut Output amount
     */
    function processTrade(
        address trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external {
        // Check if the trader is a strategy leader
        if (copyRelay.strategyNFT().isStrategyLeader(trader)) {
            emit TradeDetected(trader, tokenIn, tokenOut, amountIn, amountOut);
            
            // Trigger copy trading
            copyRelay.executeTrade(tokenIn, tokenOut, amountIn, amountOut);
        }
    }
    
    /**
     * @dev Get the CopyRelay contract address
     * @return CopyRelay contract address
     */
    function getCopyRelay() external view returns (address) {
        return address(copyRelay);
    }
}