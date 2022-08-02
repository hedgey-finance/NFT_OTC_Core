import { MockProvider } from 'ethereum-waffle';
import { deployWeth } from '@thenextblock/hardhat-weth';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { expect } from 'chai';
import moment from 'moment';

const initialSupply = ethers.utils.parseEther('10000');
const amount = ethers.utils.parseEther('1');
const decimals = 18;
const nextWeek = moment().add(1, 'week').unix().toString();

export default () => {
  const provider = new MockProvider();
  const [wallet] = provider.getWallets();

  let weth: Contract, nonTransferrableNFTs: Contract, token: Contract, burn: Contract;

  before(async () => {
    weth = await deployWeth(wallet);
    
    const NonTransferrableNFTs = await ethers.getContractFactory('NonTransferrableNFTs');
    nonTransferrableNFTs = await NonTransferrableNFTs.deploy('NonTransfer', 'NT');

    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy(initialSupply, decimals);

    const Burn = await ethers.getContractFactory('BurnToken');
    burn = await Burn.deploy('Burn', 'BRN');
  });

  it('create an NFT', async () => {
    //pre balance check
    expect(await token.balanceOf(nonTransferrableNFTs.address)).to.eq('0');
    await token.approve(nonTransferrableNFTs.address, amount);
    const createTransaction = await nonTransferrableNFTs.createNFT(wallet.address, amount, token.address, nextWeek);
    const receipt = await createTransaction.wait();
    const event = receipt.events.find((event: any) => event.event === 'NFTCreated');
    const id = event.args['_i'];

    expect(createTransaction)
      .to.emit(nonTransferrableNFTs, 'NFTCreated')
      .withArgs(id, wallet.address, amount, token.address, nextWeek);

    const future = await nonTransferrableNFTs.futures(id);
    expect(future.token).to.eq(token.address);
    expect(future.unlockDate).to.eq(nextWeek);
    expect(await token.balanceOf(nonTransferrableNFTs.address)).to.eq(amount);
    //check holder
    expect(await nonTransferrableNFTs.balanceOf(wallet.address)).to.eq('1');
    expect(await nonTransferrableNFTs.ownerOf('1')).to.eq(wallet.address);
    expect(await nonTransferrableNFTs.totalSupply()).to.eq('1');
  });

  it('reverts if the amount == 0', async () => {
    await expect(nonTransferrableNFTs.createNFT(wallet.address, '0', token.address, nextWeek)).to.be.revertedWith('NFT01');
  });

  it('reverts if the token == zero address', async () => {
    await expect(nonTransferrableNFTs.createNFT(wallet.address, amount, ethers.constants.AddressZero, nextWeek)).to.be.revertedWith('NFT01');
  });

  it('reverts if the unlockDate is less than now', async () => {
    await expect(nonTransferrableNFTs.createNFT(wallet.address, amount, token.address, '0')).to.be.revertedWith('NFT01');
  });

  it('reverts if my wallet has insufficient balance', async () => {
    await expect(nonTransferrableNFTs.createNFT(wallet.address, ethers.utils.parseEther('10000'), token.address, nextWeek)).to.be.revertedWith(
      'THL01'
    );
  });

  it('reverts if the tokens sent do not match the amount received', async () => {
    expect(nonTransferrableNFTs.createNFT(wallet.address, amount, burn.address, nextWeek)).to.be.revertedWith('THL02');
  });
};
