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
  it('creates a batch mint of 10 NFTs', async () => {
    const fixture = await newNFTFixture(isCelo);
    const token = fixture.token;
    const nft = fixture.nft;
    const wallet = fixture.owner;
    const walletA = fixture.walletA;
    const walletB = fixture.walletB;
    const batch = fixture.batch;
    const holders = [
      wallet.address,
      wallet.address,
      wallet.address,
      walletA.address,
      walletA.address,
      walletA.address,
      walletB.address,
      walletB.address,
      walletB.address,
      walletB.address,
    ];
    const amounts = [
      amount,
      Constants.E18_10,
      amount,
      Constants.E18_10,
      amount,
      amount,
      amount,
      amount,
      amount,
      Constants.E18_10,
    ];
    const unlockDates = [
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
      unlockDate,
    ];
    await expect(batch.batchMint(nft.address, holders, token.address, amounts, unlockDates))
      .to.emit(nft, 'NFTCreated')
      .withArgs('1', wallet.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('2', wallet.address, Constants.E18_10, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('3', wallet.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('4', walletA.address, Constants.E18_10, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('5', walletA.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('6', walletA.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('7', walletB.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('8', walletB.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('9', walletB.address, amount, token.address, unlockDate)
      .to.emit(nft, 'NFTCreated')
      .withArgs('10', walletB.address, Constants.E18_10, token.address, unlockDate);
  });
};
