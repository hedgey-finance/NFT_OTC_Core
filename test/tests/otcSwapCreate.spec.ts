import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { deployWeth } from '@thenextblock/hardhat-weth';

const initialSupply = ethers.utils.parseEther("1000");
const one = ethers.utils.parseEther("1");
const ten = ethers.utils.parseEther("10");

describe.only('OTCSwap create deal', () => {
  let otcSwap: Contract;
  let accounts: Signer[];
  let weth: Contract;
  let hedgeys: Contract;
  let audi: Contract;
  let bmw: Contract;

  before(async () => {
    accounts = await ethers.getSigners();
    weth = await deployWeth(accounts[0]);

    const Hedgeys = await ethers.getContractFactory('Hedgeys');
    hedgeys = await Hedgeys.deploy(weth, '');

    const OTCSwap = await ethers.getContractFactory('OTCSwap');
    otcSwap = await OTCSwap.deploy(weth.address, hedgeys.address);

    const Audi = await ethers.getContractFactory('Token');
    audi = await Audi.deploy(initialSupply, "Audi", "AUD");

    const Bmw = await ethers.getContractFactory('Token');
    bmw = await Bmw.deploy(initialSupply, "BMW", "BMW");
  });

  it('should create a deal', () => {
    otcSwap.create(bmw.address, audi.address, one, one, one, one)
  });
});
