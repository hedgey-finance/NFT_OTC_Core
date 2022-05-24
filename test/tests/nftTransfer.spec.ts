import { expect } from 'chai';
import { WETH9 } from '@thenextblock/hardhat-weth';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { inSixSeconds, inTenSeconds } from '../helpers';
import * as Constants from '../constants';
import { createdNFTFixture } from '../fixtures';
import { Sign } from 'crypto';

export default (isWeth: boolean, isCelo: boolean = false) => {
  const amount = Constants.E18_1;
  let unlockDate: string;
  let token: Contract;
  let nft: Contract;
  let weth: WETH9;
  let asset: WETH9 | Contract;
  let wallet: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async () => {
    unlockDate = inSixSeconds();
    const fixture = await createdNFTFixture(isWeth, amount, unlockDate, isCelo);
    nft = fixture.nft;
    weth = fixture.weth;
    token = fixture.token;
    asset = isWeth ? weth : token;
    wallet = fixture.owner;
    other = fixture.walletA;
  });

  it('wallet transfers to other & other redeems', async () => {
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
    await expect(nft.connect(other).approve(other.address, '1')).to.be.revertedWith(
      'ERC721: approve caller is not owner nor approved for all'
    );
  });

  it('reverts if the wallet tries to approve itself', async () => {
    await expect(nft.approve(wallet.address, '1')).to.be.revertedWith('ERC721: approval to current owner');
  });
};
