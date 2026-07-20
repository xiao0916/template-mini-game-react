# Cyber Loading Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将资源预加载默认界面改为与游戏 HUD 一致、移动端可读的赛博任务同步界面。

**Architecture:** 保持 `GameLoading` 的加载与重试状态逻辑不变，只更新 `DefaultLoading` 的语义文案与 Tailwind 呈现。端到端测试通过资源路由延迟观察默认加载态，避免测试内部实现。

**Tech Stack:** React、TypeScript、Tailwind CSS、Playwright。

---

### Task 1: 覆盖默认加载界面

**Files:**
- Modify: `tests/fullscreen.spec.ts`

**Step 1:** 添加断言，验证加载态显示“资源同步中”与任务进度区域。

**Step 2:** 运行对应 Playwright 用例，确认旧文案导致失败。

### Task 2: 实现任务同步加载界面

**Files:**
- Modify: `src/components/GameLoading.tsx`

**Step 1:** 使用半透明任务卡、状态标签、刻度进度轨和加载计数替换默认加载样式。

**Step 2:** 保留原有 `role="progressbar"`、`aria` 属性、失败原因与重试行为。

**Step 3:** 重跑目标用例确认通过。

### Task 3: 回归验证

**Files:**
- Verify: `tests/fullscreen.spec.ts`

**Step 1:** 运行 `npm test`。

**Step 2:** 运行 `npm run build` 与 `npm run build:sdk`。
