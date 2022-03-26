import { DummyTokens } from './../fixtures';
import { expect } from 'chai';
import { TestParameters, generateLabel, IIndexable } from '../helpers';
import * as Constants from '../constants';
import { generateOTCFixture } from '../fixtures';

export default (params: TestParameters) => {
  it(generateLabel(params), async () => {
    const { owner, otc, dummyTokens } = await generateOTCFixture({ isCelo: params.isCelo });

    const token = dummyTokens[params.asset as keyof DummyTokens];
    const paymentToken = dummyTokens[params.payment as keyof DummyTokens];
    const assetAndPaymentMatch = token.address === paymentToken.address;
    const prePaymentBalance = await paymentToken.balanceOf(otc.address);

    const _tokenAddress = token.address;
    const _paymentCurrencyAddress = paymentToken.address;
    const _amount = params.amount;
    const _min = Constants.OTC_DEFAULTS.Min;
    const _price = Constants.OTC_DEFAULTS.Price;
    const _maturity = Constants.IN_ONE_HOUR;
    const _unlockDate = params.unlockDate;
    const _buyer = params.buyer;

    await expect(
      otc.create(_tokenAddress, _paymentCurrencyAddress, _amount, _min, _price, _maturity, _unlockDate, _buyer, {
        value: params.asset === Constants.Tokens.Weth ? _amount : 0,
      })
    )
      .to.emit(otc, 'NewDeal')
      .withArgs(
        '0',
        owner.address,
        _tokenAddress,
        _paymentCurrencyAddress,
        _amount,
        _min,
        _price,
        _maturity,
        _unlockDate,
        _buyer
      );

    // Check our deal has been created
    const deal = await otc.deals(0);
    expect(deal[0]).to.eq(owner.address);
    expect(deal[1]).to.eq(_tokenAddress);
    expect(deal[2]).to.eq(_paymentCurrencyAddress);
    expect(deal[3]).to.eq(_amount);
    expect(deal[4]).to.eq(_min);
    expect(deal[5]).to.eq(_price);
    expect(deal[6]).to.eq(_maturity);
    expect(deal[7]).to.eq(_unlockDate);
    expect(deal[8]).to.eq(_buyer);

    const postTokenBalance = await token.balanceOf(otc.address);
    const postPaymentBalance = await paymentToken.balanceOf(otc.address);

    // Test that the tokens have actually been sent to the contract
    expect(postTokenBalance).to.eq(_amount);

    // check that no balance changes have been made on the payment token (unless it's the same as the asset)
    if (!assetAndPaymentMatch) {
      expect(prePaymentBalance).to.eq(postPaymentBalance);
    }
  });
};
