import { useCallback, useEffect, useRef, useState } from "react";

import type { DragPoint } from "./drag-point";

export type PuzzlePieceDefinition = {
  id: string;
  label: string;
  color: string;
  start: DragPoint;
  target: DragPoint;
};

export type PuzzlePieceStatus = "available" | "dragging" | "placed";

export type PuzzlePieceState = PuzzlePieceDefinition & {
  point: DragPoint;
  status: PuzzlePieceStatus;
};

export type PuzzleDropOutcome = "success" | "retry" | "ignored";

export type PuzzleDragState = {
  pieces: readonly PuzzlePieceState[];
  draggingPieceId: string | null;
  lastOutcome: PuzzleDropOutcome;
  placedCount: number;
  isComplete: boolean;
};

export type PuzzleDragAction =
  | { type: "begin"; pieceId: string; point: DragPoint }
  | { type: "move"; pieceId: string; point: DragPoint }
  | { type: "end"; pieceId: string; point: DragPoint }
  | { type: "cancel"; pieceId: string }
  | { type: "reset" };

export type UsePuzzleDragOptions = {
  pieces: readonly PuzzlePieceDefinition[];
  targetRadius: number;
};

export type PuzzleDragController = PuzzleDragState & {
  begin: (pieceId: string, point: DragPoint) => boolean;
  move: (pieceId: string, point: DragPoint) => boolean;
  end: (pieceId: string, point: DragPoint) => PuzzleDropOutcome;
  cancel: (pieceId: string) => boolean;
  reset: () => void;
};

function copyPoint(point: DragPoint): DragPoint {
  return { x: point.x, y: point.y };
}

function getPlacedCount(pieces: readonly PuzzlePieceState[]) {
  return pieces.filter((piece) => piece.status === "placed").length;
}

function withPiece(state: PuzzleDragState, pieceId: string, update: (piece: PuzzlePieceState) => PuzzlePieceState): PuzzleDragState {
  const pieces = state.pieces.map((piece) => (piece.id === pieceId ? update(piece) : piece));
  const placedCount = getPlacedCount(pieces);
  return {
    pieces,
    draggingPieceId: state.draggingPieceId,
    lastOutcome: state.lastOutcome,
    placedCount,
    isComplete: placedCount === pieces.length,
  };
}

/** 创建拼图状态的初始快照，所有拼片从各自起点开始。 */
export function createPuzzleDragState(pieces: readonly PuzzlePieceDefinition[]): PuzzleDragState {
  const states = pieces.map((piece) => ({ ...piece, point: copyPoint(piece.start), status: "available" as const }));
  return {
    pieces: states,
    draggingPieceId: null,
    lastOutcome: "ignored",
    placedCount: 0,
    isComplete: states.length === 0,
  };
}

/**
 * 执行一次拼图拖拽状态转换。渲染层只需把 Pointer Event 或 Canvas 射线坐标转换成归一化点。
 */
export function transitionPuzzleDrag(state: PuzzleDragState, action: PuzzleDragAction, targetRadius: number): { state: PuzzleDragState; outcome: PuzzleDropOutcome } {
  if (action.type === "reset") return { state: createPuzzleDragState(state.pieces), outcome: "retry" };

  const piece = state.pieces.find((candidate) => candidate.id === action.pieceId);
  if (!piece) return { state, outcome: "ignored" };

  if (action.type === "begin") {
    if (state.draggingPieceId !== null || piece.status === "placed") return { state, outcome: "ignored" };
    return {
      state: withPiece({ ...state, draggingPieceId: piece.id }, piece.id, (current) => ({ ...current, point: copyPoint(action.point), status: "dragging" })),
      outcome: "ignored",
    };
  }

  if (state.draggingPieceId !== piece.id || piece.status !== "dragging") return { state, outcome: "ignored" };

  if (action.type === "move") {
    return {
      state: withPiece(state, piece.id, (current) => ({ ...current, point: copyPoint(action.point) })),
      outcome: "ignored",
    };
  }

  const isHit = action.type === "end" && Math.hypot(action.point.x - piece.target.x, action.point.y - piece.target.y) <= targetRadius;
  const nextState = withPiece({ ...state, draggingPieceId: null }, piece.id, (current) => ({
    ...current,
    point: isHit ? copyPoint(current.target) : copyPoint(current.start),
    status: isHit ? "placed" : "available",
  }));

  const outcome = isHit ? "success" : "retry";
  return { state: { ...nextState, lastOutcome: outcome }, outcome };
}

/** 管理拼图状态并将归一化状态转换暴露给 H5 与 R3F 适配层。 */
export function usePuzzleDrag({ pieces, targetRadius }: UsePuzzleDragOptions): PuzzleDragController {
  const stateRef = useRef<PuzzleDragState | null>(null);
  if (!stateRef.current) stateRef.current = createPuzzleDragState(pieces);
  const [state, setState] = useState(stateRef.current);

  useEffect(() => {
    const nextState = createPuzzleDragState(pieces);
    stateRef.current = nextState;
    setState(nextState);
  }, [pieces]);

  const dispatch = useCallback((action: PuzzleDragAction) => {
    const current = stateRef.current;
    if (!current) return "ignored" as PuzzleDropOutcome;
    const transition = transitionPuzzleDrag(current, action, targetRadius);
    if (transition.state !== current) {
      stateRef.current = transition.state;
      setState(transition.state);
    }
    return transition.outcome;
  }, [targetRadius]);

  const begin = useCallback((pieceId: string, point: DragPoint) => {
    const current = stateRef.current;
    const piece = current?.pieces.find((candidate) => candidate.id === pieceId);
    const canBegin = Boolean(piece && current?.draggingPieceId === null && piece.status === "available");
    dispatch({ type: "begin", pieceId, point });
    return canBegin;
  }, [dispatch]);

  const move = useCallback((pieceId: string, point: DragPoint) => {
    const current = stateRef.current;
    const canMove = current?.draggingPieceId === pieceId && current.pieces.some((piece) => piece.id === pieceId && piece.status === "dragging");
    dispatch({ type: "move", pieceId, point });
    return Boolean(canMove);
  }, [dispatch]);

  const cancel = useCallback((pieceId: string) => {
    const current = stateRef.current;
    const canCancel = current?.draggingPieceId === pieceId;
    dispatch({ type: "cancel", pieceId });
    return Boolean(canCancel);
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, [dispatch]);

  return {
    ...state,
    begin,
    move,
    end: (pieceId, point) => dispatch({ type: "end", pieceId, point }),
    cancel,
    reset,
  };
}
