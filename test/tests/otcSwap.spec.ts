import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { deployWeth } from '@thenextblock/hardhat-weth';
import moment from 'moment';
import { expect } from 'chai';

const initialSupply = ethers.utils.parseEther('1000');
const one = ethers.utils.parseEther('1');
const ten = ethers.utils.parseEther('10');
const tomorrow = moment().add(1, 'day').unix().toString();
const yesterday = moment().subtract(1, 'day').unix().toString();
const NEW_DEAL_EVENT = 'NewDeal';

describe.only('OTCSwap', () => {
  let otcSwap: Contract;
  let accounts: Signer[];
  let weth: Contract;
  let hedgeys: Contract;
  let audi: Contract;
  let bmw: Contract;
  let address: String;

  before(async () => {
    accounts = await ethers.getSigners();
    weth = await deployWeth(accounts[0]);
    address = await accounts[0].getAddress();

    const Hedgeys = await ethers.getContractFactory('Hedgeys');
    hedgeys = await Hedgeys.deploy(weth.address, '');

    const OTCSwap = await ethers.getContractFactory('OTCSwap');
    otcSwap = await OTCSwap.deploy(weth.address, hedgeys.address);

    const Token = await ethers.getContractFactory('Token');
    audi = await Token.deploy(initialSupply, 18);
    bmw = await Token.deploy(initialSupply, 18);
  });

  describe('create deal', () => {
    it('should create a deal with no whitelist', async () => {
      const buyers: string[] = [];
      await bmw.approve(otcSwap.address, one);
      const createTransaction = await otcSwap.create(
        bmw.address,
        audi.address,
        one,
        one,
        one,
        one,
        tomorrow,
        tomorrow,
        tomorrow,
        buyers
      );
      const createReceipt = await createTransaction.wait();
      const event = createReceipt.events.find((event: any) => event.event === NEW_DEAL_EVENT);
      const dealIndex = event.args['dealIndex'];
      await expect(createTransaction)
        .to.emit(otcSwap, NEW_DEAL_EVENT)
        .withArgs(
          dealIndex,
          address,
          bmw.address,
          audi.address,
          one,
          one,
          one,
          one,
          tomorrow,
          tomorrow,
          tomorrow,
          false
        );
    });

    it('should create a deal with a whitelist', async () => {
      const buyer = await accounts[1].getAddress();
      const buyers: string[] = [buyer];
      await bmw.approve(otcSwap.address, one);
      const createTransaction = await otcSwap.create(
        bmw.address,
        audi.address,
        one,
        one,
        one,
        one,
        tomorrow,
        tomorrow,
        tomorrow,
        buyers
      );
      const createReceipt = await createTransaction.wait();
      const event = createReceipt.events.find((event: any) => event.event === NEW_DEAL_EVENT);
      const dealIndex = event.args['dealIndex'];
      await expect(createTransaction)
        .to.emit(otcSwap, NEW_DEAL_EVENT)
        .withArgs(
          dealIndex,
          address,
          bmw.address,
          audi.address,
          one,
          one,
          one,
          one,
          tomorrow,
          tomorrow,
          tomorrow,
          true
        );
    });
  });

  describe.only('buy deal', () => {
    it('should fail to buy a deal when buyer is not in the whitelist', async () => {
      const buyer = accounts[1];
      const buyerAddress = buyer.getAddress();
      const buyers: string[] = [];
      await audi.transfer(buyerAddress, one);
      await bmw.approve(otcSwap.address, one);
      const createTransaction = await otcSwap.create(
        bmw.address,
        audi.address,
        one,
        one,
        one,
        one,
        tomorrow,
        tomorrow,
        tomorrow,
        buyers
      );
      const createReceipt = await createTransaction.wait();
      const newDealEvent = createReceipt.events.find((event: any) => event.event === NEW_DEAL_EVENT);
      const dealIndex = newDealEvent.args['dealIndex'];

      const buyTransaction = await otcSwap.connect(buyer).buy(dealIndex, one);
    });
  });
});
