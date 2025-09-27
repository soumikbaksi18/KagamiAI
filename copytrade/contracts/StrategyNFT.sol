// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StrategyNFT
 * @dev NFT contract for strategy leaders in the SocialDeFi Copy AMM
 * @notice This contract manages strategy NFTs that represent trading strategies
 */
contract StrategyNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    address public copyRelay;
    
    struct Strategy {
        address leader;
        string name;
        string description;
        uint256 performanceFee; // in basis points (100 = 1%)
        bool isActive;
        uint256 totalFollowers;
        uint256 totalVolume;
        uint256 createdAt;
    }
    
    mapping(uint256 => Strategy) public strategies;
    mapping(address => uint256) public leaderToTokenId;
    mapping(address => bool) public isLeader;
    
    event StrategyCreated(
        uint256 indexed tokenId,
        address indexed leader,
        string name,
        uint256 performanceFee
    );
    
    event StrategyUpdated(
        uint256 indexed tokenId,
        string name,
        string description,
        uint256 performanceFee,
        bool isActive
    );
    
    event FollowerAdded(uint256 indexed tokenId, address indexed follower);
    event FollowerRemoved(uint256 indexed tokenId, address indexed follower);
    
    constructor() ERC721("StrategyNFT", "STRAT") Ownable(msg.sender) {}
    
    /**
     * @dev Set CopyRelay contract address
     * @param _copyRelay CopyRelay contract address
     */
    function setCopyRelay(address _copyRelay) external onlyOwner {
        copyRelay = _copyRelay;
    }
    
    /**
     * @dev Create a new strategy NFT
     * @param name Strategy name
     * @param description Strategy description
     * @param performanceFee Performance fee in basis points
     */
    function createStrategy(
        string memory name,
        string memory description,
        uint256 performanceFee
    ) external returns (uint256) {
        require(performanceFee <= 1000, "Performance fee cannot exceed 10%");
        // Removed: require(!isLeader[msg.sender], "Address already has a strategy");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        
        strategies[newTokenId] = Strategy({
            leader: msg.sender,
            name: name,
            description: description,
            performanceFee: performanceFee,
            isActive: true,
            totalFollowers: 0,
            totalVolume: 0,
            createdAt: block.timestamp
        });
        
        // For multiple strategies, we'll store the latest strategy ID
        // The frontend can use events to get all strategies by a leader
        leaderToTokenId[msg.sender] = newTokenId;
        isLeader[msg.sender] = true;
        
        emit StrategyCreated(newTokenId, msg.sender, name, performanceFee);
        
        return newTokenId;
    }
    
    /**
     * @dev Update strategy details (only by strategy owner)
     * @param tokenId Strategy token ID
     * @param name New strategy name
     * @param description New strategy description
     * @param performanceFee New performance fee
     * @param isActive Whether strategy is active
     */
    function updateStrategy(
        uint256 tokenId,
        string memory name,
        string memory description,
        uint256 performanceFee,
        bool isActive
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not strategy owner");
        require(performanceFee <= 1000, "Performance fee cannot exceed 10%");
        
        strategies[tokenId].name = name;
        strategies[tokenId].description = description;
        strategies[tokenId].performanceFee = performanceFee;
        strategies[tokenId].isActive = isActive;
        
        emit StrategyUpdated(tokenId, name, description, performanceFee, isActive);
    }
    
    /**
     * @dev Get strategy details
     * @param tokenId Strategy token ID
     * @return Strategy struct
     */
    function getStrategy(uint256 tokenId) external view returns (Strategy memory) {
        return strategies[tokenId];
    }
    
    /**
     * @dev Get strategy by leader address
     * @param leader Leader address
     * @return Strategy struct
     */
    function getStrategyByLeader(address leader) external view returns (Strategy memory) {
        uint256 tokenId = leaderToTokenId[leader];
        require(tokenId != 0, "No strategy found for leader");
        return strategies[tokenId];
    }
    
    /**
     * @dev Update follower count (only callable by CopyRelay)
     * @param tokenId Strategy token ID
     * @param delta Change in follower count (+1 or -1)
     */
    function updateFollowerCount(uint256 tokenId, int256 delta) external {
        // This will be called by CopyRelay contract
        require(msg.sender == copyRelay, "Only CopyRelay can update follower count");
        
        if (delta > 0) {
            strategies[tokenId].totalFollowers += uint256(delta);
        } else {
            strategies[tokenId].totalFollowers -= uint256(-delta);
        }
    }
    
    /**
     * @dev Update strategy volume (only callable by CopyRelay)
     * @param tokenId Strategy token ID
     * @param volume Volume to add
     */
    function updateVolume(uint256 tokenId, uint256 volume) external {
        // This will be called by CopyRelay contract
        require(msg.sender == copyRelay, "Only CopyRelay can update volume");
        strategies[tokenId].totalVolume += volume;
    }
    
    /**
     * @dev Check if address is a strategy leader
     * @param leader Address to check
     * @return True if address is a leader
     */
    function isStrategyLeader(address leader) external view returns (bool) {
        return isLeader[leader];
    }
    
    /**
     * @dev Get total number of strategies
     * @return Total strategy count
     */
    function totalStrategies() external view returns (uint256) {
        return _tokenIds;
    }
}