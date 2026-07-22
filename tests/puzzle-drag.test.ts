import assert from "node:assert/strict";
import test from "node:test";

const puzzleModule = await import("../src/business-components/drag-drop/usePuzzleDrag.ts").catch(() => null);

const PIECES = [
  { id: "alpha", label: "A", color: "#67e8f9", start: { x: 0.16, y: 0.28 }, target: { x: 0.68, y: 0.32 } },
  { id: "beta", label: "B", color: "#facc15", start: { x: 0.34, y: 0.28 }, target: { x: 0.84, y: 0.32 } },
] as const;

function getPiece(state: { pieces: readonly { id: string; point: { x: number; y: number }; status: string }[] }, id: string) {
  return state.pieces.find((piece) => piece.id === id);
}

test("拼图状态机会初始化所有拼片并保持未归位", () => {
  assert.ok(puzzleModule);

  const state = puzzleModule.createPuzzleDragState(PIECES);

  assert.equal(state.draggingPieceId, null);
  assert.equal(state.placedCount, 0);
  assert.equal(state.isComplete, false);
  assert.deepEqual(getPiece(state, "alpha"), { ...PIECES[0], point: PIECES[0].start, status: "available" });
});

test("命中目标会吸附并锁定拼片，全部归位后完成", () => {
  assert.ok(puzzleModule);

  let state = puzzleModule.createPuzzleDragState(PIECES);
  let transition = puzzleModule.transitionPuzzleDrag(state, { type: "begin", pieceId: "alpha", point: { x: 0.2, y: 0.3 } }, 0.1);
  state = transition.state;
  assert.equal(transition.outcome, "ignored");
  transition = puzzleModule.transitionPuzzleDrag(state, { type: "end", pieceId: "alpha", point: PIECES[0].target }, 0.1);
  state = transition.state;

  assert.equal(transition.outcome, "success");
  assert.equal(state.lastOutcome, "success");
  assert.deepEqual(getPiece(state, "alpha"), { ...PIECES[0], point: PIECES[0].target, status: "placed" });
  assert.equal(state.placedCount, 1);

  transition = puzzleModule.transitionPuzzleDrag(state, { type: "begin", pieceId: "beta", point: PIECES[1].start }, 0.1);
  state = transition.state;
  transition = puzzleModule.transitionPuzzleDrag(state, { type: "end", pieceId: "beta", point: PIECES[1].target }, 0.1);

  assert.equal(transition.outcome, "success");
  assert.equal(transition.state.placedCount, 2);
  assert.equal(transition.state.isComplete, true);
  assert.equal(puzzleModule.transitionPuzzleDrag(transition.state, { type: "begin", pieceId: "alpha", point: PIECES[0].target }, 0.1).outcome, "ignored");
});

test("未命中或取消会把当前拼片放回起点", () => {
  assert.ok(puzzleModule);

  let state = puzzleModule.createPuzzleDragState(PIECES);
  state = puzzleModule.transitionPuzzleDrag(state, { type: "begin", pieceId: "alpha", point: { x: 0.2, y: 0.3 } }, 0.1).state;
  let transition = puzzleModule.transitionPuzzleDrag(state, { type: "end", pieceId: "alpha", point: { x: 0.5, y: 0.8 } }, 0.1);
  assert.equal(transition.outcome, "retry");
  assert.equal(transition.state.lastOutcome, "retry");
  assert.deepEqual(getPiece(transition.state, "alpha"), { ...PIECES[0], point: PIECES[0].start, status: "available" });

  state = puzzleModule.transitionPuzzleDrag(transition.state, { type: "begin", pieceId: "alpha", point: { x: 0.2, y: 0.3 } }, 0.1).state;
  transition = puzzleModule.transitionPuzzleDrag(state, { type: "cancel", pieceId: "alpha" }, 0.1);
  assert.equal(transition.outcome, "retry");
  assert.equal(transition.state.lastOutcome, "retry");
  assert.deepEqual(getPiece(transition.state, "alpha"), { ...PIECES[0], point: PIECES[0].start, status: "available" });
});

test("非当前拖动拼片的操作不会改变状态", () => {
  assert.ok(puzzleModule);

  const state = puzzleModule.createPuzzleDragState(PIECES);
  const transition = puzzleModule.transitionPuzzleDrag(state, { type: "move", pieceId: "unknown", point: { x: 0.5, y: 0.5 } }, 0.1);

  assert.equal(transition.outcome, "ignored");
  assert.deepEqual(transition.state, state);
});
