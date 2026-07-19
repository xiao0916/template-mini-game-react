# AGENTS.md

本文件是全屏 Three.js 游戏模板的维护规则，适用于后续 AI agent 和工程师修改本目录下的代码。

## 中文文件与编码

- 编辑包含中文的文件时必须保护 UTF-8 编码。
- 读取中文文件时，PowerShell 命令必须显式使用 `-Encoding UTF8`。
- 写入中文文件时，优先使用 `apply_patch` 做小范围编辑。
- 如果必须用 PowerShell 重写整文件，使用 `[System.Text.UTF8Encoding]::new($false)` 写入 UTF-8 no BOM。
- 写入后必须重新读取目标文件，确认中文内容没有乱码。

## 文档与注释语言

- 项目文档、维护规则和代码注释默认使用中文。
- 代码标识符、类型名、API 字段名、命令、路径、第三方库名和错误对象保持英文原文。
- JSDoc 描述使用中文，但参数名和字段名必须保持代码中的真实名称。
- 面向外部英文读者的发布材料可以单独新增英文文档，不要在同一段说明里中英混写。

## 注释原则

- 注释解释协议、边界、原因和非显然行为，不重复描述代码字面含义。
- 模板代码面向复用者，公开接口和项目约定必须比普通业务代码写得更明确。
- 导出且非显然、可复用的 `src/utils/*.ts` 工具函数必须使用 JSDoc，说明输入、输出和边界行为。
- 不要为简单 JSX、变量赋值、Tailwind class 或显而易见的控制流添加注释。
- 注释必须跟代码一起维护；实现变化导致注释不准确时必须同步更新或删除。

## Three.js 与样式

- three.js 代码只给复杂边界添加注释；引入手写 renderer、模型加载/归一化或手动释放 geometry/material 时，必须说明原因与 cleanup 责任。
- 组件样式优先使用 Tailwind utility；`src/game/tailwind.css` 仅维护 Tailwind 指令、主题 CSS 变量和全局重置。
- 框架布局组件放在 `src/components/`；场景、HUD、Canvas 组合和其他游戏业务组件必须放在 `src/business-components/`。
- 不解释普通 Tailwind class 的视觉含义，除非 class 组合承载重要的全屏、安全区或交互约束。

## 修改后的验证

- 修改工具函数、模板结构或测试后，运行 `npm test`。
- 修改 React、three.js 组件、Tailwind 配置或全局样式后，运行 `npm run build`。
- 修改 `FullViewportGame`、`FixedDesignGame`、`OrientationStage`、`FixedDesignStage`、安全区映射、设计稿缩放、方向适配或业务接入后，必须运行 `npm test` 和 `npm run build`。
- 修改中文文档后，至少用 `Get-Content -Encoding UTF8` 重新读取确认内容。

## Graphify 产物

- `graphify-out/` 是本地生成的代码知识图谱、缓存和临时分析文件，不得提交到 Git，也不作为模板源码引用。
- 需要图谱时，在项目根目录运行 `/graphify .` 重新生成；长期维护的架构说明应使用人工审核的项目文档。
