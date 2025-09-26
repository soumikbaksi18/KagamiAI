// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OneInchPriceOracle
 * @dev Phase 3: Price oracle using 1inch APIs for copy trading
 * @notice Provides token prices and market data for trading decisions
 */
contract OneInchPriceOracle is Ownable {
    
    struct TokenPrice {
        uint256 price; // Price in USD with 8 decimals
        uint256 timestamp;
        uint256 volume24h;
        bool isValid;
    }
    
    struct MarketData {
        uint256 totalLiquidity;
        uint256 priceImpact; // in basis points
        address[] liquiditySources;
        uint256 confidence; // 0-100
    }
    
    mapping(address => TokenPrice) public tokenPrices;
    mapping(bytes32 => MarketData) public marketData; // keccak256(tokenA, tokenB)
    
    address[] public supportedTokens;
    mapping(address => bool) public isSupported;
    
    // Price feed updater (could be Chainlink, 1inch API bot, etc.)
    mapping(address => bool) public priceUpdaters;
    
    // Events
    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 volume24h,
        uint256 timestamp
    );
    
    event MarketDataUpdated(
        address indexed tokenA,
        address indexed tokenB,
        uint256 totalLiquidity,
        uint256 priceImpact,
        uint256 confidence
    );
    
    event TokenAdded(address indexed token, string symbol);
    event PriceUpdaterAdded(address indexed updater);
    event PriceUpdaterRemoved(address indexed updater);
    
    modifier onlyPriceUpdater() {
        require(priceUpdaters[msg.sender], "Not authorized price updater");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Add deployer as initial price updater
        priceUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Update token price (called by 1inch API bot or oracle)
     * @param token Token address
     * @param price Price in USD (8 decimals)
     * @param volume24h 24h volume
     */
    function updateTokenPrice(
        address token,
        uint256 price,
        uint256 volume24h
    ) external onlyPriceUpdater {
        require(isSupported[token], "Token not supported");
        
        tokenPrices[token] = TokenPrice({
            price: price,
            timestamp: block.timestamp,
            volume24h: volume24h,
            isValid: true
        });
        
        emit PriceUpdated(token, price, volume24h, block.timestamp);
    }
    
    /**
     * @dev Update market data for a token pair
     * @param tokenA First token
     * @param tokenB Second token
     * @param totalLiquidity Total liquidity available
     * @param priceImpact Price impact in basis points
     * @param liquiditySources Array of liquidity source addresses
     * @param confidence Confidence score (0-100)
     */
    function updateMarketData(
        address tokenA,
        address tokenB,
        uint256 totalLiquidity,
        uint256 priceImpact,
        address[] calldata liquiditySources,
        uint256 confidence
    ) external onlyPriceUpdater {
        bytes32 pairId = _getPairId(tokenA, tokenB);
        
        marketData[pairId] = MarketData({
            totalLiquidity: totalLiquidity,
            priceImpact: priceImpact,
            liquiditySources: liquiditySources,
            confidence: confidence
        });
        
        emit MarketDataUpdated(tokenA, tokenB, totalLiquidity, priceImpact, confidence);
    }
    
    /**
     * @dev Get current price for a token
     * @param token Token address
     * @return price Current price in USD (8 decimals)
     * @return timestamp Last update timestamp
     * @return isValid Whether price is valid/fresh
     */
    function getTokenPrice(address token) 
        external 
        view 
        returns (uint256 price, uint256 timestamp, bool isValid) 
    {
        TokenPrice memory tokenPrice = tokenPrices[token];
        
        // Price is valid if updated within last hour
        bool fresh = block.timestamp - tokenPrice.timestamp <= 3600;
        
        return (tokenPrice.price, tokenPrice.timestamp, tokenPrice.isValid && fresh);
    }
    
    /**
     * @dev Get swap quote between two tokens
     * @param tokenIn Input token
     * @param tokenOut Output token  
     * @param amountIn Input amount
     * @return amountOut Expected output amount
     * @return priceImpact Price impact in basis points
     * @return confidence Confidence score
     */
    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 priceImpact, uint256 confidence) {
        require(isSupported[tokenIn] && isSupported[tokenOut], "Unsupported token");
        
        TokenPrice memory priceIn = tokenPrices[tokenIn];
        TokenPrice memory priceOut = tokenPrices[tokenOut];
        
        require(priceIn.isValid && priceOut.isValid, "Invalid price data");
        
        // Calculate output amount based on prices
        uint256 valueIn = (amountIn * priceIn.price) / (10 ** 8); // Convert to USD value
        amountOut = (valueIn * (10 ** 8)) / priceOut.price; // Convert to output token
        
        // Get market data for price impact
        bytes32 pairId = _getPairId(tokenIn, tokenOut);
        MarketData memory market = marketData[pairId];
        
        return (amountOut, market.priceImpact, market.confidence);
    }
    
    /**
     * @dev Get best trading route recommendation
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return useLimit Whether to use limit order
     * @return useTWAP Whether to use TWAP
     * @return reason Recommendation reason
     */
    function getTradingRecommendation(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (bool useLimit, bool useTWAP, string memory reason) {
        (, uint256 priceImpact, uint256 confidence) = this.getSwapQuote(tokenIn, tokenOut, amountIn);
        
        // High price impact -> recommend TWAP
        if (priceImpact > 300) { // > 3%
            return (false, true, "High price impact - use TWAP");
        }
        
        // Medium price impact -> recommend limit order
        if (priceImpact > 100) { // > 1%
            return (true, false, "Medium price impact - use limit order");
        }
        
        // Low confidence -> recommend limit order
        if (confidence < 70) {
            return (true, false, "Low confidence - use limit order");
        }
        
        // Otherwise, instant swap is fine
        return (false, false, "Low impact - instant swap recommended");
    }
    
    /**
     * @dev Add supported token
     * @param token Token address
     * @param symbol Token symbol
     */
    function addSupportedToken(address token, string calldata symbol) external onlyOwner {
        require(!isSupported[token], "Token already supported");
        
        isSupported[token] = true;
        supportedTokens.push(token);
        
        emit TokenAdded(token, symbol);
    }
    
    /**
     * @dev Add price updater
     * @param updater Updater address
     */
    function addPriceUpdater(address updater) external onlyOwner {
        priceUpdaters[updater] = true;
        emit PriceUpdaterAdded(updater);
    }
    
    /**
     * @dev Remove price updater
     * @param updater Updater address
     */
    function removePriceUpdater(address updater) external onlyOwner {
        priceUpdaters[updater] = false;
        emit PriceUpdaterRemoved(updater);
    }
    
    /**
     * @dev Get all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    /**
     * @dev Get market data for token pair
     * @param tokenA First token
     * @param tokenB Second token
     * @return market Market data struct
     */
    function getMarketData(address tokenA, address tokenB) 
        external 
        view 
        returns (MarketData memory market) 
    {
        bytes32 pairId = _getPairId(tokenA, tokenB);
        return marketData[pairId];
    }
    
    /**
     * @dev Check if prices are fresh (updated within last hour)
     * @param tokens Array of token addresses to check
     * @return allFresh Whether all prices are fresh
     * @return stalePrices Array of tokens with stale prices
     */
    function checkPriceFreshness(address[] calldata tokens) 
        external 
        view 
        returns (bool allFresh, address[] memory stalePrices) 
    {
        uint256 staleCount = 0;
        address[] memory tempStale = new address[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            TokenPrice memory price = tokenPrices[tokens[i]];
            if (!price.isValid || block.timestamp - price.timestamp > 3600) {
                tempStale[staleCount] = tokens[i];
                staleCount++;
            }
        }
        
        // Create properly sized array
        stalePrices = new address[](staleCount);
        for (uint256 i = 0; i < staleCount; i++) {
            stalePrices[i] = tempStale[i];
        }
        
        allFresh = staleCount == 0;
    }
    
    // Internal functions
    
    /**
     * @dev Generate pair ID for token pair
     * @param tokenA First token
     * @param tokenB Second token
     * @return pairId Unique pair identifier
     */
    function _getPairId(address tokenA, address tokenB) internal pure returns (bytes32) {
        // Ensure consistent ordering
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        return keccak256(abi.encodePacked(tokenA, tokenB));
    }
}