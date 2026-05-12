import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#A855F7";
export const Embajadores: React.FC = () => (
  <SlideLayout number="03" color={C} title="Sistema de Embajadores" subtitle="Gana Comisiones">
    <BulletList color={C} items={[
      "🤝 Comparte tu link único de referido",
      "💰 Nivel 1: 5% USDT de cada compra directa",
      "🌟 Nivel 2: 3% de los referidos de tus referidos",
      "💎 Nivel 3: 2% del tercer nivel de tu red",
      "📊 Sin límite de referidos — escala sin techo",
      "⚡ Pagos automáticos en cada transacción on-chain",
    ]} />
  </SlideLayout>
);
