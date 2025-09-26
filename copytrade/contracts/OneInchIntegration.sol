// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CopyRelay.sol";

/**
 * @title OneInchIntegration 
 * @dev Phase 3: 1inch Limit Order Protocol integration for copy trading
 * @notice Enables TWAP execution and advanced order types for strategy leaders
 */
contract OneInchIntegration is Ownable {
    using SafeERC20 for IERC20;

    CopyRelay public immutable copyRelay;
    
    // 1inch Limit Order Protocol address (varies by network)
    address public limitOrderProtocol;
    
    struct LimitOrder {
        uint256 orderId;
        address maker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
        bool isActive;
        bool isTWAP;
        uint256 twapDuration;
        uint256 executedAmount;
        uint256 createdAt;
    }
    
    struct TWAPOrder {
        uint256 totalAmount;
        uint256 intervalDuration; // seconds between executions
        uint256 numberOfIntervals;
        uint256 currentInterval;
        uint256 lastExecutionTime;
        uint256 amountPerInterval;
    }
    
    mapping(uint256 => LimitOrder) public limitOrders;
    mapping(uint256 => TWAPOrder) public twapOrders;
    mapping(address => uint256[]) public leaderOrders;
    
    uint256 public nextOrderId = 1;
    
    // Events
    event LimitOrderPlaced(
        uint256 indexed orderId,
        address indexed leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline,
        bool isTWAP
    );
    
    event LimitOrderExecuted(
        uint256 indexed orderId,
        address indexed leader,
        uint256 amountIn,
        uint256 amountOut,
        bool isPartialFill
    );
    
    event TWAPOrderCreated(
        uint256 indexed orderId,
        address indexed leader,
        uint256 totalAmount,
        uint256 intervals,
        uint256 duration
    );
    
    event TWAPIntervalExecuted(
        uint256 indexed orderId,
        uint256 intervalNumber,
        uint256 amountExecuted,
        uint256 amountReceived
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed leader);
    
    event PriceDataUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp
    );

    modifier onlyStrategyLeader() {
        require(copyRelay.strategyNFT().isStrategyLeader(msg.sender), "Not a strategy leader");
        _;
    }
    
    constructor(address _copyRelay, address _limitOrderProtocol) Ownable(msg.sender) {
        copyRelay = CopyRelay(_copyRelay);
        limitOrderProtocol = _limitOrderProtocol;
    }
    
    /**
     * @dev Place a limit order through 1inch
     * @param tokenIn Input token address
     * @param tokenOut Output token address  
     * @param amountIn Input amount
     * @param minAmountOut Minimum output amount
     * @param deadline Order deadline
     */
    function placeLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external onlyStrategyLeader returns (uint256 orderId) {
        require(deadline > block.timestamp, "Invalid deadline");
        require(amountIn > 0, "Invalid amount");
        
        orderId = nextOrderId++;
        
        // Transfer tokens from leader
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve 1inch Limit Order Protocol
        IERC20(tokenIn).forceApprove(limitOrderProtocol, amountIn);
        
        // Store order details
        limitOrders[orderId] = LimitOrder({
            orderId: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            deadline: deadline,
            isActive: true,
            isTWAP: false,
            twapDuration: 0,
            executedAmount: 0,
            createdAt: block.timestamp
        });
        
        leaderOrders[msg.sender].push(orderId);
        
        emit LimitOrderPlaced(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            deadline,
            false
        );
        
        // Call 1inch API to place order (this would be done off-chain in practice)
        _submitTo1inch(orderId);
        
        return orderId;
    }
    
    /**
     * @dev Place a TWAP (Time-Weighted Average Price) order
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param totalAmount Total amount to trade
     * @param minAmountOut Minimum total output amount
     * @param intervalDuration Duration between trades (seconds)
     * @param numberOfIntervals Number of intervals to split trade
     */
    function placeTWAPOrder(
        address tokenIn,
        address tokenOut,
        uint256 totalAmount,
        uint256 minAmountOut,
        uint256 intervalDuration,
        uint256 numberOfIntervals
    ) external onlyStrategyLeader returns (uint256 orderId) {
        require(totalAmount > 0, "Invalid total amount");
        require(numberOfIntervals > 1, "Need at least 2 intervals");
        require(intervalDuration >= 300, "Minimum 5 minutes between intervals");
        
        orderId = nextOrderId++;
        uint256 amountPerInterval = totalAmount / numberOfIntervals;
        uint256 deadline = block.timestamp + (intervalDuration * numberOfIntervals);
        
        // Transfer tokens from leader
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Store order details
        limitOrders[orderId] = LimitOrder({
            orderId: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: totalAmount,
            minAmountOut: minAmountOut,
            deadline: deadline,
            isActive: true,
            isTWAP: true,
            twapDuration: intervalDuration * numberOfIntervals,
            executedAmount: 0,
            createdAt: block.timestamp
        });
        
        // Store TWAP-specific data
        twapOrders[orderId] = TWAPOrder({
            totalAmount: totalAmount,
            intervalDuration: intervalDuration,
            numberOfIntervals: numberOfIntervals,
            currentInterval: 0,
            lastExecutionTime: block.timestamp,
            amountPerInterval: amountPerInterval
        });
        
        leaderOrders[msg.sender].push(orderId);
        
        emit LimitOrderPlaced(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            totalAmount,
            minAmountOut,
            deadline,
            true
        );
        
        emit TWAPOrderCreated(orderId, msg.sender, totalAmount, numberOfIntervals, intervalDuration);
        
        return orderId;
    }
    
    /**
     * @dev Execute next interval of a TWAP order
     * @param orderId Order ID
     */
    function executeTWAPInterval(uint256 orderId) external {
        LimitOrder storage order = limitOrders[orderId];
        TWAPOrder storage twapOrder = twapOrders[orderId];
        
        require(order.isActive, "Order not active");
        require(order.isTWAP, "Not a TWAP order");
        require(
            block.timestamp >= twapOrder.lastExecutionTime + twapOrder.intervalDuration,
            "Too early for next interval"
        );
        require(twapOrder.currentInterval < twapOrder.numberOfIntervals, "TWAP completed");
        
        uint256 amountToExecute = twapOrder.amountPerInterval;
        
        // Last interval might have remainder
        if (twapOrder.currentInterval == twapOrder.numberOfIntervals - 1) {
            amountToExecute = order.amountIn - order.executedAmount;
        }
        
        // Execute the trade through 1inch
        uint256 amountOut = _executeOn1inch(order.tokenIn, order.tokenOut, amountToExecute);
        
        // Update order state
        order.executedAmount += amountToExecute;
        twapOrder.currentInterval++;
        twapOrder.lastExecutionTime = block.timestamp;
        
        // Transfer output tokens to leader
        IERC20(order.tokenOut).safeTransfer(order.maker, amountOut);
        
        emit TWAPIntervalExecuted(orderId, twapOrder.currentInterval, amountToExecute, amountOut);
        
        // Trigger copy trading for followers
        copyRelay.executeTrade(order.tokenIn, order.tokenOut, amountToExecute, amountOut);
        
        // Complete order if all intervals executed
        if (twapOrder.currentInterval >= twapOrder.numberOfIntervals) {
            order.isActive = false;
            emit LimitOrderExecuted(orderId, order.maker, order.amountIn, 0, false);
        }
    }
    
    /**
     * @dev Cancel an active order
     * @param orderId Order ID
     */
    function cancelOrder(uint256 orderId) external {
        LimitOrder storage order = limitOrders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.isActive, "Order not active");
        
        order.isActive = false;
        
        // Return remaining tokens to maker
        uint256 remainingAmount = order.amountIn - order.executedAmount;
        if (remainingAmount > 0) {
            IERC20(order.tokenIn).safeTransfer(order.maker, remainingAmount);
        }
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @dev Get price quote from 1inch API
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Expected output amount
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        // This would call 1inch API in practice
        // For now, return a mock price
        return _getMockPrice(tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @dev Get orders for a strategy leader
     * @param leader Leader address
     * @return orderIds Array of order IDs
     */
    function getLeaderOrders(address leader) external view returns (uint256[] memory) {
        return leaderOrders[leader];
    }
    
    /**
     * @dev Get order details
     * @param orderId Order ID
     * @return order Order details
     */
    function getOrder(uint256 orderId) external view returns (LimitOrder memory) {
        return limitOrders[orderId];
    }
    
    /**
     * @dev Get TWAP order details
     * @param orderId Order ID
     * @return twapOrder TWAP order details
     */
    function getTWAPOrder(uint256 orderId) external view returns (TWAPOrder memory) {
        return twapOrders[orderId];
    }
    
    /**
     * @dev Update 1inch Limit Order Protocol address
     * @param newProtocol New protocol address
     */
    function updateLimitOrderProtocol(address newProtocol) external onlyOwner {
        limitOrderProtocol = newProtocol;
    }
    
    // Internal functions
    
    /**
     * @dev Submit order to 1inch (placeholder)
     * @param orderId Order ID
     */
    function _submitTo1inch(uint256 orderId) internal {
        // This would make API call to 1inch to place the order
        // Implementation would use 1inch SDK or direct API calls
    }
    
    /**
     * @dev Execute trade on 1inch (placeholder)
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Output amount received
     */
    function _executeOn1inch(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // This would execute the actual trade through 1inch
        // For now, return mock amount
        return _getMockPrice(tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @dev Get mock price for testing
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Mock output amount
     */
    function _getMockPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal pure returns (uint256 amountOut) {
        // Mock price calculation (1:1000 ratio for USDC:ETH example)
        if (tokenIn < tokenOut) {
            return amountIn * 1000; // USDC to ETH-like conversion
        } else {
            return amountIn / 1000; // ETH to USDC-like conversion  
        }
    }
}