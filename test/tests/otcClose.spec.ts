import { MockProvider } from 'ethereum-waffle';
import { expect } from 'chai';

import { dealFixture } from '../fixtures';
import * as Constants from '../constants';

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [seller, buyer] = provider.getWallets();

  const amount = Constants.E18_10;
  const min = Constants.E18_1;
  const price = Constants.E18_1;
  const maturity = Constants.IN_ONE_HOUR;
  const unlockDate = Constants.IN_ONE_HOUR;

  it('closes the deal', async () => {
    const fixture = await dealFixture(
      provider,
      [seller, buyer],
      amount,
      min,
      price,
      maturity,
      unlockDate,
      Constants.ZERO_ADDRESS,
      Constants.Tokens.TokenA,
      Constants.Tokens.TokenB,
      isCelo
    );

    const otc = fixture.otc;
    const tokenA = fixture.tokenA;

    //check the before balance of the otc address to make sure fixture instantiated correctly
    expect(await tokenA.balanceOf(otc.address)).to.eq(amount);
    await expect(otc.close('0')).to.emit(otc, 'DealClosed').withArgs('0');
    expect(await tokenA.balanceOf(otc.address)).to.eq('0');

    const deal = await otc.deals(0);
    expect(deal[3]).to.eq('0'); //remainder == 0
  });
};
