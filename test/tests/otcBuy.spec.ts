import { expect } from 'chai';
import * as Constants from '../constants';
import { generateDealFixture } from '../fixtures';
import { TestParameters, generateLabel, IIndexable } from '../helpers';

export default (params: TestParameters) => {
  const whitelist = Constants.ZERO_ADDRESS;

  it(generateLabel(params), async () => {
    const _amount = params.amount;
    const _min = Constants.OTC_DEFAULTS.Min;
    const _price = Constants.OTC_DEFAULTS.Price;
    const _maturity = Constants.IN_ONE_HOUR;
    const _unlockDate = params.unlockDate;
    const isFuture = params.unlockDate === '0' ? false : true;
    const wethAsset = params.asset === Constants.Tokens.Weth;
    const wethPayment = params.payment === Constants.Tokens.Weth;

    const fixture = await generateDealFixture({
      amount: _amount,
      minimum: _min,
      price: _price,
      maturity: _maturity,
      unlockDate: _unlockDate,
      whitelist: whitelist,
      asset: params.asset,
      payment: params.payment,
      isCelo: params.isCelo || false,
    });
    const buyer = fixture.buyer;
    const seller = fixture.owner;

    const otc = fixture.otc;

    const token = (fixture as IIndexable)[params.asset];
    const paymentToken = (fixture as IIndexable)[params.payment];
    const nft = fixture.nft;

    // const preBuyerEthBalance = await provider.getBalance(buyer.address);
    const preBuyerEthBalance = await buyer.getBalance();
    const preBuyerBalance = await token.balanceOf(buyer.address);
    const preBuyerPaymentBalance = await paymentToken.balanceOf(buyer.address);

    const preSellerEthBalance = await seller.getBalance();
    const preSellerBalance = await token.balanceOf(seller.address);
    const preSellerPaymentBalance = await paymentToken.balanceOf(seller.address);

    expect(await token.balanceOf(otc.address)).to.eq(_amount);

    const txReceipt = await otc.connect(buyer).buy('0', params.amount, { value: wethPayment ? _amount : 0 });
    await expect(txReceipt).to.emit(otc, 'TokensBought').withArgs('0', params.amount, '0');

    const gasEstimate = txReceipt.gasPrice.mul(txReceipt.gasLimit);

    const postBuyerEthBalance = await buyer.getBalance();
    const postBuyerBalance = await token.balanceOf(buyer.address);
    const postBuyerPaymentBalance = await paymentToken.balanceOf(buyer.address);

    const postSellerEthBalance = await seller.getBalance();
    const postSellerBalance = await token.balanceOf(seller.address);
    const postSellerPaymentBalance = await paymentToken.balanceOf(seller.address);

    if (wethAsset && wethPayment) expect(preSellerEthBalance).to.eq(postSellerEthBalance.sub(_amount));
    else if (params.asset === params.payment) expect(preSellerBalance).to.eq(postSellerBalance.sub(_amount));
    else expect(preSellerBalance).to.eq(postSellerBalance);

    expect(await token.balanceOf(otc.address)).to.eq('0');
    expect(await paymentToken.balanceOf(otc.address)).to.eq('0');

    if (wethPayment) expect(postSellerEthBalance).to.eq(preSellerEthBalance.add(_amount));
    else expect(postSellerPaymentBalance).to.eq(preSellerPaymentBalance.add(_amount));

    if (isFuture) {
      if (wethPayment) {
        expect(preBuyerBalance).eq(postBuyerBalance);
        expect(postBuyerPaymentBalance).eq(preBuyerPaymentBalance);
        expect(preBuyerEthBalance).to.be.closeTo(postBuyerEthBalance.add(_amount), gasEstimate);
      } else if (params.asset === params.payment) {
        expect(postBuyerPaymentBalance).eq(preBuyerPaymentBalance.sub(_amount));
        expect(preBuyerBalance).eq(postBuyerBalance.add(_amount));
      } else {
        expect(preBuyerBalance).eq(postBuyerBalance);
        expect(postBuyerPaymentBalance).eq(preBuyerPaymentBalance.sub(_amount));
      }

      expect(await token.balanceOf(nft.address)).to.eq(_amount);
      expect(await nft.balanceOf(buyer.address)).to.eq('1');
      expect(await nft.ownerOf('1')).to.eq(buyer.address);

      const future = await nft.futures('1');
      expect(future[0]).to.eq(_amount);
      expect(future[1]).to.eq(token.address);
      expect(future[2]).to.eq(params.unlockDate);
    } else {
      if (wethPayment || params.asset === params.payment) expect(postBuyerPaymentBalance).eq(preBuyerPaymentBalance);
      else expect(postBuyerPaymentBalance).eq(preBuyerPaymentBalance.sub(_amount));

      if (wethAsset && wethPayment) {
        expect(preBuyerEthBalance).to.be.closeTo(postBuyerEthBalance, gasEstimate);
      } else if (params.asset === params.payment) expect(postBuyerBalance).eq(preBuyerBalance);
      else if (wethAsset) expect(postBuyerEthBalance).to.be.closeTo(preBuyerEthBalance.add(_amount), gasEstimate);
      else expect(postBuyerBalance).eq(preBuyerBalance.add(_amount));
    }
  });
};
