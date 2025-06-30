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

const APECHAIN_NFT_CONTRACTS = [
    {
        address: '0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266',
        name: 'ApeCoin Collection',
        description: 'Official ApeCoin NFT Collection on ApeChain',
        totalSupply: 10000,
        magicEdenUrl: 'https://magiceden.us/collections/apechain/0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266'
    }
];

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
const sendTransactionBtn = document.getElementById('sendTransaction');

networkSelect.addEventListener('change', (e) => {
    currentNetwork = e.target.value;
    if (userAccount) {
        connectWallet();
    }
});
connectWalletBtn.addEventListener('click', connectWallet);
sendTransactionBtn.addEventListener('click', sendTransaction);

// Skip authentication in dev mode
showMainContent();

async function connectWallet() {
    if (currentNetwork === 'solana') {
        await connectSolanaWallet();
        return;
    }
    
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

async function connectSolanaWallet() {
    try {
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
            const response = await window.solana.connect();
            userAccount = response.publicKey.toString();
            
            walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(-6);
            currentNetworkSpan.textContent = 'Solana Mainnet';
            balanceSymbol.textContent = 'SOL';
            walletBalance.textContent = '0.0000';
            
            walletInfo.classList.remove('hidden');
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.disabled = true;
            sendTransactionBtn.disabled = false;
            
            if (currentNetwork === 'solana') {
                document.getElementById('nftContainer').classList.remove('hidden');
                // Solana NFT loading not implemented yet
                document.getElementById('nftContainer').innerHTML = '<p>Solana NFT support coming soon</p>';
            }
        } else {
            alert('Please install Phantom wallet for Solana');
        }
    } catch (error) {
        console.error('Solana wallet connection failed:', error);
        alert('Failed to connect Solana wallet');
    }
}

async function loadNFTs() {
    const nftContainer = document.getElementById('nftContainer');
    if (!nftContainer) return;
    
    const networkConfig = NETWORKS[currentNetwork];
    const coinClass = networkConfig.logo ? 'coin has-logo' : 'coin';
    const coinStyle = networkConfig.logo ? `style="background-image: url('${networkConfig.logo}')"` : '';
    
    nftContainer.innerHTML = `
        <div class="coin-loader">
            <div class="${coinClass}" ${coinStyle}></div>
            <div class="loading-text">Loading ${networkConfig.chainName} NFTs...</div>
        </div>`;
    
    try {
        const allTokens = [];
        
        // Process contracts with collection info
        for (const contractInfo of APECHAIN_NFT_CONTRACTS) {
            try {
                const balanceData = '0x70a08231' + userAccount.slice(2).padStart(64, '0');
                const balance = await window.ethereum.request({
                    method: 'eth_call',
                    params: [{ to: contractInfo.address, data: balanceData }, 'latest']
                });
                
                const tokenCount = parseInt(balance, 16);
                console.log(`${contractInfo.name} balance: ${tokenCount} tokens`);
                
                if (tokenCount > 0) {
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
                                <span class="stat">Total Supply: <strong>${contractInfo.totalSupply.toLocaleString()}</strong></span>
                            </div>
                        </div>
                        <div class="coin-loader">
                            <div class="${coinClass}" ${coinStyle}></div>
                            <div class="loading-text">Loading your ${tokenCount} NFTs...</div>
                        </div>`;
                    
                    // Optimized scanning with smaller batches for faster initial results
                    const ranges = [
                        [1, 500],
                        [501, 2000], 
                        [2001, 5000],
                        [5001, 10000]
                    ];
                    
                    for (const [start, end] of ranges) {
                        if (allTokens.length >= tokenCount) break;
                        
                        const batchSize = 100; // Smaller batches for faster response
                        
                        for (let i = start; i <= end && allTokens.length < tokenCount; i += batchSize) {
                            const batch = [];
                            const batchEnd = Math.min(i + batchSize - 1, end);
                            
                            for (let tokenId = i; tokenId <= batchEnd; tokenId++) {
                                batch.push(checkTokenOwnership(contractInfo.address, tokenId));
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
                                allTokens.push(...newTokens);
                                
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
            nftContainer.innerHTML = '<p>No ApeCoin NFTs found in your wallet</p>';
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
    
    nftContainer.innerHTML = `
        <div class="collection-header">
            <div class="collection-title">
                <img src="${networkConfig.logo}" alt="${networkConfig.chainName}" class="network-logo">
                <h3>${contractInfo.name}</h3>
            </div>
            <p class="collection-description">${contractInfo.description}</p>
            <div class="collection-stats">
                <span class="stat">Your NFTs: <strong>${tokens.length}${isComplete ? '' : `/${totalCount}`}</strong></span>
                <span class="stat">Total Supply: <strong>${contractInfo.totalSupply.toLocaleString()}</strong></span>
                ${!isComplete ? '<span class="stat loading-indicator">Loading more...</span>' : ''}
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
    
    const contractInfo = APECHAIN_NFT_CONTRACTS.find(c => c.address === nft.contract);
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

function showMainContent() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.querySelector('.top-nav').classList.remove('hidden');
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