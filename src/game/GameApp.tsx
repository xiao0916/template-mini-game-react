import type { GameComponentProps } from "game-sdk-builder";

import { DemoGame } from "../business-components/DemoGame";
import { FixedDesignGame } from "../components/FixedDesignGame";
import { FullViewportGame } from "../components/FullViewportGame";
import { GameLoading } from "../components/GameLoading";
import { assertGameLayoutCssCompatibility, gameConfig } from "./config";
import { gameCssConfig } from "./css-config";

export default function GameApp({ options }: GameComponentProps) {
  assertGameLayoutCssCompatibility(gameConfig.layout, gameCssConfig.unit);

  if (gameConfig.layout.mode === "fullscreen") {
    return <FullViewportGame options={options} orientation={gameConfig.layout.orientation}>{(props) => <GameLoading resourceBaseUrl={props.options.resourceBaseUrl}><DemoGame {...props} /></GameLoading>}</FullViewportGame>;
  }

  return <FixedDesignGame design={gameConfig.design} options={options}>{(props) => <GameLoading resourceBaseUrl={props.options.resourceBaseUrl}><DemoGame {...props} /></GameLoading>}</FixedDesignGame>;
}
