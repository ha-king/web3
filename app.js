let web3;
let userAccount;
let currentNetwork = 'ethereum';
// Authentication disabled for dev environment

// NFT Cache
const NFT_CACHE = {
    metadata: new Map(),
    images: new Map(),
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    
    setMetadata(key, data) {
        this.metadata.set(key, {
            data,
            timestamp: Date.now()
        });
    },
    
    getMetadata(key) {
        const cached = this.metadata.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.data;
        }
        this.metadata.delete(key);
        return null;
    },
    
    setImage(url, blob) {
        this.images.set(url, {
            blob,
            objectUrl: URL.createObjectURL(blob),
            timestamp: Date.now()
        });
    },
    
    getImage(url) {
        const cached = this.images.get(url);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.objectUrl;
        }
        if (cached) {
            URL.revokeObjectURL(cached.objectUrl);
            this.images.delete(url);
        }
        return null;
    }
};

const NETWORK_CONTRACTS = {
    ethereum: [
        {
            address: '0xba0964f4e23c4e9ac8a8d50eef4f5b025e637eab',
            name: 'Ethereum NFT Collection',
            description: 'NFT Collection on Ethereum'
        }
    ],
    apechain: [
        {
            address: '0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266',
            name: 'ApeCoin Collection',
            description: 'Official ApeCoin NFT Collection on ApeChain',
            creator: '0x1234567890123456789012345678901234567890',
            magicEdenUrl: 'https://magiceden.us/collections/apechain/0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266'
        }
    ],
    base: [
        {
            address: '0x7b99dd120231cdb80252c4eac3e09d999a8254e1',
            name: 'Base NFT Collection',
            description: 'NFT Collection on Base'
        }
    ],
    optimism: [
        {
            address: '0xad3a0eeecefd100d2ff9dc55cbff11b8a2f489c2',
            name: 'Optimism NFT Collection',
            description: 'NFT Collection on Optimism'
        }
    ]
};

const BASE_NFT_CONTRACTS = [
    {
        address: '0x7b99dd120231cdb80252c4eac3e09d999a8254e1',
        name: 'Your Base NFT',
        description: 'NFT Collection on Base from OpenSea',
        creator: '0x7b99dd120231cdb80252c4eac3e09d999a8254e1'
    },
    {
        address: '0x1a92f7381b9f03921564a437210bb9396471050c',
        name: 'OpenSea Shared Storefront',
        description: 'OpenSea Shared Storefront on Base',
        creator: '0x1a92f7381b9f03921564a437210bb9396471050c'
    }
];

const OPTIMISM_NFT_CONTRACTS = [
    {
        address: '0xad3a0eeecefd100d2ff9dc55cbff11b8a2f489c2',
        name: 'Your NFT Collection',
        description: 'NFT Collection from Optimism',
        creator: '0xad3a0eeecefd100d2ff9dc55cbff11b8a2f489c2'
    }
];

// OpenSea API configuration
const OPENSEA_API_KEY = 'your-opensea-api-key'; // Get from https://docs.opensea.io/reference/api-keys
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

// MagicEden API configuration
const MAGICEDEN_BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

// Alchemy API configuration
const ALCHEMY_API_KEY = 'alcht_2pMoCHtaV57zHiLREXewLVSdZKoaCM';
const ALCHEMY_BASE_URL = 'https://eth-mainnet.g.alchemy.com/nft/v3';

// Moralis API configuration
const MORALIS_API_KEY = 'your-moralis-api-key';
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

const NETWORKS = {
    ethereum: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io'],
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDI0QzE4LjYyNzQgMjQgMjQgMTguNjI3NCAyNCAxMkMyNCA1LjM3MjU4IDE4LjYyNzQgMCAxMiAwQzUuMzcyNTggMCAwIDUuMzcyNTggMCAxMkMwIDE4LjYyNzQgNS4zNzI1OCAyNCAxMiAyNFoiIGZpbGw9IiM2MjdFRUEiLz4KPHBhdGggZD0iTTEyLjM3MzQgM1Y5LjY1MjVMMTguMzY1NiAxMi4yMTc1TDEyLjM3MzQgM1oiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIvPgo8cGF0aCBkPSJNMTIuMzczNCAzTDYuMzgxMjUgMTIuMjE3NUwxMi4zNzM0IDkuNjUyNVYzWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'
    },
    apechain: {
        chainId: '0x8157',
        chainName: 'ApeChain',
        nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
        rpcUrls: ['https://apechain.calderachain.xyz/http'],
        blockExplorerUrls: ['https://apechain.calderachain.xyz/'],
        logo: 'logo.jpg'
    },
    base: {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org'],
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMDUyRkYiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJBU0U8L3RleHQ+Cjwvc3ZnPg=='
    },
    optimism: {
        chainId: '0xa',
        chainName: 'OP Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io'],
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNGRjAwNDIiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+T1A8L3RleHQ+Cjwvc3ZnPg=='
    },
    solana: {
        chainName: 'Solana Mainnet',
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: ['https://api.mainnet-beta.solana.com'],
        blockExplorerUrls: ['https://explorer.solana.com'],
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM5OTQ1RkYiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnNvbDwvdGV4dD4KPC9zdmc+'
    }
};

const networkSelect = document.getElementById('networkSelect');
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const currentNetworkSpan = document.getElementById('currentNetwork');
const walletAddress = document.getElementById('walletAddress');
const walletBalance = document.getElementById('walletBalance');
const balanceSymbol = document.getElementById('balanceSymbol');


networkSelect.addEventListener('change', (e) => {
    currentNetwork = e.target.value;
    if (userAccount) {
        connectWallet();
    } else if (window.ethereum && /CoinbaseWallet/i.test(navigator.userAgent) && currentNetwork === 'apechain') {
        // Auto-connect when ApeChain is selected in Coinbase Wallet mobile view
        setTimeout(() => connectWallet(), 500);
    }
});
connectWalletBtn.addEventListener('click', () => {
    if (detectMultipleWallets()) {
        showWalletSelector();
    } else {
        connectWallet();
    }
});

function detectMultipleWallets() {
    const wallets = [];
    if (window.ethereum) wallets.push('MetaMask/Ethereum');
    if (window.coinbaseWalletExtension) wallets.push('Coinbase Wallet');
    if (window.solana?.isPhantom) wallets.push('Phantom');
    if (window.coinbaseSolana) wallets.push('Coinbase Solana');
    return wallets.length > 1;
}

function showWalletSelector() {
    const selector = document.getElementById('walletSelector');
    const select = document.getElementById('walletSelect');
    
    select.innerHTML = '<option value="">Select Wallet</option>';
    
    if (window.ethereum) select.innerHTML += '<option value="ethereum">MetaMask/Ethereum</option>';
    if (window.coinbaseWalletExtension) select.innerHTML += '<option value="coinbase">Coinbase Wallet</option>';
    if (window.solana?.isPhantom) select.innerHTML += '<option value="phantom">Phantom</option>';
    if (window.coinbaseSolana) select.innerHTML += '<option value="coinbase-solana">Coinbase Solana</option>';
    
    selector.classList.remove('hidden');
    connectWalletBtn.textContent = 'Cancel';
    
    select.onchange = (e) => {
        if (e.target.value) {
            connectSpecificWallet(e.target.value);
            selector.classList.add('hidden');
            connectWalletBtn.textContent = 'Connect Wallet';
        }
    };
}

async function connectSpecificWallet(walletType) {
    try {
        switch (walletType) {
            case 'ethereum':
                await connectEthereumWallet(window.ethereum);
                break;
            case 'coinbase':
                await connectEthereumWallet(window.coinbaseWalletExtension);
                break;
            case 'phantom':
                await connectPhantomWallet();
                break;
            case 'coinbase-solana':
                await connectCoinbaseSolanaWallet();
                break;
        }
    } catch (error) {
        console.error('Wallet connection failed:', error);
        alert('Failed to connect wallet');
    }
}

async function connectEthereumWallet(provider) {
    const networkConfig = NETWORKS[currentNetwork];
    
    if (currentNetwork === 'apechain' || currentNetwork === 'base' || currentNetwork === 'optimism') {
        await addNetwork(networkConfig, provider);
    }
    
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    userAccount = accounts[0];
    
    await updateWalletDisplay();
    
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', userAccount);
    localStorage.setItem('connectedNetwork', currentNetwork);
    localStorage.setItem('walletType', 'ethereum');
    
    if (currentNetwork !== 'solana') {
        document.getElementById('nftContainer').classList.remove('hidden');
        await loadNFTs();
    }
}

async function connectPhantomWallet() {
    const response = await window.solana.connect();
    userAccount = response.publicKey.toString();
    
    walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(-6);
    currentNetworkSpan.textContent = 'Solana Mainnet';
    balanceSymbol.textContent = 'SOL';
    walletBalance.textContent = '0.0000';
    
    walletInfo.classList.remove('hidden');
    connectWalletBtn.textContent = 'Connected';
    connectWalletBtn.disabled = true;
    
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', userAccount);
    localStorage.setItem('connectedNetwork', 'solana');
    localStorage.setItem('walletType', 'solana');
}

async function connectCoinbaseSolanaWallet() {
    const response = await window.coinbaseSolana.connect();
    userAccount = response.publicKey.toString();
    
    walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(-6);
    currentNetworkSpan.textContent = 'Solana Mainnet';
    balanceSymbol.textContent = 'SOL';
    walletBalance.textContent = '0.0000';
    
    walletInfo.classList.remove('hidden');
    connectWalletBtn.textContent = 'Connected';
    connectWalletBtn.disabled = true;
    
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', userAccount);
    localStorage.setItem('connectedNetwork', 'solana');
    localStorage.setItem('walletType', 'solana');
}


// Skip authentication in dev mode
showMainContent();

// Check for previously connected wallet on page load
document.addEventListener('DOMContentLoaded', checkPreviousConnection);

// Auto-connect if opened in Coinbase Wallet mobile view
document.addEventListener('DOMContentLoaded', () => {
    if (window.ethereum && /CoinbaseWallet/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (!userAccount && currentNetwork === 'apechain') {
                connectWallet();
            }
        }, 1000);
    }
});

async function checkPreviousConnection() {
    const wasConnected = localStorage.getItem('walletConnected');
    const savedAddress = localStorage.getItem('walletAddress');
    const savedNetwork = localStorage.getItem('connectedNetwork');
    const walletType = localStorage.getItem('walletType');
    
    if (wasConnected && savedAddress && savedNetwork) {
        currentNetwork = savedNetwork;
        networkSelect.value = savedNetwork;
        userAccount = savedAddress;
        
        // Update UI immediately
        const networkConfig = NETWORKS[currentNetwork];
        
        if (savedNetwork === 'solana') {
            walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(-6);
        } else {
            walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
        }
        
        currentNetworkSpan.textContent = networkConfig.chainName;
        balanceSymbol.textContent = networkConfig.nativeCurrency.symbol;
        
        walletInfo.classList.remove('hidden');
        connectWalletBtn.textContent = 'Connected';
        connectWalletBtn.disabled = true;
        
        // Try to get fresh balance for non-Solana networks
        if (savedNetwork !== 'solana' && (window.ethereum || window.coinbaseWalletExtension)) {
            try {
                const provider = window.coinbaseWalletExtension || window.ethereum;
                const balance = await provider.request({
                    method: 'eth_getBalance',
                    params: [userAccount, 'latest']
                });
                const tokenBalance = parseInt(balance, 16) / Math.pow(10, 18);
                walletBalance.textContent = tokenBalance.toFixed(4);
            } catch (e) {
                walletBalance.textContent = '0.0000';
            }
        } else {
            walletBalance.textContent = '0.0000';
        }
        
        // Load NFTs if supported network
        if (currentNetwork === 'ethereum' || currentNetwork === 'apechain' || currentNetwork === 'base' || currentNetwork === 'optimism' || currentNetwork === 'solana') {
            document.getElementById('nftContainer').classList.remove('hidden');
            await loadNFTs();
        }
    }
}

async function updateWalletDisplay() {
    const networkConfig = NETWORKS[currentNetwork];
    
    walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
    currentNetworkSpan.textContent = networkConfig.chainName;
    balanceSymbol.textContent = networkConfig.nativeCurrency.symbol;
    
    const provider = window.coinbaseWalletExtension || window.ethereum;
    const balance = await provider.request({
        method: 'eth_getBalance',
        params: [userAccount, 'latest']
    });
    
    const tokenBalance = parseInt(balance, 16) / Math.pow(10, 18);
    walletBalance.textContent = tokenBalance.toFixed(4);
    
    walletInfo.classList.remove('hidden');
    connectWalletBtn.textContent = 'Connected';
    connectWalletBtn.disabled = true;
}

async function connectWallet() {
    if (currentNetwork === 'solana') {
        await connectSolanaWallet();
        return;
    }
    
    // Check for mobile wallets first
    if (window.ethereum || window.coinbaseWalletExtension) {
        const provider = window.coinbaseWalletExtension || window.ethereum;
        try {
            const networkConfig = NETWORKS[currentNetwork];
            
            try {
                if (currentNetwork === 'apechain' || currentNetwork === 'base' || currentNetwork === 'optimism') {
                    await addNetwork(networkConfig, provider);
                } else {
                    await switchToNetwork(networkConfig.chainId, provider);
                }
            } catch (networkError) {
                console.log('Network switch failed, continuing anyway:', networkError.message);
            }
            
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
            currentNetworkSpan.textContent = networkConfig.chainName;
            balanceSymbol.textContent = networkConfig.nativeCurrency.symbol;
            
            const balance = await provider.request({
                method: 'eth_getBalance',
                params: [userAccount, 'latest']
            });
            
            const tokenBalance = parseInt(balance, 16) / Math.pow(10, 18);
            walletBalance.textContent = tokenBalance.toFixed(4);
            
            walletInfo.classList.remove('hidden');
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.disabled = true;
            
            // Save connection state
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', userAccount);
            localStorage.setItem('connectedNetwork', currentNetwork);
            
            // Persist Solana connection
            if (currentNetwork === 'solana') {
                localStorage.setItem('walletType', 'solana');
            } else {
                localStorage.setItem('walletType', 'ethereum');
            }
            
            if (currentNetwork === 'apechain' || currentNetwork === 'base' || currentNetwork === 'optimism') {
                document.getElementById('nftContainer').classList.remove('hidden');
                await loadNFTs();
            } else {
                document.getElementById('nftContainer').classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet');
        }
    } else {
        // Mobile-specific wallet detection
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            // Try to open Coinbase Wallet on mobile
            const coinbaseWalletUrl = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;
            window.open(coinbaseWalletUrl, '_blank');
        } else {
            alert('Please install MetaMask or Coinbase Wallet');
        }
    }
}

async function addNetwork(config, provider = window.ethereum) {
    try {
        await provider.request({
            method: 'wallet_addEthereumChain',
            params: [config]
        });
    } catch (error) {
        console.error('Failed to add network:', error);
    }
}

async function switchToNetwork(chainId, provider = window.ethereum) {
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
        });
    } catch (error) {
        console.error('Failed to switch network:', error);
    }
}

async function connectSolanaWallet() {
    try {
        // Try Phantom wallet first
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
            const response = await window.solana.connect();
            userAccount = response.publicKey.toString();
        }
        // Try Coinbase Wallet for Solana
        else if (window.coinbaseSolana) {
            const response = await window.coinbaseSolana.connect();
            userAccount = response.publicKey.toString();
        }
        // Try generic Solana provider
        else if (window.solana) {
            const response = await window.solana.connect();
            userAccount = response.publicKey.toString();
        }
        else {
            // Mobile detection for wallet apps
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                const coinbaseUrl = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;
                window.open(coinbaseUrl, '_blank');
                return;
            } else {
                alert('Please install Phantom wallet or Coinbase Wallet for Solana');
                return;
            }
        }
        
        // Update UI after successful connection
        walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(-6);
        currentNetworkSpan.textContent = 'Solana Mainnet';
        balanceSymbol.textContent = 'SOL';
        walletBalance.textContent = '0.0000';
        
        walletInfo.classList.remove('hidden');
        connectWalletBtn.textContent = 'Connected';
        connectWalletBtn.disabled = true;
        
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', userAccount);
        localStorage.setItem('connectedNetwork', currentNetwork);
        localStorage.setItem('walletType', 'solana');
        
        if (currentNetwork === 'solana') {
            document.getElementById('nftContainer').classList.remove('hidden');
            document.getElementById('nftContainer').innerHTML = '<p>Solana NFT support available</p>';
        }
        
    } catch (error) {
        console.error('Solana wallet connection failed:', error);
        alert('Failed to connect Solana wallet');
    }
}

async function getTotalSupplyFromMagicEden(contractAddress) {
    try {
        const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/apechain/${contractAddress}/stats`);
        const data = await response.json();
        return data.totalSupply || null;
    } catch (e) {
        console.log('Failed to fetch total supply from MagicEden:', e);
        return null;
    }
}

async function getCollectionAveragePrice(contractAddress) {
    try {
        // Try to get collection listings
        const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/apechain/${contractAddress}/listings?offset=0&limit=100`);
        if (response.ok) {
            const listings = await response.json();
            if (listings.length > 0) {
                const prices = listings.map(listing => parseFloat(listing.price) / Math.pow(10, 18));
                const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                console.log(`Collection average price: ${average} APE from ${prices.length} listings`);
                return average;
            }
        }
        
        // Fallback: try collection stats for floor price
        const statsResponse = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/apechain/${contractAddress}/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            const floorPrice = stats.floorPrice ? parseFloat(stats.floorPrice) / Math.pow(10, 18) : null;
            if (floorPrice) {
                console.log(`Using floor price: ${floorPrice} APE`);
                return floorPrice;
            }
        }
        
        return 55; // Final fallback
    } catch (e) {
        console.log('Failed to fetch collection average price:', e);
        return 55;
    }
}

async function getApeCoinPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=apecoin&vs_currencies=usd');
        const data = await response.json();
        const price = data.apecoin?.usd || 1;
        console.log('ApeCoin price fetched:', price, 'USD');
        return price;
    } catch (e) {
        console.log('Failed to fetch ApeCoin price:', e);
        console.log('Using fallback price: 1 USD');
        return 1;
    }
}

async function getNFTPurchasePrice(contractAddress, tokenId, fallbackPrice = 55) {
    try {
        // Try multiple MagicEden API endpoints
        let activities = [];
        
        // Try token-specific endpoint
        try {
            const response1 = await fetch(`https://api-mainnet.magiceden.dev/v2/tokens/apechain/${contractAddress}/${tokenId}/activities?offset=0&limit=20`);
            if (response1.ok) {
                activities = await response1.json();
            }
        } catch (e) {}
        
        // Try collection activities endpoint if token endpoint fails
        if (!activities.length) {
            try {
                const response2 = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/apechain/${contractAddress}/activities?tokenIds=${tokenId}&limit=20`);
                if (response2.ok) {
                    activities = await response2.json();
                }
            } catch (e) {}
        }
        
        console.log(`MagicEden API response for token ${tokenId}:`, activities);
        
        // Find purchase transaction by current user
        const purchase = activities.find(activity => 
            (activity.type === 'sale' || activity.type === 'buy') && 
            (activity.buyer?.toLowerCase() === userAccount.toLowerCase() || 
             activity.to?.toLowerCase() === userAccount.toLowerCase())
        );
        
        if (purchase) {
            // Try different price fields from MagicEden response
            const priceValue = purchase.price || purchase.pricePerItem || purchase.totalPrice || purchase.amount;
            if (priceValue) {
                // Price might be in different formats - try parsing as number first
                let price = parseFloat(priceValue);
                // If price is very large, assume it's in wei and convert
                if (price > 1000) {
                    price = price / Math.pow(10, 18);
                }
                console.log(`Found purchase price for token ${tokenId}: ${price} APE (raw: ${priceValue})`);
                return price;
            }
        }
        
        // Fallback: get recent sale price
        const recentSale = activities.find(activity => 
            (activity.type === 'sale' || activity.type === 'buy') && 
            (activity.price || activity.pricePerItem || activity.totalPrice || activity.amount)
        );
        if (recentSale) {
            const priceValue = recentSale.price || recentSale.pricePerItem || recentSale.totalPrice || recentSale.amount;
            let price = parseFloat(priceValue);
            if (price > 1000) {
                price = price / Math.pow(10, 18);
            }
            console.log(`Using recent sale price for token ${tokenId}: ${price} APE (raw: ${priceValue})`);
            return price;
        }
        
        console.log(`No price data found for token ${tokenId}, using collection average: ${fallbackPrice} APE`);
        return fallbackPrice;
    } catch (e) {
        console.log(`Failed to fetch purchase price from MagicEden for token ${tokenId}:`, e);
        console.log(`Using fallback price: ${fallbackPrice} APE for token ${tokenId}`);
        return fallbackPrice;
    }
}

function calculateCollectionValue(purchasePrices, apeCoinPrice) {
    console.log('=== COLLECTION VALUE DEBUG ===');
    console.log('Purchase prices array:', purchasePrices);
    console.log('ApeCoin USD price:', apeCoinPrice);
    
    const totalApe = purchasePrices.reduce((sum, price) => sum + price, 0);
    console.log('Total APE calculation:', purchasePrices.join(' + '), '=', totalApe);
    
    const totalUsd = totalApe * apeCoinPrice;
    console.log('USD calculation:', totalApe, 'x', apeCoinPrice, '=', totalUsd);
    console.log('=== END DEBUG ===');
    
    return { totalApe, totalUsd };
}

async function loadNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    if (!nftContainer) return;
    
    const networkConfig = NETWORKS[currentNetwork];
    const coinClass = 'coin has-logo';
    const coinStyle = `style="background-image: url('logo.jpg'); background-size: cover;"`;
    
    nftContainer.innerHTML = `
        <div class="coin-loader">
            <div class="${coinClass}" ${coinStyle}></div>
            <div class="loading-text">Loading ${networkConfig.chainName} NFTs...</div>
        </div>`;
    
    try {
        // Load NFTs based on network
        if (currentNetwork === 'ethereum') {
            await loadAlchemyNFTs();
            return;
        } else if (currentNetwork === 'base' || currentNetwork === 'optimism') {
            await loadDirectContractNFTs();
            return;
        }
        
        const allTokens = [];
        
        // Process contracts with collection info
        const contracts = NETWORK_CONTRACTS[currentNetwork] || [];
        for (const contractInfo of contracts) {
            try {
                const balanceData = '0x70a08231' + userAccount.slice(2).padStart(64, '0');
                const balance = await window.ethereum.request({
                    method: 'eth_call',
                    params: [{ to: contractInfo.address, data: balanceData }, 'latest']
                });
                
                const tokenCount = parseInt(balance, 16);
                console.log(`${contractInfo.name} (${contractInfo.address}) balance: ${tokenCount} tokens`);
                console.log(`Network: ${currentNetwork}, User: ${userAccount}`);
                
                if (tokenCount > 0) {
                    // Fetch total supply and average price
                    const totalSupply = await getTotalSupplyFromMagicEden(contractInfo.address);
                    const averagePrice = await getCollectionAveragePrice(contractInfo.address);
                    contractInfo.totalSupply = totalSupply;
                    contractInfo.averagePrice = averagePrice;
                    
                    // Show collection info immediately
                    nftContainer.innerHTML = `
                        <div class="collection-header">
                            <div class="collection-title">
                                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                                <h3>${contractInfo.name}</h3>
                            </div>
                            <p class="collection-description">${contractInfo.description}</p>
                            <div class="collection-stats">
                                <span class="stat">Your NFTs: <strong>${tokenCount}</strong></span>
                                ${totalSupply ? `<span class="stat">Total Supply: <strong>${totalSupply.toLocaleString()}</strong></span>` : ''}
                                <span class="stat">Loading value...</span>
                            </div>
                        </div>
                        <div class="coin-loader">
                            <div class="coin has-logo" style="background-image: url('logo.jpg'); background-size: cover;"></div>
                            <div class="loading-text">Loading your ${tokenCount} NFTs...</div>
                        </div>`;
                    
                    // Check specific token ID 25 for Base NFT first
                    if (currentNetwork === 'base' && contractInfo.address === '0x7b99dd120231cdb80252c4eac3e09d999a8254e1') {
                        const hasToken25 = await checkERC1155Balance(contractInfo.address, 25);
                        if (hasToken25) {
                            const metadata = await getTokenMetadata(contractInfo.address, 25);
                            allTokens.push({ contract: contractInfo.address, tokenId: 25, ...metadata });
                            updateNFTDisplay(contractInfo, allTokens, tokenCount);
                        }
                    }
                    
                    // Optimized scanning with larger batches for faster loading
                    const ranges = [
                        [1, 1000],
                        [1001, 3000], 
                        [3001, 10000]
                    ];
                    
                    for (const [start, end] of ranges) {
                        if (allTokens.length >= tokenCount) break;
                        
                        const batchSize = 200; // Larger batches for faster response
                        
                        for (let i = start; i <= end && allTokens.length < tokenCount; i += batchSize) {
                            const batch = [];
                            const batchEnd = Math.min(i + batchSize - 1, end);
                            
                            for (let tokenId = i; tokenId <= batchEnd; tokenId++) {
                                if (currentNetwork === 'base' || currentNetwork === 'optimism') {
                                    batch.push(checkERC1155Balance(contractInfo.address, tokenId));
                                } else {
                                    batch.push(checkTokenOwnership(contractInfo.address, tokenId));
                                }
                            }
                            
                            const results = await Promise.allSettled(batch);
                            const ownedIds = [];
                            
                            for (let j = 0; j < results.length; j++) {
                                if (results[j].status === 'fulfilled' && results[j].value) {
                                    ownedIds.push(i + j);
                                }
                            }
                            
                            if (ownedIds.length > 0) {
                                console.log(`Found owned tokens:`, ownedIds);
                                
                                // Load metadata in parallel for faster loading
                                const metadataPromises = ownedIds.map(tokenId => 
                                    getTokenMetadata(contractInfo.address, tokenId)
                                        .then(metadata => ({ contract: contractInfo.address, tokenId, ...metadata }))
                                );
                                
                                const newTokens = await Promise.all(metadataPromises);
                                
                                // Get purchase prices for new tokens
                                const pricePromises = ownedIds.map(tokenId => getNFTPurchasePrice(contractInfo.address, tokenId, contractInfo.averagePrice));
                                const purchasePrices = await Promise.all(pricePromises);
                                
                                // Add purchase prices to tokens
                                newTokens.forEach((token, index) => {
                                    token.purchasePrice = purchasePrices[index];
                                });
                                
                                allTokens.push(...newTokens);
                                
                                // Update collection value
                                const apeCoinPrice = await getApeCoinPrice();
                                console.log(`ApeCoin price from API: $${apeCoinPrice}`);
                                
                                const allPrices = allTokens.map(token => token.purchasePrice || contractInfo.averagePrice || 55);
                                console.log(`Individual NFT prices:`, allPrices);
                                console.log(`Number of NFTs: ${allPrices.length}`);
                                
                                const { totalApe, totalUsd } = calculateCollectionValue(allPrices, apeCoinPrice);
                                console.log(`Total APE: ${totalApe}, Total USD: ${totalUsd}`);
                                console.log(`Calculation: ${allPrices.join(' + ')} = ${totalApe} APE * $${apeCoinPrice} = $${totalUsd}`);
                                
                                contractInfo.collectionValue = { totalApe, totalUsd };
                                
                                // Update UI with partial results for faster perceived loading
                                updateNFTDisplay(contractInfo, allTokens, tokenCount);
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('Contract check failed:', e);
            }
        }
        
        if (allTokens.length === 0) {
            const networkName = currentNetwork === 'base' ? 'Base' : 
                               currentNetwork === 'optimism' ? 'Optimism' : 'ApeCoin';
            nftContainer.innerHTML = `<p>No ${networkName} NFTs found in your wallet</p>
                <p><small>Note: Only scanning specific collections. Your NFT may be from a different contract.</small></p>`;
        }
    } catch (error) {
        nftContainer.innerHTML = '<p>Error loading NFTs</p>';
        console.error('NFT loading error:', error);
    }
}

function updateNFTDisplay(contractInfo, tokens, totalCount) {
    const nftContainer = document.getElementById('nftContainer');
    const isComplete = tokens.length >= totalCount;
    const networkConfig = NETWORKS[currentNetwork];
    
    const totalSupply = contractInfo.totalSupply;
    
    nftContainer.innerHTML = `
        <div class="collection-header">
            <div class="collection-title">
                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                <h3>${contractInfo.name}</h3>
            </div>
            <p class="collection-description">${contractInfo.description}</p>
            <div class="collection-stats">
                <span class="stat">Your NFTs: <strong>${tokens.length}${isComplete ? '' : `/${totalCount}`}</strong></span>
                ${totalSupply ? `<span class="stat">Total Supply: <strong>${totalSupply.toLocaleString()}</strong></span>` : ''}
                ${contractInfo.collectionValue ? `<span class="stat">Est. Value: <strong>${contractInfo.collectionValue.totalApe.toFixed(2)} APE (~$${contractInfo.collectionValue.totalUsd.toFixed(2)})</strong></span>` : ''}
                ${!isComplete ? '<span class="stat loading-indicator">Loading more...</span>' : ''}
                ${isComplete && currentNetwork === 'apechain' ? `<button class="trade-btn" onclick="showTradeModal()">Trade</button>` : ''}
                ${isComplete ? `<select id="filterSelect" class="filter-select" onchange="filterGallery()">
                    <option value="all">Show All</option>
                    ${getFilterOptions(tokens)}
                </select>` : ''}
            </div>
        </div>
        <div class="nft-gallery">
            ${tokens.map((token, index) => 
                `<div class="nft-card" onclick="showNFTModal(${index})">
                    <img src="${getCachedImageUrl(token.image)}" alt="${token.name}" class="nft-image" onerror="this.src='${generateFallbackImage(token.tokenId)}'">
                    <div class="nft-info">
                        <h4>${token.name || `#${token.tokenId}`}</h4>
                        <p>Token ID: ${token.tokenId}</p>
                    </div>
                </div>`
            ).join('')}
        </div>`;
    
    window.nftData = tokens;
}

async function getTokenMetadata(contract, tokenId) {
    const cacheKey = `${contract}-${tokenId}`;
    
    // Check cache first
    const cached = NFT_CACHE.getMetadata(cacheKey);
    if (cached) {
        return cached;
    }
    
    try {
        const uriData = '0xc87b56dd' + tokenId.toString(16).padStart(64, '0');
        const uriHex = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: contract, data: uriData }, 'latest']
        });
        
        const tokenURI = decodeString(uriHex);
        if (tokenURI && (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs'))) {
            const metadataUrl = tokenURI.startsWith('ipfs://') ? 
                tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/') : tokenURI;
            
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            
            const processedImage = metadata.image?.startsWith('ipfs://') ? 
                metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : 
                metadata.image || generateFallbackImage(tokenId);
            
            const result = {
                name: metadata.name || `ApeCoin NFT #${tokenId}`,
                image: processedImage,
                description: metadata.description,
                attributes: metadata.attributes || [],
                tokenURI: tokenURI
            };
            
            // Cache the metadata
            NFT_CACHE.setMetadata(cacheKey, result);
            
            // Preload and cache the image
            if (processedImage && !processedImage.startsWith('data:')) {
                preloadImage(processedImage);
            }
            
            return result;
        }
    } catch (e) {
        console.log('Metadata fetch failed:', e);
    }
    
    const fallback = {
        name: `ApeCoin NFT #${tokenId}`,
        image: generateFallbackImage(tokenId),
        description: 'ApeCoin NFT from ApeChain',
        attributes: [],
        tokenURI: ''
    };
    
    // Cache fallback too
    NFT_CACHE.setMetadata(cacheKey, fallback);
    return fallback;
}

function showNFTModal(index) {
    const nft = window.nftData[index];
    const modal = document.getElementById('nftModal');
    
    const cachedImageUrl = getCachedImageUrl(nft.image);
    
    const imageSection = `
        <img id="modalImage" class="modal-image" src="${cachedImageUrl}" alt="${nft.name}">
        ${nft.attributes && nft.attributes.length > 0 ? `<div class="attributes-section">
            <h4>Attributes</h4>
            <div class="attributes-2col">
                ${nft.attributes.map(attr => `
                    <div class="attribute-row">
                        <div class="attribute-trait">${attr.trait_type}</div>
                        <div class="attribute-value">${attr.value}</div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
    `;
    
    const contractInfo = NETWORK_CONTRACTS[currentNetwork]?.find(c => c.address === nft.contract);
    const metadataHtml = `
        <div class="metadata-section">
            <h4>Token Details</h4>
            <div class="metadata-item">
                <span class="metadata-label">Token ID</span>
                <div class="metadata-value">${nft.tokenId}</div>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Contract Address</span>
                <div class="metadata-value">${nft.contract}</div>
            </div>
            ${contractInfo?.creator ? `<div class="metadata-item">
                <span class="metadata-label">Creator</span>
                <div class="metadata-value">${contractInfo.creator}</div>
            </div>` : ''}
            ${contractInfo?.magicEdenUrl ? `<div class="metadata-item">
                <span class="metadata-label">Collection</span>
                <div class="metadata-value"><a href="${contractInfo.magicEdenUrl}" target="_blank" class="collection-link">View on MagicEden</a></div>
            </div>` : ''}
        </div>
        
        ${nft.description ? `<div class="metadata-section">
            <h4>Description</h4>
            <div class="metadata-item">
                <div class="metadata-value">${nft.description}</div>
            </div>
        </div>` : ''}
    `;
    
    document.querySelector('.modal-body').innerHTML = `
        <div class="modal-image-section">
            ${imageSection}
        </div>
        <div class="modal-info">
            <h3>${nft.name}</h3>
            ${metadataHtml}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('nftModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.add('hidden');
    }
    
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        };
    }
});

// Add global close function for modal
function closeModal() {
    const modal = document.getElementById('nftModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function preloadImage(url) {
    try {
        // Check if already cached
        if (NFT_CACHE.getImage(url)) return;
        
        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            NFT_CACHE.setImage(url, blob);
        }
    } catch (e) {
        console.log('Image preload failed:', url, e);
    }
}

function getCachedImageUrl(url) {
    const cached = NFT_CACHE.getImage(url);
    return cached || url;
}

function generateFallbackImage(tokenId) {
    return `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="45%" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">#${tokenId}</text><text x="50%" y="60%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">ApeCoin NFT</text></svg>`)}`;
}

async function checkTokenOwnership(contract, tokenId) {
    try {
        const ownerData = '0x6352211e' + tokenId.toString(16).padStart(64, '0');
        const owner = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: contract, data: ownerData }, 'latest']
        });
        
        const ownerAddress = '0x' + owner.slice(-40);
        return ownerAddress.toLowerCase() === userAccount.toLowerCase();
    } catch {
        return false;
    }
}

async function checkERC1155Balance(contract, tokenId) {
    try {
        const balanceData = '0x00fdd58e' + 
            userAccount.slice(2).padStart(64, '0') + 
            tokenId.toString(16).padStart(64, '0');
        const balance = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: contract, data: balanceData }, 'latest']
        });
        
        return parseInt(balance, 16) > 0;
    } catch {
        return false;
    }
}

function decodeString(hex) {
    try {
        const clean = hex.replace('0x', '');
        const offset = parseInt(clean.slice(0, 64), 16) * 2;
        const length = parseInt(clean.slice(offset, offset + 64), 16) * 2;
        const data = clean.slice(offset + 64, offset + 64 + length);
        return decodeURIComponent(data.replace(/[0-9a-f]{2}/g, '%$&'));
    } catch {
        return '';
    }
}

async function loadOpenSeaNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    const networkConfig = NETWORKS[currentNetwork];
    
    try {
        const chainMap = {
            'ethereum': 'ethereum',
            'base': 'base',
            'optimism': 'optimism'
        };
        
        const response = await fetch(`${OPENSEA_BASE_URL}/chain/${chainMap[currentNetwork]}/account/${userAccount}/nfts`, {
            headers: {
                'X-API-KEY': OPENSEA_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('OpenSea API error');
        
        const data = await response.json();
        const nfts = data.nfts || [];
        
        if (nfts.length === 0) {
            nftContainer.innerHTML = `<p>No NFTs found on ${networkConfig.chainName}</p>`;
            return;
        }
        
        // Process OpenSea NFTs
        const processedNFTs = nfts.map(nft => ({
            tokenId: nft.identifier,
            name: nft.name || `#${nft.identifier}`,
            image: nft.image_url || nft.display_image_url,
            description: nft.description,
            contract: nft.contract,
            collection: nft.collection,
            opensea_url: nft.opensea_url,
            traits: nft.traits || []
        }));
        
        displayOpenSeaNFTs(processedNFTs, networkConfig);
        
    } catch (error) {
        console.error('OpenSea API error:', error);
        nftContainer.innerHTML = '<p>Error loading NFTs from OpenSea</p>';
    }
}

function displayOpenSeaNFTs(nfts, networkConfig) {
    const nftContainer = document.getElementById('nftContainer');
    
    nftContainer.innerHTML = `
        <div class="collection-header">
            <div class="collection-title">
                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                <h3>OpenSea Collection</h3>
            </div>
            <p class="collection-description">Your NFTs from OpenSea on ${networkConfig.chainName}</p>
            <div class="collection-stats">
                <span class="stat">Total NFTs: <strong>${nfts.length}</strong></span>
            </div>
        </div>
        <div class="nft-gallery">
            ${nfts.map((nft, index) => 
                `<div class="nft-card" onclick="showOpenSeaNFTModal(${index})">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='${generateFallbackImage(nft.tokenId)}'">
                    <div class="nft-info">
                        <h4>${nft.name}</h4>
                        <p>Token ID: ${nft.tokenId}</p>
                    </div>
                </div>`
            ).join('')}
        </div>`;
    
    window.openSeaNFTData = nfts;
}

function showOpenSeaNFTModal(index) {
    const nft = window.openSeaNFTData[index];
    const modal = document.getElementById('nftModal');
    
    document.querySelector('.modal-body').innerHTML = `
        <div class="modal-image-section">
            <img class="modal-image" src="${nft.image}" alt="${nft.name}">
        </div>
        <div class="modal-info">
            <h3>${nft.name}</h3>
            <div class="metadata-section">
                <h4>Token Details</h4>
                <div class="metadata-item">
                    <span class="metadata-label">Token ID</span>
                    <div class="metadata-value">${nft.tokenId}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Contract</span>
                    <div class="metadata-value">${nft.contract}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Collection</span>
                    <div class="metadata-value">${nft.collection}</div>
                </div>
                ${nft.opensea_url ? `<div class="metadata-item">
                    <span class="metadata-label">OpenSea</span>
                    <div class="metadata-value"><a href="${nft.opensea_url}" target="_blank" class="collection-link">View on OpenSea</a></div>
                </div>` : ''}
            </div>
            ${nft.description ? `<div class="metadata-section">
                <h4>Description</h4>
                <div class="metadata-item">
                    <div class="metadata-value">${nft.description}</div>
                </div>
            </div>` : ''}
            ${nft.traits && nft.traits.length > 0 ? `<div class="attributes-section">
                <h4>Traits</h4>
                <div class="attributes-2col">
                    ${nft.traits.map(trait => `
                        <div class="attribute-row">
                            <div class="attribute-trait">${trait.trait_type}</div>
                            <div class="attribute-value">${trait.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

async function loadAllETHNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    const networkConfig = NETWORKS[currentNetwork];
    
    nftContainer.innerHTML = `
        <div class="coin-loader">
            <div class="coin has-logo" style="background-image: url('logo.jpg'); background-size: cover;"></div>
            <div class="loading-text">Discovering all your NFTs...</div>
        </div>`;
    
    try {
        const allNFTs = [];
        
        // Method 1: Alchemy API (most comprehensive)
        try {
            const alchemyNFTs = await fetchAlchemyNFTs();
            allNFTs.push(...alchemyNFTs);
        } catch (e) { console.log('Alchemy failed:', e); }
        
        // Method 2: OpenSea API
        try {
            const openSeaNFTs = await fetchOpenSeaETHNFTs();
            allNFTs.push(...openSeaNFTs);
        } catch (e) { console.log('OpenSea failed:', e); }
        
        // Method 3: Moralis API
        try {
            const moralisNFTs = await fetchMoralisNFTs();
            allNFTs.push(...moralisNFTs);
        } catch (e) { console.log('Moralis failed:', e); }
        
        // Remove duplicates based on contract + tokenId
        const uniqueNFTs = removeDuplicateNFTs(allNFTs);
        
        if (uniqueNFTs.length === 0) {
            nftContainer.innerHTML = `<p>No NFTs found in your wallet</p>`;
            return;
        }
        
        displayAllNFTs(uniqueNFTs, networkConfig);
        
    } catch (error) {
        console.error('NFT discovery error:', error);
        nftContainer.innerHTML = '<p>Error discovering NFTs</p>';
    }
}

async function loadAlchemyNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    const networkConfig = NETWORKS[currentNetwork];
    
    nftContainer.innerHTML = `
        <div class="coin-loader">
            <div class="coin has-logo" style="background-image: url('logo.jpg'); background-size: cover;"></div>
            <div class="loading-text">Loading Ethereum NFTs...</div>
        </div>`;
    
    try {
        const response = await fetch(`${ALCHEMY_BASE_URL}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${userAccount}&withMetadata=true&pageSize=100`);
        const data = await response.json();
        
        const nfts = (data.ownedNfts || []).map(nft => ({
            tokenId: nft.tokenId,
            name: nft.name || nft.title || `#${nft.tokenId}`,
            image: nft.image?.originalUrl || nft.image?.cachedUrl || nft.media?.[0]?.gateway,
            description: nft.description,
            contract: nft.contract.address,
            collection: nft.contract.name,
            attributes: nft.rawMetadata?.attributes || []
        }));
        
        if (nfts.length === 0) {
            nftContainer.innerHTML = `<p>No NFTs found on Ethereum</p>`;
            return;
        }
        
        nftContainer.innerHTML = `
            <div class="collection-header">
                <div class="collection-title">
                    <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                    <h3>Ethereum NFT Collection</h3>
                </div>
                <p class="collection-description">Your NFTs on Ethereum via Alchemy</p>
                <div class="collection-stats">
                    <span class="stat">Total NFTs: <strong>${nfts.length}</strong></span>
                </div>
            </div>
            <div class="nft-gallery">
                ${nfts.map((nft, index) => 
                    `<div class="nft-card" onclick="showEthNFTModal(${index})">
                        <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='${generateFallbackImage(nft.tokenId)}'">
                        <div class="nft-info">
                            <h4>${nft.name}</h4>
                            <p>Token ID: ${nft.tokenId}</p>
                        </div>
                    </div>`
                ).join('')}
            </div>`;
        
        window.ethNFTData = nfts;
        
    } catch (error) {
        console.error('Alchemy API error:', error);
        nftContainer.innerHTML = '<p>Error loading Ethereum NFTs</p>';
    }
}

function showEthNFTModal(index) {
    const nft = window.ethNFTData[index];
    const modal = document.getElementById('nftModal');
    
    document.querySelector('.modal-body').innerHTML = `
        <div class="modal-image-section">
            <img class="modal-image" src="${nft.image}" alt="${nft.name}">
        </div>
        <div class="modal-info">
            <h3>${nft.name}</h3>
            <div class="metadata-section">
                <h4>Token Details</h4>
                <div class="metadata-item">
                    <span class="metadata-label">Token ID</span>
                    <div class="metadata-value">${nft.tokenId}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Contract</span>
                    <div class="metadata-value">${nft.contract}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Collection</span>
                    <div class="metadata-value">${nft.collection}</div>
                </div>
            </div>
            ${nft.description ? `<div class="metadata-section">
                <h4>Description</h4>
                <div class="metadata-item">
                    <div class="metadata-value">${nft.description}</div>
                </div>
            </div>` : ''}
            ${nft.attributes && nft.attributes.length > 0 ? `<div class="attributes-section">
                <h4>Attributes</h4>
                <div class="attributes-2col">
                    ${nft.attributes.map(attr => `
                        <div class="attribute-row">
                            <div class="attribute-trait">${attr.trait_type}</div>
                            <div class="attribute-value">${attr.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

async function fetchAlchemyNFTs() {
    const response = await fetch(`${ALCHEMY_BASE_URL}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${userAccount}&withMetadata=true&pageSize=100`);
    const data = await response.json();
    
    return (data.ownedNfts || []).map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name || nft.title || `#${nft.tokenId}`,
        image: nft.image?.originalUrl || nft.image?.cachedUrl || nft.media?.[0]?.gateway,
        description: nft.description,
        contract: nft.contract.address,
        collection: nft.contract.name,
        attributes: nft.rawMetadata?.attributes || [],
        source: 'Alchemy'
    }));
}

async function fetchOpenSeaETHNFTs() {
    const response = await fetch(`${OPENSEA_BASE_URL}/chain/ethereum/account/${userAccount}/nfts`, {
        headers: { 'X-API-KEY': OPENSEA_API_KEY }
    });
    const data = await response.json();
    
    return (data.nfts || []).map(nft => ({
        tokenId: nft.identifier,
        name: nft.name || `#${nft.identifier}`,
        image: nft.image_url || nft.display_image_url,
        description: nft.description,
        contract: nft.contract,
        collection: nft.collection,
        attributes: nft.traits || [],
        opensea_url: nft.opensea_url,
        source: 'OpenSea'
    }));
}

async function fetchMoralisNFTs() {
    const response = await fetch(`${MORALIS_BASE_URL}/${userAccount}/nft?chain=eth&format=decimal&media_items=true`, {
        headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    const data = await response.json();
    
    return (data.result || []).map(nft => ({
        tokenId: nft.token_id,
        name: nft.name || `#${nft.token_id}`,
        image: nft.media?.media_collection?.high?.url || nft.media?.original_media_url,
        description: nft.metadata?.description,
        contract: nft.token_address,
        collection: nft.name,
        attributes: nft.metadata?.attributes || [],
        source: 'Moralis'
    }));
}

function removeDuplicateNFTs(nfts) {
    const seen = new Set();
    return nfts.filter(nft => {
        const key = `${nft.contract}-${nft.tokenId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function displayAllNFTs(nfts, networkConfig) {
    const nftContainer = document.getElementById('nftContainer');
    
    nftContainer.innerHTML = `
        <div class="collection-header">
            <div class="collection-title">
                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                <h3>Complete NFT Collection</h3>
            </div>
            <p class="collection-description">All your NFTs discovered from multiple sources</p>
            <div class="collection-stats">
                <span class="stat">Total NFTs: <strong>${nfts.length}</strong></span>
                <span class="stat">Sources: <strong>Alchemy, OpenSea, Moralis</strong></span>
            </div>
        </div>
        <div class="nft-gallery">
            ${nfts.map((nft, index) => 
                `<div class="nft-card" onclick="showAllNFTModal(${index})">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='${generateFallbackImage(nft.tokenId)}'">
                    <div class="nft-info">
                        <h4>${nft.name}</h4>
                        <p>Token ID: ${nft.tokenId}</p>
                        <small>via ${nft.source}</small>
                    </div>
                </div>`
            ).join('')}
        </div>`;
    
    window.allNFTData = nfts;
}

async function loadDirectContractNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    if (!nftContainer) return;
    
    const networkConfig = NETWORKS[currentNetwork];
    const coinClass = 'coin has-logo';
    const coinStyle = `style="background-image: url('logo.jpg'); background-size: cover;"`;
    
    nftContainer.innerHTML = `
        <div class="coin-loader">
            <div class="${coinClass}" ${coinStyle}></div>
            <div class="loading-text">Loading ${networkConfig.chainName} NFTs...</div>
        </div>`;
    
    try {
        const allTokens = [];
        const contracts = NETWORK_CONTRACTS[currentNetwork] || [];
        
        for (const contractInfo of contracts) {
            try {
                const balanceData = '0x70a08231' + userAccount.slice(2).padStart(64, '0');
                const balance = await window.ethereum.request({
                    method: 'eth_call',
                    params: [{ to: contractInfo.address, data: balanceData }, 'latest']
                });
                
                const tokenCount = parseInt(balance, 16);
                console.log(`${contractInfo.name} balance: ${tokenCount} tokens`);
                
                if (tokenCount > 0) {
                    nftContainer.innerHTML = `
                        <div class="collection-header">
                            <div class="collection-title">
                                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                                <h3>${contractInfo.name}</h3>
                            </div>
                            <p class="collection-description">${contractInfo.description}</p>
                            <div class="collection-stats">
                                <span class="stat">Your NFTs: <strong>${tokenCount}</strong></span>
                            </div>
                        </div>
                        <div class="coin-loader">
                            <div class="coin has-logo" style="background-image: url('logo.jpg'); background-size: cover;"></div>
                            <div class="loading-text">Loading your ${tokenCount} NFTs...</div>
                        </div>`;
                    
                    // Scan for owned tokens
                    for (let tokenId = 1; tokenId <= 10000 && allTokens.length < tokenCount; tokenId++) {
                        try {
                            const ownerData = '0x6352211e' + tokenId.toString(16).padStart(64, '0');
                            const owner = await window.ethereum.request({
                                method: 'eth_call',
                                params: [{ to: contractInfo.address, data: ownerData }, 'latest']
                            });
                            
                            const ownerAddress = '0x' + owner.slice(-40);
                            if (ownerAddress.toLowerCase() === userAccount.toLowerCase()) {
                                const metadata = await getTokenMetadata(contractInfo.address, tokenId);
                                allTokens.push({ contract: contractInfo.address, tokenId, ...metadata });
                                
                                // Update display with current progress
                                if (allTokens.length % 5 === 0) {
                                    updateNFTDisplay(contractInfo, allTokens, tokenCount);
                                }
                            }
                        } catch (e) {
                            // Token doesn't exist or other error
                        }
                    }
                    
                    updateNFTDisplay(contractInfo, allTokens, tokenCount);
                }
            } catch (e) {
                console.log('Contract check failed:', e);
            }
        }
        
        if (allTokens.length === 0) {
            nftContainer.innerHTML = `<p>No NFTs found on ${networkConfig.chainName}</p>`;
        }
    } catch (error) {
        nftContainer.innerHTML = '<p>Error loading NFTs</p>';
        console.error('NFT loading error:', error);
    }
}

function showAllNFTModal(index) {
    const nft = window.allNFTData[index];
    const modal = document.getElementById('nftModal');
    
    document.querySelector('.modal-body').innerHTML = `
        <div class="modal-image-section">
            <img class="modal-image" src="${nft.image}" alt="${nft.name}">
        </div>
        <div class="modal-info">
            <h3>${nft.name}</h3>
            <div class="metadata-section">
                <h4>Token Details</h4>
                <div class="metadata-item">
                    <span class="metadata-label">Token ID</span>
                    <div class="metadata-value">${nft.tokenId}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Contract</span>
                    <div class="metadata-value">${nft.contract}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Collection</span>
                    <div class="metadata-value">${nft.collection}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Data Source</span>
                    <div class="metadata-value">${nft.source}</div>
                </div>
                ${nft.opensea_url ? `<div class="metadata-item">
                    <span class="metadata-label">OpenSea</span>
                    <div class="metadata-value"><a href="${nft.opensea_url}" target="_blank" class="collection-link">View on OpenSea</a></div>
                </div>` : ''}
            </div>
            ${nft.description ? `<div class="metadata-section">
                <h4>Description</h4>
                <div class="metadata-item">
                    <div class="metadata-value">${nft.description}</div>
                </div>
            </div>` : ''}
            ${nft.attributes && nft.attributes.length > 0 ? `<div class="attributes-section">
                <h4>Attributes</h4>
                <div class="attributes-2col">
                    ${nft.attributes.map(attr => `
                        <div class="attribute-row">
                            <div class="attribute-trait">${attr.trait_type}</div>
                            <div class="attribute-value">${attr.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function displayMagicEdenNFTs(nfts, networkConfig) {
    const nftContainer = document.getElementById('nftContainer');
    
    nftContainer.innerHTML = `
        <div class="collection-header">
            <div class="collection-title">
                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                <h3>MagicEden ETH Collection</h3>
            </div>
            <p class="collection-description">Your ETH NFTs from MagicEden</p>
            <div class="collection-stats">
                <span class="stat">Total NFTs: <strong>${nfts.length}</strong></span>
            </div>
        </div>
        <div class="nft-gallery">
            ${nfts.map((nft, index) => 
                `<div class="nft-card" onclick="showMagicEdenNFTModal(${index})">
                    <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='${generateFallbackImage(nft.tokenId)}'">
                    <div class="nft-info">
                        <h4>${nft.name}</h4>
                        <p>Token ID: ${nft.tokenId}</p>
                    </div>
                </div>`
            ).join('')}
        </div>`;
    
    window.magicEdenNFTData = nfts;
}

function showMagicEdenNFTModal(index) {
    const nft = window.magicEdenNFTData[index];
    const modal = document.getElementById('nftModal');
    
    document.querySelector('.modal-body').innerHTML = `
        <div class="modal-image-section">
            <img class="modal-image" src="${nft.image}" alt="${nft.name}">
        </div>
        <div class="modal-info">
            <h3>${nft.name}</h3>
            <div class="metadata-section">
                <h4>Token Details</h4>
                <div class="metadata-item">
                    <span class="metadata-label">Token ID</span>
                    <div class="metadata-value">${nft.tokenId}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Contract</span>
                    <div class="metadata-value">${nft.contract}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Collection</span>
                    <div class="metadata-value">${nft.collection}</div>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">MagicEden</span>
                    <div class="metadata-value"><a href="${nft.magiceden_url}" target="_blank" class="collection-link">View on MagicEden</a></div>
                </div>
            </div>
            ${nft.description ? `<div class="metadata-section">
                <h4>Description</h4>
                <div class="metadata-item">
                    <div class="metadata-value">${nft.description}</div>
                </div>
            </div>` : ''}
            ${nft.attributes && nft.attributes.length > 0 ? `<div class="attributes-section">
                <h4>Attributes</h4>
                <div class="attributes-2col">
                    ${nft.attributes.map(attr => `
                        <div class="attribute-row">
                            <div class="attribute-trait">${attr.trait_type}</div>
                            <div class="attribute-value">${attr.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function showMainContent() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.querySelector('.top-nav').classList.remove('hidden');
}

function getFilterOptions(tokens) {
    const attributeValues = new Map();
    tokens.forEach(token => {
        if (token.attributes) {
            token.attributes.forEach(attr => {
                if (!attributeValues.has(attr.trait_type)) {
                    attributeValues.set(attr.trait_type, new Set());
                }
                attributeValues.get(attr.trait_type).add(attr.value);
            });
        }
    });
    
    let options = '';
    attributeValues.forEach((values, traitType) => {
        values.forEach(value => {
            options += `<option value="${traitType}:${value}">${traitType}: ${value}</option>`;
        });
    });
    return options;
}

function filterGallery() {
    const filterBy = document.getElementById('filterSelect').value;
    if (!window.nftData) return;
    
    let filtered = window.nftData;
    if (filterBy !== 'all') {
        const [traitType, value] = filterBy.split(':');
        filtered = window.nftData.filter(token => 
            token.attributes?.some(attr => attr.trait_type === traitType && attr.value === value)
        );
    }
    
    const gallery = document.querySelector('.nft-gallery');
    if (gallery) {
        gallery.innerHTML = filtered.map((token, index) => 
            `<div class="nft-card" onclick="showNFTModal(${window.nftData.indexOf(token)})">
                <img src="${getCachedImageUrl(token.image)}" alt="${token.name}" class="nft-image" onerror="this.src='${generateFallbackImage(token.tokenId)}'">
                <div class="nft-info">
                    <h4>${token.name || `#${token.tokenId}`}</h4>
                    <p>Token ID: ${token.tokenId}</p>
                </div>
            </div>`
        ).join('');
    }
}

function showTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (!modal) {
        createTradeModal();
    }
    document.getElementById('tradeModal').classList.remove('hidden');
}

function createTradeModal() {
    const modalHtml = `
        <div id="tradeModal" class="modal hidden">
            <div class="modal-content">
                <span class="close" onclick="closeTradeModal()">&times;</span>
                <div class="modal-body">
                    <h3>Transfer NFTs</h3>
                    <div class="trade-form">
                        <label for="recipientAddress">Recipient Address:</label>
                        <input type="text" id="recipientAddress" placeholder="0x..." class="trade-input">
                        <div class="nft-selection">
                            <h4>Select NFTs to Transfer:</h4>
                            <div id="nftCheckboxes"></div>
                        </div>
                        <button class="btn" onclick="executeTransfer()">Transfer Selected NFTs</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    populateNFTCheckboxes();
}

function populateNFTCheckboxes() {
    const container = document.getElementById('nftCheckboxes');
    if (!window.nftData || !container) return;
    
    container.innerHTML = window.nftData.map((token, index) => 
        `<div class="nft-checkbox">
            <input type="checkbox" id="nft-${index}" value="${token.tokenId}">
            <label for="nft-${index}">${token.name || `#${token.tokenId}`}</label>
        </div>`
    ).join('');
}

function closeTradeModal() {
    document.getElementById('tradeModal').classList.add('hidden');
}

async function executeTransfer() {
    const recipientAddress = document.getElementById('recipientAddress').value;
    if (!recipientAddress || !recipientAddress.startsWith('0x')) {
        alert('Please enter a valid recipient address');
        return;
    }
    
    const selectedTokens = [];
    document.querySelectorAll('#nftCheckboxes input:checked').forEach(checkbox => {
        selectedTokens.push(checkbox.value);
    });
    
    if (selectedTokens.length === 0) {
        alert('Please select at least one NFT to transfer');
        return;
    }
    
    try {
        const contractAddress = '0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266';
        const transferContract = '0x[DEPLOYED_CONTRACT_ADDRESS]'; // Replace with deployed contract
        
        // Batch transfer function call
        const data = '0x' + 'batchTransferNFTs' + 
            contractAddress.slice(2).padStart(64, '0') +
            selectedTokens.map(id => parseInt(id).toString(16).padStart(64, '0')).join('') +
            recipientAddress.slice(2).padStart(64, '0');
        
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: userAccount,
                to: transferContract,
                data: data,
                gas: '0x' + (100000 * selectedTokens.length).toString(16)
            }]
        });
        
        alert(`Transfer initiated: ${txHash}`);
        closeTradeModal();
    } catch (error) {
        console.error('Transfer failed:', error);
        alert('Transfer failed: ' + error.message);
    }
}

function logoutWallet() {
    userAccount = null;
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedNetwork');
    localStorage.removeItem('walletType');
    
    walletInfo.classList.add('hidden');
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    document.getElementById('nftContainer').classList.add('hidden');
    document.getElementById('nftContainer').innerHTML = '';
}

async function sendTransaction() {
    if (!userAccount) return;
    
    try {
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: userAccount,
                to: '0x0000000000000000000000000000000000000000',
                value: '0x0',
                gas: '0x5208'
            }]
        });
        
        alert(`Transaction sent: ${txHash}`);
    } catch (error) {
        console.error('Transaction failed:', error);
        alert('Transaction failed');
    }
}