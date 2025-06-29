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
            
            if (currentNetwork === 'apechain') {
                await addNetwork(networkConfig);
            } else {
                await switchToNetwork(networkConfig.chainId);
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