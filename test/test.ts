import { MockProvider } from 'ethereum-waffle';

import * as Constants from './constants';

import otcConstructorTests from './tests/otcConstructor.spec';
import otcBuyErrorsTests from './tests/otcBuyErrors.spec';
import otcCreateErrorsTests from './tests/otcCreateErrors.spec';
import otcCreateTests from './tests/otcCreate.spec';
import otcBuyTests from './tests/otcBuy.spec';
import otcCloseTests from './tests/otcClose.spec';
import otcCloseErrorsTests from './tests/otcCloseErrors.spec';

import nftMiscTests from './tests/nftMisc.spec';
import nftRedeemTests from './tests/nftRedeem.spec';
import nftCreateTests from './tests/nftCreate.spec';
import nftTransferTests from './tests/nftTransfer.spec';
import noTransferTest from './tests/nftNoTransfer.spec';

describe('Hedgey OTC Library', async () => {
  const provider = new MockProvider();
  const [, buyer] = provider.getWallets();

  // Set up our variations of asset and payment tokens
  const tokenMatrix = [
    { asset: Constants.Tokens.TokenA, payment: Constants.Tokens.TokenA },
    { asset: Constants.Tokens.TokenA, payment: Constants.Tokens.Weth },
    { asset: Constants.Tokens.TokenA, payment: Constants.Tokens.TokenB },
    { asset: Constants.Tokens.Weth, payment: Constants.Tokens.TokenA },
    { asset: Constants.Tokens.Weth, payment: Constants.Tokens.Weth },
  ];

  const parameterMatrix = [
    { buyer: Constants.ZERO_ADDRESS, unlockDate: '0', amount: Constants.E18_10 },
    { buyer: Constants.ZERO_ADDRESS, unlockDate: '0', amount: Constants.E18_1 },
    { buyer: Constants.ZERO_ADDRESS, unlockDate: Constants.IN_ONE_HOUR, amount: Constants.E18_10 },
    { buyer: Constants.ZERO_ADDRESS, unlockDate: Constants.IN_ONE_HOUR, amount: Constants.E18_1 },
    { buyer: buyer.address, unlockDate: '0', amount: Constants.E18_10 },
    { buyer: buyer.address, unlockDate: '0', amount: Constants.E18_1 },
    { buyer: buyer.address, unlockDate: Constants.IN_ONE_HOUR, amount: Constants.E18_10 },
    { buyer: buyer.address, unlockDate: Constants.IN_ONE_HOUR, amount: Constants.E18_1 },
  ];

  describe('OTC Contract', () => {
    describe('Constructor', otcConstructorTests);
    describe('Create Errors', otcCreateErrorsTests);

    describe('Creating', () => {
      tokenMatrix.forEach((tokenPair) => {
        parameterMatrix.forEach((params) => {
          otcCreateTests({ ...tokenPair, ...params });
        });
      });
    });

    describe('Buy Errors', otcBuyErrorsTests);
    describe('Buying', () => {
      tokenMatrix.forEach((tokenPair) => {
        parameterMatrix.forEach((params) => {
          otcBuyTests({ ...tokenPair, ...params });
        });
      });
    });

    describe('Close Errors', otcCloseErrorsTests);
    describe('Closing', otcCloseTests);
  });

  describe('Celo OTC Contract', () => {
    describe('Constructor', () => otcConstructorTests(true));
    describe('Create Errors', () => otcCreateErrorsTests(true));

    describe('Creating', () => {
      tokenMatrix.forEach((tokenPair) => {
        parameterMatrix.forEach((params) => {
          if (tokenPair.asset !== Constants.Tokens.Weth && tokenPair.payment !== Constants.Tokens.Weth)
            otcCreateTests({ ...tokenPair, ...params, isCelo: true });
        });
      });
    });

    describe('Buy Errors', () => otcBuyErrorsTests(true));
    describe('Buying', () => {
      tokenMatrix.forEach((tokenPair) => {
        parameterMatrix.forEach((params) => {
          if (tokenPair.asset !== Constants.Tokens.Weth && tokenPair.payment !== Constants.Tokens.Weth)
            otcBuyTests({ ...tokenPair, ...params, isCelo: true });
        });
      });
    });

    describe('Close Errors', () => otcCloseErrorsTests(true));
    describe('Closing', () => otcCloseTests(true));
  });

  describe('NFT Contract', () => {
    describe('URI & Name', () => nftMiscTests(false));

    describe('Creating', () => nftCreateTests(false));

    describe('Redeeming - Token', () => nftRedeemTests);
    describe('Redeeming - Weth', () => {
      nftRedeemTests(true);
    });

    describe('Transferring - Token', () => {
      nftTransferTests(false, false);
    });

    describe('Transferring - Weth', () => {
      nftTransferTests(true, false);
    });
  });

  describe('Celo NFT Contract', () => {
    describe('URI & Name', () => nftMiscTests(true));

    describe('Creating', () => nftCreateTests(true));

    describe('Redeeming - Token', () => {
      nftRedeemTests(false, true);
    });

    describe('Transferring - Token', () => {
      nftTransferTests(false, true);
    });
  });
  describe('Non Transferrable NFT', () => {
    describe('Cannot Transfer', () => noTransferTest(false));
  });
});
