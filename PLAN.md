# SimpleWorkoutRecorder 优化规划

> 制定日期：2026-05-02
> 适用分支：基于 `main` (`8dad251`)

## 1. 背景

当前应用是一个 React + Vite + Tailwind 的本地优先 PWA 训练记录器，已具备计划管理、训练记录、历史日历、主题切换等功能。本轮迭代目标是**完善现有体验**，不引入新业务功能。

## 2. 本轮范围

### IN（这轮做）

- **A.** 训练会话（active workout）状态全局化，离开训练页不中断
- **B.** 底部悬浮导航在所有主视图统一显示
- **C.** 悬浮休息计时器（跨页面持续显示、可拖动、可最小化）
- **D.** 顺手清理：移除死代码、修复发现的小 bug（不强制）

### OUT（明确不做）

- AI Coach 功能开发（保留 `AiManager.jsx` 现有占位）
- 新业务功能（训练量统计、PR 追踪、体重记录等，等本轮稳定后再开下一轮）
- TypeScript 迁移
- 测试体系搭建
- 设计系统重构（双主题 cyber/rhodes 维持现状）

## 3. 关键架构观察（影响方案）

| 观察 | 文件位置 | 影响 |
|---|---|---|
| 训练会话状态完全在 `SessionDashboard` 组件内 (`useState`)，离开 `WORKOUT_DASHBOARD` 视图即销毁 | `src/modules/tracker/SessionDashboard.jsx:14-22, 193` | 这是会话中断的根因，也是 nav 不能统一显示的原因 |
| 已有一个标注 "Global Floating Rest Timer" 的代码块，但实际写在 `SessionDashboard` 的 JSX 里，并不全局 | `src/modules/tracker/SessionDashboard.jsx:386-406` | 命名误导，需要真正提到 App 层 |
| `WorkoutSession.jsx` 不被任何地方引用（App.jsx 用的是 `SessionDashboard`） | `src/modules/tracker/WorkoutSession.jsx` | 死代码，可以删 |
| "FINISH WORKOUT" 按钮是 `fixed bottom-0`，会和将要加的底部 nav 打架 | `src/modules/tracker/SessionDashboard.jsx:368` | Chunk B 必须处理这个布局冲突 |
| `RestTimer` 用 `endTimeRef` 维持倒数，但每次 mount 都会 reset (`useEffect [initialSeconds]`) | `src/modules/tracker/RestTimer.jsx:10-14` | 一旦容器重渲染卸载/挂载，计时归零 |
| `showNav` 仅 4 个视图为 true | `src/App.jsx:265` | Chunk B 直接改这一行 + 处理对应页面布局 |
| 数据已有 V1→V2 迁移痕迹（logs 从对象到数组） | `src/App.jsx:177-204`, `HistoryManager.jsx:64-77` | 任何动数据 schema 的改动都要兼容这两种格式 |

---

## 4. 任务分块

### Chunk A — 训练会话状态全局化（架构基础）

**目标：** 训练会话从"组件本地状态"提升为"应用级状态"。用户可以离开训练页面去看历史/计划，回来时进度完整保留；浏览器刷新/关标签页后再打开仍可恢复（带"丢弃当前训练"出口）。

**技术方案：**

- 新建 `src/modules/tracker/SessionContext.jsx`，提供 `WorkoutSessionProvider` 和 `useWorkoutSession()` hook
- 状态形状（从 `SessionDashboard` 抽出）：
  ```js
  {
    isActive: boolean,
    plan: Plan | null,
    dayIndex: number | null,
    sessionExercises: Exercise[],   // 含 ad-hoc
    sessionLogs: { [exerciseId]: SetData[] },
    expandedExerciseId: string | null,
    startTime: number,
    restState: { isActive, endTime, target, totalDuration }
  }
  ```
- 持久化：写入 `localStorage['active_session']`，每次状态变更去抖（debounce 300ms）后落盘。新增 `discardSession()` 方法清除。
- App 启动时检查 `active_session`，若存在则可恢复；如果跨天则提示用户是否继续。
- `SessionDashboard` 改为消费 Context，自身只剩 UI；进入页面时不再 `new` 一个会话，而是读已有会话或调用 `startSession(plan, dayIndex)`。

**涉及文件：**

- 新建：`src/modules/tracker/SessionContext.jsx`
- 大改：`src/modules/tracker/SessionDashboard.jsx`
- 改：`src/App.jsx`（包裹 Provider；`handleStartWorkout` 调 `startSession`；`finishWorkout` 调 `endSession`）
- 改：`src/main.jsx`（如果选择在更外层 Provider）
- 不动：`src/modules/tracker/ExerciseLogger.jsx`（继续接 props）
- 顺手删：`src/modules/tracker/WorkoutSession.jsx`（死代码）

**详细步骤：**

1. 抽出 `SessionContext`，先把 `SessionDashboard` 的所有 useState 原样搬进去，加 reducer 或 setter。
2. `SessionDashboard` 改为从 Context 读，确认行为不变（功能 parity）。
3. 加 localStorage 持久化层 + debounce。
4. App.jsx 加恢复逻辑：启动时 if (`active_session` && !跨天) → 显示"继续训练"提示。
5. 加"丢弃训练"按钮（在训练页 header 或 home 的恢复 pill 上）。
6. 删除 WorkoutSession.jsx，确认 grep 无引用。

**验收标准：**

- [x] 训练中切到 History → 切回 → 当前组、已记录 set、weight 输入、展开的 exercise、计时器都还在
- [x] 训练中刷新页面 → 看到"继续训练"提示，点击后状态完整恢复
- [x] 点"FINISH WORKOUT" → 会话状态清空，`active_session` 从 localStorage 移除
- [x] 点"丢弃训练" → 同上，但不写入 history
- [x] V1/V2 历史数据兼容性回归（用一个老备份导入测一次）

**推荐工具：Claude Code**
理由：跨 4-5 个文件的状态搬迁，需要先完整读懂 `SessionDashboard` 现有 state 流再小心移动；Claude 的 read-then-edit 风格最适合。

**预计工作量：** 半天到一天

---

### Chunk B — 底部导航统一与布局协调

**目标：** `PLAN_DETAIL` 和 `WORKOUT_DASHBOARD` 也显示底部 nav；nav 不再"切换视图就丢失训练"。

**前置依赖：** Chunk A 完成（否则切走真的会丢数据）。

**技术方案：**

- 修改 `src/App.jsx:265` 的 `showNav` 规则：
  ```js
  // before
  const showNav = ['HOME', 'PLANS_LIST', 'HISTORY', 'AI_COACH'].includes(view) && !isKeyboardOpen;
  // after
  const showNav = view !== '__no_nav__' && !isKeyboardOpen;
  // 或显式列举全部 5 个视图
  ```
- 处理 `SessionDashboard.jsx:368` 的 "FINISH WORKOUT" 按钮：
  - 方案 1（推荐）：把 Finish 按钮上移到页面 header 右上角（小尺寸 + 完成态高亮）
  - 方案 2：保留底部，但加 `pb-24` 给 nav 让位，且 nav 的 z-index 高于 Finish
- 选定方案 1 时，原来的 `pb-32` 滚动 padding 也要相应调小
- nav 在训练中的视觉状态：底部 nav 多一个"训练中"指示（可在 home/files/logs 旁加一个红点 badge）

**涉及文件：**

- `src/App.jsx`
- `src/modules/tracker/SessionDashboard.jsx`（Finish 按钮位置）
- `src/modules/plans/PlanDetail.jsx`（底部 padding 留出 nav 空间）

**验收标准：**

- [x] 5 个主视图都能看到底部 nav
- [x] 训练中点 nav 切换 → 训练状态保留（Chunk A 保证）
- [x] FINISH WORKOUT 按钮不被 nav 遮挡，且不会和 nav 在一行重叠
- [x] 键盘弹起时 nav 仍正常隐藏（保留现有 `isKeyboardOpen` 逻辑）
- [x] 训练中其他页面有视觉提示（badge 或 pill）能让用户回到训练

**推荐工具：Codex / GPT**
理由：范围明确、文件少、规则清楚，适合一次性产出。Chunk A 完成后这里基本是"调几个 className"。

**预计工作量：** 1-2 小时

---

### Chunk C — 悬浮休息计时器（跨页面持续）

**目标：** 休息计时器变成真正的"全局悬浮组件"——开始倒数后跨任何视图都持续显示、倒数、可手动调整 ±10s/+30s、可暂停/取消、可拖动到屏幕任意位置。

**前置依赖：** Chunk A 完成（计时器状态进入 SessionContext，与训练共生命周期）。

**技术方案（两阶段）：**

#### C-1：设计探索阶段

需要回答的设计问题（不在代码里硬猜）：
- 悬浮态尺寸（pill / 圆球 / 卡片）
- 默认位置（顶部、底部、跟手指头落点）
- 拖动手感（边缘吸附？磁吸到 nav？）
- 最小化态（只剩 mm:ss）vs 展开态（含 ±10s/+30s/取消按钮）的切换交互
- 倒数结束的反馈（震动？声音？仅视觉？）
- 与底部 nav、键盘、Finish 按钮的避让规则

**产出：** 一个可交互原型 + 一份 Spec 文档（约 1 页），描述上述决策。

**推荐工具：**
- 选项 A：**Antigravity (Gemini)** — 它有视觉反馈循环，适合 UI 迭代
- 选项 B：**Claude.ai web 的 artifacts** — 用 React + Tailwind 写一个独立可拖动 demo，快速试手感

我倾向 A，因为本地视觉反馈更快。

#### C-2：实现阶段

- 新建 `src/modules/tracker/FloatingRestTimer.jsx`（替代现有 `RestTimer.jsx` 的"全局浮动"角色）
- 复用 `RestTimer.jsx` 内核（计时逻辑），重组合 UI
- 状态来自 `SessionContext.restState`
- 在 App 层渲染（`renderContent` 之外，与 nav 同级），由 `restState.isActive` 控制显隐
- 拖动：原生 pointer events，记位置到 `localStorage['rest_timer_pos']`
- 修复现有 RestTimer.jsx:10-14 的 remount 重置问题（解决方法：endTime 由 Context 管理，组件只读不写）

**涉及文件：**

- 新建：`src/modules/tracker/FloatingRestTimer.jsx`
- 重构：`src/modules/tracker/RestTimer.jsx`（瘦身为纯展示组件 / 或合并）
- 删除：`SessionDashboard.jsx:386-406` 的伪 Global Timer 块
- 改：`src/App.jsx`（顶层渲染 FloatingRestTimer）

**验收标准：**

- [x] 训练中点"开始休息" → 计时器悬浮出现
- [x] 切换到 History / Plans / Home → 计时器仍在屏幕上，时间继续走
- [x] 拖动计时器 → 释放后停在新位置，刷新后位置记住
- [x] 倒数到 0 → 进入 OVERTIME 显示（保留现有红色 + `+m:ss` 行为）
- [x] 点取消 → 计时器消失，restState 清零
- [x] 计时器不遮挡键盘弹起后的输入区域（自动避让或允许移动）

**推荐工具：**
- C-1 设计：**Antigravity**
- C-2 实现：**Claude Code**（涉及现有 RestTimer 的拆分和与 Context 的对接，需要小心）

**预计工作量：** 设计 0.5 天 + 实现 1 天

---

### Chunk D — 代码清理（可选，顺手做）

**目标：** 移除死代码、修小问题，让仓库更干净。

**任务清单：**

| 项 | 文件 | 动作 |
|---|---|---|
| 死代码 | `src/modules/tracker/WorkoutSession.jsx` | 直接删（Chunk A 做时确认无引用） |
| 重复 setProperty | `src/App.jsx:181-182` | `--color-text-muted` 被 set 了两次 |
| 未使用 `_BACKUP/` | 仓库根 | 看是否还需要，否则移到独立分支 |
| 重复 useEffect | `src/App.jsx:113-120` 和 `:189-197` | 两段 quote 加载逻辑可合并 |
| `index.css` Tailwind 自定义 | 视情况 | 不在范围内，跳过 |

**推荐工具：** 任意。Codex 或 Claude Code 都可以一次性扫一遍。

**预计工作量：** 30 分钟

---

## 5. 执行顺序与依赖图

```
                    ┌─────────────────────────┐
                    │  Chunk A (Claude Code)  │
                    │  会话状态全局化           │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
   ┌─────────────────────┐         ┌──────────────────────────┐
   │  Chunk B (Codex)    │         │  Chunk C-1 (Antigravity) │
   │  底部 nav 统一       │         │  悬浮计时器 设计探索      │
   └─────────────────────┘         └──────────┬───────────────┘
                                              │
                                              ▼
                                  ┌──────────────────────────┐
                                  │  Chunk C-2 (Claude Code) │
                                  │  悬浮计时器 实现          │
                                  └──────────────────────────┘

   Chunk D 可在任意时间穿插，不阻塞主线
```

**关键节点：**

- 第 1 阶段：Chunk A 单独跑，**不并行**（其他 chunk 都依赖它）
- 第 2 阶段：Chunk A merge 后，Chunk B 和 Chunk C-1 并行
- 第 3 阶段：Chunk B merge 后，Chunk C-2 跟上，最后整体回归

## 6. 本地协作工作流

### 分支策略

```bash
# Chunk A
git checkout -b feat/session-context-claude
# 完成 → push → PR → squash merge → 删除分支
git checkout main && git pull

# Chunk B (依赖 A)
git checkout -b feat/global-nav-codex

# Chunk C-1 (依赖 A，与 B 并行)
git checkout -b feat/floating-timer-design-gemini

# Chunk C-2 (依赖 C-1 设计稿)
git checkout -b feat/floating-timer-impl-claude

# Chunk D (任意时间)
git checkout -b chore/cleanup
```

### 规则

1. **同一时间只让一个工具在 working tree 里写代码** — 切换工具前先 commit + push 当前分支。
2. **每个分支只动自己 chunk 列出的文件**，避免合并冲突。Chunk B 和 Chunk C 都要改 `App.jsx`，所以二者要串行 merge（B 先）。
3. **commit message 风格延续仓库现有约定**：`feat(scope):` / `fix(scope):` / `chore:`（参考 `git log`）。
4. **每块完成后跑一遍验收清单**，截图或录屏放进 PR 描述。
5. **不要在分支上跑 `npm install`** 改 `package-lock.json` 除非真的加依赖（本规划不需要新依赖）。

### 本地启动

```bash
cd ~/ToyProject/SimpleWorkoutRecorder
npm install            # 首次
npm run dev            # http://localhost:5173
npm run lint           # 提交前过一遍
npm run build          # 偶尔验证 PWA build 没坏
```

## 7. 整体回归清单（每块合并后必跑）

- [ ] 全新加载（清空 localStorage） → 创建一个 Plan → 进入训练 → 记一组 → 完成 → history 显示
- [ ] 训练中切 History → 切 Plans → 切回训练，所有状态保留
- [ ] 训练中开始休息 → 切到 Home，计时器仍可见
- [ ] 训练中刷新页面 → 提示恢复，点击恢复 → 状态完整
- [ ] 训练完点 Finish → history 多一条记录，会话清空
- [ ] 双主题 (cyber / rhodes) 切换 nav 显示正常
- [ ] 移动设备键盘弹起 → nav 隐藏；收起 → nav 恢复
- [ ] 导出 JSON → 清空 localStorage → 导入 JSON → 数据完整恢复
- [ ] PWA 安装后离线打开 → 主要功能可用

---

## 8. 开放决策（动手前需要拍板）

1. **持久化策略**：`localStorage`（关闭浏览器仍在）vs `sessionStorage`（关闭即清）— 倾向 localStorage + 跨天提示。
2. **状态管理**：React Context + useReducer（无新依赖）vs Zustand（更轻便但要装包）— 倾向 Context（数据量小、单消费方）。
3. **悬浮计时器拖动范围**：是否磁吸到屏幕边缘？默认位置在哪？— 留给 Chunk C-1 设计阶段定。
4. **训练中"训练进行中"提示**：徽章 / 顶部条幅 / nav 高亮？— 留给 Chunk B 设计。

这几个决策不影响开始 Chunk A 的搭架子（Context 改 Zustand 后期可以平滑迁移）。
