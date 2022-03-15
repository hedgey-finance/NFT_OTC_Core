import { WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { Contract } from 'ethers';

import * as Constants from '../constants';
import { createdNFTFixture } from '../fixtures';

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [wallet] = provider.getWallets();

  let nft: Contract;
  let weth: WETH9;
  let uri = 'hello/';

  it('updates the baseURI', async () => {
    const fixture = await createdNFTFixture(provider, [wallet], false, wallet, Constants.E18_1, Constants.IN_ONE_HOUR, isCelo);
    nft = fixture.nft;
    weth = fixture.weth;
    await nft.updateBaseURI(uri);
    expect(await nft.tokenURI('1')).to.eq('hello/1');
  });
  if (!isCelo) {
    it('confirms the weth address', async () => {
      expect(await nft.weth()).to.eq(weth.address);
    });
  }
  it('reverts if the baseURI is updated twice', async () => {
    uri = 'goodbye';
    await expect(nft.updateBaseURI(uri)).to.be.revertedWith('HNEC06: uri already set');
  });
};
