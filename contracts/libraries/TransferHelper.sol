// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IWETH.sol';

library TransferHelper {
  using SafeERC20 for IERC20;


  /// @notice This function used for standard ERC20 transfers 
  /// @notice it contains a pre and post balance check
  /// @notice as well as a check on the msg.senders balance
  /// @param token is the address of the ERC20 being transferred
  /// @param from is the remitting address
  /// @param to is the location where they are being delivered
  function transferTokens(
    address token,
    address from,
    address to,
    uint256 amount
  ) internal returns (bool) {
    uint256 priorBalance = IERC20(token).balanceOf(address(to));
    require(IERC20(token).balanceOf(msg.sender) >= amount, 'LIB02: Insufficient Balance');
    SafeERC20.safeTransferFrom(IERC20(token), from, to, amount);
    uint256 postBalance = IERC20(token).balanceOf(address(to));
    require(postBalance - priorBalance == amount, "LIB03: Token Imbalance");
    return true;
  }

  function withdrawTokens(
    address token,
    address to,
    uint256 amount
  ) internal returns (bool) {
    SafeERC20.safeTransfer(IERC20(token), to, amount);
    return true;
  }

  
  /// @dev internal function that handles transfering payments from buyers to sellers with special WETH handling
  /// @dev this function assumes that if the recipient address is a contract, it cannot handle ETH - so we always deliver WETH
  /// @dev special care needs to be taken when using contract addresses to sell deals - to ensure it can handle WETH properly when received
  function transferPayment(
    address weth,
    address token,
    address from,
    address payable to,
    uint256 amount
  ) internal returns (bool) {
    if (token == weth) {
      require(msg.value == amount, 'LIB01: Incorrect Transfer Value');
      if (!Address.isContract(to)) {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed.");
      } else {
        // we want to deliver WETH from ETH here for better handling at contract
        IWETH(weth).deposit{value: amount}();
        assert(IWETH(weth).transfer(to, amount));
      }
    } else {
      bool success = transferTokens(token, from, to, amount);
      require(success, "Transfer error");
    }
    return true;
  }

  /// @dev internal funciton that handles withdrawing tokens that are up for sale to buyers
  /// @dev this function is only called if the tokens are not timelocked
  /// @dev this function handles weth specially and delivers ETH to the recipient
  function withdraw(
    address weth,
    address token,
    address payable to,
    uint256 amount
  ) internal returns (bool) {
    if (token == weth) {
      IWETH(weth).withdraw(amount);
      (bool success, ) = to.call{value: amount}("");
      require(success, "Transfer failed.");
    } else {
      SafeERC20.safeTransfer(IERC20(token), to, amount);
    }
    return true;
  }


}
