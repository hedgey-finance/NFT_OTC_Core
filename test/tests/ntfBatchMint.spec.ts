import { expect } from 'chai';
import { getBlockTimePlusSeconds } from '../helpers';
import * as Constants from '../constants';
import { newNFTFixture } from '../fixtures';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

export default (isCelo: boolean = false) => {
  const amount = Constants.E18_1;
  let token: Contract;
  let nft: Contract;
  let wallet: SignerWithAddress;
  let walletA: SignerWithAddress;
  let walletB: SignerWithAddress;
  let batch: Contract;

  beforeEach(async () => {
    const fixture = await newNFTFixture(isCelo);
    token = fixture.token;
    nft = fixture.nft;
    wallet = fixture.owner;
    walletA = fixture.walletA;
    walletB = fixture.walletB;
    batch = fixture.batch;
  });
  it('creates a batch mint of 10 NFTs', async () => {
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

    const unlockDate = await getBlockTimePlusSeconds(10);

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

  it('reverts if the sizes of arrays are different', async () => {
    const holders = [wallet.address, walletA.address];
    const amounts = [amount, amount, amount];
    const unlockDate = await getBlockTimePlusSeconds(10);
    const unlockDates = [unlockDate, unlockDate, unlockDate];
    await expect(batch.batchMint(nft.address, holders, token.address, amounts, unlockDates)).to.be.revertedWith(
      'array size wrong'
    );
  });
  it('reverts if any amount is 0', async () => {
    const holders = [wallet.address, wallet.address, wallet.address];
    const amounts = ['0', amount, amount];
    const unlockDate = await getBlockTimePlusSeconds(10);
    const unlockDates = [unlockDate, unlockDate, unlockDate];
    await expect(batch.batchMint(nft.address, holders, token.address, amounts, unlockDates)).to.be.revertedWith(
      'cant mint with 0'
    );
  });
  it('reverts if any date is in the past', async () => {
    const holders = [wallet.address, wallet.address, wallet.address];
    const amounts = [amount, amount, amount];
    const unlockDate = await getBlockTimePlusSeconds(10);
    const unlockDates = [unlockDate, unlockDate, '0'];
    await expect(batch.batchMint(nft.address, holders, token.address, amounts, unlockDates)).to.be.revertedWith(
      'must be in the future'
    );
  });
  it('reverts if the wallet has insufficient balances', async () => {
    const holders = [wallet.address, wallet.address, wallet.address];
    const amounts = [amount, amount, Constants.E18_10000];
    const unlockDate = await getBlockTimePlusSeconds(10);
    const unlockDates = [unlockDate, unlockDate, unlockDate];
    await expect(batch.batchMint(nft.address, holders, token.address, amounts, unlockDates)).to.be.revertedWith(
      'THL01'
    );
  });
};
