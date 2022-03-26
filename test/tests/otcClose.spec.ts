import { expect } from 'chai';

import { generateDealFixture } from '../fixtures';
import * as Constants from '../constants';

export default (isCelo: boolean = false) => {
  const amount = Constants.E18_10;
  const min = Constants.E18_1;
  const price = Constants.E18_1;
  const maturity = Constants.IN_ONE_HOUR;
  const unlockDate = Constants.IN_ONE_HOUR;

  it('closes the deal', async () => {
    const { owner, buyer, otc, tokenA } = await generateDealFixture({
      amount,
      minimum: min,
      price,
      maturity,
      unlockDate,
      whitelist: Constants.ZERO_ADDRESS,
      asset: Constants.Tokens.TokenA,
      payment: Constants.Tokens.TokenB,
      isCelo,
    });

    //check the before balance of the otc address to make sure fixture instantiated correctly
    expect(await tokenA.balanceOf(otc.address)).to.eq(amount);
    await expect(otc.close('0')).to.emit(otc, 'DealClosed').withArgs('0');
    expect(await tokenA.balanceOf(otc.address)).to.eq('0');

    const deal = await otc.deals(0);
    expect(deal[3]).to.eq('0'); //remainder == 0
  });
};
