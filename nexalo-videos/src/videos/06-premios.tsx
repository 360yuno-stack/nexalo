import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#FB923C";
export const ReclamarPremios: React.FC = () => (
  <SlideLayout number="06" color={C} title="Reclama Tus Premios" subtitle="USDT · NXL · Dashboard">
    <BulletList color={C} items={[
      "🏆 Tras el sorteo, el ganador queda on-chain",
      "💰 Ve a 'Mi Cuenta' → tu saldo USDT aparece disponible",
      "1️⃣ Pulsa '💰 Reclamar USDT' — transferencia directa a tu wallet",
      "🪙 Si acumulaste NXL pendiente → pulsa '🪙 Reclamar NXL'",
      "📊 Referidos y comisiones también disponibles en 'Mi Cuenta'",
      "⚡ Sin intermediarios — el contrato paga directamente",
    ]} />
  </SlideLayout>
);
