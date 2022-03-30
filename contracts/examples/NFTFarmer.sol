// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '../libraries/TransferHelper.sol';
import '../libraries/NFTHelper.sol';
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
  uint256 public remainingRewards;
  address public nftContract;
  bool private initialized;
  address private funder;
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

  /// @dev function to iniaitlize and pull the funds into the contract to be paid out
  /// @dev this would probably be an onlyOwner function in real usage
  function initialize(uint256 totalRewards) public {
    require(!initialized, 'already initalized');
    initialized = true;
    TransferHelper.transferTokens(rewardToken, msg.sender, address(this), totalRewards);
    /// @dev set the remaining amount to the total
    remainingRewards = totalRewards;
    /// @dev set our nice funder to the msg.sender - thanks for funding the contract!
    funder = msg.sender;
    emit Started(totalRewards);
  }

  /// @notice this is a super basic example yield farming function
  /// @notice all it does is prove that you have locked tokens and can therefore claim some rewards
  /// @notice only allowed to claim once though based on our mapping
  function claimRewards() public nonReentrant {
    require(initialized, 'not initialized');
    require(!claimed[msg.sender], 'already claimed your rewards');
    /// @dev set to true for reentrancy guard
    claimed[msg.sender] == true;
    /// @dev get their locked token balance
    uint256 lockedTokens = NFTHelper.getLockedTokenBalance(nftContract, msg.sender, lockToken);
    /// @dev calculate rewards to deliver
    uint256 payout = lockedTokens * rewardRate;
    /// @dev check that there is enough in the contract to pay
    require(remainingRewards >= payout, 'not enough rewards left');
    /// @dev subtract the payout
    remainingRewards -= payout;
    /// @dev transfer the rewards from this contract to the claimmant
    TransferHelper.withdrawTokens(rewardToken, msg.sender, payout);
    emit RewardsClaimed(msg.sender, lockedTokens, payout);
  }

  function close() public nonReentrant {
    require(initialized, 'not initialized');
    require(msg.sender == funder, 'not the funder');
    /// @dev set the initialized back to false!
    initialized = false;
    require(remainingRewards > 0, 'nothing left');
    /// @dev send the remainder home
    TransferHelper.withdrawTokens(rewardToken, funder, remainingRewards);
    emit Closed(remainingRewards);
  }

  event Started(uint256 _totalRewards);
  event RewardsClaimed(address _claimer, uint256 _lockedTokens, uint256 _payout);
  event Closed(uint256 _remainingTokens);
}
