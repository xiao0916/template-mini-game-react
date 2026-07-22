import assert from "node:assert/strict";
import test from "node:test";

const dragPointModule = await import("../src/business-components/drag-drop/drag-point.ts").catch(() => null);

test("旋转舞台指针坐标会转换为逻辑坐标", () => {
  assert.ok(dragPointModule);

  const input = {
    clientX: 25,
    clientY: 75,
    rect: { height: 100, left: 0, top: 0, width: 100 },
  };

  assert.deepEqual(dragPointModule.getRotatedStagePointerPoint({ ...input, rotation: 0 }), { x: 0.25, y: 0.75 });
  assert.deepEqual(dragPointModule.getRotatedStagePointerPoint({ ...input, rotation: 90 }), { x: 0.75, y: 0.75 });
  assert.deepEqual(dragPointModule.getRotatedStagePointerPoint({ ...input, rotation: -90 }), { x: 0.25, y: 0.25 });
});

test("旋转舞台指针坐标可限制在逻辑边界内", () => {
  assert.ok(dragPointModule);

  const point = dragPointModule.getRotatedStagePointerPoint({
    bounds: { x: [0.08, 0.92], y: [0.18, 0.82] },
    clientX: 0,
    clientY: 100,
    rect: { height: 100, left: 0, top: 0, width: 100 },
    rotation: 0,
  });

  assert.deepEqual(point, { x: 0.08, y: 0.82 });
});
