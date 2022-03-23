// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.13;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './interfaces/Decimals.sol';
import './libraries/TransferHelper.sol';
import './libraries/NFTHelper.sol';

/**
 * @title HedgeyOTC is an over the counter contract with time locking abilitiy
 * @notice This contract allows for a seller to generate a unique over the counter deal, which can be private or public
 * @notice The public deals allow anyone to participate and purchase tokens from the seller, whereas a private deal allows only a single whitelisted address to participate
 * @notice The Seller chooses whether or not the tokens being sold will be locked, as well as the price for the offer
 */
contract HedgeyOTC is ReentrancyGuard {
  using SafeERC20 for IERC20;

  address payable public weth;
  /// @dev d is a strict uint for indexing the OTC deals one at a time
  uint256 public d = 0;
  /// @dev we use this address to store a single futures contract, which is our NFT ERC721 contract address, which we point to for the minting process
  address public futureContract;

  constructor(address payable _weth, address _fc) {
    weth = _weth;
    futureContract = _fc;
  }

  /**
   * @notice Deal is the struct that defines a single OTC offer, created by a seller
   * @param  Deal struct contains the following parameter definitions:
   * @param 1) seller: This is the creator and seller of the deal
   * @param 2) token: This is the token that the seller deposits into the contract and which they are selling over the counter. The address defines this ERC20
   * @param ... the token ERC20 contract is required to have a public call function decimals() that returns a uint. This is required to price the amount of tokens being purchase
   * @param ... by the buyer - calculating exactly how much to deliver to the seller.
   * @param 3) paymentCurrency: This is also an ERC20 which the seller will get paid in, during the act of a buyer buying tokens, and paying the seller in the paymentCurrency
   * @param 4) remainingAmount: This initially is the entire deposit the seller is selling, but as people purchase chunks of the deal, the remaining amount is decreased to 0
   * @param 5) minimumPurchase: This is the minimum chunk size that a buyer can purchase, defined by the seller. this prevents security issues of
   * @param ... buyers purchasing 1wei worth of the token which can cause a 0 payment amount, resulting in a conflict.
   * @param 6) price: The Price is the per token cost which buyers pay to the seller, denominated in the payment currency. This is not the total price of the deal
   * @param ... the total price is calculated by the remainingAmount * price (then adjusting for the decimals of the payment currency)
   * @param 7) maturity: this is the unix block time for up until this deal is valid. After the maturity no purchases can be made.
   * @param 8) unlockDate: this is the unix block time which may be used to time lock tokens that are sold. If the unlock date is 0 or less than current block time
   * @param ... at the time of purchase, the tokens are not locked but rather delivered directly to the buyer from the contract
   * @param 9) open: boolean for security purposes to check if this deal is still open and can be purchsed. When the remainingAmount == 0 or it has been cancelled by the seller open == false and no purcahses can be made
   * @param 10) buyer: this is a whitelist address for the buyer. It can either be the Zero address - which indicates that Anyone can purchase
   * @param ... or it is a single address that only that owner of the address can participate in purchasing the tokens
   */
  struct Deal {
    address seller;
    address token;
    address paymentCurrency;
    uint256 remainingAmount;
    uint256 minimumPurchase;
    uint256 price;
    uint256 maturity;
    uint256 unlockDate;
    address buyer;
  }

  /// @dev the Deals are all mapped via the indexer d to deals mapping
  mapping(uint256 => Deal) public deals;

  receive() external payable {}

  /**
   * @notice This function is what the seller uses to create a new OTC offering
   * @dev this function will pull in tokens from the seller, create a new struct as Deal indexed by the current uint d
   * @dev this function does not allow for taxed / deflationary tokens - as the amount that is pulled into the contract must match with what is being sent
   * @dev this function requires that the _token has a decimals() public function on its ERC20 contract to be called
   * @param _token address is the token that the seller is going to create the over the counter offering for
   * @param _paymentCurrency is the address of the opposite ERC20 that the seller wants to get paid in when selling the token (use WETH for ETH)
   * @param _amount is the amount of tokens that you as the seller want to sell
   * @param _min is the minimum amount of tokens that a buyer can purchase from you. this should be less than or equal to the total amount
   * @param _price is the price per token which you would like to get paid, denominated in the payment currency
   * @param _maturity is how long you would like to allow buyers to purchase tokens from this deal, in unix block time. this needs to be beyond current time
   * @param _unlockDate is used if you are requiring that tokens purchased by buyers are locked. If this is set to 0 or anything less than current time
   * ... any tokens purchased will not be locked but immediately delivered to the buyers. Otherwise the unlockDate will lock the tokens in the associated
   * ... futures NFT contract - which will hold the tokens in escrow until the unlockDate has passed - whereupon the owner of the NFT can redeem the tokens
   * @param _buyer is a special option to make this a private deal - where only the buyer's address can participate and make the purchase. If this is set to the
   * ... Zero address - then it is publicly available and anyone can purchase tokens from this deal
   */
  function create(
    address _token,
    address _paymentCurrency,
    uint256 _amount,
    uint256 _min,
    uint256 _price,
    uint256 _maturity,
    uint256 _unlockDate,
    address payable _buyer
  ) external payable nonReentrant {
    require(_maturity > block.timestamp, 'OTC01');
    require(_amount >= _min, 'OTC02');
    /// @dev this checks to make sure that if someone purchases the minimum amount, it is never equal to 0
    /// @dev where someone could find a small enough minimum to purchase all of the tokens for free.
    require((_min * _price) / (10**Decimals(_token).decimals()) > 0, 'OTC03');
    /// @dev we check the before balance of this address for security - this includes checking the WETH balance
    /// @dev creates the Deal struct with all of the parameters for inputs - and set the bool 'open' to true so that this offer can now be purchased
    deals[d++] = Deal(msg.sender, _token, _paymentCurrency, _amount, _min, _price, _maturity, _unlockDate, _buyer);
    /// @dev pulls the tokens into this contract so that they can be purchased
    TransferHelper.transferPayment(weth, _token, payable(msg.sender), payable(address(this)), _amount);
    emit NewDeal(d - 1, msg.sender, _token, _paymentCurrency, _amount, _min, _price, _maturity, _unlockDate, _buyer);
  }

  /**
   * @notice This function lets a seller cancel their existing deal anytime they would like to
   * @notice there is no requirement that the deal have expired
   * @notice all that is required is that the deal is still open, and that there is still a reamining balance
   * @dev you need to know the index _d of the deal you are trying to close and that is it
   * @dev only the seller can close this deal
   * @param _d is the dealID that is mapped to the Struct Deal
   */
  function close(uint256 _d) external nonReentrant {
    Deal memory deal = deals[_d];
    require(msg.sender == deal.seller, 'OTC04');
    require(deal.remainingAmount > 0, 'OTC05');
    /// @dev once we have confirmed it is the seller and there are remaining tokens -
    //_withdraw(deal.token, payable(msg.sender), deal.remainingAmount);
    /// @dev delete the struct so it can no longer be used
    delete deals[_d];
    TransferHelper.withdrawPayment(weth, deal.token, payable(msg.sender), deal.remainingAmount);
    emit DealClosed(_d);
  }

  /**
   * @notice This function is what buyers use to make their OTC purchases
   * @param _d is the index of the deal that a buyer wants to participate in and make a purchase
   * @param _amount is the amount of tokens the buyer is willing to purchase, which must be at least the minimumPurchase and at most the remainingAmount for this deal
   * @notice ensure when using this function that you are aware of the minimums, and price per token to ensure sufficient balances to make a purchase
   * @notice if the deal has an unlockDate that is beyond the current block time - no tokens will be received by the buyer, but rather they will receive
   * @notice an NFT, which represents their ability to redeem and claim the locked tokens after the unlockDate has passed
   * @notice the NFT received is a separate smart contract, which also contains the locked tokens
   * @notice the Seller will receive payment in full immediately when triggering this function, there is no lock on payments
   */
  function buy(uint256 _d, uint256 _amount) external payable nonReentrant {
    /// @dev pull the deal details from storage
    Deal memory deal = deals[_d];
    /// @dev we do not let the seller sell to themselves, must be a separate buyer
    require(msg.sender != deal.seller, 'OTC06');
    /// @dev require that the deal order is still valid by checking if the block time is not passed the maturity date
    require(deal.maturity >= block.timestamp, 'OTC07');
    /// @dev if the deal had a whitelist - then require the msg.sender to be that buyer, otherwise if there was no whitelist, anyone can buy
    require(msg.sender == deal.buyer || deal.buyer == address(0x0), 'OTC08');
    /// @dev require that the amount being purchased is greater than the deal minimum, or that the amount being purchased is the entire remainder of whats left
    /// @dev AND require that the remaining amount in the deal actually equals or exceeds what the buyer wants to purchase
    require(
      (_amount >= deal.minimumPurchase || _amount == deal.remainingAmount) && deal.remainingAmount >= _amount,
      'OTC09'
    );
    /// @dev we calculate the purchase amount taking the decimals from the token first
    /// @dev then multiply the amount by the per token price, and now to get back to an amount denominated in the payment currency divide by the factor of token decimals
    uint256 decimals = Decimals(deal.token).decimals();
    uint256 purchase = (_amount * deal.price) / (10**decimals);
    TransferHelper.transferPayment(weth, deal.paymentCurrency, msg.sender, payable(deal.seller), purchase);
    if (deal.unlockDate > block.timestamp) {
      /// @dev if the unlockdate is the in future, then we call our internal function lockTokens to lock those in the NFT contract
      NFTHelper.lockTokens(futureContract, msg.sender, deal.token, _amount, deal.unlockDate);
      emit FutureCreated(msg.sender, deal.token, _amount, deal.unlockDate);
    } else {
      /// @dev if the unlockDate is in the past or now - then tokens are already unlocked and delivered directly to the buyer
      TransferHelper.withdrawPayment(weth, deal.token, payable(msg.sender), _amount);
    }
    /// @dev reduce the deal remaining amount by how much was purchased. If the remainder is 0, then we consider this deal closed and set our open bool to false
    deal.remainingAmount -= _amount;
    if (deal.remainingAmount == 0) {
      delete deals[_d];
    } else {
      deals[_d].remainingAmount = deal.remainingAmount;
    }
    emit TokensBought(_d, _amount, deal.remainingAmount);
  }

  /// @dev events for each function
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
  event TokensBought(uint256 _d, uint256 _amount, uint256 _remainingAmount);
  event DealClosed(uint256 _d);
  event FutureCreated(address _owner, address _token, uint256 _amount, uint256 _unlockDate);
}
