import { deployContract } from 'ethereum-waffle';
import { Web3Provider } from '@ethersproject/providers';
import { Wallet, Contract } from 'ethers';
import { WETH9 } from '@thenextblock/hardhat-weth';
import { deployWeth } from '@thenextblock/hardhat-weth';

import Token from '../artifacts/contracts/test/Token.sol/Token.json';
import NFT from '../artifacts/contracts/FuturesNFT.sol/Hedgeys.json';
import OTC from '../artifacts/contracts/HedgeyOTC.sol/HedgeyOTC.json';
import CeloNFT from '../artifacts/contracts/CeloFuturesNFT.sol/CeloHedgeys.json';
import CeloOTC from '../artifacts/contracts/CeloHedgeyOTC.sol/CeloHedgeyOTC.json';
import BurnToken from '../artifacts/contracts/test/BurnToken.sol/BurnToken.json';
import FakeToken from '../artifacts/contracts/test/FakeToken.sol/FakeToken.json';

import { IIndexable } from './helpers';
import * as Constants from './constants';

interface DealFixture {
  weth: WETH9;
  nft: Contract;
  otc: Contract;
  tokenA: Contract;
  tokenB: Contract;
}

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

interface CeloDealFixture {
  nft: Contract;
  otc: Contract;
  tokenA: Contract;
  tokenB: Contract;
}

interface NewCeloNFTFixture {
  nft: Contract;
  token: Contract;
  burn: Contract;
}

interface CreatedCeloNFTFixture {
  nft: Contract;
  token: Contract;
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

export async function otcFixture(
  provider: Web3Provider,
  [wallet]: Wallet[],
  emptyWallet: boolean = false,
  isCelo: boolean = false
) {
  const weth = await wethFixture(provider, [wallet]);
  const nft = await nftFixture(provider, [wallet], isCelo);
  const otc = isCelo
    ? await deployContract(wallet, CeloOTC, [nft.address])
    : await deployContract(wallet, OTC, [weth.address, nft.address]);

  const tokenA = await tokenFixture(provider, [wallet], { ...defaultTokenFixtureConfig, emptyWallet });
  await tokenA.approve(otc.address, Constants.E18_100);

  const tokenB = await tokenFixture(provider, [wallet]);
  await tokenB.approve(otc.address, Constants.E18_100);

  const burn = await burnTokenFixture(provider, [wallet]);
  await burn.approve(otc.address, Constants.E18_100);

  const fake = await fakeTokenFixture(provider, [wallet]);

  return { weth, nft, otc, tokenA, tokenB, burn, fake };
}

export async function dealFixture(
  provider: Web3Provider,
  [seller, buyer]: Wallet[],
  amount: string,
  minimum: string,
  price: string,
  maturity: string,
  unlockDate: string,
  whitelist: string,
  asset: string = Constants.Tokens.TokenA,
  payment: string = Constants.Tokens.TokenB,
  isCelo: boolean = false
): Promise<DealFixture> {
  const weth = await wethFixture(provider, [seller]);
  const nft = await nftFixture(provider, [seller], isCelo);
  const otc = isCelo
    ? await deployContract(seller, CeloOTC, [nft.address])
    : await deployContract(seller, OTC, [weth.address, nft.address]);

  if ((asset === Constants.Tokens.Weth || payment === Constants.Tokens.Weth) && !isCelo) {
    await weth.deposit({ value: Constants.E18_100 });
    await weth.connect(buyer).deposit({ value: Constants.E18_100 });

    await weth.approve(otc.address, Constants.E18_100);
    await weth.connect(buyer).approve(otc.address, Constants.E18_100);
  }

  const tokenA = await tokenFixture(provider, [seller]);
  await tokenA.approve(otc.address, Constants.E18_100);
  await tokenA.transfer(buyer.address, Constants.E18_50);
  await tokenA.connect(buyer).approve(otc.address, Constants.E18_100);

  const tokenB = await tokenFixture(provider, [seller]);
  await tokenB.approve(otc.address, Constants.E18_100);
  await tokenB.transfer(buyer.address, Constants.E18_50);
  await tokenB.connect(buyer).approve(otc.address, Constants.E18_100);

  const returnValues = { weth, nft, tokenA, tokenB };

  const assetAddress = (returnValues as IIndexable)[asset].address;
  const paymentAddress = (returnValues as IIndexable)[payment].address;

  //create a deal at index0
  await otc.create(assetAddress, paymentAddress, amount, minimum, price, maturity, unlockDate, whitelist, {
    value: asset === Constants.Tokens.Weth ? amount : 0,
  });
  return { ...returnValues, otc };
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
