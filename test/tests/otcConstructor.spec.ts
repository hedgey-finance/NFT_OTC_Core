import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

import { nftBaseUrl } from '../constants';

export default (isCelo: boolean = false) => {
  let OTC: ContractFactory;
  let otc: Contract;
  let weth: WETH9;
  let NFT: ContractFactory;
  let nft: Contract;

  before(async () => {
    const [owner] = await ethers.getSigners();
    weth = await deployWeth(owner);
    OTC = await ethers.getContractFactory(isCelo ? 'CeloHedgeyOTC' : 'HedgeyOTC');
    NFT = await ethers.getContractFactory(isCelo ? 'CeloHedgeys' : 'Hedgeys');

    nft = isCelo ? await NFT.deploy(nftBaseUrl) : await NFT.deploy(weth.address, nftBaseUrl);
    otc = isCelo ? await OTC.deploy(nft.address) : await OTC.deploy(await nft.weth(), nft.address);
  });

  if (isCelo) {
    it('should have not have weth method', async () => {
      expect(otc.weth).equal(undefined);
    });
  } else {
    it('should have weth set', async () => {
      const otcWeth = await otc.weth();
      expect(otcWeth).equal(weth.address);
    });
  }

  it('should have base URI set', async () => {
    const futuresContract = await otc.futureContract();
    expect(futuresContract).equal(nft.address);
  });
};
