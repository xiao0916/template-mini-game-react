import { useCallback, useEffect, useRef, useState } from "react";

import type { DragPoint } from "./drag-point";

export type DragDropResult = "idle" | "retry" | "success";

export type UseDragDropOptions = {
  initialPoint: DragPoint;
  onResultChange: (result: DragDropResult) => void;
  result: DragDropResult;
  targetPoint: DragPoint;
  targetRadius: number;
};

/**
 * 管理游戏拖放的通用状态机，不负责事件捕获或坐标换算。
 * 调用方应在各自渲染层中将 H5 Pointer Event 或 R3F 射线结果传入操作方法。
 */
export function useDragDrop({ initialPoint, onResultChange, result, targetPoint, targetRadius }: UseDragDropOptions) {
  const draggingRef = useRef(false);
  const [point, setPoint] = useState(initialPoint);

  useEffect(() => {
    if (draggingRef.current) return;
    setPoint(result === "success" ? targetPoint : initialPoint);
  }, [initialPoint, result, targetPoint]);

  const begin = useCallback((nextPoint: DragPoint) => {
    draggingRef.current = true;
    if (result === "success") onResultChange("idle");
    setPoint(nextPoint);
  }, [onResultChange, result]);

  const move = useCallback((nextPoint: DragPoint) => {
    if (!draggingRef.current) return false;
    setPoint(nextPoint);
    return true;
  }, []);

  const end = useCallback((nextPoint: DragPoint) => {
    if (!draggingRef.current) return false;
    draggingRef.current = false;
    if (Math.hypot(nextPoint.x - targetPoint.x, nextPoint.y - targetPoint.y) <= targetRadius) {
      setPoint(targetPoint);
      onResultChange("success");
      return true;
    }
    setPoint(initialPoint);
    onResultChange("retry");
    return true;
  }, [initialPoint, onResultChange, targetPoint, targetRadius]);

  const cancel = useCallback(() => {
    if (!draggingRef.current) return false;
    draggingRef.current = false;
    setPoint(initialPoint);
    onResultChange("retry");
    return true;
  }, [initialPoint, onResultChange]);

  return { begin, cancel, end, move, point };
}
