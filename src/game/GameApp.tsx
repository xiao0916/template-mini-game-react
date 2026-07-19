import type { GameComponentProps } from "game-sdk-builder";

import { DemoGame } from "../business-components/DemoGame";
import { FixedDesignGame } from "../components/FixedDesignGame";
import { FullViewportGame } from "../components/FullViewportGame";
import { gameConfig } from "./config";

export default function GameApp({ options }: GameComponentProps) {
  if (gameConfig.layout.mode === "fullscreen") {
    return <FullViewportGame options={options} orientation={gameConfig.layout.orientation}>{(props) => <DemoGame {...props} />}</FullViewportGame>;
  }

  return <FixedDesignGame design={gameConfig.design} options={options}>{(props) => <DemoGame {...props} />}</FixedDesignGame>;
}
