// ============================================
// NEXALO - MAIN.JS COMPLETO
// ============================================

let currentProductId = null;
let selectedNumbers = [];
let contracts = {};
let provider = null;
let signer = null;
let userAddress = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 NEXALO Iniciando...');
    
    document.getElementById('walletConnect').addEventListener('click', connectWallet);
    document.getElementById('number-input').addEventListener('input', formatNumberInput);
    
    await initReadOnly();
    setInterval(updateAllData, 30000);
});

// ============================================
// CONEXIÓN WALLET
// ============================================

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('❌ Por favor instala MetaMask: https://metamask.io');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        userAddress = accounts[0];
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== CONFIG.NETWORK.chainId) {
            await switchNetwork();
        }
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        await initContracts();
        updateWalletUI();
        await loadUserData();
        
        console.log('✅ Wallet conectada:', userAddress);
        
    } catch (error) {
        console.error('❌ Error conectando wallet:', error);
        alert('Error al conectar wallet: ' + error.message);
    }
}

async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.NETWORK.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.NETWORK.chainId,
                        chainName: CONFIG.NETWORK.chainName,
                        nativeCurrency: {
                            name: 'BNB',
                            symbol: 'BNB',
                            decimals: 18
                        },
                        rpcUrls: CONFIG.NETWORK.rpcUrls,
                        blockExplorerUrls: [CONFIG.NETWORK.blockExplorer]
                    }],
                });
            } catch (addError) {
                console.error('Error agregando red:', addError);
                throw addError;
            }
        } else {
            throw switchError;
        }
    }
}

// ============================================
// INICIALIZACIÓN CONTRATOS
// ============================================

async function initReadOnly() {
    provider = new ethers.providers.JsonRpcProvider(CONFIG.NETWORK.rpcUrls[0]);
    
    contracts.nexumManager = new ethers.Contract(
        CONFIG.CONTRACTS.NEXUM_MANAGER,
        ABIS.NEXUM_MANAGER,
        provider
    );
    
    console.log('✅ Contratos inicializados');
    await updateAllData();
}

async function initContracts() {
    contracts.nxlToken = new ethers.Contract(
        CONFIG.CONTRACTS.NXL_TOKEN,
        ABIS.NXL_TOKEN,
        signer
    );
    
    contracts.nexumManager = new ethers.Contract(
        CONFIG.CONTRACTS.NEXUM_MANAGER,
        ABIS.NEXUM_MANAGER,
        signer
    );
    
    console.log('✅ Contratos inicializados con signer');
}

// ============================================
// ACTUALIZAR DATOS
// ============================================

async function updateAllData() {
    try {
        for (let i = 0; i < 6; i++) {
            await updateProductData(i);
        }
    } catch (error) {
        console.error('Error actualizando datos:', error);
    }
}

async function updateProductData(productId) {
    try {
        const roundId = await contracts.nexumManager.currentRound(productId);
        const roundInfo = await contracts.nexumManager.getRoundInfo(productId, roundId);
        const soldTickets = parseInt(roundInfo.ticketsSold.toString());
        
        const product = await contracts.nexumManager.products(productId);
        const maxTickets = parseInt(product.maxTickets.toString());
        
        const soldElement = document.getElementById(`sold-${productId}`);
        const progressElement = document.getElementById(`progress-${productId}`);
        
        if (soldElement) soldElement.textContent = soldTickets;
        
        if (progressElement) {
            const percentage = (soldTickets / maxTickets) * 100;
            progressElement.style.width = percentage + '%';
        }
        
    } catch (error) {
        console.error(`Error actualizando producto ${productId}:`, error);
    }
}

async function loadUserData() {
    if (!userAddress || !contracts.nxlToken) return;
    
    try {
        const balance = await contracts.nxlToken.balanceOf(userAddress);
        const balanceFormatted = ethers.utils.formatEther(balance);
        
        document.getElementById('nxl-balance').textContent = parseFloat(balanceFormatted).toFixed(2);
        
        const usdValue = parseFloat(balanceFormatted) * 0.05;
        document.getElementById('nxl-usd').textContent = usdValue.toFixed(2);
        
        await loadUserTickets();
        
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    }
}

async function loadUserTickets() {
    const container = document.getElementById('my-tickets');
    container.innerHTML = '<p class="text-gray-400 text-center">Cargando tickets...</p>';
    
    try {
        let hasTickets = false;
        let ticketsHTML = '';
        
        for (let productId = 0; productId < 6; productId++) {
            const roundId = await contracts.nexumManager.currentRound(productId);
            const tickets = await contracts.nexumManager.getUserTickets(productId, roundId, userAddress);
            
            if (tickets.length > 0) {
                hasTickets = true;
                const productData = CONFIG.PRODUCTS[productId];
                
                ticketsHTML += `
                    <div class="bg-black/40 border border-gray-700 rounded-lg p-4 mb-4">
                        <h4 class="text-lg font-bold text-[#00FF41] mb-3">${productData.emoji} ${productData.name}</h4>
                        <div class="flex flex-wrap gap-2">
                            ${tickets.map(num => `
                                <span class="bg-gray-800 border border-[#00FF41] px-3 py-1 rounded font-mono">
                                    ${num.toString().padStart(productData.digits, '0')}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = hasTickets ? ticketsHTML : 
            '<p class="text-gray-400 text-center py-8">No tienes números comprados aún</p>';
        
    } catch (error) {
        console.error('Error cargando tickets:', error);
        container.innerHTML = '<p class="text-red-400 text-center">Error cargando tickets</p>';
    }
}

// ============================================
// MODAL DE COMPRA
// ============================================

function openModal(productId) {
    if (!userAddress) {
        alert('⚠️ Por favor conecta tu wallet primero');
        return;
    }
    
    currentProductId = productId;
    selectedNumbers = [];
    
    const product = CONFIG.PRODUCTS[productId];
    const modal = document.getElementById('number-modal');
    
    document.getElementById('modal-title').textContent = `${product.emoji} ${product.name}`;
    document.getElementById('number-format').textContent = `Formato: ${'0'.repeat(product.digits)} (${product.maxTickets} números disponibles)`;
    document.getElementById('number-input').value = '';
    document.getElementById('number-input').maxLength = product.digits;
    document.getElementById('number-input').placeholder = '0'.repeat(product.digits);
    
    updateSelectedNumbersUI();
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('number-modal').classList.remove('active');
    selectedNumbers = [];
    currentProductId = null;
}

function formatNumberInput(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
}

function addNumber() {
    const input = document.getElementById('number-input');
    const number = input.value;
    const product = CONFIG.PRODUCTS[currentProductId];
    
    if (number.length !== product.digits) {
        alert(`⚠️ Debes ingresar exactamente ${product.digits} dígitos`);
        return;
    }
    
    const numValue = parseInt(number);
    const maxValue = product.maxTickets - 1;
    
    if (numValue > maxValue) {
        alert(`⚠️ Número fuera de rango (0-${maxValue})`);
        return;
    }
    
    if (selectedNumbers.includes(numValue)) {
        alert('⚠️ Ese número ya está seleccionado');
        return;
    }
    
    selectedNumbers.push(numValue);
    input.value = '';
    updateSelectedNumbersUI();
}

function removeNumber(index) {
    selectedNumbers.splice(index, 1);
    updateSelectedNumbersUI();
}

function updateSelectedNumbersUI() {
    const container = document.getElementById('selected-numbers-container');
    const countElement = document.getElementById('selected-count');
    
    if (countElement) {
        countElement.textContent = selectedNumbers.length;
    }
    
    if (selectedNumbers.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center w-full">Ningún número seleccionado</p>';
        return;
    }
    
    const product = CONFIG.PRODUCTS[currentProductId];
    
    container.innerHTML = selectedNumbers.map((num, idx) => `
        <div class="selected-number">
            <span>${num.toString().padStart(product.digits, '0')}</span>
            <button onclick="removeNumber(${idx})">×</button>
        </div>
    `).join('');
}

// ============================================
// COMPRA DE TICKETS
// ============================================

async function confirmPurchase() {
    if (selectedNumbers.length === 0) {
        alert('⚠️ Selecciona al menos un número');
        return;
    }
    
    if (!userAddress || !contracts.nexumManager) {
        alert('⚠️ Conecta tu wallet primero');
        return;
    }
    
    const product = CONFIG.PRODUCTS[currentProductId];
    const quantity = selectedNumbers.length;
    const totalCostUSD = product.price * quantity;
    
    try {
        const confirmBuy = window.confirm(
            `¿Confirmar compra?\n\n` +
            `Producto: ${product.name}\n` +
            `Números: ${quantity}\n` +
            `Total: $${totalCostUSD} USDT\n` +
            `Recibirás: ${product.nxlPerTicket * quantity} NXL`
        );
        
        if (!confirmBuy) return;
        
        const usdtContract = new ethers.Contract(
            CONFIG.CONTRACTS.USDT,
            ["function approve(address spender, uint256 amount) returns (bool)", "function allowance(address owner, address spender) view returns (uint256)", "function balanceOf(address account) view returns (uint256)"],
            signer
        );
        
        const usdtBalance = await usdtContract.balanceOf(userAddress);
        const totalCostWei = ethers.utils.parseEther(totalCostUSD.toString());
        
        if (usdtBalance.lt(totalCostWei)) {
            alert(`❌ Fondos insuficientes\n\nNecesitas: ${totalCostUSD} USDT\nTienes: ${ethers.utils.formatEther(usdtBalance)} USDT`);
            return;
        }
        
        const allowance = await usdtContract.allowance(userAddress, CONFIG.CONTRACTS.NEXUM_MANAGER);
        
        if (allowance.lt(totalCostWei)) {
            alert('⏳ Aprobando USDT... (1/2)');
            const approveTx = await usdtContract.approve(CONFIG.CONTRACTS.NEXUM_MANAGER, ethers.constants.MaxUint256);
            await approveTx.wait();
            alert('✅ USDT aprobado (1/2)');
        }
        
        alert('⏳ Comprando tickets... (2/2)');
        
        const tx = await contracts.nexumManager.buyTickets(currentProductId, quantity, ethers.constants.AddressZero);
        await tx.wait();
        
        alert(`✅ ¡COMPRA EXITOSA!\n\n${quantity} números comprados\nRecibiste ${product.nxlPerTicket * quantity} NXL`);
        
        closeModal();
        await loadUserData();
        await updateProductData(currentProductId);
        
    } catch (error) {
        console.error('❌ Error en compra:', error);
        alert('❌ Error: ' + (error.data?.message || error.message || 'Transacción fallida'));
    }
}

async function buyBatch(productId, quantity) {
    if (!userAddress) {
        alert('⚠️ Por favor conecta tu wallet primero');
        return;
    }
    
    const product = CONFIG.PRODUCTS[productId];
    const totalCostUSD = product.price * quantity;
    
    const confirmBuy = window.confirm(
        `🎲 COMPRA RÁPIDA\n\n` +
        `${quantity} números aleatorios\n` +
        `Producto: ${product.name}\n` +
        `Total: $${totalCostUSD} USDT\n` +
        `Recibirás: ${product.nxlPerTicket * quantity} NXL\n\n` +
        `¿Confirmar?`
    );
    
    if (!confirmBuy) return;
    
    try {
        const usdtContract = new ethers.
Contract(
            CONFIG.CONTRACTS.USDT,
            ["function approve(address spender, uint256 amount) returns (bool)", "function allowance(address owner, address spender) view returns (uint256)", "function balanceOf(address account) view returns (uint256)"],
            signer
        );
        
        const usdtBalance = await usdtContract.balanceOf(userAddress);
        const totalCostWei = ethers.utils.parseEther(totalCostUSD.toString());
        
        if (usdtBalance.lt(totalCostWei)) {
            alert(`❌ Fondos insuficientes\n\nNecesitas: ${totalCostUSD} USDT\nTienes: ${ethers.utils.formatEther(usdtBalance)} USDT`);
            return;
        }
        
        const allowance = await usdtContract.allowance(userAddress, CONFIG.CONTRACTS.NEXUM_MANAGER);
        
        if (allowance.lt(totalCostWei)) {
            alert('⏳ Aprobando USDT... (1/2)');
            const approveTx = await usdtContract.approve(CONFIG.CONTRACTS.NEXUM_MANAGER, ethers.constants.MaxUint256);
            await approveTx.wait();
            alert('✅ USDT aprobado (1/2)');
        }
        
        alert('⏳ Comprando tickets... (2/2)');
        
        const tx = await contracts.nexumManager.buyTickets(productId, quantity, ethers.constants.AddressZero);
        await tx.wait();
        
        alert(`✅ ¡COMPRA EXITOSA!\n\n${quantity} números comprados\nRecibiste ${product.nxlPerTicket * quantity} NXL`);
        
        await loadUserData();
        await updateProductData(productId);
        
    } catch (error) {
        console.error('Error:', error);
        let errorMsg = 'Error en la transacción';
        if (error.code === 4001) errorMsg = 'Transacción cancelada';
        else if (error.message?.includes('insufficient funds')) errorMsg = 'Fondos insuficientes para gas (necesitas BNB)';
        else if (error.data?.message) errorMsg = error.data.message;
        else if (error.reason) errorMsg = error.reason;
        alert('❌ ' + errorMsg);
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function addNXLToWallet() {
    if (!window.ethereum) {
        alert('❌ MetaMask no detectado');
        return;
    }
    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: CONFIG.CONTRACTS.NXL_TOKEN,
                    symbol: 'NXL',
                    decimals: 18,
                    image: 'https://i.imgur.com/placeholder.png',
                },
            },
        });
        if (wasAdded) alert('✅ Token NXL agregado a tu wallet');
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

async function copyAddress() {
    if (!userAddress) {
        alert('⚠️ Conecta tu wallet primero');
        return;
    }
    try {
        await navigator.clipboard.writeText(userAddress);
        alert('✅ Dirección copiada: ' + userAddress);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function copyReferralLink() {
    if (!userAddress) {
        alert('⚠️ Conecta tu wallet primero');
        return;
    }
    const link = document.getElementById('referral-link').value;
    try {
        await navigator.clipboard.writeText(link);
        alert('✅ Link copiado al portapapeles');
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateWalletUI() {
    const btn = document.getElementById('walletConnect');
    const text = document.getElementById('walletText');
    
    if (userAddress) {
        text.textContent = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
        btn.classList.remove('from-[#00FF41]', 'to-[#00cc33]');
        btn.classList.add('from-green-600', 'to-green-700');
        
        const addressDisplay = document.getElementById('wallet-address-display');
        if (addressDisplay) addressDisplay.textContent = userAddress.slice(0, 10) + '...' + userAddress.slice(-8);
        
        const bscLink = document.getElementById('bscscan-link');
        if (bscLink) {
            bscLink.href = `https://testnet.bscscan.com/address/${userAddress}`;
            bscLink.textContent = userAddress;
        }
        
        const refLink = document.getElementById('referral-link');
        if (refLink) {
            const baseUrl = window.location.origin + window.location.pathname;
            refLink.value = `${baseUrl}?ref=${userAddress}`;
        }
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName + '-section').classList.add('active');
}

function showNoCryptoGuide() {
    alert('🚀 COMPRA FÁCIL SIN WALLET\n\nPróximamente podrás comprar con:\n• Tarjeta de crédito/débito\n• PayPal\n• Transferencia bancaria\n\nPor ahora, necesitas MetaMask.\nInstalación: metamask.io (2 minutos)');
}

// ============================================
// LISTENERS
// ============================================

if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            userAddress = null;
            location.reload();
        } else {
            location.reload();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        location.reload();
    });
}

console.log('✅ Main.js cargado');
