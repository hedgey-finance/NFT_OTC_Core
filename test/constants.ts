import { BigNumber } from 'ethers';

export const nftBaseUrl = 'http://nft.hedgey.finance';

export const Tokens = {
  TokenA: 'tokenA',
  TokenB: 'tokenB',
  Weth: 'weth',
  Burn: 'burn',
  Fake: 'fake',
};

export const ZERO = BigNumber.from(0).toString();
export const ONE = BigNumber.from(1).toString();

export const E18_05 = BigNumber.from(10).pow(18).div(2).toString(); // 0.5e18
export const E18_1 = BigNumber.from(10).pow(18).toString(); // 1e18
export const E18_10 = BigNumber.from(10).pow(18).mul(10).toString(); // 10e18
export const E18_50 = BigNumber.from(10).pow(18).mul(50).toString(); // 50e18
export const E18_100 = BigNumber.from(10).pow(18).mul(100).toString(); // 100e18
export const E18_1000 = BigNumber.from(10).pow(18).mul(1000).toString(); // 1000e18
export const E18_10000 = BigNumber.from(10).pow(18).mul(10000).toString(); // 1000e18

export const E9_1 = BigNumber.from(10).pow(9).toString(); // 1e9

export const E6_1 = BigNumber.from(10).pow(6).toString(); // 1e6
export const E6_10 = BigNumber.from(10).pow(6).mul(10).toString(); // 10e6
export const E6_100 = BigNumber.from(10).pow(6).mul(100).toString(); // 100e6
export const E6_1000 = BigNumber.from(10).pow(6).mul(1000).toString(); // 1000e6

export const ONE_SECOND = 1;
export const ONE_MINUTE = 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;

export const IN_ONE_HOUR = (Math.round(Date.now() / 1000) + ONE_HOUR).toString();
export const ONE_HOUR_AGO = (Math.round(Date.now() / 1000) - ONE_HOUR).toString();

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NON_ZERO_ADDRESS = '0x0000000000000000000000000000000000000001';

export const OTC_DEFAULTS = {
  Amount: E18_10,
  Min: E18_1,
  Price: E18_1,
};
