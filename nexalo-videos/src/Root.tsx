import React from "react";
import { Composition } from "remotion";
import { NexaloIntro } from "./videos/01-intro";
import { ComprarNumeros } from "./videos/02-comprar";
import { Embajadores } from "./videos/03-embajadores";
import { ConfigMetaMask } from "./videos/04-metamask";
import { SinWallet } from "./videos/05-sinwallet";
import { ReclamarPremios } from "./videos/06-premios";
import { SerInversor } from "./videos/07-inversor";
import { NXLFuncionalidades } from "./videos/08-nxl";

const FPS = 30;
const W = 1920;
const H = 1080;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="01-intro"        component={NexaloIntro}       width={W} height={H} fps={FPS} durationInFrames={FPS * 90}  />
    <Composition id="02-comprar"      component={ComprarNumeros}    width={W} height={H} fps={FPS} durationInFrames={FPS * 120} />
    <Composition id="03-embajadores"  component={Embajadores}       width={W} height={H} fps={FPS} durationInFrames={FPS * 90}  />
    <Composition id="04-metamask"     component={ConfigMetaMask}    width={W} height={H} fps={FPS} durationInFrames={FPS * 90}  />
    <Composition id="05-sinwallet"    component={SinWallet}         width={W} height={H} fps={FPS} durationInFrames={FPS * 90}  />
    <Composition id="06-premios"      component={ReclamarPremios}   width={W} height={H} fps={FPS} durationInFrames={FPS * 90}  />
    <Composition id="07-inversor"     component={SerInversor}       width={W} height={H} fps={FPS} durationInFrames={FPS * 120} />
    <Composition id="08-nxl"          component={NXLFuncionalidades} width={W} height={H} fps={FPS} durationInFrames={FPS * 90} />
  </>
);
