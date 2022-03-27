import { DummyTokens } from './../fixtures';
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import * as Constants from '../constants';
import { generateOTCFixture } from '../fixtures';

interface OTCCreateErrorParameters {
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

  it(params.label, async () => {
    const { otc, dummyTokens } = await generateOTCFixture({
      isCelo: params.isCelo,
      tokenASupply: params.emptyWallet ? Constants.ZERO : Constants.E18_100,
    });
    const token = params.asset ? dummyTokens[params.asset as keyof DummyTokens] : dummyTokens.tokenA;
    const fCreate = otc.create(
      token.address,
      dummyTokens.tokenB.address,
      params.amount,
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
  const params = [
    {
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
