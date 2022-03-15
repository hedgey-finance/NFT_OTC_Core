import { Web3Provider } from '@ethersproject/providers';
import { expect } from 'chai';
import { MockProvider } from 'ethereum-waffle';
import { Wallet } from 'ethers';

import * as Constants from '../constants';
import { dealFixture } from '../fixtures';

interface OTCCloseErrorParameters {
  provider: Web3Provider;
  seller: Wallet;
  suspiciousSeller?: Wallet;
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
  isCelo: boolean,
  waitForBuyerPurchase?: boolean;
  waitForDealClose?: boolean;
}

const errorTest = async (params: OTCCloseErrorParameters) => {
  it(params.label, async () => {
    const fixture = await dealFixture(
      params.provider,
      [params.seller, params.buyer],
      params.amount,
      params.min,
      params.price,
      params.maturity,
      params.unlockDate,
      params.whitelist
    );

    let seller = params.seller;
    if (params.suspiciousSeller) {
      seller = params.suspiciousSeller;
    }

    if (params.waitForBuyerPurchase) {
      await fixture.otc.connect(params.buyer).buy(0, params.purchaseAmount);
    }

    if (params.waitForDealClose) {
      await fixture.otc.connect(seller).close(0);
    }

    await expect(fixture.otc.connect(seller).close(0)).to.be.revertedWith(params.expectedError);
  });
};

export default (isCelo: boolean = false) => {
  const provider = new MockProvider();
  const [buyer, seller, other] = provider.getWallets();

  const params = [
    {
      provider,
      buyer,
      seller,
      isCelo,
      suspiciousSeller: other,
      amount: Constants.E18_10,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC04: Only Seller Can Close',
      label: 'reverts if msg.sender is not the seller',
    },
    {
      provider,
      buyer,
      waitForBuyerPurchase: true,
      seller,
      isCelo,
      amount: Constants.E18_1,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC05: All tokens have been sold',
      label: 'reverts if all tokens in the deal have been sold',
    },
    {
      provider,
      buyer,
      waitForDealClose: true,
      seller,
      isCelo,
      amount: Constants.E18_1,
      min: Constants.E18_1,
      price: Constants.E18_1,
      maturity: Constants.IN_ONE_HOUR,
      unlockDate: Constants.IN_ONE_HOUR,
      whitelist: Constants.ZERO_ADDRESS,
      purchaseAmount: Constants.E18_1,
      expectedError: 'HEC05: All tokens have been sold',
      label: 'reverts if deal has been closed',
    },
  ];

  params.forEach(errorTest);
};
