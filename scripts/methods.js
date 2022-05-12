const networks = require("./networks");

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
BN = BigNumber.clone({ DECIMAL_PLACES: 0 });
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;

const batchMinter = require('../artifacts/contracts/examples/BatchNFTMinter.sol/BatchNFTMinter.json');
const basictoken = require('../artifacts/contracts/test/Token.sol/Token.json');
const nft = require("../artifacts/contracts/FuturesNFT.sol/Hedgeys.json");
const otc = require("../artifacts/contracts/HedgeyOTC.sol/HedgeyOTC.json");



async function sendTx(web3, network, encodedABI, address, wallet, value, gwei) {
    const publicKey = wallet.publicKey;
    const privKey = wallet.privateKey;
    const privateKey = Buffer.from(privKey, 'hex');
    const transactionNonce = await web3.eth.getTransactionCount(publicKey, "pending");
    // TO DO - ESTIMATE GAS
    let transactionObject = {
        nonce: web3.utils.toHex(transactionNonce),
        gasLimit: web3.utils.toHex(8000000),
        gasPrice: web3.utils.toHex(gwei * (10 ** 9)),
        to: address,
        from: publicKey,
        data: encodedABI,
        value: web3.utils.toHex(value)
    }
    const tx = new Tx(transactionObject, { common: network });
    tx.sign(privateKey);
    const serializedEthTx = tx.serialize();
    web3.eth.sendSignedTransaction('0x' + serializedEthTx.toString('hex')).on('transactionHash', (hash) => {
        console.log(hash);
    })
        .on('receipt', (receipt) => {
            console.log(`tx hash: ${receipt.transactionHash}`);
            console.log(`status: ${receipt.status}`);
        })
        .catch(console.log);
}

async function setupWeb3(provider, target) {
    const network = networks[provider];
    let address;
    let point;
    switch (target) {
        case 'nft':
            address = network.nftAddress;
            point = nft;
            break;
        case 'otc':
            address = network.otcAddress;
            point = otc;
            break;
        case 'batch':
            address = network.batchAddress;
            point = batchMinter;
            break;
    }

    const customChain = Common.forCustomChain(
        'mainnet',
        {
            name: network.name,
            networkId: network.chainID,
            chainId: network.chainID,
        },
        'petersburg'
    )
    const rpcURL = network.url;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(point.abi, address);
    return {
        contract,
        web3,
        customChain,
        address,
        network,
    }
}

async function deploy(provider, wallet, target, constructorArgs, gwei) {
    const network = networks[provider];
    const customChain = Common.forCustomChain(
        'mainnet',
        {
            name: network.name,
            networkId: network.chainID,
            chainId: network.chainID,
        },
        'petersburg'
    )
    const rpcURL = network.url;
    const web3 = new Web3(rpcURL);
    const abi = target.abi;
    const data = target.bytecode;
    const myContract = new web3.eth.Contract(abi);
    const encodedABI = await myContract.deploy({
        data: data,
        arguments: constructorArgs
    }).encodeABI();
    const publicKey = wallet.publicKey;
    const privKey = wallet.privateKey;
    const privateKey = Buffer.from(privKey, 'hex');
    const transactionNonce = await web3.eth.getTransactionCount(publicKey, "pending");
    const transactionObject = {
        nonce: web3.utils.toHex(transactionNonce),
        gasLimit: web3.utils.toHex(8000000),
        gasPrice: web3.utils.toHex(gwei * (10 ** 9)),
        from: publicKey,
        data: encodedABI,
        value: 0
    }
    const tx = new Tx(transactionObject, { common: customChain });
    tx.sign(privateKey);
    const serializedEthTx = tx.serialize();
    await web3.eth.sendSignedTransaction('0x' + serializedEthTx.toString('hex')).on('transactionHash', (hash) => {
        console.log(hash);
    })
        .on('receipt', (receipt) => {
            console.log(receipt.contractAddress);
            futuresAddress = receipt.contractAddress;
        })
        .catch(console.log);
}

async function approve(provider, wallet, token, address, gwei) {
    const network = networks[provider];
    const customChain = Common.forCustomChain(
        'mainnet',
        {
            name: network.name,
            networkId: network.chainID,
            chainId: network.chainID,
        },
        'petersburg'
    )
    const rpcURL = network.url;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(basictoken.abi, token);
    const max = new BN(2).pow(200);
    const encodedABI = await contract.methods.approve(address, max).encodeABI();
    sendTx(web3, customChain, encodedABI, token, wallet, 0, gwei);
}

async function batchMint(provider, wallet, batch, gwei) {
    const setup = await setupWeb3(provider, 'batch');
    const encodedABI = await setup.contract.methods.batchMint(
        setup.network.nftAddress,
        batch.holders,
        batch.token,
        batch.amounts,
        batch.unlockDates
    ).encodeABI();
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, 0, gwei);
}

async function createDeal(provider, wallet, deal, gwei) {
    const setup = await setupWeb3(provider, 'otc');
    const encodedABI = await setup.contract.methods.create(
        deal.token,
        deal.paymentCurrency,
        deal.amount,
        deal.min,
        deal.price,
        deal.maturity,
        deal.unlockDate,
        deal.buyer
    ).encodeABI();
    let v = deal.token == setup.network.weth ? deal.amount : 0;
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, v, gwei);
}

async function closeDeal(provider, wallet, dealId, gwei) {
    const setup = await setupWeb3(provider, 'otc');
    const encodedABI = await setup.contract.methods.close(dealId);
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, 0, gwei);
}

async function buyDeal(provider, wallet, deal, gwei) {
    const setup = await setupWeb3(provider, 'otc');
    const encodedABI = await setup.contract.methods.buy(deal.id, deal.amount);
    let v = deal.paymentCurrency == setup.network.weth ? new BN(deal.amount).times(new BN(deal.price)).toString() : 0;
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, v, gwei);
}

async function mintNFT(provider, wallet, future, gwei) {
    const setup = await setupWeb3(provider, 'nft');
    const encodedABI = await setup.contract.methods.createNFT(future.holder, future.amount, future.token, future.unlockDate).encodeABI();
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, 0, gwei);
}

async function redeemNFT(provider, wallet, futureId, gwei) {
    const setup = await setupWeb3(provider, 'nft');
    const encodedABI = await setup.contract.methods.redeemNFT(futureId).encodeABI();
    sendTx(setup.web3, setup.customChain, encodedABI, setup.address, wallet, 0, gwei);
}

async function getDeal(provider, dealId) {
    const setup = await setupWeb3(provider, 'otc');
    const deal = await setup.contract.methods.deals(dealId).call();
    return deal;
}

async function getFuture(provider, nftId) {
    const setup = await setupWeb3(provider, 'nft');
    const future = await setup.contract.methods.futures(nftId).call();
    return future;
}

async function getBalance(provider, token, walletAddress) {
    const network = networks[provider];
    const rpcURL = network.url;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(basictoken.abi, token);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();
    console.log(balance);
    console.log(`decimals: ${decimals}`);
    return {
        balance,
        decimals,
    }
}

async function getLockedTokenDetails(provider, walletAddress) {
    const setup = await setupWeb3(provider, 'nft');
    const nftBalance = await setup.contract.methods.balanceOf(walletAddress).call();
    let nftsDetails = {};
    for (i = 0; i < nftBalance; i++) {
        let tokenId = await setup.contract.methods.tokenOfOwnerByIndex(walletAddress, i).call()
        let details = await setup.contract.methods.futures(tokenId).call();
        nftsDetails[i] = details;
    }
    console.log(nftsDetails);
    return nftsDetails;
}

async function getLockedTokenBalance(provider, walletAddress, token) {
    const setup = await setupWeb3(provider, 'nft');
    const nftBalance = await setup.contract.methods.balanceOf(walletAddress).call();
    let tokenBalance = 0;
    for (i = 0; i < nftBalance; i++) {
        let tokenId = await setup.contract.methods.tokenOfOwnerByIndex(walletAddress, i).call()
        let details = await setup.contract.methods.futures(tokenId).call();
        if (details.token.toLowerCase() == token.toLowerCase()) {
            tokenBalance += parseInt(details.amount, 10);
        }
    }
    console.log(tokenBalance);
    return tokenBalance;
}

module.exports = {
    approve,
    deploy,
    batchMint,
    createDeal,
    closeDeal,
    buyDeal,
    mintNFT,
    redeemNFT,
    getDeal,
    getFuture,
    getBalance,
    getLockedTokenDetails,
    getLockedTokenBalance,
}