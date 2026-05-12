import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#34D399";
export const NXLFuncionalidades: React.FC = () => (
  <SlideLayout number="08" color={C} title="NXL y Sus Funcionalidades" subtitle="Token · Staking · Treasury">
    <BulletList color={C} items={[
      "🪙 NXL: ERC-20 en BSC · Supply: 100,000,000 tokens",
      "🎟️ Se distribuye automáticamente al comprar tickets",
      "📈 Staking: bloquea NXL → gana WBTC del Treasury",
      "₿ Treasury BTC: 10% de cada compra acumula para la DAO",
      "🗓️ Ventana anual: canjea NXL por USDT del Treasury",
      "🔒 Vesting: equipo bloqueado 2 años — sin dumps",
    ]} />
  </SlideLayout>
);
