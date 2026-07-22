# 游戏拖拽功能包

本目录承载游戏内 H5 与 R3F Canvas 拖放的共享状态机及各自适配层。它不依赖第三方拖拽库，适用于“拖动物体到目标区域并按命中结果反馈”的游戏交互。

## 使用方式

`useDragDrop` 负责业务状态：传入 `initialPoint`、`targetPoint`、`targetRadius`、外部 `result` 与 `onResultChange`，获得 `point`、`begin`、`move`、`end`、`cancel`。

- `begin`：进入拖拽；若此前成功，会立即切换为 `idle`，支持从目标重新投放。
- `move`：仅在拖拽进行时更新位置。
- `end`：在目标半径内吸附并通过回调触发 `success`，否则回到起点并触发 `retry`。
- `cancel`：处理 `pointercancel` 与丢失 Pointer Capture，回到起点并通过回调触发 `retry`。

Hook 不处理事件类型、Pointer Capture 或坐标系。H5 和 Canvas 必须各自完成这些渲染层职责。

## H5 适配

H5 使用原生 Pointer Event 与 `setPointerCapture`，通过 `getRotatedStagePointerPoint` 将物理 `clientX/clientY` 转为逻辑舞台比例坐标。

- `0°`：直接映射；
- `90°`：交换轴并翻转逻辑 Y；
- `-90°`：交换轴并翻转逻辑 X。

传入 `bounds` 可限制物体活动范围。旋转舞台必须提供现有的 `data-rotation="0|90|-90"` 约定。

## Canvas 适配

Canvas 继续由 R3F 事件系统命中拖动物体。适配层使用射线与拖拽平面求交得到世界坐标，再调用 Hook 的操作方法；目标吸附与成功/重试状态由 Hook 统一处理。Canvas 仍需监听原生 `lostpointercapture`，以覆盖 R3F 事件之外的捕获丢失。

## 第三方库边界

- H5 出现排序、多容器或键盘无障碍需求时，采用 dnd-kit。
- Canvas 变成多物体、轴锁定或限位的编辑器式拖动时，采用现有依赖 `@react-three/drei` 的 `DragControls`。
- 当前单物体投放场景保留本地实现：目标判定、旋转映射和游戏状态无需额外库适配。
