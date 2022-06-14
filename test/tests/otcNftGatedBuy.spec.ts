import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployWeth, WETH9 } from '@thenextblock/hardhat-weth';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import * as Constants from '../constants';

describe('OTC NFT Gated Buy', () => {
  let weth: WETH9;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let hedgeys: Contract;

  before(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    buyer = signers[1];
    weth = await deployWeth(owner);

    const Hedgeys = await ethers.getContractFactory('Hedgeys');
    hedgeys = await Hedgeys.deploy(weth.address, Constants.nftBaseUrl);
  });

  it('should create and fail to buy the deal with no NFT', async () => {
    const NFT = await ethers.getContractFactory('Demo');
    const nft = await NFT.deploy();
    const whitelist = [nft.address];

    const OTC = await ethers.getContractFactory('OTCNftGated');
    const otc = await OTC.deploy(weth.address, hedgeys.address);

    const deal = await otc.createNFTGatedDeal(
      weth.address,
      weth.address,
      Constants.E18_100,
      Constants.E18_100,
      Constants.OTC_DEFAULTS.Price,
      Constants.IN_ONE_HOUR,
      Constants.IN_ONE_HOUR,
      whitelist,
      {
        value: Constants.E18_100,
      }
    );

    await expect(otc.connect(buyer).buy('0', Constants.E18_100, { value: Constants.E18_100 })).to.be.revertedWith(
      'OTC08'
    );
  });

  it('should buy the deal if the buyer has one NFT', async () => {
    const NFT = await ethers.getContractFactory('Demo');
    const nft = await NFT.deploy();
    await nft.mintOne(buyer.address);
    const whitelist = [nft.address];

    const OTC = await ethers.getContractFactory('OTCNftGated');
    const otc = await OTC.deploy(weth.address, hedgeys.address);

    await otc.createNFTGatedDeal(
      weth.address,
      weth.address,
      Constants.E18_100,
      Constants.E18_100,
      Constants.OTC_DEFAULTS.Price,
      Constants.IN_ONE_HOUR,
      Constants.IN_ONE_HOUR,
      whitelist,
      {
        value: Constants.E18_100,
      }
    );

    const txReceipt = await otc.connect(buyer).buy('0', Constants.E18_100, { value: Constants.E18_100 });
    await expect(txReceipt).to.emit(otc, 'TokensBought').withArgs('0', Constants.E18_100, '0');
  });

  it('should buy the deal if the buyer has one of many NFTs', async () => {
    const NFT = await ethers.getContractFactory('Demo');
    const nftA = await NFT.deploy();
    const nftB = await NFT.deploy();
    await nftA.mintOne(buyer.address);
    const whitelist = [nftA.address, nftB.address];

    const OTC = await ethers.getContractFactory('OTCNftGated');
    const otc = await OTC.deploy(weth.address, hedgeys.address);

    await otc.createNFTGatedDeal(
      weth.address,
      weth.address,
      Constants.E18_100,
      Constants.E18_100,
      Constants.OTC_DEFAULTS.Price,
      Constants.IN_ONE_HOUR,
      Constants.IN_ONE_HOUR,
      whitelist,
      {
        value: Constants.E18_100,
      }
    );

    const txReceipt = await otc.connect(buyer).buy('0', Constants.E18_100, { value: Constants.E18_100 });
    await expect(txReceipt).to.emit(otc, 'TokensBought').withArgs('0', Constants.E18_100, '0');
  });

  it('should fail to create the deal with a dodgy NFT address', async () => {
    const whitelist = ['dodgy'];

    const OTC = await ethers.getContractFactory('OTCNftGated');
    const otc = await OTC.deploy(weth.address, hedgeys.address);

    await expect(
      otc.createNFTGatedDeal(
        weth.address,
        weth.address,
        Constants.E18_100,
        Constants.E18_100,
        Constants.OTC_DEFAULTS.Price,
        Constants.IN_ONE_HOUR,
        Constants.IN_ONE_HOUR,
        whitelist,
        {
          value: Constants.E18_100,
        }
      )
    ).to.be.reverted;
  });

  it('should fail to buy the deal with the zero address', async () => {
    const whitelist = [Constants.ZERO_ADDRESS];

    const OTC = await ethers.getContractFactory('OTCNftGated');
    const otc = await OTC.deploy(weth.address, hedgeys.address);

    await otc.createNFTGatedDeal(
      weth.address,
      weth.address,
      Constants.E18_100,
      Constants.E18_100,
      Constants.OTC_DEFAULTS.Price,
      Constants.IN_ONE_HOUR,
      Constants.IN_ONE_HOUR,
      whitelist,
      {
        value: Constants.E18_100,
      }
    );

    //Error: Transaction reverted: function returned an unexpected amount of data
    await expect(otc.connect(buyer).buy('0', Constants.E18_100, { value: Constants.E18_100 })).to.be.reverted;
  });


});
