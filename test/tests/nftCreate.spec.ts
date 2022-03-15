import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';

import { inFiveSeconds } from '../helpers';
import * as Constants from '../constants';
import { newNFTFixture } from '../fixtures';

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [wallet] = provider.getWallets();

  let unlockDate: string;

  const amount = Constants.E18_1;

  beforeEach(async () => {
    unlockDate = inFiveSeconds();
  });

  it('create an NFT', async () => {
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const token = fixture.token;
    const nft = fixture.nft;

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
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const token = fixture.token;
    const nft = fixture.nft;

    await expect(nft.createNFT(wallet.address, '0', token.address, unlockDate)).to.be.revertedWith(
      'HEC01: NFT Minting Error'
    );
  });

  it('reverts if the token == zero address', async () => {
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const nft = fixture.nft;

    await expect(nft.createNFT(wallet.address, amount, Constants.ZERO_ADDRESS, unlockDate)).to.be.revertedWith(
      'HEC01: NFT Minting Error'
    );
  });

  it('reverts if the unlockDate is less than now', async () => {
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const token = fixture.token;
    const nft = fixture.nft;

    await expect(nft.createNFT(wallet.address, amount, token.address, '0')).to.be.revertedWith(
      'HEC01: NFT Minting Error'
    );
  });

  it('reverts if my wallet has insufficient balance', async () => {
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const token = fixture.token;
    const nft = fixture.nft;

    await expect(nft.createNFT(wallet.address, Constants.E18_1000, token.address, unlockDate)).to.be.revertedWith(
      'HNEC02: Insufficient Balance'
    );
  });

  it('reverts if the tokens sent do not match the amount received', async () => {
    const fixture = await newNFTFixture(provider, [wallet], isCelo);
    const nft = fixture.nft;
    const burn = fixture.burn;

    expect(nft.createNFT(wallet.address, amount, burn.address, unlockDate)).to.be.revertedWith('HNEC03: Wrong amount');
  });
};
