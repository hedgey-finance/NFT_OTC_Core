// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '../libraries/TransferHelper.sol';
import '../interfaces/INFT.sol';

/// @notice this is a smart contract for example only that will pay token rewards for locking up tokens (once)
/// ... to people who have locked up your LP (or any ERC20) token in an NFT.
/// @notice its a basic way to yield farm with your LP tokens being locked up by the Hedgeys NFT!

/// @notice THIS IS JUST AND EXAMPLE AND SHOULD NOT BE USED IN PRODUCTION!!!!!!!!!!!!!!!!!!!
contract NFTFarmer is ReentrancyGuard {
  address public rewardToken;
  address public lockToken;
  uint256 public rewardRate;
  uint256 public rewards;
  address public nftContract;
  mapping(address => bool) public claimed;

  constructor(
    address _rewardToken,
    address _lockToken,
    uint256 _rewardRate,
    address _nftContract,
    uint256 _rewards
  ) {
    rewardToken = _rewardToken;
    lockToken = _lockToken;
    rewardRate = _rewardRate;
    nftContract = _nftContract;
    rewards = _rewards;
    /// @dev gotta pull the tokens into the contract!
    TransferHelper.transferTokens(_rewardToken, msg.sender, address(this), _rewards);
  }

  /// @notice function to get the balances for a given wallet
  function getLockedTokenBalance(address holder) public view returns (uint256 lockedTokens) {
    uint256 holdersBalance = IERC721(nftContract).balanceOf(holder);
    /// @dev for loop going through the holders balance to get each of their token IDs
    for (uint256 i = 0; i < holdersBalance; i++) {
      /// @dev gets the tokenId
      uint256 tokenId = IERC721Enumerable(nftContract).tokenOfOwnerByIndex(holder, i);
      /// @dev now we can use that tokenId to get their time lock details
      (uint256 amount, address token, uint256 unlockDate) = INFT(nftContract).futures(tokenId);
      /// @dev only record the amounts that match the locked token we are tracking and paying rewards for
      if (token == lockToken) {
        lockedTokens += amount;
      }
    }
  }

  /// @notice this is a super basic example yield farming function
  /// @notice all it does is prove that you have locked tokens and can therefore claim some rewards
  /// @notice only allowed to claim once though based on our mapping
  function claimRewards() public nonReentrant {
    require(!claimed[msg.sender], 'already claimed your rewards');
    /// @dev set to true for reentrancy guard
    claimed[msg.sender] == true;
    /// @dev get their locked token balance
    uint256 lockedTokens = getLockedTokenBalance(msg.sender);
    /// @dev calculate rewards to deliver
    uint256 payout = lockedTokens * rewardRate;
    TransferHelper.withdrawTokens(rewardToken, msg.sender, payout);
    emit RewardsClaimed(msg.sender, lockedTokens, payout);
  }

  event RewardsClaimed(address _claimer, uint256 _lockedTokens, uint256 _payout);
}
