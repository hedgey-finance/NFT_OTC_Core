import { expect } from 'chai';
import { WETH9 } from '@thenextblock/hardhat-weth';
import { inTenSeconds } from '../helpers';
import * as Constants from '../constants';
import { newNFTFixture } from '../fixtures';
import { constants } from 'buffer';

export default (isCelo: boolean = false) => {
  let unlockDate: string;

  const amount = Constants.E18_1;

  beforeEach(async () => {
    unlockDate = inTenSeconds();
  });

  it('create an NFT', async () => {
    //let unlockDate = (Math.round(Date.now() / 1000) + 10).toString()
    const fixture = await newNFTFixture(isCelo);
    const token = fixture.token;
    const nft = fixture.nft;
    const wallet = fixture.owner;

    //pre balance check
    expect(await token.balanceOf(nft.address)).to.eq('0');
    await expect(nft.createNFT(wallet.address, amount, token.address, unlockDate))
      .to.emit(nft, 'NFTCreated')
      .withArgs('1', wallet.address, amount, token.address, unlockDate);

    const future = await nft.futures('1');
    expect(future[0]).to.eq(amount);
    expect(future[1]).to.eq(token.address);
    expect(future[2]).to.eq(unlockDate);

    expect(await token.balanceOf(nft.address)).to.eq(amount);
    //check holder
    expect(await nft.balanceOf(wallet.address)).to.eq('1');
    expect(await nft.ownerOf('1')).to.eq(wallet.address);
    expect(await nft.totalSupply()).to.eq('1');
  });

  it('reverts if the amount == 0', async () => {
    const fixture = await newNFTFixture(isCelo);
    const token = fixture.token;
    const nft = fixture.nft;
    const wallet = fixture.owner;

    await expect(nft.createNFT(wallet.address, '0', token.address, unlockDate)).to.be.revertedWith('NFT01');
  });

  it('reverts if the token == zero address', async () => {
    const fixture = await newNFTFixture(isCelo);
    const nft = fixture.nft;
    const wallet = fixture.owner;

    await expect(nft.createNFT(wallet.address, amount, Constants.ZERO_ADDRESS, unlockDate)).to.be.revertedWith('NFT01');
  });

  it('reverts if the unlockDate is less than now', async () => {
    const fixture = await newNFTFixture(isCelo);
    const token = fixture.token;
    const nft = fixture.nft;
    const wallet = fixture.owner;

    await expect(nft.createNFT(wallet.address, amount, token.address, '0')).to.be.revertedWith('NFT01');
  });

  it('reverts if my wallet has insufficient balance', async () => {
    const fixture = await newNFTFixture(isCelo);
    const token = fixture.token;
    const nft = fixture.nft;
    const wallet = fixture.owner;
    await token.approve(nft.address, Constants.E18_10000);
    await expect(nft.createNFT(wallet.address, Constants.E18_10000, token.address, unlockDate)).to.be.revertedWith(
      'THL01'
    );
  });

  it('reverts if the tokens sent do not match the amount received', async () => {
    const fixture = await newNFTFixture(isCelo);
    const nft = fixture.nft;
    const burn = fixture.burn;
    const wallet = fixture.owner;

    expect(nft.createNFT(wallet.address, amount, burn.address, unlockDate)).to.be.revertedWith('THL02');
  });
};
