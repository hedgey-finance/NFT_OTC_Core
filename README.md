# NFT_OTC_Core
Smart Contracts Core for the NFT and OTC Products.  

These smart contracts enable users to create peer to peer over the counter transactions with a permissionless decentralized protocol (HedgeyOTC). These transactions can enforce that tokens purchased are timelocked - where the FuturesNFT smart contract (Hedgeys) will lock tokens and mint the owner of those locked tokens an NFT that can later be redeemed.   
The Hedgeys (NFT) contract also enables users to build ontop of the protocol, and mint NFTs directly via locking tokens into the smart contract.  

For more information and documentation on the OTC product and functionality, please visit the [Hedgey OTC Docs](https://global-alfalfa-07c.notion.site/Hedgey-OTC-deals-cbc7b0047d7343e3ba2e236741e9c9bd)  
For more information and documentation specifically on the NFTs, please visit the [Hedgeys NFT Docs](https://global-alfalfa-07c.notion.site/Hedgeys-NFT-b03348c0f84a46acbe0d8861c7490c05)  

For developer documentation, integrations and APIs -  [OTC developers](https://global-alfalfa-07c.notion.site/OTC-Protocol-95b18254e5c543498b2d7b01790f1f86)  and [NFT Developers](https://global-alfalfa-07c.notion.site/Hedgeys-NFT-2fc03fc8bdc54cb0ae6673d33b5e2f8b)  
For a list of [Error Codes](https://global-alfalfa-07c.notion.site/Error-Codes-e15907bfd8804105ba7b5a373df63c18)  

The formal audit by Hacken can be found [HERE](https://hacken.io/audits/#hedgey_finance)  

## Testing
Clone repository

``` bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploymenting    
To deploy the contracts, use your preferred web3 deployment script. When deploying the contracts we go in a specific order for immediate linking of everything:  
1. deploy the NFT contract with the WETH address and blank '' string for the starting URI  
2. await the NFT contract deployment and then deploy the OTC contract with the WETH address and the newly confirmed NFT contract address for second constructor param  
3. call the function 'updateBaseURI' immediately after the NFT contract has been deployed with the URL that you use (for hedgey its https://nfts.hedgey.finance/${nft_address}),  
  ensuring that the uri is immediately set - now it cannot be reset by anyone again. This prevents unneccessary risks of having an admin address continue to manage the baseURI.  
4. For Deployting the BatchNFTMinter.sol contract, there are no constructor arguments necessary, as this contract can point to any of the deployed Hedgeys NFT contracts, it can simply be deployed via deployment script. 

## Active Mainnet NFT and OTC Deployments  
Deployed from commit hash `06a3c29c3b0ad0b2347aba9d858e044f1de59edb`  
All of the smart contracts on production mainnets have been deployed at the same addresses below:  
Hedgeys (Futures.sol): `0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351`    
HedgeyOTC linked to Hedgeys: `0xad337077480134028B7C68AF290E891ce28076Eb`  

NonTransferrableNFT: `0x6572a11EA2DD4E7B6161B531C3FDfd9CB6e9bdc6`  
OTC linked to nonTransferrable: `0x2e3f19e467E729d0b732a1D73A3210a2218C1F5F`  

Hedgeys Deployments on below mainnets, with the NonTransferrableNFT where noted:  
- Ethereum Mainnet  (+ NonTransferrable)  
- Polygon
- Fantom
- Avalanche C-chain
- Gnosis  (+ NonTransferrable)  
- Harmony
- Binance Smart Chain 
- Celo
- Boba network
- Optimism
- Arbitrum
- Evmos
- OEC (OkEx Chain)


