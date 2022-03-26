import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

export default () => {
  let OTC: ContractFactory;
  let otc: Contract;
  let weth: WETH9;
  let NFT: ContractFactory;
  let nft: Contract;

  before(async () => {
    const [owner] = await ethers.getSigners();
    weth = await deployWeth(owner);
    OTC = await ethers.getContractFactory('HedgeyOTC');
    NFT = await ethers.getContractFactory('Hedgeys');
    nft = await NFT.deploy(weth.address, 'http://nft.hedgey.finance');
    otc = await OTC.deploy(await nft.weth(), nft.address);
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
