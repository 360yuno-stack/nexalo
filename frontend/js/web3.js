// ============================================
// NEXALO - WEB3.JS UTILITIES
// Helper functions para interacción blockchain
// ============================================

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.userAddress = null;
        this.isConnected = false;
    }

    // ============================================
    // HELPERS DE RED
    // ============================================

    async getNetworkInfo() {
        if (!this.provider) return null;
        
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getGasPrice();
            
            return {
                chainId: network.chainId,
                name: network.name,
                blockNumber,
                gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
            };
        } catch (error) {
            console.error('Error obteniendo info de red:', error);
            return null;
        }
    }

    async getBNBBalance(address) {
        if (!this.provider) return '0';
        
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error obteniendo balance BNB:', error);
            return '0';
        }
    }

    // ============================================
    // PRICE ORACLE (SIMPLIFICADO)
    // ============================================

    async getBNBPrice() {
        // TODO: Integrar Chainlink Price Feed en producción
        // Por ahora, precio hardcoded para testnet
        
        // Chainlink BNB/USD en BSC Testnet:
        // 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
        
        try {
            // Simular precio (en producción, usar Chainlink)
            // 1 BNB = ~$500 USD (aproximado)
            return 500;
        } catch (error) {
            console.error('Error obteniendo precio BNB:', error);
            return 500; // Fallback
        }
    }

    convertUSDtoBNB(usdAmount) {
        // Simplificado: 1 USD = 0.002 BNB (cuando BNB = $500)
        // En producción, usar oracle real
        const bnbPrice = 500;
        const bnbAmount = usdAmount / bnbPrice;
        return ethers.utils.parseEther(bnbAmount.toString());
    }

    // ============================================
    // VALIDACIONES
    // ============================================

    isValidAddress(address) {
        try {
            return ethers.utils.isAddress(address);
        } catch {
            return false;
        }
    }

    validateNumber(number, digits) {
        const num = parseInt(number);
        const max = Math.pow(10, digits) - 1;
        
        return {
            valid: !isNaN(num) && num >= 0 && num <= max,
            num,
            max
        };
    }

    // ============================================
    // FORMATEO
    // ============================================

    formatAddress(address, chars = 4) {
        if (!address) return '';
        return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    }

    formatNumber(value, decimals = 2) {
        return parseFloat(value).toFixed(decimals);
    }

    formatLargeNumber(value) {
        const num = parseFloat(value);
        
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        
        return num.toFixed(2);
    }

    // ============================================
    // TRANSACCIONES
    // ============================================

    async waitForTransaction(txHash, confirmations = 1) {
        if (!this.provider) throw new Error('Provider no inicializado');
        
        console.log(`⏳ Esperando ${confirmations} confirmación(es) para tx: ${txHash}`);
        
        try {
            const receipt = await this.provider.waitForTransaction(txHash, confirmations);
            
            if (receipt.status === 1) {
                console.log('✅ Transacción confirmada:', receipt);
                return { success: true, receipt };
            } else {
                console.error('❌ Transacción falló');
                return { success: false, receipt };
            }
        } catch (error) {
            console.error('Error esperando transacción:', error);
            return { success: false, error };
        }
    }

    getExplorerUrl(txHash) {
        return `https://testnet.bscscan.com/tx/${txHash}`;
    }

    getAddressExplorerUrl(address) {
        return `https://testnet.bscscan.com/address/${address}`;
    }

    // ============================================
    // EVENTOS
    // ============================================

    async getContractEvents(contract, eventName, fromBlock = 0) {
        try {
            const filter = contract.filters[eventName]();
            const events = await contract.queryFilter(filter, fromBlock);
            return events;
        } catch (error) {
            console.error(`Error obteniendo eventos ${eventName}:`, error);
            return [];
        }
    }

    listenToEvent(contract, eventName, callback) {
        try {
            contract.on(eventName, (...args) => {
                console.log(`📢 Evento ${eventName}:`, args);
                callback(...args);
            });
            console.log(`👂 Escuchando evento: ${eventName}`);
        } catch (error) {
            console.error(`Error escuchando evento ${eventName}:`, error);
        }
    }

    // ============================================
    // ESTIMACIÓN DE GAS
    // ============================================

    async estimateGas(contract, method, args = [], overrides = {}) {
        try {
            const gasEstimate = await contract.estimateGas[method](...args, overrides);
            const gasPrice = await this.provider.getGasPrice();
            
            const gasCost = gasEstimate.mul(gasPrice);
            const gasCostBNB = ethers.utils.formatEther(gasCost);
            
            return {
                gasLimit: gasEstimate.toString(),
                gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
                totalCost: gasCostBNB
            };
        } catch (error) {
            console.error('Error estimando gas:', error);
            return null;
        }
    }

    // ============================================
    // REFERRAL HELPERS
    // ============================================

    generateReferralLink(address) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?ref=${address}`;
    }

    getReferrerFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        
        if (ref && this.isValidAddress(ref)) {
            return ref;
        }
        
        return ethers.constants.AddressZero;
    }

    saveReferrer(address) {
        if (this.isValidAddress(address)) {
            localStorage.setItem('nexalo_referrer', address);
        }
    }

    loadReferrer() {
        const saved = localStorage.getItem('nexalo_referrer');
        return saved && this.isValidAddress(saved) ? saved : ethers.constants.AddressZero;
    }

    // ============================================
    // LOCAL STORAGE HELPERS
    // ============================================

    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(`nexalo_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`nexalo_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error cargando de localStorage:', error);
            return defaultValue;
        }
    }

    // ============================================
    // DEBUGGING
    // ============================================

    async debugContractCall(contract, method, args = []) {
        console.log('🔍 DEBUG CONTRACT CALL');
        console.log('Contract:', contract.address);
        console.log('Method:', method);
        console.log('Args:', args);
        
        try {
            const result = await contract.callStatic[method](...args);
            console.log('✅ Resultado (callStatic):', result);
            return result;
        } catch (error) {
            console.error('❌ Error en call:', error);
            throw error;
        }
    }

    // ============================================
    // NÚMEROS ALEATORIOS (CLIENTE)
    // ============================================

    generateRandomNumbers(min, max, count) {
        const numbers = new Set();
        
        while (numbers.size < count) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(num);
        }
        
        return Array.from(numbers);
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    parseError(error) {
        console.error('Parsing error:', error);
        
        // Error de usuario rechazó transacción
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            return {
                type: 'USER_REJECTED',
                message: 'Transacción cancelada por el usuario'
            };
        }
        
        // Error de gas insuficiente
        if (error.code === -32000 || error.message?.includes('insufficient funds')) {
            return {
                type: 'INSUFFICIENT_FUNDS',
                message: 'Fondos insuficientes para pagar gas'
            };
        }
        
        // Error de contrato revert
        if (error.data || error.message?.includes('revert')) {
            const reason = this.extractRevertReason(error);
            return {
                type: 'CONTRACT_REVERT',
                message: reason || 'Transacción rechazada por el contrato'
            };
        }
        
        // Error genérico
        return {
            type: 'UNKNOWN',
            message: error.message || 'Error desconocido'
        };
    }

    extractRevertReason(error) {
        // Intentar extraer razón del revert
        if (error.reason) return error.reason;
        if (error.data?.message) return error.data.message;
        
        const match = error.message?.match(/reason="([^"]+)"/);
        return match ? match[1] : null;
    }

    // ============================================
    // CLIPBOARD
    // ============================================

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            return true;
        }
    }
}

// Crear instancia global
const web3Manager = new Web3Manager();

console.log('✅ Web3Manager cargado');
