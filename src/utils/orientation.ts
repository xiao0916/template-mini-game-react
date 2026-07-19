export type GameOrientation = "any" | "portrait" | "landscape";
export type RotationStrategy = "auto" | "clockwise" | "counterclockwise";

type SafeAreaEdges = {
  top: "top" | "right" | "bottom" | "left";
  right: "top" | "right" | "bottom" | "left";
  bottom: "top" | "right" | "bottom" | "left";
  left: "top" | "right" | "bottom" | "left";
};

export type OrientationStageLayout = {
  shouldRotate: boolean;
  width: "100vw" | "100dvh";
  height: "100dvh" | "100vw";
  rotation: -90 | 0 | 90;
  safeArea: SafeAreaEdges;
};

type OrientationStageLayoutOptions = {
  width: number;
  height: number;
  target: GameOrientation;
  isTouchDevice: boolean;
  screenAngle?: number;
  rotationStrategy?: RotationStrategy;
};

const directSafeArea: SafeAreaEdges = { bottom: "bottom", left: "left", right: "right", top: "top" };
const clockwiseSafeArea: SafeAreaEdges = { bottom: "left", left: "top", right: "bottom", top: "right" };
const counterclockwiseSafeArea: SafeAreaEdges = { bottom: "right", left: "bottom", right: "top", top: "left" };

/**
 * 根据真实视口和目标方向，计算游戏逻辑舞台的旋转、尺寸与安全区映射。
 * 仅在触控设备方向不匹配时旋转；未知屏幕角度默认顺时针，保证结果稳定。
 */
export function getOrientationStageLayout({
  height,
  isTouchDevice,
  rotationStrategy = "auto",
  screenAngle,
  target,
  width,
}: OrientationStageLayoutOptions): OrientationStageLayout {
  const viewportOrientation = width > height ? "landscape" : "portrait";
  const shouldRotate = isTouchDevice && target !== "any" && viewportOrientation !== target;

  if (!shouldRotate) {
    return { height: "100dvh", rotation: 0, safeArea: directSafeArea, shouldRotate: false, width: "100vw" };
  }

  const rotation = getRotation(rotationStrategy, screenAngle);
  return {
    height: "100vw",
    rotation,
    safeArea: rotation === 90 ? clockwiseSafeArea : counterclockwiseSafeArea,
    shouldRotate: true,
    width: "100dvh",
  };
}

function getRotation(strategy: RotationStrategy, screenAngle?: number): -90 | 90 {
  if (strategy === "clockwise") return 90;
  if (strategy === "counterclockwise") return -90;
  return screenAngle === 90 ? -90 : 90;
}
