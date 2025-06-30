// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract NFTTransfer {
    function transferNFT(
        address nftContract,
        uint256 tokenId,
        address to
    ) external {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        nft.transferFrom(msg.sender, to, tokenId);
    }
    
    function batchTransferNFTs(
        address nftContract,
        uint256[] calldata tokenIds,
        address to
    ) external {
        IERC721 nft = IERC721(nftContract);
        for (uint i = 0; i < tokenIds.length; i++) {
            require(nft.ownerOf(tokenIds[i]) == msg.sender, "Not owner");
            nft.transferFrom(msg.sender, to, tokenIds[i]);
        }
    }
}