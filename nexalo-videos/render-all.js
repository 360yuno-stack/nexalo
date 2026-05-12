#!/usr/bin/env node
/**
 * render-all.js — Renders all 8 NEXALO video compositions to ./out/
 * Run: node render-all.js
 */
const { execSync } = require("child_process");
const path = require("path");

const VIDEOS = [
  "01-intro",
  "02-comprar",
  "03-embajadores",
  "04-metamask",
  "05-sinwallet",
  "06-premios",
  "07-inversor",
  "08-nxl",
];

console.log("🎬 Rendering all NEXALO videos...\n");

for (const id of VIDEOS) {
  const out = path.join("out", `${id}.mp4`);
  console.log(`▸ Rendering ${id} → ${out}`);
  execSync(
    `npx remotion render src/index.tsx ${id} ${out} --codec=h264`,
    { stdio: "inherit" }
  );
  console.log(`✅ ${id} done\n`);
}

console.log("🎉 All 8 videos rendered to ./out/");
console.log("📁 Copy ./out/*.mp4 to ../frontend/videos/ and update the iframes.");
