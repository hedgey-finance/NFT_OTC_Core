import { Web3Provider } from '@ethersproject/providers';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { BigNumber, utils, Wallet } from 'ethers';

import * as Constants from '../constants';
import { otcFixture } from '../fixtures';
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

  it(params.label, async () => {
    const fixture = await otcFixture(params.provider, [params.seller], params.emptyWallet, params.isCelo);

    const assetToken = params.asset ? (fixture as IIndexable)[params.asset] : fixture.tokenA;
    const fCreate = fixture.otc.create(
      assetToken.address,
      fixture.tokenB.address,
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
      expectedError: 'HEC01: Maturity before block timestamp',
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
      expectedError: 'HEC02: Amount less than minium',
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
      expectedError: 'HEC03: Minimum smaller than 0',
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
      expectedError: 'HEC03: Minimum smaller than 0',
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
      expectedError: 'HEC03: Minimum smaller than 0',
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
      expectedError: 'HECA: Incorrect Transfer Value',
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
      expectedError: 'HECA: Incorrect Transfer Value',
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
      expectedError: 'HECB: Insufficient Balance',
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
