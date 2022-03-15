import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

export default async () => {
  let Otc: ContractFactory;
  let otc: Contract;
  let weth: WETH9;
  let Nft: ContractFactory;
  let nft: Contract;

  const [owner] = await ethers.getSigners();

  before(async () => {
    weth = await deployWeth(owner);
    Otc = await ethers.getContractFactory('HedgeyOTC');
    Nft = await ethers.getContractFactory('Hedgeys');
    nft = await Nft.deploy(weth.address, 'http://nft.hedgey.finance');
    otc = await Otc.deploy(await nft.weth(), nft.address);
  });

  it('should have weth set', async () => {
    const otcWeth = await otc.weth();
    expect(otcWeth).equal(weth.address);
  });

  it('should have base URI set', async () => {
    const futuresContract = await otc.futureContract();
    expect(futuresContract).equal(nft.address);
  });
};
