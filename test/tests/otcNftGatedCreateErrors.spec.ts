import { BigNumber, Contract, utils } from 'ethers';
import * as Constants from '../constants';
import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { ethers } from 'hardhat';

const TOKEN_SUPPLY = Constants.E18_1000;
const TOKEN_DECIMALS = 18;

interface OTCCreateErrorParameters {
  amount: string;
  min: string;
  price: string;
  maturity: string;
  unlockDate: string;
  whitelist: string[];
  purchaseAmount: string;
  expectedError?: string;
  label: string;
  isCelo: boolean;
  skipIfCelo?: boolean;
  asset?: string;
  emptyWallet?: boolean;
  txValue?: {
    value?: BigNumber;
  };
}

const errorTest = async (params: OTCCreateErrorParameters) => {
  if (params.isCelo && params.skipIfCelo) return;

  it(params.label, async () => {
    let weth: WETH9;
    let otcNftGated: Contract;
    let nft: Contract;

    const [owner] = await ethers.getSigners();

    weth = await deployWeth(owner);

    const NFT = await ethers.getContractFactory('Hedgeys');
    nft = await NFT.deploy(weth.address, '');

    const OtcNftGated = await ethers.getContractFactory('OTCNftGated');
    otcNftGated = await OtcNftGated.deploy(weth.address, nft.address);

    const Token = await ethers.getContractFactory('Token');
    const BurnToken = await ethers.getContractFactory('BurnToken');
    const FakeToken = await ethers.getContractFactory('FakeToken');

    let tokenA;
    switch (params.asset) {
      case Constants.Tokens.Weth:
        tokenA = weth;
        break;
      case Constants.Tokens.Burn:
        tokenA = await BurnToken.deploy(params.emptyWallet ? Constants.ZERO : TOKEN_SUPPLY, TOKEN_DECIMALS);
        await tokenA.mint(Constants.E18_100);
        break;
      case Constants.Tokens.Fake:
        tokenA = await FakeToken.deploy(params.emptyWallet ? Constants.ZERO : TOKEN_SUPPLY, TOKEN_DECIMALS);
        break;
      default:
        tokenA = await Token.deploy(params.emptyWallet ? Constants.ZERO : TOKEN_SUPPLY, TOKEN_DECIMALS);
    }
    await tokenA.approve(otcNftGated.address, Constants.E18_100);
  
    const tokenB = await Token.deploy(TOKEN_SUPPLY, TOKEN_DECIMALS);
    await tokenB.approve(otcNftGated.address, Constants.E18_100);

    const created = otcNftGated.createNFTGatedDeal(
      tokenA.address,
      tokenB.address,
      params.amount,
      params.min,
      params.price,
      params.maturity,
      params.unlockDate,
      params.whitelist
    );

    if (params.expectedError) {
      await expect(created).to.be.revertedWith(params.expectedError);
    } else {
      await expect(created).to.be.reverted;
    }
  });
};

export default (isCelo: boolean = false) => {
  const params = [
    {
      isCelo,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.ONE_HOUR_AGO,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC01',
      label: 'reverts if maturity date is less than the current block timestamp',
    },
    {
      isCelo,
      amount: Constants.ONE,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC02',
      label: 'reverts if amount is less than minimum',
    },
    {
      isCelo,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.ZERO,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if price is zero',
    },
    {
      isCelo,
      amount: Constants.E18_10,
      min: Constants.ZERO,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if minimum is zero',
    },
    {
      isCelo,
      amount: Constants.E18_10,
      min: Constants.ONE,
      price: Constants.E9_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if minimum is 1 wei and price is 1 gwei',
    },
    {
      isCelo,
      skipIfCelo: true,
      asset: Constants.Tokens.Weth,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL03',
      label: "reverts if seller's token is weth and there's a small amount of eth in msg.value",
      txValue: {
        value: utils.parseEther('0.001'),
      },
    },
    {
      isCelo,
      skipIfCelo: true,
      asset: Constants.Tokens.Weth,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL03',
      label: "reverts if seller's token is weth and there's a large amount of eth in msg.value",
      txValue: {
        value: utils.parseEther('500'),
      },
    },
    {
      isCelo,
      emptyWallet: true,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL01',
      label: "reverts if seller's token is ERC20 but wallet has insufficient balance",
    },
    {
      isCelo,
      asset: Constants.Tokens.Burn,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL02',
      label: "reverts if seller's token is a tax or deflationary token",
    },
    {
      isCelo,
      asset: Constants.Tokens.Fake,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: [],
      purchaseAmount: Constants.E18_1,
      label: "reverts if seller's token contract doesn't have the `decimals` method",
    },
  ];

  params.forEach(errorTest);
};
