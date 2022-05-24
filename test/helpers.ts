import { ZERO_ADDRESS, OTC_DEFAULTS } from './constants';
import { ethers } from 'hardhat';

export const getBlockTimePlusSeconds = async (seconds: number): Promise<string> => {
  const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return (block.timestamp + seconds).toString();
}

export interface IIndexable {
  [key: string]: any;
}

export interface TestParameters {
  asset: string;
  payment: string;
  buyer: string;
  unlockDate: string;
  amount: string;
  isCelo?: boolean;
}

/**
 * Generates a test description showing what combination of parameters we have
 * @param {object} params the list of params we'll send into this test
 * @returns {string} the test test description
 */
export const generateLabel = (params: TestParameters): string => {
  let amountString = '';

  switch (true) {
    case params.amount === OTC_DEFAULTS.Amount:
      amountString = '10 x min value';
      break;
    case params.amount === OTC_DEFAULTS.Min:
      amountString = 'min value';
      break;
    default:
      amountString = params.amount;
  }

  return `asset: ${params.asset}, payment: ${params.payment}, buyer: ${
    params.buyer === ZERO_ADDRESS ? 'not specified' : 'specific buyer'
  }, unlockDate: ${params.unlockDate === '0' ? 'none' : 'specified'}, amount: ${amountString}`;
};
