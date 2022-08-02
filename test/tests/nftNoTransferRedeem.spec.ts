import { deployWeth } from '@thenextblock/hardhat-weth';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect } from 'chai';
import moment from 'moment';

const initialSupply = ethers.utils.parseEther('1000');
const amount = ethers.utils.parseEther('1');
const decimals = 18;
const tomorrow = moment().add(1, 'day').unix().toString();
const threeDays = moment().add(3, 'day').unix().toString();

export default (isWeth: boolean = false) => {
  let weth: Contract, nonTransferrableNFTs: Contract, token: Contract, burn: Contract, account: Signer, other: Signer;

  before(async () => {
    const accounts = await ethers.getSigners();
    [account] = accounts;
    other = accounts[1];

    weth = await deployWeth(account);
    await weth.deposit({ value: amount });

    const NonTransferrableNFTs = await ethers.getContractFactory('NonTransferrableNFTs');
    nonTransferrableNFTs = await NonTransferrableNFTs.deploy('NonTransfer', 'NT');

    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy(initialSupply, decimals);
  });

  it('redeems token future', async () => {
    const address = await account.getAddress();
    await token.approve(nonTransferrableNFTs.address, amount);
    const createTransaction = await nonTransferrableNFTs.createNFT(address, amount, token.address, tomorrow);
    const receipt = await createTransaction.wait();
    const event = receipt.events.find((event: any) => event.event === 'NFTCreated');
    const id = event.args['_i'];

    // reverts if the tokens are not unlocked yet
    await expect(nonTransferrableNFTs.redeemNFT(id)).to.be.revertedWith('NFT04');

    await ethers.provider.send('evm_setNextBlockTimestamp', [moment().add(2, 'days').unix()]);

    // reverts if the wallet sending is not the owner
    await expect(nonTransferrableNFTs.connect(other).redeemNFT(id)).to.be.revertedWith('NFT03');

    await expect(nonTransferrableNFTs.redeemNFT(id))
      .to.emit(nonTransferrableNFTs, 'NFTRedeemed')
      .withArgs(id, address, amount, token.address, tomorrow)
      .to.emit(nonTransferrableNFTs, 'Transfer')
      .withArgs(address, ethers.constants.AddressZero, id);

    const future = await nonTransferrableNFTs.futures(id);
    expect(future.amount).to.eq('0');
    expect(future.token).to.eq(ethers.constants.AddressZero);
    expect(future.unlockDate).to.eq('0');
    await expect(nonTransferrableNFTs.ownerOf(id)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    expect(await token.balanceOf(nonTransferrableNFTs.address)).to.eq('0');
    expect(await nonTransferrableNFTs.balanceOf(address)).to.eq('0');
  });
  it('redeems weth future', async () => {
    const address = await account.getAddress();
    await weth.approve(nonTransferrableNFTs.address, amount);
    const createTransaction = await nonTransferrableNFTs.createNFT(address, amount, weth.address, threeDays);
    const receipt = await createTransaction.wait();
    const event = receipt.events.find((event: any) => event.event === 'NFTCreated');
    const id = event.args['_i'];

    // reverts if the tokens are not unlocked yet
    await expect(nonTransferrableNFTs.redeemNFT(id)).to.be.revertedWith('NFT04');

    await ethers.provider.send('evm_setNextBlockTimestamp', [moment().add(3, 'days').unix()]);

    // reverts if the wallet sending is not the owner
    await expect(nonTransferrableNFTs.connect(other).redeemNFT(id)).to.be.revertedWith('NFT03');

    await expect(nonTransferrableNFTs.redeemNFT(id))
      .to.emit(nonTransferrableNFTs, 'NFTRedeemed')
      .withArgs(id, address, amount, weth.address, threeDays)
      .to.emit(nonTransferrableNFTs, 'Transfer')
      .withArgs(address, ethers.constants.AddressZero, id);

    const future = await nonTransferrableNFTs.futures(id);
    expect(future.amount).to.eq('0');
    expect(future.token).to.eq(ethers.constants.AddressZero);
    expect(future.unlockDate).to.eq('0');
    await expect(nonTransferrableNFTs.ownerOf(id)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    expect(await weth.balanceOf(nonTransferrableNFTs.address)).to.eq('0');
    expect(await nonTransferrableNFTs.balanceOf(address)).to.eq('0');
  });
};
