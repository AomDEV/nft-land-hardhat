// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC20 {
    function allowance(address owner, address spender) external returns(uint256);
    function approve(address spender, uint256 amount) external returns(bool);
    function transfer(address recipient, uint256 amount) external returns(bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns(bool);
    function balanceOf(address account) external returns(uint256);
}
interface IERC721 {
    function balanceOf(address owner) external returns(uint256);
    function ownerOf(uint256 tokenId) external returns(address);
    function isApprovedForAll(address account, address operator) external returns(bool);
    function supportsInterface(bytes4 interfaceId) external returns(bool);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

/// @custom:security-contact siriwat576@gmail.com
contract Storage is IERC721Receiver, AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes4 public constant ERC721_INTERFACEID = 0x80ac58cd;

    event OnLandPurchased(uint256[] tokenIds, address newOwner);
    event OnLandPriceChanged(uint256 newPrice);

    address public _ERC20;
    address public _ERC721;
    address public _WALLET;
    uint256 public _pricePerBlock = 1 ether;

    constructor(
        address _land,
        address _token
    ) {
        _ERC721 = _land;
        _ERC20 = _token;

        // Grant role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function batchPurchase(uint256[] memory tokenIds) public {
        for(uint256 i = 0; i < tokenIds.length; i++) {
            if(
                IERC721(_ERC721).ownerOf(tokenIds[i]) == address(this)
            ){
                IERC721(_ERC721).safeTransferFrom(address(this), msg.sender, tokenIds[i]);
            } else{
                revert("Land is not available");
            }
        }

        uint256 totalPrice = _pricePerBlock * tokenIds.length;
        IERC20(_ERC20).transferFrom(msg.sender, _WALLET, totalPrice);

        emit OnLandPurchased(tokenIds, msg.sender);
    }

    // === Role ===
    function grantManagerRole(address user) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MANAGER_ROLE, user);
    }
    // ============

    // === Setting ===
    function setERC20(address erc20) public onlyRole(MANAGER_ROLE) {
        _ERC20 = erc20;
    }
    function setERC721(address erc721) public onlyRole(MANAGER_ROLE) {
        require(IERC721(erc721).supportsInterface(ERC721_INTERFACEID), "Address is not support ERC721");

        _ERC721 = erc721;
    }
    function setWallet(address erc20) public onlyRole(MANAGER_ROLE){
        _WALLET = erc20;
    }
    function setPricePerBlock(uint256 price) public onlyRole(MANAGER_ROLE) {
        _pricePerBlock = 1 ether * price;

        emit OnLandPriceChanged(_pricePerBlock);
    }
    // ============

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}