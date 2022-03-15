import { Web3Provider } from '@ethersproject/providers';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { Wallet } from 'ethers';

import * as Constants from '../constants';
import { dealFixture } from '../fixtures';

interface OTCBuyErrorParameters {
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
  expectedError: string;
  label: string;
  closed: boolean;
  isCelo: boolean;
}

const errorTest = async (params: OTCBuyErrorParameters) => {
  it(params.label, async () => {
    const fixture = await dealFixture(
      params.provider,
      [params.seller, params.buyer],
      params.amount,
      params.min,
      params.price,
      params.maturity,
      params.unlockDate,
      params.whitelist,
      Constants.Tokens.TokenA,
      Constants.Tokens.TokenB,
      params.isCelo
    );
    if (params.closed) fixture.otc.close(0);

    await expect(fixture.otc.connect(params.buyer).buy('0', params.purchaseAmount)).to.be.revertedWith(
      params.expectedError
    );
  });
};

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [buyer, seller] = provider.getWallets();

  const params = [
    {
      provider,
      seller,
      buyer: seller,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC07: Buyer cannot be seller',
      label: 'should not allow the buyer to be the seller',
      closed: false,
      isCelo,
    },
    {
      provider,
      seller,
      buyer,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC06: Deal has been closed',
      label: 'should not allow a closed deal to be bought',
      closed: true,
      isCelo,
    },
    {
      provider,
      seller,
      buyer,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.NON_ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC08: Whitelist or buyer allowance error',
      label: 'whitelist should be a zero address',
      closed: false,
      isCelo,
    },
    {
      provider,
      seller,
      buyer,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E6_1,
      expectedError: 'HEC09: Insufficient Purchase Size',
      label: 'amount should be greater than minimum purchase',
      closed: false,
      isCelo,
    },
    {
      provider,
      seller,
      buyer,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_100,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_10,
      expectedError: 'HECB: Insufficient Balance',
      label: 'should be reverted when buyer has insufficient balance',
      closed: false,
      isCelo,
    },
  ];

  params.forEach(errorTest);
};
