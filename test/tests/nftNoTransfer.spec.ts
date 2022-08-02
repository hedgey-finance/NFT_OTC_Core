import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';

import * as Constants from '../constants';
import { createdNoTransferNFTFixture } from '../fixtures';
import moment from 'moment';
const tomorrow = moment().add(1, 'day').unix().toString();

export default (isWeth: boolean) => {
  const provider = new MockProvider();
  const [wallet, other] = provider.getWallets();

  const amount = Constants.E18_1;

  it('wallet cannot transfer a non-transferrable NFT', async () => {
    const fixture = await createdNoTransferNFTFixture(provider, [wallet], isWeth, wallet, amount, tomorrow);
    const nft = fixture.nft;
    await expect(nft.transferFrom(wallet.address, other.address, '1')).to.be.revertedWith('Not transferrable');

    await expect(
      nft['safeTransferFrom(address,address,uint256)'](wallet.address, other.address, '1')
    ).to.be.revertedWith('Not transferrable');
  });
};
