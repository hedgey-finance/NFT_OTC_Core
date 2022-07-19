import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';

import { inFiveSeconds } from '../helpers';
import * as Constants from '../constants';
import { createdNFTFixture } from '../fixtures';

export default (isWeth: boolean, isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [wallet, other] = provider.getWallets();

  const amount = Constants.E18_1;
  let unlockDate: string;

  beforeEach(async () => {
    unlockDate = inFiveSeconds();
  });

  it('wallet transfers to other & other redeems', async () => {
    const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    const nft = fixture.nft;
    const weth = fixture.weth;
    const token = fixture.token;
    const asset = isWeth ? weth : token;

    expect(await nft.transferFrom(wallet.address, other.address, '1'))
      .to.emit(nft, 'Transfer')
      .withArgs(wallet.address, other.address, '1');

    expect(await nft.balanceOf(other.address)).to.eq('1');
    expect(await nft.ownerOf('1')).to.eq(other.address);
    expect(await asset.balanceOf(nft.address)).to.eq(amount);

    await new Promise((resolve) => setTimeout(resolve, 6000));

    expect(await nft.connect(other).redeemNFT('1'))
      .to.emit(nft, 'NFTRedeemed')
      .withArgs('1', other.address, amount, asset.address, unlockDate)
      .to.emit(nft, 'Transfer')
      .withArgs(other.address, Constants.ZERO_ADDRESS, '1');
    expect(await asset.balanceOf(nft.address)).to.eq('0');
  });

  it('wallet approves other to transferFrom & other redeems', async () => {
    const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    const nft = fixture.nft;
    const weth = fixture.weth;
    const token = fixture.token;
    const asset = isWeth ? weth : token;

    //check there is no approvals before
    expect(await nft.getApproved('1')).to.eq(Constants.ZERO_ADDRESS);
    expect(await nft.approve(other.address, '1'))
      .to.emit(nft, 'Approval')
      .withArgs(wallet.address, other.address, '1');

    expect(await nft.getApproved('1')).to.eq(other.address);
    expect(await nft.connect(other).transferFrom(wallet.address, other.address, '1'))
      .to.emit(nft, 'Transfer')
      .withArgs(wallet.address, other.address, '1');

    expect(await nft.balanceOf(other.address)).to.eq('1');
    expect(await nft.ownerOf('1')).to.eq(other.address);
    expect(await asset.balanceOf(nft.address)).to.eq(amount);

    await new Promise((resolve) => setTimeout(resolve, 6000));

    expect(await nft.connect(other).redeemNFT('1'))
      .to.emit(nft, 'NFTRedeemed')
      .withArgs('1', other.address, amount, asset.address, unlockDate)
      .to.emit(nft, 'Transfer')
      .withArgs(other.address, Constants.ZERO_ADDRESS, '1');
    expect(await asset.balanceOf(nft.address)).to.eq('0');
  });

  it('reverts if the approver is not the owner', async () => {
    const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    const nft = fixture.nft;

    await expect(nft.connect(other).approve(other.address, '1')).to.be.revertedWith(
      'ERC721: approve caller is not owner nor approved for all'
    );
  });

  it('reverts if the wallet tries to approve itself', async () => {
    const fixture = await createdNFTFixture(provider, [wallet], isWeth, wallet, amount, unlockDate, isCelo);
    const nft = fixture.nft;

    await expect(nft.approve(wallet.address, '1')).to.be.revertedWith('ERC721: approval to current owner');
  });
};
