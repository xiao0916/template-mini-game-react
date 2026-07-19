import type { ReactNode } from "react";
import type { GameSDKOptions } from "game-sdk-builder";

import { getDesignOrientation, type GameDesign } from "../utils/design-stage";
import { withSdkOptions } from "../utils/sdk-options";
import { FixedDesignStage } from "./FixedDesignStage";
import { GameFrame, type GameRenderProps } from "./GameFrame";
import { OrientationStage } from "./OrientationStage";

type FixedDesignGameProps = {
  children: (props: GameRenderProps) => ReactNode;
  design: GameDesign;
  options: GameSDKOptions;
};

export function FixedDesignGame({ children, design, options }: FixedDesignGameProps) {
  return (
    <GameFrame>
      {({ viewport, ...fullscreen }) => viewport.width > 0 && viewport.height > 0 && (
        <OrientationStage target={getDesignOrientation(design)} viewport={viewport}>
          <FixedDesignStage design={design}>
            {(layout) => children(withSdkOptions({ ...fullscreen, pixelRatio: layout.pixelRatio }, options))}
          </FixedDesignStage>
        </OrientationStage>
      )}
    </GameFrame>
  );
}
