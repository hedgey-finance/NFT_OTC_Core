import { expect } from 'chai';

import * as Constants from '../constants';
import { generateDealFixture } from '../fixtures';

interface OTCBuyErrorParameters {
  buyer?: string;
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
    const { otc, owner, buyer } = await generateDealFixture({
      amount: params.amount,
      minimum: params.min,
      price: params.price,
      maturity: params.maturity,
      unlockDate: params.unlockDate,
      whitelist: params.whitelist,
      asset: Constants.Tokens.TokenA,
      payment: Constants.Tokens.TokenB,
      isCelo: params.isCelo,
    });

    if (params.closed) otc.close(0);

    const connectTo = params.buyer === 'owner' ? owner : buyer;

    await expect(otc.connect(connectTo).buy('0', params.purchaseAmount)).to.be.revertedWith(params.expectedError);
  });
};

export default (isCelo: boolean = false) => {
  const params = [
    {
      buyer: 'owner',
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC06',
      label: 'should not allow the buyer to be the seller',
      closed: false,
      isCelo,
    },
    {
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.NON_ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC08',
      label: 'whitelist should be a zero address',
      closed: false,
      isCelo,
    },
    {
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E6_1,
      expectedError: 'OTC09',
      label: 'amount should be greater than minimum purchase',
      closed: false,
      isCelo,
    },
    {
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_100,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_10,
      expectedError: 'THL01',
      label: 'should be reverted when buyer has insufficient balance',
      closed: false,
      isCelo,
    },
  ];

  params.forEach(errorTest);
};
