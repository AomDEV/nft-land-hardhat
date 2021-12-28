// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @custom:security-contact siriwat576@gmail.com
contract Land is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    event OnMintedLand(uint256 zoneId, uint256 x, uint256 y, uint256 tokenId);
    event OnLandTypeChanged(uint256 zoneId, uint256 x, uint256 y, LandType landType);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
    bytes32 public constant DEV_ROLE = keccak256("DEV_ROLE");

    Counters.Counter private _tokenIdCounter;

    enum LandType {
        AVAILABLE,
        RESERVED,
        SPONSORED,
        UNAVAILABLE
    }

    struct LandMetadata {
        uint256 x;
        uint256 y;
        LandType landType;
        uint256 tokenId;
    }

    struct LandDetail {
        uint256 x;
        uint256 y;
        LandType landType;
        uint256 tokenId;
        address owner;
    }

    mapping(uint256 => LandMetadata[]) public _lands;
    mapping(uint256 => string) private _tokenURI;
    uint256[] public _zones;

    address public _landStorage;

    constructor() ERC721("Multiverse Land", "LAND") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(DEV_ROLE, msg.sender);
    }

    // === Core ===
    function safeMint(address to, string memory uri) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function _isZoneExists(uint256 zoneId) internal view returns(bool){
        for(uint256 i = 0; i < _zones.length; i++){
            if(_zones[i] == zoneId) return true;
        }
        return false;
    }

    function getZoneList() public view returns(uint256[] memory) {
        return _zones;
    }
    // ============

    // === Token Manager ===
    function _getTokenURI(uint256 zoneId) internal view returns(string memory) {
        return _tokenURI[zoneId];
    }

    function setZoneTokenURI(uint256 zoneId, string memory uri) public onlyRole(DEV_ROLE) {
        _tokenURI[zoneId] = uri;
    }
    // ============

    // === Modifier ===
    modifier uniqueLand(uint256 zoneId, uint256 x, uint256 y) {
        for(uint256 i = 0; i < _lands[zoneId].length; i++){
            if(_lands[zoneId][i].x == x && _lands[zoneId][i].y == y) revert("Land is already exists");
        }
        _;
    }
    // ============

    // === Base ===
    function batchPremint(uint256 zoneId, uint256[] memory x, uint256[] memory y, LandType landType) public onlyRole(MINTER_ROLE) {
        require(
            x.length == y.length, 
            "Invalid parameter"
        );

        for(uint256 i = 0; i < x.length; i++){
            premint(zoneId, x[i], y[i], landType);
        }
    }

    function premint(uint256 zoneId, uint256 x, uint256 y, LandType landType) public onlyRole(MINTER_ROLE) uniqueLand(zoneId, x, y) {
        string memory tokenUri = _getTokenURI(zoneId);
        require(bytes(tokenUri).length > 0, "Not found metadata URI");
        require(_landStorage != address(0) && _landStorage != address(this), "Land Storage is not found");
        require(_isZoneExists(zoneId), "tThis zone is not exists");

        // Generate Token ID
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint NFT & Set NFT Token URI
        _safeMint(_landStorage, tokenId);
        _setTokenURI(tokenId, tokenUri);

        _lands[zoneId].push(
            LandMetadata({
                x: x,
                y: y,
                landType: landType,
                tokenId: tokenId
            })
        );

        emit OnMintedLand(zoneId, x, y, tokenId);
    }

    function createZone(uint256 zoneId, string memory _uri) public{
        require(bytes(_uri).length > 0, "Invalid Token URI");
        require(zoneId >= 0, "Invalid Zone-ID");
        require(!_isZoneExists(zoneId), "This zone is already exists");

        _zones.push(zoneId);
        setZoneTokenURI(zoneId, _uri);
    }

    function _setLandType(uint256 zoneId, uint256 x, uint256 y, LandType landType) internal {
        for(uint256 i = 0; i < _lands[zoneId].length; i++){
            if(_lands[zoneId][i].x == x && _lands[zoneId][i].y == y){
                // check this land is already purchased?
                if(ownerOf(_lands[zoneId][i].tokenId) != _landStorage) 
                    revert("Land is not available");
                if(_lands[zoneId][i].landType == landType) 
                    revert("Duplicate value");
                _lands[zoneId][i].landType = landType;
                emit OnLandTypeChanged(zoneId, x, y, landType);
                break;
            }
        }
    }

    function _getLandByTokenId(uint256 tokenId) internal view returns(uint256,LandMetadata memory) {
        for(uint256 zoneId = 0; zoneId < _zones.length; zoneId++){
            for(uint256 i = 0; i < _lands[zoneId].length; i++){
                if(_lands[zoneId][i].tokenId == tokenId) {
                    return (zoneId, _lands[zoneId][i]);
                }
            }
        }
        return (
            0,
            LandMetadata({
                x: 0,
                y: 0,
                landType: LandType.UNAVAILABLE,
                tokenId: 0
            })
        );
    }

    function batchSetLandType(uint256 zoneId, uint256[] memory x, uint256[] memory y, LandType landType) public onlyRole(MANAGER_ROLE) {
        require(x.length == y.length, "Invalid parameter");
        for(uint256 i = 0; i < x.length; i++){
            setLandType(zoneId, x[i], y[i], landType);
        }
    }

    function setLandStorage(address newStorage) public onlyRole(DEV_ROLE) {
        _landStorage = newStorage;
    }

    function setLandType(uint256 zoneId, uint256 x, uint256 y, LandType landType) public onlyRole(MANAGER_ROLE){
        _setLandType(zoneId, x, y, landType);
    }
    // ============

    // === UI ===
    function getLands(uint256 zoneId) public view returns(LandDetail[] memory) {
        LandDetail[] memory details = new LandDetail[](_lands[zoneId].length);
        for(uint256 i = 0; i < _lands[zoneId].length; i++){
            address owner = ownerOf(_lands[zoneId][i].tokenId);
            details[i] = LandDetail({
                x: _lands[zoneId][i].x,
                y: _lands[zoneId][i].y,
                landType: _lands[zoneId][i].landType,
                tokenId: _lands[zoneId][i].tokenId,
                owner: owner == _landStorage ? address(0) : owner
            });
        }
        return details;
    }
    // ============

    // === Contract ===
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    // ============
}