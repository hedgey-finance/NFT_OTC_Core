import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';

import { inFiveSeconds } from '../helpers';
import * as Constants from '../constants';
import { createdNoTransferNFTFixture } from '../fixtures';

export default (isWeth: boolean, isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [wallet, other] = provider.getWallets();

  const amount = Constants.E18_1;
  let unlockDate: string;

  beforeEach(async () => {
    unlockDate = inFiveSeconds();
  });

  it('wallet cannot transfer a non-transferrable NFT', async () => {
    const fixture = await createdNoTransferNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    const nft = fixture.nft;
    const weth = fixture.weth;
    const token = fixture.token;
    const asset = isWeth ? weth : token;
    console.log('trying to transfer');
    expect(await nft.transferFrom(wallet.address, other.address, '1'))
      .to.be.revertedWith('Not transferrable');

      expect(await nft.safeTransferFrom(wallet.address, other.address, '1'))
      .to.be.revertedWith('Not transferrable');
  });

  
};
