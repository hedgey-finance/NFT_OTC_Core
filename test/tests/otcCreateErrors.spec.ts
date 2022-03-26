import { Web3Provider } from '@ethersproject/providers';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { BigNumber, Contract, ContractFactory, utils, Wallet } from 'ethers';
import * as Constants from '../constants';
import { deployWeth } from '@thenextblock/hardhat-weth';
import { ethers } from 'hardhat';
import { IIndexable } from '../helpers';

interface OTCCreateErrorParameters {
  provider: Web3Provider;
  seller: Wallet;
  buyer: Wallet;
  amount: string;
  min: string;
  price: string;
  maturity: string;
  unlockDate: string;
  whitelist: string;
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

  let otc: Contract, dummyTokens: IIndexable;

  before(async() => {
    const baseUrl = 'http://nft.hedgey.finance';
    const wallets = await ethers.getSigners();
    const [owner] = wallets;
    const weth = await deployWeth(owner);
    await weth.deployed();
    
    const nftFactory = await ethers.getContractFactory(params.isCelo ? 'CeloHedgeys' : 'Hedgeys');
    const nft = params.isCelo ? await nftFactory.deploy(baseUrl) : await nftFactory.deploy(weth.address, baseUrl);
    await nft.deployed();

    const otcFactory = await ethers.getContractFactory(params.isCelo ? 'CeloHedgeyOTC' : 'HedgeyOTC');
    otc = params.isCelo ? await otcFactory.deploy(nft.address) : await otcFactory.deploy(weth.address, nft.address);
    await otc.deployed();

    const Token = await ethers.getContractFactory('Token');
    const tokenA = await Token.deploy(params.emptyWallet ? Constants.ZERO : Constants.E18_100, 18);
    await tokenA.deployed();
    await tokenA.approve(otc.address, Constants.E18_100);
    const tokenB = await Token.deploy(Constants.E18_1000, 18);
    await tokenB.deployed();
    await tokenB.approve(otc.address, Constants.E18_100);
    const BurnToken = await ethers.getContractFactory('BurnToken');
    const burn = await BurnToken.deploy('BURN', 'BURN');
    await burn.deployed();
    await burn.mint(Constants.E18_100);
    await burn.approve(otc.address, Constants.E18_100);
    const FakeToken = await ethers.getContractFactory('FakeToken');
    const fake = await FakeToken.deploy('FAKE', 'FAKE');
    await fake.deployed();
    dummyTokens = { tokenA, tokenB, weth, burn, fake };
  });

  it(params.label, async () => {
    // @ts-ignore
    const token = params.asset ? dummyTokens[params.asset] : dummyTokens.tokenA;
    const fCreate = otc.create(
      token.address,
      dummyTokens.tokenB.address,
      params.amount, to
      params.min,
      params.price,
      params.maturity,
      params.unlockDate,
      params.whitelist
    );

    if (params.expectedError) {
      await expect(fCreate).to.be.revertedWith(params.expectedError);
    } else {
      await expect(fCreate).to.be.reverted;
    }
  });
};

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [buyer, seller] = provider.getWallets();

  const params = [
    {
      provider,
      buyer,
      seller,
      isCelo,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.ONE_HOUR_AGO,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC01',
      label: 'reverts if maturity date is less than the current block timestamp',
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      amount: Constants.ONE,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC02',
      label: 'reverts if amount is less than minimum',
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.ZERO,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if price is zero',
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      amount: Constants.E18_10,
      min: Constants.ZERO,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if minimum is zero',
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      amount: Constants.E18_10,
      min: Constants.ONE,
      price: Constants.E9_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC03',
      label: 'reverts if minimum is 1 wei and price is 1 gwei',
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      skipIfCelo: true,
      asset: Constants.Tokens.Weth,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL03',
      label: "reverts if seller's token is weth and there's a small amount of eth in msg.value",
      txValue: {
        value: utils.parseEther('0.001'),
      },
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      skipIfCelo: true,
      asset: Constants.Tokens.Weth,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL03',
      label: "reverts if seller's token is weth and there's a large amount of eth in msg.value",
      txValue: {
        value: utils.parseEther('500'),
      },
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      emptyWallet: true,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL01',
      label: "reverts if seller's token is ERC20 but wallet has insufficient balance",
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      asset: Constants.Tokens.Burn,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'THL02',
      label: "reverts if seller's token is a tax or deflationary token",
    },
    {
      provider,
      buyer,
      seller,
      isCelo,
      asset: Constants.Tokens.Fake,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      label: "reverts if seller's token contract doesn't have the `decimals` method",
    },
  ];

  params.forEach(errorTest);
};
