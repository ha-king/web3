let web3;
let userAccount;
let currentNetwork = 'ethereum';

const NETWORKS = {
    ethereum: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io']
    },
    apechain: {
        chainId: '0x8157',
        chainName: 'ApeChain',
        nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
        rpcUrls: ['https://apechain.calderachain.xyz/http'],
        blockExplorerUrls: ['https://apechain.calderachain.xyz/']
    }
};

const networkSelect = document.getElementById('networkSelect');
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const currentNetworkSpan = document.getElementById('currentNetwork');
const walletAddress = document.getElementById('walletAddress');
const walletBalance = document.getElementById('walletBalance');
const balanceSymbol = document.getElementById('balanceSymbol');
const sendTransactionBtn = document.getElementById('sendTransaction');

networkSelect.addEventListener('change', (e) => {
    currentNetwork = e.target.value;
    if (userAccount) {
        connectWallet();
    }
});
connectWalletBtn.addEventListener('click', connectWallet);
sendTransactionBtn.addEventListener('click', sendTransaction);

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const networkConfig = NETWORKS[currentNetwork];
            
            try {
                if (currentNetwork === 'apechain') {
                    await addNetwork(networkConfig);
                } else {
                    await switchToNetwork(networkConfig.chainId);
                }
            } catch (networkError) {
                console.log('Network switch failed, continuing anyway:', networkError.message);
            }
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
            currentNetworkSpan.textContent = networkConfig.chainName;
            balanceSymbol.textContent = networkConfig.nativeCurrency.symbol;
            
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [userAccount, 'latest']
            });
            
            const tokenBalance = parseInt(balance, 16) / Math.pow(10, 18);
            walletBalance.textContent = tokenBalance.toFixed(4);
            
            walletInfo.classList.remove('hidden');
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.disabled = true;
            sendTransactionBtn.disabled = false;
            
            if (currentNetwork === 'apechain') {
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
        alert('Please install MetaMask or another Web3 wallet');
    }
}

async function addNetwork(config) {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config]
        });
    } catch (error) {
        console.error('Failed to add network:', error);
    }
}

async function switchToNetwork(chainId) {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
        });
    } catch (error) {
        console.error('Failed to switch network:', error);
    }
}

const APECHAIN_NFT_CONTRACTS = [
    '0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266'  // ApeCoin Collection on ApeChain
];

async function loadNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    if (!nftContainer) return;
    
    nftContainer.innerHTML = '<p>Loading ApeCoin NFTs...</p>';
    
    try {
        const allTokens = [];
        
        // Scan contract directly
            for (const contract of APECHAIN_NFT_CONTRACTS) {
                try {
                    const balanceData = '0x70a08231' + userAccount.slice(2).padStart(64, '0');
                    const balance = await window.ethereum.request({
                        method: 'eth_call',
                        params: [{ to: contract, data: balanceData }, 'latest']
                    });
                    
                    const tokenCount = parseInt(balance, 16);
                    console.log(`Contract balance: ${tokenCount} tokens`);
                    
                    if (tokenCount > 0) {
                        // Try to get tokens by checking a range of token IDs
                        // Optimized batch scanning
                        const batchSize = 100;
                        const maxRange = Math.min(5000, tokenCount * 10); // Limit scan range
                        
                        for (let start = 1; start <= maxRange && allTokens.length < tokenCount; start += batchSize) {
                            const promises = [];
                            for (let tokenId = start; tokenId < start + batchSize && tokenId <= maxRange; tokenId++) {
                                promises.push(checkTokenOwnership(contract, tokenId));
                            }
                            
                            const results = await Promise.allSettled(promises);
                            const ownedTokens = [];
                            
                            for (let i = 0; i < results.length; i++) {
                                if (results[i].status === 'fulfilled' && results[i].value) {
                                    ownedTokens.push(start + i);
                                }
                            }
                            
                            // Load metadata in parallel
                            const metadataPromises = ownedTokens.map(tokenId => 
                                getTokenMetadata(contract, tokenId).then(metadata => ({
                                    contract, tokenId, ...metadata
                                }))
                            );
                            
                            const metadataResults = await Promise.allSettled(metadataPromises);
                            metadataResults.forEach(result => {
                                if (result.status === 'fulfilled') {
                                    allTokens.push(result.value);
                                }
                            });
                            
                            // Update UI with progress
                            if (allTokens.length > 0) {
                                nftContainer.innerHTML = `<p>Loading... Found ${allTokens.length}/${tokenCount} NFTs</p>`;
                            }
                        }
                    }
                } catch (e) {
                    console.log('Contract check failed:', e);
                }
            }
        
        if (allTokens.length > 0) {
            nftContainer.innerHTML = `
                <h3>Your ApeCoin NFTs (${allTokens.length} items)</h3>
                <div class="nft-gallery">
                    ${allTokens.map(token => 
                        `<div class="nft-card">
                            <img src="${token.image}" alt="${token.name}" class="nft-image" onerror="this.src='${generateFallbackImage(token.tokenId)}'">
                            <div class="nft-info">
                                <h4>${token.name || `#${token.tokenId}`}</h4>
                                <p>Token ID: ${token.tokenId}</p>
                            </div>
                        </div>`
                    ).join('')}
                </div>`;
        } else {
            nftContainer.innerHTML = '<p>No ApeCoin NFTs found in your wallet</p>';
        }
    } catch (error) {
        nftContainer.innerHTML = '<p>Error loading NFTs</p>';
        console.error('NFT loading error:', error);
    }
}

async function getTokenMetadata(contract, tokenId) {
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
            
            return {
                name: metadata.name || `ApeCoin NFT #${tokenId}`,
                image: metadata.image?.startsWith('ipfs://') ? 
                    metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : 
                    metadata.image || generateFallbackImage(tokenId)
            };
        }
    } catch (e) {
        console.log('Metadata fetch failed:', e);
    }
    
    return {
        name: `ApeCoin NFT #${tokenId}`,
        image: generateFallbackImage(tokenId)
    };
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