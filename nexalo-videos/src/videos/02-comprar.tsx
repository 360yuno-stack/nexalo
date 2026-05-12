import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#FFD700";
export const ComprarNumeros: React.FC = () => (
  <SlideLayout number="02" color={C} title="Comprar Números" subtitle="Tutorial Paso a Paso">
    <BulletList color={C} items={[
      "1️⃣ Conecta tu wallet — MetaMask o WalletConnect",
      "2️⃣ Aprueba el gasto de USDT en el contrato",
      "3️⃣ Elige tu producto: FLASH ($1), ORIGINAL ($1), PREMIUM ($20)…",
      "4️⃣ Compra rápida: 1 · 3 · 5 · 10 tickets aleatorios",
      "5️⃣ O elige tus números específicos con 🎯",
      "6️⃣ Recibes NXL automáticamente on-chain",
    ]} />
  </SlideLayout>
);
