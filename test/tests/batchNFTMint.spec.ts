import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import * as Constants from '../constants';
import { batchMintFixture } from '../fixtures';

export default () => {
  //creates a batchmint for the NFTs
  it(`Batch Mints 10 NFTs with identifier`, async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const token = fixture.token;
    let holders = [];
    let amounts = [];
    let unlockDates = [];
    const unlock = (await time.latest()) + 10;
    for (let i = 0; i < 10; i++) {
      holders.push(reciever.address);
      amounts.push(Constants.E18_1);
      unlockDates.push(unlock + i);
    }
    expect(
      await batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    )
      .to.emit(batchMinter, 'BatchMinted')
      .withArgs('55');
    expect(await token.balanceOf(nft.address)).to.eq(Constants.E18_10);
    expect(await token.balanceOf(batchMinter.address)).to.eq('0');
  });
  it(`Batch Mints 10 NFTs without identifier`, async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const token = fixture.token;
    let holders = [];
    let amounts = [];
    let unlockDates = [];
    const unlock = (await time.latest()) + 10;
    for (let i = 0; i < 10; i++) {
      holders.push(reciever.address);
      amounts.push(Constants.E18_1);
      unlockDates.push(unlock + i);
    }
    expect(
      await batchMinter['batchMint(address,address[],address,uint256[],uint256[])'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates
      )
    );
    expect(await token.balanceOf(nft.address)).to.eq(Constants.E18_10);
    expect(await token.balanceOf(batchMinter.address)).to.eq('0');
  });
  it('Reverts if a Burn token is used', async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const burn = fixture.burn;
    let holders = [];
    let amounts = [];
    let unlockDates = [];
    const unlock = (await time.latest()) + 10;
    for (let i = 0; i < 10; i++) {
      holders.push(reciever.address);
      amounts.push(Constants.E18_1);
      unlockDates.push(unlock + i);
    }
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[])'](
        nft.address,
        holders,
        burn.address,
        amounts,
        unlockDates
      )
    ).to.be.reverted;
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        burn.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.reverted;
  });
  it('Reverts if the amounts length doesnt match the holders length doesnt match the unlockdates length', async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const token = fixture.token;
    const unlock = (await time.latest()) + 10;
    //test holders diff than amounts, same as unlock
    let holders = [reciever.address, reciever.address];
    let amounts = [Constants.E18_1];
    let unlockDates = [unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.revertedWith('array error');
    //change unlocks to match holders, different than amounts size
    unlockDates = [unlock, unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.revertedWith('array error');
    unlockDates = [unlock, unlock, unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.revertedWith('array error');
  });
  it('Reverts if the token is the 0 address token', async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const unlock = (await time.latest()) + 10;
    let holders = [reciever.address];
    let amounts = [Constants.E18_1];
    let unlockDates = [unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        Constants.ZERO_ADDRESS,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.reverted;
  });
  it('Reverts if the amount is 0', async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const token = fixture.token;
    const unlock = (await time.latest()) + 10;
    let holders = [reciever.address];
    let amounts = ['0'];
    let unlockDates = [unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.revertedWith('amount error');
  });
  it('Reverts if the unlock date is in the past', async () => {
    const fixture = await batchMintFixture();
    const reciever = fixture.reciever;
    const nft = fixture.nft;
    const batchMinter = fixture.batchMinter;
    const token = fixture.token;
    const unlock = (await time.latest()) - 10;
    let holders = [reciever.address];
    let amounts = [Constants.E18_1];
    let unlockDates = [unlock];
    await expect(
      batchMinter['batchMint(address,address[],address,uint256[],uint256[],uint256)'](
        nft.address,
        holders,
        token.address,
        amounts,
        unlockDates,
        '55'
      )
    ).to.be.revertedWith('date error');
  });
};
