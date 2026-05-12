import React from "react";
import { SlideLayout, BulletList } from "../shared";
const C = "#22D3EE";
export const SerInversor: React.FC = () => (
  <SlideLayout number="07" color={C} title="Sé un Inversor" subtitle="Liquidez · Retornos · Dashboard">
    <BulletList color={C} items={[
      "💼 En 'Mi Cuenta' → sección de Inversiones",
      "1️⃣ Selecciona producto y ronda → pulsa 'Aportar Liquidez'",
      "2️⃣ El contrato usa tu USDT para el pool de instant rewards",
      "📈 Recibes principal + 3% de profit al cerrar la ronda",
      "🔒 Si la ronda no abre, tu capital se reintegra íntegro",
      "⚡ Reclamar inversión: 'Mi Cuenta' → 'Reclamar USDT'",
    ]} />
  </SlideLayout>
);
