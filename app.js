let web3;
let userAccount;
let currentNetwork = 'ethereum';

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
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNGRkQ3MDAiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QTwvdGV4dD4KPC9zdmc+'
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
            
            if (currentNetwork === 'apechain' || currentNetwork === 'solana') {
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
            
            document.getElementById('nftContainer').classList.remove('hidden');
            await loadNFTs();
        } else {
            alert('Please install Phantom wallet for Solana');
        }
    } catch (error) {
        console.error('Solana wallet connection failed:', error);
        alert('Failed to connect Solana wallet');
    }
}

const APECHAIN_NFT_CONTRACTS = [
    '0xa0d77da1e690156b95e0619de4a4f8fc5e3a2266'  // ApeCoin Collection on ApeChain
];

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
                        console.log(`Scanning for ${tokenCount} tokens...`);
                        
                        // Scan common NFT ranges efficiently
                        const ranges = [
                            [1, 1000],
                            [1001, 5000], 
                            [5001, 10000],
                            [10001, 20000]
                        ];
                        
                        for (const [start, end] of ranges) {
                            if (allTokens.length >= tokenCount) break;
                            
                            console.log(`Checking range ${start}-${end}`);
                            const batchSize = 500;
                            
                            for (let i = start; i <= end && allTokens.length < tokenCount; i += batchSize) {
                                const batch = [];
                                const batchEnd = Math.min(i + batchSize - 1, end);
                                
                                for (let tokenId = i; tokenId <= batchEnd; tokenId++) {
                                    batch.push(checkTokenOwnership(contract, tokenId));
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
                                    
                                    for (const tokenId of ownedIds) {
                                        const metadata = await getTokenMetadata(contract, tokenId);
                                        allTokens.push({ contract, tokenId, ...metadata });
                                    }
                                    
                                    nftContainer.innerHTML = `
                                        <div class="coin-loader">
                                            <div class="${coinClass}" ${coinStyle}></div>
                                            <div class="loading-text">Found ${allTokens.length}/${tokenCount} NFTs...</div>
                                        </div>`;
                                }
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
                    ${allTokens.map((token, index) => 
                        `<div class="nft-card" onclick="showNFTModal(${index})">
                            <img src="${token.image}" alt="${token.name}" class="nft-image" onerror="this.src='${generateFallbackImage(token.tokenId)}'">
                            <div class="nft-info">
                                <h4>${token.name || `#${token.tokenId}`}</h4>
                                <p>Token ID: ${token.tokenId}</p>
                            </div>
                        </div>`
                    ).join('')}
                </div>`;
            
            window.nftData = allTokens;
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
                    metadata.image || generateFallbackImage(tokenId),
                description: metadata.description,
                attributes: metadata.attributes || [],
                tokenURI: tokenURI
            };
        }
    } catch (e) {
        console.log('Metadata fetch failed:', e);
    }
    
    return {
        name: `ApeCoin NFT #${tokenId}`,
        image: generateFallbackImage(tokenId),
        description: 'ApeCoin NFT from ApeChain',
        attributes: [],
        tokenURI: ''
    };
}

function showNFTModal(index) {
    const nft = window.nftData[index];
    const modal = document.getElementById('nftModal');
    
    document.getElementById('modalImage').src = nft.image;
    document.getElementById('modalTitle').textContent = nft.name;
    
    const metadataHtml = `
        <div class="metadata-item">
            <span class="metadata-label">Token ID:</span> ${nft.tokenId}
        </div>
        <div class="metadata-item">
            <span class="metadata-label">Contract:</span> ${nft.contract}
        </div>
        ${nft.description ? `<div class="metadata-item">
            <span class="metadata-label">Description:</span> ${nft.description}
        </div>` : ''}
        ${nft.attributes.length > 0 ? `<div class="metadata-item">
            <span class="metadata-label">Attributes:</span><br>
            ${nft.attributes.map(attr => `<span style="display:block;margin:0.25rem 0;">${attr.trait_type}: ${attr.value}</span>`).join('')}
        </div>` : ''}
    `;
    
    document.getElementById('modalMetadata').innerHTML = metadataHtml;
    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('nftModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };
});

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