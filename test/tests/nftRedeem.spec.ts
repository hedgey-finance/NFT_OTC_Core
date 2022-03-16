import { WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';

import { MockProvider } from 'ethereum-waffle';
import { Contract } from 'ethers';

import { inFiveSeconds } from '../helpers';
import * as Constants from '../constants';
import { createdNFTFixture } from '../fixtures';

export default (isWeth: boolean, isCelo: boolean) => {
  const provider = new MockProvider();
  const [wallet, other] = provider.getWallets();

  const amount = Constants.E18_1;

  let unlockDate: string;
  let token: Contract;
  let nft: Contract;
  let weth: WETH9;
  let asset: WETH9 | Contract;

  beforeEach(async () => {
    unlockDate = inFiveSeconds();

    const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    token = fixture.token;
    nft = fixture.nft;
    weth = fixture.weth;
    asset = isWeth ? weth : token;

    expect(await asset.balanceOf(nft.address)).to.eq(amount);
  });

  it('redeem future', async () => {
    //gotta wait 6 seconds for it to be redeemable;
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await expect(nft.redeemNFT('1'))
      .to.emit(nft, 'NFTRedeemed')
      .withArgs('1', wallet.address, amount, asset.address, unlockDate)
      .to.emit(nft, 'Transfer')
      .withArgs(wallet.address, Constants.ZERO_ADDRESS, '1');
    const future = await nft.futures('1');

    expect(future[0]).to.eq('0');
    expect(future[1]).to.eq(Constants.ZERO_ADDRESS);
    expect(future[2]).to.eq('0');
    await expect(nft.ownerOf('1')).to.be.revertedWith('ERC721: owner query for nonexistent token');
    expect(await asset.balanceOf(nft.address)).to.eq('0');
    expect(await nft.balanceOf(wallet.address)).to.eq('0');
  });

  it('reverts if the wallet sending is not the owner', async () => {
    //const fixture = await fixtures.createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate);
    //nft = fixture.nft;
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await expect(nft.connect(other).redeemNFT('1')).to.be.revertedWith('HNEC04: Only the NFT Owner');
  });

  it('reverts if the tokens are not unlocked yet', async () => {
    //const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    //nft = fixture.nft;
    await expect(nft.redeemNFT('1')).to.be.revertedWith('HNEC05: Tokens are still locked');
  });
};
