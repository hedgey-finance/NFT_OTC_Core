// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

import './libraries/TransferHelper.sol';
import './interfaces/INFT.sol';

/// @notice basic smart contract to allow minting of Hedgeys NFTs in batches
contract BatchNFTMinter {
  event BatchMinted(uint256 mintType);

  ///@notice basic function for minting multiple hedgys in a single transaction
  /// @param nftContract is the Hedgeys NFT contract that will mint the NFTs, the target of the call
  /// @param holders is an array of the recipients who will receive the minted NFTs
  /// @param token is the token address that is going to be locked in each NFT
  /// @param amounts is an array of the amounts of tokens, this should match the length of the holders array and corresponds in order to the amount each will receive
  /// @param unlockDates is the date set for when each NFT will unlock the tokens, also should match the holders array and each index corresponds to that holders unlockDate
  function batchMint(
    address nftContract,
    address[] memory holders,
    address token,
    uint256[] memory amounts,
    uint256[] memory unlockDates
  ) external {
    _batchMint(nftContract, holders, token, amounts, unlockDates);
  }

  ///@notice batch minter function with the additional mintType input which is spit out in an event for analytics purposes
  /// @param nftContract is the Hedgeys NFT contract that will mint the NFTs, the target of the call
  /// @param holders is an array of the recipients who will receive the minted NFTs
  /// @param token is the token address that is going to be locked in each NFT
  /// @param amounts is an array of the amounts of tokens, this should match the length of the holders array and corresponds in order to the amount each will receive
  /// @param unlockDates is the date set for when each NFT will unlock the tokens, also should match the holders array and each index corresponds to that holders unlockDate
  /// @param mintType is an internal identifier used by Hedgey to associate certain minting behaviors based on integrations and UIs used during the minting process.
  function batchMint(
    address nftContract,
    address[] memory holders,
    address token,
    uint256[] memory amounts,
    uint256[] memory unlockDates,
    uint256 mintType
  ) external {
    emit BatchMinted(mintType);
    _batchMint(nftContract, holders, token, amounts, unlockDates);
  }

  /// @notice the internal function for batch minting used by both external methods
  /// @param nftContract is the Hedgeys NFT contract that will mint the NFTs, the target of the call
  /// @param holders is an array of the recipients who will receive the minted NFTs
  /// @param token is the token address that is going to be locked in each NFT
  /// @param amounts is an array of the amounts of tokens, this should match the length of the holders array and corresponds in order to the amount each will receive
  /// @param unlockDates is the date set for when each NFT will unlock the tokens, also should match the holders array and each index corresponds to that holders unlockDate
  function _batchMint(
    address nftContract,
    address[] memory holders,
    address token,
    uint256[] memory amounts,
    uint256[] memory unlockDates
  ) internal {
    require(holders.length == amounts.length && amounts.length == unlockDates.length, 'array error');
    require(token != address(0) && nftContract != address(0));
    uint256 totalAmount;
    for (uint256 i; i < amounts.length; i++) {
      require(amounts[i] > 0, 'amount error');
      require(unlockDates[i] > block.timestamp, 'date error');
      totalAmount += amounts[i];
    }
    TransferHelper.transferTokens(token, msg.sender, address(this), totalAmount);
    SafeERC20.safeIncreaseAllowance(IERC20(token), nftContract, totalAmount);
    for (uint256 i; i < amounts.length; i++) {
      uint256 tokenId = INFT(nftContract).createNFT(holders[i], amounts[i], token, unlockDates[i]);
      require(tokenId > 0, 'mint error');
    }
  }
}
