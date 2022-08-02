import { deployWeth } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import moment from 'moment';

const nextWeek = moment().add(1, 'week').unix().toString();
const one = ethers.utils.parseEther('1');
const initialSupply = ethers.utils.parseEther('10000');
const decimals = 18;

const amount = one;
const min = one;
const price = one;
const maturity = nextWeek;
const unlockDate = nextWeek;
const buyer = ethers.constants.AddressZero;

export default () => {
  let weth: Contract, nonTransferrableNFTs: Contract, tokenContract: Contract, hedgeyOTC: Contract;

  it('should create an OTC deal with a token', async () => {
    const signers = await ethers.getSigners();
    const wallet = signers[7];

    weth = await deployWeth(wallet);

    const NonTransferrableNFTs = await ethers.getContractFactory('NonTransferrableNFTs');
    nonTransferrableNFTs = await NonTransferrableNFTs.deploy('NonTransfer', 'NT');

    const HedgeyOTC = await ethers.getContractFactory('HedgeyOTC');
    hedgeyOTC = await HedgeyOTC.deploy(weth.address, nonTransferrableNFTs.address);

    const Token = await ethers.getContractFactory('Token');
    tokenContract = await Token.deploy(initialSupply, decimals);

    const dealBuyer = signers[8];
    const token = tokenContract.address;
    const paymentToken = tokenContract.address;
    await tokenContract.approve(hedgeyOTC.address, one);
    await tokenContract.transfer(dealBuyer.address, one);
    await tokenContract.connect(dealBuyer).approve(hedgeyOTC.address, one);

    const createTransaction = await hedgeyOTC.create(
      token,
      paymentToken,
      amount,
      min,
      price,
      maturity,
      unlockDate,
      buyer
    );

    const createReceipt = await createTransaction.wait();
    const createEvent = createReceipt.events.find((event: any) => event.event === 'NewDeal');
    const dealId = createEvent.args['_d'];
    expect(dealId).to.not.be.undefined;

    const beforeNFTBalance = await nonTransferrableNFTs.balanceOf(dealBuyer.address);

    const lockedTokensBefore = await tokenContract.balanceOf(hedgeyOTC.address);
    const lockedValueBefore = await tokenContract.balanceOf(nonTransferrableNFTs.address);
    const buyTransaction = await hedgeyOTC.connect(dealBuyer).buy(dealId, one);
    const lockedTokensAfter = await tokenContract.balanceOf(hedgeyOTC.address);
    const buyReceipt = await buyTransaction.wait();
    const buyEvent = buyReceipt.events.find((event: any) => event.event === 'TokensBought');
    expect(lockedTokensAfter).to.be.eq(lockedTokensBefore.sub(one));
    expect(dealId).to.be.eq(buyEvent.args['_d']);

    const afterNFTBalance = await nonTransferrableNFTs.balanceOf(dealBuyer.address);
    const lockedValueAfter = await tokenContract.balanceOf(nonTransferrableNFTs.address);
    expect(lockedValueAfter).to.be.eq(lockedValueBefore.add(one));
    expect(afterNFTBalance).to.be.eq(beforeNFTBalance.add(1));
  });

  it('should create an OTC deal with weth', async () => {
    const signers = await ethers.getSigners();
    const wallet = signers[7];

    weth = await deployWeth(wallet);

    const NonTransferrableNFTs = await ethers.getContractFactory('NonTransferrableNFTs');
    nonTransferrableNFTs = await NonTransferrableNFTs.deploy(weth.address, '');

    const HedgeyOTC = await ethers.getContractFactory('HedgeyOTC');
    hedgeyOTC = await HedgeyOTC.deploy(weth.address, nonTransferrableNFTs.address);

    const Token = await ethers.getContractFactory('Token');
    tokenContract = await Token.deploy(initialSupply, decimals);

    const dealBuyer = signers[9];

    const token = weth.address;
    const paymentToken = weth.address;

    const createTransaction = await hedgeyOTC.create(
      token,
      paymentToken,
      amount,
      min,
      price,
      maturity,
      unlockDate,
      buyer,
      { value: one }
    );

    const receipt = await createTransaction.wait();
    const event = receipt.events.find((event: any) => event.event === 'NewDeal');
    const dealId = event.args['_d'];
    expect(dealId).to.not.be.undefined;

    const beforeNFTBalance = await nonTransferrableNFTs.balanceOf(dealBuyer.address);
    const lockedValueBefore = await weth.balanceOf(nonTransferrableNFTs.address);
    const lockedBalanceBefore = await weth.balanceOf(hedgeyOTC.address);
    const buyTransaction = await hedgeyOTC.connect(dealBuyer).buy(dealId, one, { value: one });
    const buyReceipt = await buyTransaction.wait();

    const lockedBalanceAfter = await weth.balanceOf(hedgeyOTC.address);
    expect(lockedBalanceAfter).to.be.eq(lockedBalanceBefore.sub(one));

    const buyEvent = buyReceipt.events.find((event: any) => event.event === 'TokensBought');
    expect(dealId).to.be.eq(buyEvent.args['_d']);

    const afterNFTBalance = await nonTransferrableNFTs.balanceOf(dealBuyer.address);
    expect(afterNFTBalance).to.be.eq(beforeNFTBalance.add(1));
    const lockedValueAfter = await weth.balanceOf(nonTransferrableNFTs.address);
    expect(lockedValueAfter).to.be.eq(lockedValueBefore.add(one));
  });
};
