// NEXALO - GESTIÓN DE WEB3 Y METAMASK

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.contracts = {};
        this.isConnected = false;
    }

    // Verificar si MetaMask está instalado
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    // Conectar wallet
    async connectWallet() {
        if (!this.isMetaMaskInstalled()) {
            alert('Por favor instala MetaMask para continuar.\n\nVisita: https://metamask.io');
            return false;
        }

        try {
            // Solicitar acceso a la cuenta
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });

            // Crear provider y signer con ethers.js
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.address = accounts[0];

            // Verificar red
            await this.checkNetwork();

            // Inicializar contratos
            await this.initContracts();

            // Actualizar UI
            this.updateWalletUI();

            // Escuchar cambios de cuenta
            this.setupEventListeners();

            this.isConnected = true;
            console.log('Wallet conectada:', this.address);

            return true;
        } catch (error) {
            console.error('Error al conectar wallet:', error);
            alert('Error al conectar con MetaMask. Por favor intenta de nuevo.');
            return false;
        }
    }

    // Verificar y cambiar a la red correcta
    async checkNetwork() {
        const network = await this.provider.getNetwork();
        const targetChainId = parseInt(CONFIG.NETWORK.chainId, 16);

        if (network.chainId !== targetChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CONFIG.NETWORK.chainId }],
                });
            } catch (switchError) {
                // Si la red no está agregada, agregarla
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: CONFIG.NETWORK.chainId,
                                chainName: CONFIG.NETWORK.chainName,
                                nativeCurrency: CONFIG.NETWORK.nativeCurrency,
                                rpcUrls: CONFIG.NETWORK.rpcUrls,
                                blockExplorerUrls: CONFIG.NETWORK.blockExplorerUrls
                            }]
                        });
                    } catch (addError) {
                        throw new Error('No se pudo agregar la red BSC Testnet');
                    }
                } else {
                    throw switchError;
                }
            }
        }
    }

    // Inicializar instancias de contratos
    async initContracts() {
        try {
            // Token NXL
            this.contracts.nxlToken = new ethers.Contract(
                CONFIG.CONTRACTS.NXL_TOKEN,
                ABIS.NXL_TOKEN,
                this.signer
            );

            // Mock USDT
            this.contracts.mockUSDT = new ethers.Contract(
                CONFIG.CONTRACTS.MOCK_USDT,
                ABIS.MOCK_USDT,
                this.signer
            );

            // NexumManager
            this.contracts.nexumManager = new ethers.Contract(
                CONFIG.CONTRACTS.NEXUM_MANAGER,
                ABIS.NEXUM_MANAGER,
                this.signer
            );

            // TreasuryBTC
            this.contracts.treasuryBTC = new ethers.Contract(
                CONFIG.CONTRACTS.TREASURY_BTC,
                ABIS.TREASURY_BTC,
                this.signer
            );

            // ReferralNetwork
            this.contracts.referralNetwork = new ethers.Contract(
                CONFIG.CONTRACTS.REFERRAL_NETWORK,
                ABIS.REFERRAL_NETWORK,
                this.signer
            );

            // AmbassadorRegistry
            this.contracts.ambassadorRegistry = new ethers.Contract(
                CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
                ABIS.AMBASSADOR_REGISTRY,
                this.signer
            );

            // DonationVault
            this.contracts.donationVault = new ethers.Contract(
                CONFIG.CONTRACTS.DONATION_VAULT,
                ABIS.DONATION_VAULT,
                this.signer
            );

            console.log('Contratos inicializados correctamente');
        } catch (error) {
            console.error('Error al inicializar contratos:', error);
            throw error;
        }
    }

    // Actualizar UI con información de wallet
    updateWalletUI() {
        const walletBtn = document.getElementById('walletConnect');
        if (walletBtn) {
            const shortAddress = `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
            walletBtn.innerHTML = `<span>💼</span> ${shortAddress}`;
            walletBtn.classList.add('connected');
        }
    }

    // Configurar listeners para cambios
    setupEventListeners() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.address = accounts[0];
                this.updateWalletUI();
                window.location.reload(); // Recargar para actualizar datos
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload(); // Recargar al cambiar de red
        });
    }

    // Desconectar wallet
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.contracts = {};
        this.isConnected = false;

        const walletBtn = document.getElementById('walletConnect');
        if (walletBtn) {
            walletBtn.innerHTML = '<span>💼</span> Conectar Wallet';
            walletBtn.classList.remove('connected');
        }
    }

    // Obtener balance de un token
    async getTokenBalance(tokenAddress) {
        try {
            const contract = new ethers.Contract(
                tokenAddress,
                ABIS.NXL_TOKEN,
                this.provider
            );
            const balance = await contract.balanceOf(this.address);
            const decimals = await contract.decimals();
            return ethers.utils.formatUnits(balance, decimals);
        } catch (error) {
            console.error('Error al obtener balance:', error);
            return '0';
        }
    }

    // Aprobar tokens
    async approveToken(tokenAddress, spenderAddress, amount) {
        try {
            const contract = new ethers.Contract(
                tokenAddress,
                ABIS.MOCK_USDT,
                this.signer
            );

            const decimals = await contract.decimals();
            const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);

            const tx = await contract.approve(spenderAddress, amountWei);
            await tx.wait();

            return true;
        } catch (error) {
            console.error('Error al aprobar tokens:', error);
            return false;
        }
    }

    // Verificar allowance
    async checkAllowance(tokenAddress, spenderAddress) {
        try {
            const contract = new ethers.Contract(
                tokenAddress,
                ABIS.MOCK_USDT,
                this.provider
            );

            const allowance = await contract.allowance(this.address, spenderAddress);
            const decimals = await contract.decimals();
            
            return ethers.utils.formatUnits(allowance, decimals);
        } catch (error) {
            console.error('Error al verificar allowance:', error);
            return '0';
        }
    }
}

// Crear instancia global
const web3Manager = new Web3Manager();
