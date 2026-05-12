import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#F472B6";
export const SinWallet: React.FC = () => (
  <SlideLayout number="05" color={C} title="Compra Sin Wallet" subtitle="WalletConnect · Móvil">
    <BulletList color={C} items={[
      "📱 Abre NEXALO desde tu navegador móvil",
      "🔗 Pulsa 'Conectar' → selecciona WalletConnect",
      "📷 Escanea el QR con Trust Wallet, MetaMask Mobile…",
      "✅ Aprueba la conexión desde tu app de wallet",
      "💳 Compra tickets exactamente igual que en desktop",
      "🔐 Tu clave privada nunca sale de tu dispositivo",
    ]} />
  </SlideLayout>
);
