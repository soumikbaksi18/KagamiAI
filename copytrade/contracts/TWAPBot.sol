// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TWAPBot - Time-Weighted Average Price Bot using 1inch Limit Order Protocol
 * @dev Implements TWAP trading strategy by splitting large orders into smaller time-distributed orders
 * @notice This contract integrates with 1inch Limit Order Protocol for gasless execution
 */
contract TWAPBot is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TWAPOrder {
        address user;                    // Order creator
        address tokenIn;                 // Token to sell
        address tokenOut;                // Token to buy
        uint256 totalAmountIn;          // Total amount to trade
        uint256 amountPerInterval;      // Amount per execution
        uint256 intervalSeconds;        // Time between executions
        uint256 executedAmount;         // Amount already executed
        uint256 remainingIntervals;     // Number of intervals left
        uint256 lastExecutionTime;      // Last execution timestamp
        uint256 minAmountOut;           // Minimum amount out per interval
        bool isActive;                  // Order status
        uint256 createdAt;              // Creation timestamp
    }

    // State variables
    mapping(address => uint256[]) public userOrders;    // User's order IDs
    mapping(uint256 => TWAPOrder) public orders;        // Order ID to order data
    uint256 public nextOrderId = 1;                     // Next order ID counter
    uint256 public executionFee = 0.001 ether;         // Fee for keepers
    
    // 1inch Integration
    address public oneInchRouter;                       // 1inch aggregation router
    address public limitOrderProtocol;                  // 1inch limit order protocol
    
    // Events
    event TWAPOrderCreated(
        uint256 indexed orderId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 totalAmountIn,
        uint256 intervals,
        uint256 intervalSeconds
    );
    
    event TWAPExecuted(
        uint256 indexed orderId,
        address indexed user,
        uint256 amountIn,
        uint256 amountOut,
        uint256 remainingIntervals
    );
    
    event TWAPOrderCancelled(
        uint256 indexed orderId,
        address indexed user,
        uint256 refundAmount
    );

    constructor(
        address _oneInchRouter,
        address _limitOrderProtocol
    ) Ownable(msg.sender) {
        oneInchRouter = _oneInchRouter;
        limitOrderProtocol = _limitOrderProtocol;
    }

    /**
     * @notice Create a new TWAP order
     * @param tokenIn Token to sell
     * @param tokenOut Token to buy
     * @param totalAmountIn Total amount to trade
     * @param intervals Number of intervals to split the order
     * @param intervalSeconds Time between each execution
     * @param minAmountOut Minimum amount out per interval (slippage protection)
     */
    function createTWAPOrder(
        address tokenIn,
        address tokenOut,
        uint256 totalAmountIn,
        uint256 intervals,
        uint256 intervalSeconds,
        uint256 minAmountOut
    ) external payable nonReentrant {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid tokens");
        require(totalAmountIn > 0, "Amount must be positive");
        require(intervals > 0 && intervals <= 100, "Invalid intervals");
        require(intervalSeconds >= 300, "Minimum 5 minutes interval"); // Minimum 5 minutes
        require(msg.value >= executionFee * intervals, "Insufficient execution fee");

        // Calculate amount per interval
        uint256 amountPerInterval = totalAmountIn / intervals;
        require(amountPerInterval > 0, "Amount per interval too small");

        // Transfer tokens to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), totalAmountIn);

        // Create order
        uint256 orderId = nextOrderId++;
        orders[orderId] = TWAPOrder({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            totalAmountIn: totalAmountIn,
            amountPerInterval: amountPerInterval,
            intervalSeconds: intervalSeconds,
            executedAmount: 0,
            remainingIntervals: intervals,
            lastExecutionTime: 0,
            minAmountOut: minAmountOut,
            isActive: true,
            createdAt: block.timestamp
        });

        userOrders[msg.sender].push(orderId);

        emit TWAPOrderCreated(
            orderId,
            msg.sender,
            tokenIn,
            tokenOut,
            totalAmountIn,
            intervals,
            intervalSeconds
        );
    }

    /**
     * @notice Execute a TWAP order interval
     * @param orderId Order ID to execute
     * @param swapData 1inch swap data for execution
     */
    function executeTWAPInterval(
        uint256 orderId,
        bytes calldata swapData
    ) external nonReentrant {
        TWAPOrder storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(order.remainingIntervals > 0, "No intervals remaining");
        
        // Check if enough time has passed since last execution
        require(
            block.timestamp >= order.lastExecutionTime + order.intervalSeconds,
            "Interval not reached"
        );

        // Calculate execution amount
        uint256 executionAmount = order.amountPerInterval;
        if (order.remainingIntervals == 1) {
            // Last interval - use remaining balance to avoid dust
            executionAmount = order.totalAmountIn - order.executedAmount;
        }

        // Execute swap via 1inch
        uint256 amountOut = _executeSwap(
            order.tokenIn,
            order.tokenOut,
            executionAmount,
            order.minAmountOut,
            swapData
        );

        // Update order state
        order.executedAmount += executionAmount;
        order.remainingIntervals--;
        order.lastExecutionTime = block.timestamp;

        // If order completed, mark as inactive
        if (order.remainingIntervals == 0) {
            order.isActive = false;
        }

        // Transfer tokens to user
        IERC20(order.tokenOut).safeTransfer(order.user, amountOut);

        // Pay execution fee to keeper
        if (address(this).balance >= executionFee) {
            payable(msg.sender).transfer(executionFee);
        }

        emit TWAPExecuted(orderId, order.user, executionAmount, amountOut, order.remainingIntervals);
    }

    /**
     * @notice Cancel a TWAP order and refund remaining tokens
     * @param orderId Order ID to cancel
     */
    function cancelTWAPOrder(uint256 orderId) external nonReentrant {
        TWAPOrder storage order = orders[orderId];
        require(order.user == msg.sender, "Not order owner");
        require(order.isActive, "Order not active");

        uint256 refundAmount = order.totalAmountIn - order.executedAmount;
        require(refundAmount > 0, "Nothing to refund");

        // Mark order as inactive
        order.isActive = false;

        // Refund remaining tokens
        IERC20(order.tokenIn).safeTransfer(order.user, refundAmount);

        // Refund unused execution fees
        uint256 unusedFee = order.remainingIntervals * executionFee;
        if (address(this).balance >= unusedFee) {
            payable(order.user).transfer(unusedFee);
        }

        emit TWAPOrderCancelled(orderId, order.user, refundAmount);
    }

    /**
     * @notice Get user's TWAP orders
     * @param user User address
     * @return Array of order IDs
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    /**
     * @notice Get order details
     * @param orderId Order ID
     * @return Order struct
     */
    function getOrder(uint256 orderId) external view returns (TWAPOrder memory) {
        return orders[orderId];
    }

    /**
     * @notice Check if order can be executed
     * @param orderId Order ID
     * @return canExecute Whether order can be executed now
     */
    function canExecuteOrder(uint256 orderId) external view returns (bool canExecute) {
        TWAPOrder storage order = orders[orderId];
        return order.isActive &&
               order.remainingIntervals > 0 &&
               block.timestamp >= order.lastExecutionTime + order.intervalSeconds;
    }

    /**
     * @notice Get all executable orders (for keepers)
     * @return executableOrders Array of executable order IDs
     */
    function getExecutableOrders() external view returns (uint256[] memory executableOrders) {
        uint256 count = 0;
        
        // First pass: count executable orders
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (_isExecutable(i)) {
                count++;
            }
        }
        
        // Second pass: collect executable orders
        executableOrders = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (_isExecutable(i)) {
                executableOrders[index] = i;
                index++;
            }
        }
    }

    /**
     * @notice Internal function to execute swap via 1inch
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount to swap
     * @param minAmountOut Minimum output amount
     * @param swapData 1inch swap data
     * @return amountOut Actual output amount
     */
    function _executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata swapData
    ) internal returns (uint256 amountOut) {
        // For now, use a simple swap mechanism
        // In production, this would integrate with 1inch aggregation router
        
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        
        // Approve 1inch router
        IERC20(tokenIn).approve(oneInchRouter, amountIn);
        
        // Execute swap via 1inch router
        (bool success,) = oneInchRouter.call(swapData);
        require(success, "Swap failed");
        
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        return amountOut;
    }

    /**
     * @notice Internal function to check if order is executable
     */
    function _isExecutable(uint256 orderId) internal view returns (bool) {
        TWAPOrder storage order = orders[orderId];
        return order.isActive &&
               order.remainingIntervals > 0 &&
               block.timestamp >= order.lastExecutionTime + order.intervalSeconds;
    }

    /**
     * @notice Update execution fee (only owner)
     * @param newFee New execution fee
     */
    function setExecutionFee(uint256 newFee) external onlyOwner {
        executionFee = newFee;
    }

    /**
     * @notice Update 1inch router address (only owner)
     * @param newRouter New router address
     */
    function setOneInchRouter(address newRouter) external onlyOwner {
        oneInchRouter = newRouter;
    }

    /**
     * @notice Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @notice Receive ETH for execution fees
     */
    receive() external payable {}
}