import React from "react";
import { SlideLayout, BulletList, NEON } from "../shared";

export const NexaloIntro: React.FC = () => (
  <SlideLayout number="01" color={NEON} title="¿Qué es NEXALO?" subtitle="Introducción al Ecosistema">
    <BulletList color={NEON} items={[
      "🎲 Lotería 100% descentralizada en BSC",
      "🔗 Smart contracts inmutables — sin dueño",
      "🏆 Premio: 50% del pool a un ganador",
      "🪙 Recibe NXL automáticamente al comprar",
      "🎲 Aleatoriedad verificable con Chainlink VRF",
      "⚡ 6 productos: FLASH, ORIGINAL, PREMIUM, ELITE, VIP, BLACKBLOK",
    ]} />
  </SlideLayout>
);
