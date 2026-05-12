import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#60A5FA";
export const ConfigMetaMask: React.FC = () => (
  <SlideLayout number="04" color={C} title="Configurar MetaMask" subtitle="Conéctate a BSC Testnet">
    <BulletList color={C} items={[
      "1️⃣ Instala MetaMask desde metamask.io",
      "2️⃣ Añade la red BSC Testnet manualmente",
      "   Chain ID: 97 · RPC: data-seed-prebsc-1-s1.binance.org",
      "3️⃣ Obtén tBNB gratis en el faucet de BSC",
      "4️⃣ Añade USDT Testnet desde deployed-addresses.json",
      "5️⃣ Conecta en NEXALO → botón 'Conectar Wallet'",
    ]} />
  </SlideLayout>
);
