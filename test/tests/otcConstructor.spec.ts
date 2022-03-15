import { WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { Contract } from 'ethers';

import * as Constants from '../constants';
import { dealFixture } from '../fixtures';

export default (isCelo: boolean = false) => {
  let otc: Contract;
  let weth: WETH9;
  let nft: Contract;

  const provider = new MockProvider();
  const [buyer, seller] = provider.getWallets();

  const price = Constants.E18_10;
  const amount = Constants.E18_10;
  const min = Constants.E18_1;
  const whitelist = Constants.ZERO_ADDRESS;

  const maturity = Constants.IN_ONE_HOUR;
  const unlockDate = Constants.IN_ONE_HOUR;

  before(async () => {
    const dealContract = await dealFixture(
      provider,
      [seller, buyer],
      amount,
      min,
      price,
      maturity,
      unlockDate,
      whitelist,
      Constants.Tokens.TokenA,
      Constants.Tokens.TokenB,
      isCelo
    );

    otc = dealContract.otc;
    weth = dealContract.weth;
    nft = dealContract.nft;
  });

  it('should have weth set', async () => {
    const otcWeth = await otc.weth();
    expect(otcWeth).equal(weth.address);
  });

  it('should have base URI set', async () => {
    const futuresContract = await otc.futureContract();
    expect(futuresContract).equal(nft.address);
  });
};
