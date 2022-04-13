// IMPORT API KEYS HERE
const api = require('./api');

module.exports = {
    rinkeby: {
        url: api.rinkeby.url,
        chainID: '0x4',
        weth: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
        name: 'rinkeby',
        nftAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
        otcAddress: '0xB3d4EFE7ECF102afCd3262cF4d5fc768D0c55459',
        batchAddress: '0x0ad2501f3CD2016EDC0e4D9d0E6e31ee34b0C9Af',
    },
    ethereum: {
        url: api.ethereum.url,
        chainID: '0x1',
        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        name: 'ethereum',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0xB3d4EFE7ECF102afCd3262cF4d5fc768D0c55459',
    },
    gnosis: {
        url: api.gnosis.url,
        chainID: '0x64',
        weth: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
        name: 'gnosis',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    polygon: {
        url: api.polygon.url,
        chainID: '0x89',
        weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        name: 'polygon',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    fantom: {
        url: api.fantom.url,
        chainID: '0xFA',
        weth: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        name: 'fantom',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    celo : {
        url: api.celo.url,
        chainID: '0xA4EC',
        weth: '',
        name: 'celo',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    bsc: {
        url: api.bsc.url,
        chainID: '0x38',
        weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        name: 'bsc',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    avalanche: {
        url: api.avalanche.url,
        chainID: '0xA86A',
        weth: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
        name: 'avalanche',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    oec: {
        url: api.oec.url,
        chainID: '0x42',
        weth: '0x8F8526dbfd6E38E3D8307702cA8469Bae6C56C15',
        name: 'oec'
    },
    harmony: {
        url: api.harmony.url,
        chainID: '0x63564C40',
        weth: '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a',
        name: 'harmony',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    },
    arbitrum: {
        url: api.arbitrum.url,
        chainID: '0xA4B1',
        weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        name: 'arbitrum'
    },
    optimism: {
        url: api.optimism.url,
        chainID: '',
        weth: '',
        name: 'optimism'
    },
    boba: {
        url: api.boba.url,
        chainID: '0x120',
        weth: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
        name: 'boba',
        nftAddress: '0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351',
        otcAddress: '0xad337077480134028B7C68AF290E891ce28076Eb',
        batchAddress: '0x4Bc8Ea84bdC3EBB01D495e5D1605d4F082aEb5d7',
    }
}