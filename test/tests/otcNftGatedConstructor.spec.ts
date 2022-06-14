import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';

import { nftBaseUrl } from '../constants';

export default (isCelo: boolean = false) => {
  let weth: WETH9;
  let otcNftGated: Contract;
  let nft: Contract;

  before(async () => {
    const [owner] = await ethers.getSigners();

    weth = await deployWeth(owner);

    const NFT = await ethers.getContractFactory('Hedgeys');
    nft = await NFT.deploy(weth.address, '');

    const OtcNftGated = await ethers.getContractFactory('OTCNftGated');
    otcNftGated = await OtcNftGated.deploy(weth.address, nft.address);
  });

  it('should have weth set', async () => {
    const otcNftGatedWeth = await otcNftGated.weth();
    expect(otcNftGatedWeth).equal(weth.address);
  });

  it('should have base URI set', async () => {
    const futuresContract = await otcNftGated.futureContract();
    expect(futuresContract).equal(nft.address);
  });
};
