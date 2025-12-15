// NEXALO - LÓGICA PRINCIPAL DE LA APLICACIÓN

class NexaloApp {
    constructor() {
        this.selectedQuantity = 1;
        this.selectedNexumType = null;
        this.referrerAddress = null;
        this.init();
    }

    async init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupEventListeners();
        this.loadReferrerFromURL();
        this.setupQuantityButtons();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón de conectar wallet
        const walletBtn = document.getElementById('walletConnect');
        if (walletBtn) {
            walletBtn.addEventListener('click', () => this.handleWalletConnect());
        }

        // Botones de compra
        const buyButtons = document.querySelectorAll('.btn-comprar');
        buyButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.handleBuyNexum(index));
        });

        // Calculadora de staking
        const stakingInput = document.getElementById('stakingAmount');
        if (stakingInput) {
            stakingInput.addEventListener('input', () => this.calculateStakingRewards());
        }

        // Botón de stake
        const stakeBtn = document.getElementById('stakeBtn');
        if (stakeBtn) {
            stakeBtn.addEventListener('click', () => this.handleStake());
        }

        // Botones de donación
        const donationBtns = document.querySelectorAll('.amount-btn');
        donationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleDonation(btn.dataset.amount));
        });

        // Donación personalizada
        const customDonateBtn = document.getElementById('customDonateBtn');
        if (customDonateBtn) {
            customDonateBtn.addEventListener('click', () => this.handleCustomDonation());
        }
    }

    // Cargar referrer desde URL
    loadReferrerFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        
        if (ref && ethers.utils.isAddress(ref)) {
            this.referrerAddress = ref;
            console.log('Referrer detectado:', this.referrerAddress);
            animationManager.showToast('Código de referido aplicado correctamente', 'success');
        }
    }

    // Configurar botones de cantidad
    setupQuantityButtons() {
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                quantityBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                nexaloApp.selectedQuantity = parseInt(this.dataset.quantity);
            });
        });
        
        // Activar el primer botón por defecto
        if (quantityBtns.length > 0) {
            quantityBtns[0].classList.add('active');
        }
    }

    // Manejar conexión de wallet
    async handleWalletConnect() {
        animationManager.showLoading('Conectando wallet...');
        
        const connected = await web3Manager.connectWallet();
        
        animationManager.hideLoading();
        
        if (connected) {
            animationManager.showToast('Wallet conectada exitosamente', 'success');
            await this.updateUserData();
        }
    }

    // Actualizar datos del usuario
    async updateUserData() {
        if (!web3Manager.isConnected) return;

        try {
            // Obtener balances
            const nxlBalance = await web3Manager.getTokenBalance(CONFIG.CONTRACTS.NXL_TOKEN);
            const usdtBalance = await web3Manager.getTokenBalance(CONFIG.CONTRACTS.MOCK_USDT);

            // Actualizar UI con balances
            this.updateBalanceDisplay(nxlBalance, usdtBalance);

            // Obtener participaciones del usuario
            await this.updateUserParticipations();

            // Obtener datos de staking
            await this.updateStakingData();

        } catch (error) {
            console.error('Error al actualizar datos del usuario:', error);
        }
    }

    // Actualizar display de balances
    updateBalanceDisplay(nxl, usdt) {
        const nxlDisplay = document.getElementById('nxlBalance');
        const usdtDisplay = document.getElementById('usdtBalance');

        if (nxlDisplay) nxlDisplay.textContent = parseFloat(nxl).toFixed(2);
        if (usdtDisplay) usdtDisplay.textContent = parseFloat(usdt).toFixed(2);
    }

    // Actualizar participaciones del usuario
    async updateUserParticipations() {
        // Aquí puedes agregar lógica para mostrar las participaciones del usuario
        // en cada tipo de Nexum
        try {
            const nexumTypes = ['FLASH', 'ORIGINAL', 'PREMIUM', 'ELITE', 'VIP'];
            
            for (const type of nexumTypes) {
                const numbers = await this.getUserParticipationNumbers(type);
                console.log(`Participaciones ${type}:`, numbers);
            }
        } catch (error) {
            console.error('Error al obtener participaciones:', error);
        }
    }

    // Actualizar datos de staking
    async updateStakingData() {
        try {
            const stakedBalance = await web3Manager.contracts.treasuryBTC.stakedBalance(web3Manager.address);
            const pendingRewards = await web3Manager.contracts.treasuryBTC.pendingRewards(web3Manager.address);

            const stakedDisplay = document.getElementById('stakedBalance');
            const rewardsDisplay = document.getElementById('pendingRewards');

            if (stakedDisplay) {
                stakedDisplay.textContent = ethers.utils.formatEther(stakedBalance);
            }
            if (rewardsDisplay) {
                rewardsDisplay.textContent = ethers.utils.formatEther(pendingRewards);
            }
        } catch (error) {
            console.error('Error al obtener datos de staking:', error);
        }
    }

    // Manejar compra de Nexum
    async handleBuyNexum(nexumTypeIndex) {
        if (!web3Manager.isConnected) {
            animationManager.showToast('Por favor conecta tu wallet primero', 'error');
            return;
        }

        const nexumTypes = ['FLASH', 'ORIGINAL', 'PREMIUM', 'ELITE', 'VIP'];
        const nexumType = nexumTypes[nexumTypeIndex];
        const nexumId = CONFIG.NEXUM_TYPES[nexumType];
        const price = CONFIG.NEXUM_PRICES[nexumType];
        const totalPrice = price * this.selectedQuantity;

        try {
            animationManager.showLoading('Procesando compra...');

            // 1. Verificar allowance de USDT
            const allowance = await web3Manager.checkAllowance(
                CONFIG.CONTRACTS.MOCK_USDT,
                CONFIG.CONTRACTS.NEXUM_MANAGER
            );

            // 2. Si no hay suficiente allowance, aprobar
            if (parseFloat(allowance) < totalPrice) {
                animationManager.showLoading('Aprobando USDT...');
                const approved = await web3Manager.approveToken(
                    CONFIG.CONTRACTS.MOCK_USDT,
                    CONFIG.CONTRACTS.NEXUM_MANAGER,
                    totalPrice * 2 // Aprobar el doble para futuras compras
                );

                if (!approved) {
                    throw new Error('Aprobación de USDT cancelada');
                }
            }

            // 3. Realizar la compra
            animationManager.showLoading('Comprando participaciones...');

            const referrer = this.referrerAddress || ethers.constants.AddressZero;

            const tx = await web3Manager.contracts.nexumManager.buyNexum(
                nexumId,
                this.selectedQuantity,
                referrer
            );

            animationManager.showLoading('Confirmando transacción...');
            const receipt = await tx.wait();

            animationManager.hideLoading();
            animationManager.showToast(
                `¡Compra exitosa! ${this.selectedQuantity} participación(es) de ${nexumType}`,
                'success'
            );

            // Actualizar datos del usuario
            await this.updateUserData();

            // Mostrar números de participación
            this.showPurchaseDetails(receipt, nexumType);

        } catch (error) {
            animationManager.hideLoading();
            console.error('Error en la compra:', error);
            
            let errorMsg = 'Error al procesar la compra';
            if (error.message.includes('insufficient')) {
                errorMsg = 'Saldo insuficiente de USDT';
            } else if (error.message.includes('user rejected')) {
                errorMsg = 'Transacción cancelada por el usuario';
            }
            
            animationManager.showToast(errorMsg, 'error');
        }
    }

    // Mostrar detalles de compra
    showPurchaseDetails(receipt, nexumType) {
        // Aquí puedes extraer los números de participación del evento emitido
        // y mostrarlos al usuario
        console.log('Recibo de compra:', receipt);
        
        // Buscar el evento NexumPurchased en los logs
        const event = receipt.events?.find(e => e.event === 'NexumPurchased');
        if (event) {
            console.log('Números de participación:', event.args.participationNumbers);
        }
    }

    // Calcular recompensas de staking
    calculateStakingRewards() {
        const input = document.getElementById('stakingAmount');
        const resultValue = document.getElementById('stakingResultValue');
        const resultDetail = document.getElementById('stakingResultDetail');

        if (!input || !resultValue) return;

        const amount = parseFloat(input.value) || 0;
        const apy = CONFIG.STAKING_APY;
        
        // Cálculo anual
        const yearlyReward = amount * apy;
        const monthlyReward = yearlyReward / 12;
        const dailyReward = yearlyReward / 365;

        resultValue.textContent = `$${yearlyReward.toFixed(2)}`;
        
        if (resultDetail) {
            resultDetail.textContent = `Mensual: $${monthlyReward.toFixed(2)} | Diario: $${dailyReward.toFixed(2)}`;
        }
    }

    // Manejar stake de NXL
    async handleStake() {
        if (!web3Manager.isConnected) {
            animationManager.showToast('Por favor conecta tu wallet primero', 'error');
            return;
        }

        const input = document.getElementById('stakingAmount');
        const amount = parseFloat(input.value);

        if (!amount || amount <= 0) {
            animationManager.showToast('Ingresa una cantidad válida', 'error');
            return;
        }

        try {
            animationManager.showLoading('Procesando stake...');

            // 1. Aprobar NXL si es necesario
            const allowance = await web3Manager.checkAllowance(
                CONFIG.CONTRACTS.NXL_TOKEN,
                CONFIG.CONTRACTS.TREASURY_BTC
            );

            if (parseFloat(allowance) < amount) {
                animationManager.showLoading('Aprobando NXL...');
                const approved = await web3Manager.approveToken(
                    CONFIG.CONTRACTS.NXL_TOKEN,
                    CONFIG.CONTRACTS.TREASURY_BTC,
                    amount * 2
                );

                if (!approved) {
                    throw new Error('Aprobación de NXL cancelada');
                }
            }

            // 2. Realizar stake
            animationManager.showLoading('Realizando stake...');

            const amountWei = ethers.utils.parseEther(amount.toString());
            const tx = await web3Manager.contracts.treasuryBTC.stakeNXL(amountWei);

            animationManager.showLoading('Confirmando transacción...');
            await tx.wait();

            animationManager.hideLoading();
            animationManager.showToast('Stake realizado exitosamente', 'success');

            // Actualizar datos
            await this.updateUserData();
            input.value = '';

        } catch (error) {
            animationManager.hideLoading();
            console.error('Error en stake:', error);
            
            let errorMsg = 'Error al realizar el stake';
            if (error.message.includes('insufficient')) {
                errorMsg = 'Saldo insuficiente de NXL';
            } else if (error.message.includes('user rejected')) {
                errorMsg = 'Transacción cancelada';
            }
            
            animationManager.showToast(errorMsg, 'error');
        }
    }

    // Manejar donación
    async handleDonation(amount) {
        if (!web3Manager.isConnected) {
            animationManager.showToast('Por favor conecta tu wallet primero', 'error');
            return;
        }

        const donationAmount = parseFloat(amount);

        try {
            animationManager.showLoading('Procesando donación...');

            // 1. Aprobar USDT
            const allowance = await web3Manager.checkAllowance(
                CONFIG.CONTRACTS.MOCK_USDT,
                CONFIG.CONTRACTS.DONATION_VAULT
            );

            if (parseFloat(allowance) < donationAmount) {
                animationManager.showLoading('Aprobando USDT...');
                const approved = await web3Manager.approveToken(
                    CONFIG.CONTRACTS.MOCK_USDT,
                    CONFIG.CONTRACTS.DONATION_VAULT,
                    donationAmount * 2
                );

                if (!approved) {
                    throw new Error('Aprobación cancelada');
                }
            }

            // 2. Realizar donación
            animationManager.showLoading('Procesando donación...');

            const amountWei = ethers.utils.parseUnits(donationAmount.toString(), 18);
            const tx = await web3Manager.contracts.donationVault.donate(amountWei);

            animationManager.showLoading('Confirmando transacción...');
            await tx.wait();

            animationManager.hideLoading();
            animationManager.showToast(`
            animationManager.showToast(`¡Gracias por tu donación de $${donationAmount}!`, 'success');

            // Actualizar datos
            await this.updateUserData();

        } catch (error) {
            animationManager.hideLoading();
            console.error('Error en donación:', error);
            
            let errorMsg = 'Error al procesar la donación';
            if (error.message.includes('user rejected')) {
                errorMsg = 'Donación cancelada';
            }
            
            animationManager.showToast(errorMsg, 'error');
        }
    }

    // Manejar donación personalizada
    async handleCustomDonation() {
        const input = document.getElementById('customAmount');
        const amount = parseFloat(input.value);

        if (!amount || amount < 1) {
            animationManager.showToast('Ingresa una cantidad válida (mínimo $1)', 'error');
            return;
        }

        await this.handleDonation(amount);
        input.value = '';
    }

    // Obtener datos de una ronda específica
    async getRoundInfo(nexumType, roundNumber) {
        try {
            const roundInfo = await web3Manager.contracts.nexumManager.roundInfo(
                CONFIG.NEXUM_TYPES[nexumType],
                roundNumber
            );

            return {
                endTime: roundInfo.endTime.toNumber(),
                drawn: roundInfo.drawn,
                totalParticipations: roundInfo.totalParticipations.toNumber(),
                prizePool: ethers.utils.formatEther(roundInfo.prizePool)
            };
        } catch (error) {
            console.error('Error al obtener info de ronda:', error);
            return null;
        }
    }

    // Obtener números de participación del usuario
    async getUserParticipationNumbers(nexumType) {
        try {
            const numbers = await web3Manager.contracts.nexumManager.getParticipationNumbers(
                web3Manager.address,
                CONFIG.NEXUM_TYPES[nexumType]
            );

            return numbers.map(n => n.toNumber());
        } catch (error) {
            console.error('Error al obtener números de participación:', error);
            return [];
        }
    }

    // Mintear USDT de prueba (solo testnet)
    async mintTestUSDT(amount = 1000) {
        if (!web3Manager.isConnected) {
            animationManager.showToast('Conecta tu wallet primero', 'error');
            return;
        }

        try {
            animationManager.showLoading('Minteando USDT de prueba...');

            const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
            const tx = await web3Manager.contracts.mockUSDT.mint(
                web3Manager.address,
                amountWei
            );

            await tx.wait();

            animationManager.hideLoading();
            animationManager.showToast(`Minteados ${amount} USDT de prueba`, 'success');

            await this.updateUserData();
        } catch (error) {
            animationManager.hideLoading();
            console.error('Error al mintear USDT:', error);
            animationManager.showToast('Error al mintear USDT de prueba', 'error');
        }
    }
}

// Crear instancia global de la aplicación
const nexaloApp = new NexaloApp();

// ============================================
// FUNCIONES GLOBALES EXPUESTAS
// ============================================

// Exponer función para mintear USDT de prueba globalmente
window.mintTestUSDT = () => nexaloApp.mintTestUSDT();

// Exponer función para obtener referrer desde URL
window.getReferrerFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
};

// Función de utilidad para copiar enlace de referido
window.copyReferralLink = async () => {
    if (!web3Manager.isConnected) {
        animationManager.showToast('Conecta tu wallet primero', 'error');
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const referralLink = `${baseUrl}?ref=${web3Manager.address}`;

    try {
        await navigator.clipboard.writeText(referralLink);
        animationManager.showToast('Enlace de referido copiado al portapapeles', 'success');
    } catch (error) {
        console.error('Error al copiar:', error);
        animationManager.showToast('No se pudo copiar el enlace', 'error');
    }
};

// Función para compartir en redes sociales
window.shareReferral = (platform) => {
    if (!web3Manager.isConnected) {
        animationManager.showToast('Conecta tu wallet primero', 'error');
        return;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const referralLink = `${baseUrl}?ref=${web3Manager.address}`;
    const message = encodeURIComponent('¡Únete a NXL y participa en sorteos con recompensas en criptomonedas!');

    let shareUrl = '';

    switch(platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralLink)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${message}%20${encodeURIComponent(referralLink)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
            break;
        default:
            return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
};

// Función para mostrar estadísticas del usuario
window.showUserStats = async () => {
    if (!web3Manager.isConnected) {
        animationManager.showToast('Conecta tu wallet primero', 'error');
        return;
    }

    try {
        animationManager.showLoading('Cargando estadísticas...');

        // Obtener participaciones en cada tipo de Nexum
        const nexumTypes = ['FLASH', 'ORIGINAL', 'PREMIUM', 'ELITE', 'VIP'];
        let totalParticipations = 0;
        let participationsByType = {};

        for (const type of nexumTypes) {
            const numbers = await nexaloApp.getUserParticipationNumbers(type);
            participationsByType[type] = numbers.length;
            totalParticipations += numbers.length;
        }

        animationManager.hideLoading();

        // Mostrar en consola (puedes crear un modal para visualizar mejor)
        console.log('Estadísticas del usuario:', {
            address: web3Manager.address,
            totalParticipations,
            participationsByType
        });

        animationManager.showToast('Estadísticas cargadas (ver consola)', 'success');

    } catch (error) {
        animationManager.hideLoading();
        console.error('Error al cargar estadísticas:', error);
        animationManager.showToast('Error al cargar estadísticas', 'error');
    }
};

// Función para reclamar recompensas de staking
window.claimStakingRewards = async () => {
    if (!web3Manager.isConnected) {
        animationManager.showToast('Conecta tu wallet primero', 'error');
        return;
    }

    try {
        animationManager.showLoading('Reclamando recompensas...');

        const tx = await web3Manager.contracts.treasuryBTC.claimRewards();
        
        animationManager.showLoading('Confirmando transacción...');
        await tx.wait();

        animationManager.hideLoading();
        animationManager.showToast('Recompensas reclamadas exitosamente', 'success');

        await nexaloApp.updateUserData();

    } catch (error) {
        animationManager.hideLoading();
        console.error('Error al reclamar recompensas:', error);
        
        let errorMsg = 'Error al reclamar recompensas';
        if (error.message.includes('No rewards')) {
            errorMsg = 'No tienes recompensas disponibles';
        } else if (error.message.includes('user rejected')) {
            errorMsg = 'Transacción cancelada';
        }
        
        animationManager.showToast(errorMsg, 'error');
    }
};

// Función para unstake
window.unstakeNXL = async () => {
    if (!web3Manager.isConnected) {
        animationManager.showToast('Conecta tu wallet primero', 'error');
        return;
    }

    try {
        // Obtener el balance staked
        const stakedBalance = await web3Manager.contracts.treasuryBTC.stakedBalance(web3Manager.address);
        
        if (stakedBalance.eq(0)) {
            animationManager.showToast('No tienes NXL en staking', 'error');
            return;
        }

        animationManager.showLoading('Retirando NXL...');

        const tx = await web3Manager.contracts.treasuryBTC.unstake(stakedBalance);
        
        animationManager.showLoading('Confirmando transacción...');
        await tx.wait();

        animationManager.hideLoading();
        animationManager.showToast('NXL retirado exitosamente', 'success');

        await nexaloApp.updateUserData();

    } catch (error) {
        animationManager.hideLoading();
        console.error('Error al hacer unstake:', error);
        
        let errorMsg = 'Error al retirar NXL';
        if (error.message.includes('Locking period')) {
            errorMsg = 'Debes esperar el período de bloqueo';
        } else if (error.message.includes('user rejected')) {
            errorMsg = 'Transacción cancelada';
        }
        
        animationManager.showToast(errorMsg, 'error');
    }
};

// ============================================
// CONTADORES Y UTILIDADES
// ============================================

// Contador de tiempo restante para sorteos
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('[data-countdown]');
    
    countdownElements.forEach(element => {
        const endTime = parseInt(element.dataset.endTime);
        if (!endTime) return;

        const now = Math.floor(Date.now() / 1000);
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            element.textContent = 'Sorteo finalizado';
            return;
        }

        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft % 86400) / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;

        let countdownText = '';
        if (days > 0) {
            countdownText = `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            countdownText = `${hours}h ${minutes}m ${seconds}s`;
        } else {
            countdownText = `${minutes}m ${seconds}s`;
        }

        element.textContent = countdownText;
    });
}

// Actualizar contadores cada segundo
setInterval(updateCountdowns, 1000);

// Inicializar contadores al cargar
updateCountdowns();

// Log de inicialización
console.log('✅ NXL App inicializada correctamente');
console.log('📍 Versión: 1.0.0');
console.log('🌐 Red: BSC Testnet');
