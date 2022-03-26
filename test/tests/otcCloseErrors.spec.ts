import { expect } from 'chai';

import * as Constants from '../constants';
import { generateDealFixture } from '../fixtures';

interface OTCCloseErrorParameters {
  suspiciousSeller?: boolean;
  amount: string;
  min: string;
  price: string;
  maturity: string;
  unlockDate: string;
  whitelist: string;
  purchaseAmount: string;
  expectedError: string;
  label: string;
  isCelo: boolean;
  waitForBuyerPurchase?: boolean;
  waitForDealClose?: boolean;
}

const errorTest = async (params: OTCCloseErrorParameters) => {
  it(params.label, async () => {
    const { otc, owner, buyer, other } = await generateDealFixture({
      amount: params.amount,
      minimum: params.min,
      price: params.price,
      maturity: params.maturity,
      unlockDate: params.unlockDate,
      whitelist: params.whitelist,
    });

    let seller = params.suspiciousSeller ? other : owner;

    if (params.waitForBuyerPurchase) {
      await otc.connect(buyer).buy(0, params.purchaseAmount);
    }

    if (params.waitForDealClose) {
      await otc.connect(seller).close(0);
    }

    await expect(otc.connect(seller).close(0)).to.be.revertedWith(params.expectedError);
  });
};

export default (isCelo: boolean = false) => {
  const params = [
    {
      isCelo,
      suspiciousSeller: true,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC04',
      label: 'reverts if msg.sender is not the seller',
    },
    {
      waitForBuyerPurchase: true,
      isCelo,
      amount: Constants.E18_1,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'OTC04',
      label: 'reverts if all tokens in the deal have been sold',
    },
  ];

  params.forEach(errorTest);
};
