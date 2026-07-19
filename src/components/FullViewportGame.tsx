import type { ReactNode } from "react";
import type { GameSDKOptions } from "game-sdk-builder";

import { clampPixelRatio } from "../utils/render";
import type { GameOrientation } from "../utils/orientation";
import { withSdkOptions } from "../utils/sdk-options";
import { GameFrame, type GameRenderProps } from "./GameFrame";
import { OrientationStage } from "./OrientationStage";

type FullViewportGameProps = {
  children: (props: GameRenderProps) => ReactNode;
  options: GameSDKOptions;
  orientation?: GameOrientation;
};

export function FullViewportGame({ children, options, orientation = "any" }: FullViewportGameProps) {
  return (
    <GameFrame>
      {({ viewport, ...fullscreen }) => viewport.width > 0 && viewport.height > 0 && (
        <OrientationStage target={orientation} viewport={viewport}>
          {children(withSdkOptions({ ...fullscreen, pixelRatio: clampPixelRatio(window.devicePixelRatio) }, options))}
        </OrientationStage>
      )}
    </GameFrame>
  );
}
