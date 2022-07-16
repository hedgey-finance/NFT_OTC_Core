import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployContract } from 'ethereum-waffle';
import { Web3Provider } from '@ethersproject/providers';
import { Wallet, Contract } from 'ethers';
import { WETH9 } from '@thenextblock/hardhat-weth';
import { deployWeth } from '@thenextblock/hardhat-weth';

import Token from '../artifacts/contracts/test/Token.sol/Token.json';
import NFT from '../artifacts/contracts/FuturesNFT.sol/Hedgeys.json';
import NoTransferNFT from '../artifacts/contracts/NonTransferrableNFT.sol/NonTransferrableNFTs.json';
import CeloNFT from '../artifacts/contracts/CeloFuturesNFT.sol/CeloHedgeys.json';
import BurnToken from '../artifacts/contracts/test/BurnToken.sol/BurnToken.json';
import FakeToken from '../artifacts/contracts/test/FakeToken.sol/FakeToken.json';

import { IIndexable } from './helpers';
import * as Constants from './constants';
import { ethers } from 'hardhat';

interface NewNFTFixture {
  nft: Contract;
  token: Contract;
  weth: WETH9;
  burn: Contract;
}

interface CreatedNFTFixture {
  nft: Contract;
  token: Contract;
  weth: WETH9;
}

interface TokenFixtureConfig {
  decimals?: number;
  emptyWallet?: boolean;
}

const defaultTokenFixtureConfig: TokenFixtureConfig = {
  decimals: 18,
  emptyWallet: false,
};

export async function tokenFixture(
  _: Web3Provider,
  [wallet]: Wallet[],
  conf: TokenFixtureConfig = defaultTokenFixtureConfig
): Promise<Contract> {
  const { decimals, emptyWallet } = conf;
  const token = await deployContract(wallet, Token, [emptyWallet ? Constants.ZERO : Constants.E18_100, decimals]);
  return token;
}

export async function burnTokenFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<Contract> {
  const burn = await deployContract(wallet, BurnToken, ['BURN', 'BURN']);
  await burn.mint(Constants.E18_100);
  return burn;
}

export async function fakeTokenFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<Contract> {
  const fake = await deployContract(wallet, FakeToken, ['FAKE', 'FAKE']);
  return fake;
}

export async function wethFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<WETH9> {
  const weth = await deployWeth(wallet);
  return weth;
}

export async function nftFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  isCelo: boolean = false
): Promise<Contract> {
  const weth = await wethFixture(provider, [wallet]);
  const nft = isCelo
    ? await deployContract(wallet, CeloNFT, [''])
    : await deployContract(wallet, NFT, [weth.address, '']);
  return nft;
}

interface OTCProps {
  isCelo?: boolean;
  tokenASupply?: string;
  tokenBSupply?: string;
}

export interface DummyTokens {
  tokenA: Contract;
  tokenB: Contract;
  weth: WETH9;
  burn: Contract;
  fake: Contract;
}
interface OTCReturn {
  owner: SignerWithAddress;
  buyer: SignerWithAddress;
  seller: SignerWithAddress;
  otc: Contract;
  dummyTokens: DummyTokens;
}

export async function generateOTCFixture({
  isCelo,
  tokenASupply = Constants.E18_1000,
  tokenBSupply = Constants.E18_1000,
}: OTCProps): Promise<OTCReturn> {
  const baseUrl = Constants.nftBaseUrl;
  const wallets = await ethers.getSigners();
  const [owner, buyer, seller] = wallets;
  const weth = await deployWeth(owner);

  // get our required contracts
  const Token = await ethers.getContractFactory('Token');
  const BurnToken = await ethers.getContractFactory('BurnToken');
  const FakeToken = await ethers.getContractFactory('FakeToken');
  const OTC = await ethers.getContractFactory(isCelo ? 'CeloHedgeyOTC' : 'HedgeyOTC');
  const NFT = await ethers.getContractFactory(isCelo ? 'CeloHedgeys' : 'Hedgeys');

  // deploy the required contracts
  const nft = isCelo ? await NFT.deploy(baseUrl) : await NFT.deploy(weth.address, baseUrl);
  const otc = isCelo ? await OTC.deploy(nft.address) : await OTC.deploy(await nft.weth(), nft.address);
  const tokenA = await Token.deploy(tokenASupply, 18);
  const tokenB = await Token.deploy(tokenBSupply, 18);
  const burn = await BurnToken.deploy('BURN', 'BURN');
  await burn.deployed();
  await burn.mint(Constants.E18_100);
  const fake = await FakeToken.deploy('FAKE', 'FAKE');

  // approvals
  await tokenA.approve(otc.address, Constants.E18_100);
  await tokenB.approve(otc.address, Constants.E18_100);
  await burn.approve(otc.address, Constants.E18_100);
  await fake.approve(otc.address, Constants.E18_100);

  const dummyTokens = { tokenA: tokenA, tokenB: tokenB, weth: weth, burn: burn, fake: fake };

  await Promise.all([
    nft.deployed(),
    otc.deployed(),
    tokenA.deployed(),
    tokenB.deployed(),
    burn.deployed(),
    fake.deployed(),
  ]);

  return {
    owner,
    buyer,
    seller,
    otc,
    dummyTokens,
  };
}

interface DealProps {
  amount: string;
  minimum: string;
  price: string;
  maturity: string;
  unlockDate: string;
  whitelist: string;
  asset?: string;
  payment?: string;
  isCelo?: boolean;
}
export async function generateDealFixture({
  amount,
  minimum,
  price,
  maturity,
  unlockDate,
  whitelist,
  asset = Constants.Tokens.TokenA,
  payment = Constants.Tokens.TokenB,
  isCelo = false,
}: DealProps) {
  const baseUrl = Constants.nftBaseUrl;
  const [owner, buyer, other] = await ethers.getSigners();
  const weth = await deployWeth(owner);
  const Token = await ethers.getContractFactory('Token');
  const OTC = await ethers.getContractFactory(isCelo ? 'CeloHedgeyOTC' : 'HedgeyOTC');
  const NFT = await ethers.getContractFactory(isCelo ? 'CeloHedgeys' : 'Hedgeys');

  const nft = isCelo ? await NFT.deploy(baseUrl) : await NFT.deploy(weth.address, baseUrl);
  const otc = isCelo ? await OTC.deploy(nft.address) : await OTC.deploy(await nft.weth(), nft.address);

  const tokenA = await Token.deploy(Constants.E18_1000, 18);
  await tokenA.approve(otc.address, Constants.E18_100);
  await tokenA.transfer(buyer.address, Constants.E18_50);
  await tokenA.connect(buyer).approve(otc.address, Constants.E18_100);

  const tokenB = await Token.deploy(Constants.E18_1000, 18);
  await tokenB.approve(otc.address, Constants.E18_100);
  await tokenB.transfer(buyer.address, Constants.E18_50);
  await tokenB.connect(buyer).approve(otc.address, Constants.E18_100);

  if ((asset === Constants.Tokens.Weth || payment === Constants.Tokens.Weth) && !isCelo) {
    await weth.deposit({ value: Constants.E18_100 });
    await weth.connect(buyer).deposit({ value: Constants.E18_100 });

    await weth.approve(otc.address, Constants.E18_100);
    await weth.connect(buyer).approve(otc.address, Constants.E18_100);
  }

  const returnValues = { weth, nft, tokenA, tokenB };

  const assetAddress = (returnValues as IIndexable)[asset].address;
  const paymentAddress = (returnValues as IIndexable)[payment].address;

  //create a deal at index0
  await otc.create(assetAddress, paymentAddress, amount, minimum, price, maturity, unlockDate, whitelist, {
    value: asset === Constants.Tokens.Weth ? amount : 0,
  });
  return { ...returnValues, otc, owner, buyer, other };
}

export async function newNFTFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  isCelo: boolean = false
): Promise<NewNFTFixture> {
  const weth = await wethFixture(provider, [wallet]);
  const token = await tokenFixture(provider, [wallet]);
  const nft = isCelo
    ? await deployContract(wallet, CeloNFT, [''])
    : await deployContract(wallet, NFT, [weth.address, '']);
  await token.approve(nft.address, Constants.E18_100);

  const burn = await burnTokenFixture(provider, [wallet]);
  await burn.approve(nft.address, Constants.E18_100);

  return { nft, token, weth, burn };
}

export async function createdNFTFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  isWeth: boolean,
  holder: Wallet,
  amount: string,
  unlockDate: string,
  isCelo: boolean = false
): Promise<CreatedNFTFixture> {
  const weth = await wethFixture(provider, [wallet]);
  const token = await tokenFixture(provider, [wallet]);
  const nft = isCelo
    ? await deployContract(wallet, CeloNFT, [''])
    : await deployContract(wallet, NFT, [weth.address, '']);

  //generates an existing NFT Futures position at index 1
  if (isWeth) {
    //need to get myself weth first
    await weth.deposit({ value: Constants.E18_100 });
    await weth.approve(nft.address, Constants.E18_100);
    await nft.createNFT(holder.address, amount, weth.address, unlockDate);
  } else {
    await token.approve(nft.address, Constants.E18_100);
    await nft.createNFT(holder.address, amount, token.address, unlockDate);
  }

  return { nft, token, weth };
}

export async function newNoTransferNFTFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  isCelo: boolean = false
): Promise<NewNFTFixture> {
  const weth = await wethFixture(provider, [wallet]);
  const token = await tokenFixture(provider, [wallet]);
  const nft = await deployContract(wallet, NoTransferNFT, [weth.address, '']);
  await token.approve(nft.address, Constants.E18_100);

  const burn = await burnTokenFixture(provider, [wallet]);
  await burn.approve(nft.address, Constants.E18_100);

  return { nft, token, weth, burn };
}

export async function createdNoTransferNFTFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  isWeth: boolean,
  holder: Wallet,
  amount: string,
  unlockDate: string,
  isCelo: boolean = false
): Promise<CreatedNFTFixture> {
  const weth = await wethFixture(provider, [wallet]);
  const token = await tokenFixture(provider, [wallet]);
  const nft = await deployContract(wallet, NoTransferNFT, [weth.address, '']);

  //generates an existing NFT Futures position at index 1
  if (isWeth) {
    //need to get myself weth first
    await weth.deposit({ value: Constants.E18_100 });
    await weth.approve(nft.address, Constants.E18_100);
    await nft.createNFT(holder.address, amount, weth.address, unlockDate);
  } else {
    await token.approve(nft.address, Constants.E18_100);
    await nft.createNFT(holder.address, amount, token.address, unlockDate);
  }

  return { nft, token, weth };
}
