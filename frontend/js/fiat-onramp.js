// ============================================
// NEXALO - FIAT ON-RAMP INTEGRATION (TRANSAK)
// Permite a usuarios no-cripto comprar USDT con tarjeta de crédito
// y recibirlo directo en su wallet BSC.
// ============================================

const TRANSAK_STAGING_URL = "https://global-stg.transak.com";
// const TRANSAK_PRODUCTION_URL = "https://global.transak.com"; // Usar en Mainnet

const TRANSAK_API_KEY = "6b4e7235-9005-4a5f-b529-6e3e576595ee"; // Demo Key (reemplazar con key real)

/**
 * Initializes and displays the Fiat On-Ramp modal widget
 * @param {string} walletAddress - Target wallet address to receive the USDT
 * @param {number} defaultFiatAmount - Default amount in fiat to pre-fill (optional)
 */
function openFiatOnRamp(walletAddress, defaultFiatAmount = 100) {
  if (!walletAddress || walletAddress === "No conectada") {
    alert("❌ Necesitas conectar tu wallet primero para saber a dónde enviar los USDT comprados.");
    // Podríamos lanzar connectInjectedWallet() aquí si queremos
    return;
  }

  // Configuración de Transak para NEXALO (USDT sobre BSC)
  const params = new URLSearchParams({
    apiKey: TRANSAK_API_KEY,
    cryptoCurrencyCode: 'USDT',
    network: 'bsc',
    fiatCurrency: 'USD',
    defaultFiatAmount: defaultFiatAmount.toString(),
    walletAddress: walletAddress,
    themeColor: '3B82F6', // Nexalo Blue
    isFeeCalculationHidden: 'false',
    exchangeScreenTitle: 'Comprar USDT para NEXALO',
    hideMenu: 'true'
  });

  const widgetUrl = `${TRANSAK_STAGING_URL}/?${params.toString()}`;

  // Creamos el Modal Iframe
  const modalHTML = `
    <div id="transak-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center;">
      
      <div style="width: 100%; max-width: 500px; text-align: right; margin-bottom: 10px;">
        <button onclick="closeFiatOnRamp()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">Cerrar ✕</button>
      </div>
      
      <div style="width: 100%; max-width: 500px; height: 650px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <iframe 
          id="transak-iframe" 
          src="${widgetUrl}" 
          allow="camera;microphone;fullscreen;payment" 
          style="width: 100%; height: 100%; border: none;">
        </iframe>
      </div>
      
      <div style="width: 100%; max-width: 500px; text-align: center; margin-top: 15px;">
        <p style="color: #94A3B8; font-size: 13px;">Proveedor seguro: Transak. El saldo (USDT) llegará a tu wallet BSC.</p>
      </div>

    </div>
  `;

  // Insertar en el DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.body.style.overflow = 'hidden'; // Prevenir scroll de fondo

  // Escuchar eventos desde el Iframe de Transak (si queremos cerrar auto cuando se completa)
  window.addEventListener('message', transakEventHandler);
}

function closeFiatOnRamp() {
  const modal = document.getElementById("transak-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
  window.removeEventListener('message', transakEventHandler);
}

function transakEventHandler(event) {
  // Transak emite eventos por window.postMessage
  if (event.data && event.data.event_id) {
    console.log('Transak Event:', event.data.event_id);
    
    // Si la orden se completó exitosamente
    if (event.data.event_id === 'ORDER_COMPLETED') {
      alert("✅ ¡Compra Fiat Completada! Tus USDT estarán en tu wallet en unos minutos. Puedes verificar tu balance actualizando la página.");
      closeFiatOnRamp();
      
      // Intentar refrescar balances si la función global existe
      if (typeof window.refreshMyBalances === 'function') {
        window.refreshMyBalances();
      }
    }
  }
}

// Exponer globalmente
window.openFiatOnRamp = openFiatOnRamp;
window.closeFiatOnRamp = closeFiatOnRamp;
