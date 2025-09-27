// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimplePool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimplePoolFactory is Ownable {
    mapping(address => mapping(address => mapping(uint24 => address))) public getPool;
    address[] public allPools;
    
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        address pool,
        uint256 poolLength
    );
    
    constructor() Ownable(msg.sender) {}
    
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 initialPrice
    ) external returns (address pool) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "ZERO_ADDRESS");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(getPool[token0][token1][fee] == address(0), "POOL_EXISTS");
        
        // Deploy new pool
        bytes memory bytecode = type(SimplePool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, fee));
        
        assembly {
            pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        
        // Initialize pool
        SimplePool(pool).initialize(token0, token1, fee, initialPrice);
        
        // Update mappings
        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool; // populate mapping in the reverse direction
        allPools.push(pool);
        
        emit PoolCreated(token0, token1, fee, pool, allPools.length);
    }
    
    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }
}