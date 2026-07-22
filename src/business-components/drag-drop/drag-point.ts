/** 用于 H5 与 Canvas 拖拽状态同步的二维逻辑坐标。 */
export type DragPoint = { x: number; y: number };

export type DragPointBounds = {
  x: readonly [number, number];
  y: readonly [number, number];
};

type StageRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type RotatedStagePointerPointOptions = {
  bounds?: DragPointBounds;
  clientX: number;
  clientY: number;
  rect: StageRect;
  rotation: -90 | 0 | 90;
};

/**
 * 将物理视口中的指针位置换算为旋转游戏舞台内的逻辑比例坐标。
 *
 * `rect` 必须是旋转后的舞台边界；宽高为零时无法完成换算并返回 `null`。
 * `bounds` 用于限制结果，适合避免拖动物体越过舞台可交互区域。
 */
export function getRotatedStagePointerPoint({ bounds, clientX, clientY, rect, rotation }: RotatedStagePointerPointOptions): DragPoint | null {
  if (rect.width === 0 || rect.height === 0) return null;

  const physicalPoint = {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
  const logicalPoint = rotation === 90
    ? { x: physicalPoint.y, y: 1 - physicalPoint.x }
    : rotation === -90
      ? { x: 1 - physicalPoint.y, y: physicalPoint.x }
      : physicalPoint;

  return bounds
    ? {
        x: clampDragValue(logicalPoint.x, bounds.x[0], bounds.x[1]),
        y: clampDragValue(logicalPoint.y, bounds.y[0], bounds.y[1]),
      }
    : logicalPoint;
}

/** 将拖拽轴向数值限制在包含端点的范围内。 */
export function clampDragValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
