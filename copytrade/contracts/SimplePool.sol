// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimplePool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    address public token0;
    address public token1;
    uint24 public fee;
    uint256 public currentPrice;
    
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalLiquidity;
    
    // Trading statistics
    uint256 public volume24h;
    uint256 public volumeChangePercent;
    uint256 public lastVolumeReset;
    uint256 public totalVolume;
    uint256 public tradeCount;
    
    mapping(address => uint256) public liquidityBalances;
    
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );
    
    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    
    modifier onlyFactory() {
        // In a real implementation, we'd check the factory address
        _;
    }
    
    function initialize(
        address _token0,
        address _token1,
        uint24 _fee,
        uint256 _initialPrice
    ) external onlyFactory {
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        currentPrice = _initialPrice;
        lastVolumeReset = block.timestamp;
        volumeChangePercent = 0; // Start with 0% change
    }
    
    function addLiquidity(
        uint256 amount0,
        uint256 amount1,
        address to
    ) external nonReentrant returns (uint256 liquidity) {
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_AMOUNT");
        
        // Transfer tokens
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);
        
        // Calculate liquidity
        if (totalLiquidity == 0) {
            liquidity = sqrt(amount0 * amount1);
        } else {
            liquidity = min(
                (amount0 * totalLiquidity) / reserve0,
                (amount1 * totalLiquidity) / reserve1
            );
        }
        
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
        
        // Update state
        reserve0 += amount0;
        reserve1 += amount1;
        totalLiquidity += liquidity;
        liquidityBalances[to] += liquidity;
        
        emit LiquidityAdded(to, amount0, amount1, liquidity);
    }
    
    function swap(
        address tokenIn,
        uint256 amountIn,
        address to
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(tokenIn == token0 || tokenIn == token1, "INVALID_TOKEN");
        require(to != address(0), "INVALID_TO");
        
        bool zeroForOne = tokenIn == token0;
        
        // Simple constant product formula (x * y = k)
        if (zeroForOne) {
            // Selling token0 for token1
            uint256 amountInWithFee = (amountIn * (10000 - fee)) / 10000;
            amountOut = (reserve1 * amountInWithFee) / (reserve0 + amountInWithFee);
            require(amountOut <= reserve1, "INSUFFICIENT_LIQUIDITY");
            
            // Update reserves
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            // Selling token1 for token0
            uint256 amountInWithFee = (amountIn * (10000 - fee)) / 10000;
            amountOut = (reserve0 * amountInWithFee) / (reserve1 + amountInWithFee);
            require(amountOut <= reserve0, "INSUFFICIENT_LIQUIDITY");
            
            // Update reserves
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }
        
        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(zeroForOne ? token1 : token0).safeTransfer(to, amountOut);
        
        // Update trading statistics
        _updateTradingStats(amountIn);
        
        // Update price (simplified)
        currentPrice = (reserve0 * 1e18) / reserve1;
        
        emit Swap(msg.sender, tokenIn, zeroForOne ? token1 : token0, amountIn, amountOut, to);
    }
    
    function _updateTradingStats(uint256 tradeAmount) internal {
        // Reset 24h volume if needed
        if (block.timestamp > lastVolumeReset + 24 hours) {
            uint256 oldVolume = volume24h;
            volume24h = tradeAmount;
            lastVolumeReset = block.timestamp;
            
            // Calculate volume change (simplified)
            if (oldVolume > 0) {
                if (volume24h > oldVolume) {
                    volumeChangePercent = ((volume24h - oldVolume) * 100) / oldVolume;
                } else {
                    volumeChangePercent = ((oldVolume - volume24h) * 100) / oldVolume;
                    volumeChangePercent = volumeChangePercent * type(uint256).max; // Make negative
                }
            }
        } else {
            volume24h += tradeAmount;
        }
        
        totalVolume += tradeAmount;
        tradeCount++;
    }
    
    // View functions for pool statistics
    function getTotalValueLocked() external view returns (uint256) {
        // Return TVL in terms of token0
        return reserve0 + (reserve1 * currentPrice) / 1e18;
    }
    
    function getVolume24h() external view returns (uint256) {
        return volume24h;
    }
    
    function getVolumeChange24h() external view returns (uint256) {
        return volumeChangePercent;
    }
    
    function getAPR() external view returns (uint256) {
        // Simplified APR calculation based on fees collected
        if (totalLiquidity == 0) return 0;
        
        // Estimate APR based on daily volume and fees
        uint256 dailyFees = (volume24h * fee) / 10000;
        uint256 tvl = this.getTotalValueLocked();
        
        if (tvl == 0) return 0;
        
        // Annual percentage rate (simplified)
        return (dailyFees * 365 * 100) / tvl;
    }
    
    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }
    
    // Utility functions
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }
}