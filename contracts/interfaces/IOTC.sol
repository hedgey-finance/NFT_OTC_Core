// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

/// @notice this interface is used for integrations of the OTC contract
/// @notice it contains the core external functions that can be used to interact with the smart contract

interface IOTC {
  /// @notice function to get information about a deal
  function deals(uint256 _d)
    external
    view
    returns (
      address seller,
      address token,
      address paymentCurrency,
      uint256 remainingAmount,
      uint256 minimumPurchase,
      uint256 price,
      uint256 maturity,
      uint256 unlockDate,
      address buyer
    );

  /// @notice this is the function to create a deal as a seller
  /// @param _token is the token address you want to sell, needs to have a decimals() function in the ERC20 contract
  /// @param _paymentCurrency is the paymentCurrency
  /// @param _amount is the amount of tokens you want to sell
  /// @param _min is the minimum chunk size that can be purchased, must be 0 < min <= _amount
  /// @param _price is the price per token you are willing to sell
  /// @param _maturity indicates how long the order is valid for, expressed by an end date in unix block time
  /// @param _unlockDate is the date by which tokens become unlocked. If this does not require a lock the standard is to set this to 0
  /// @param _buyer is used to indicate if this is a public or private deal. If public use the zero address
  /// ... if this is private input the buyers address and only they can purchase this deal
  /// @dev this will pull funds from the msg.sender into the protocol and then create the deal struct
  function create(
    address _token,
    address _paymentCurrency,
    uint256 _amount,
    uint256 _min,
    uint256 _price,
    uint256 _maturity,
    uint256 _unlockDate,
    address payable _buyer
  ) external payable;

  /// @notice this function is used to close / cancel a deal that has not sold out yet
  /// @dev can be called before or after maturity expiration so long as the remainingAmount > 0
  /// @param _d is the index of the deal held in storage
  function close(uint256 _d) external;

  /// @notice this is the function used for buyers to participate and purchase tokens from a deal
  /// @notice if the tokens are unlocked the buyer will receive them directly
  /// @notice if the tokens have an unlockDate in the future, then buyers will be minted an NFT
  /// ... and the tokens are sent from this contract to the NFT contract during the mint function to store in the protocol as escrow
  /// @notice the NFT is the buyers key to redeeming and unlocking the tokens after the unlockDate has passed
  /// @param _d is the index of the deal that you are looking to purchase from
  /// @param _amount is the amount of tokens to purchase
  /// @dev the _amount must be less than or equal to the remainingAmount, and greater than or equal to the minimumPurchase
  /// ... unless you are buying 100% of the remainingAmount which happens to be less than the minimumPurchase
  function buy(uint256 _d, uint256 _amount) external payable;

  /// @notice event that records all of the information of a new deal generated and available to be purchased
  event NewDeal(
    uint256 _d,
    address _seller,
    address _token,
    address _paymentCurrency,
    uint256 _remainingAmount,
    uint256 _minimumPurchase,
    uint256 _price,
    uint256 _maturity,
    uint256 _unlockDate,
    address _buyer
  );
  /// @notice event that is triggered when a buyer purchases some amount of tokens from a deal
  event TokensBought(uint256 _d, uint256 _amount, uint256 _remainingAmount);
  /// @notice event that is triggered when a deal is closed and can no longer be purhcased from
  event DealClosed(uint256 _d);
  /// @notice event triggered when a buyer purchased locked tokens which triggers the NFT mint and future creation on the NFT contract
  event FutureCreated(address _owner, address _token, uint256 _amount, uint256 _unlockDate);
}
