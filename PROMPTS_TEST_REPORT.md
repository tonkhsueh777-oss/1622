# 手机版提示调整测试报告

测试日期：2026-09-17。本次仅调整提示与演出展示，未部署到 GitHub Pages。

## 本次纯文字提示更新

五张特殊牌复用现有中央框，使用自然文字显示发动者、目标与真实结算。没有新增图片、图解或卡牌弹窗。手机版流程为文字约 1.8 秒 → 原 MP4 → 结算文字 4～7 秒 → 自动关闭并解除输入锁定。普通回合仍约 1 秒。

本次修改：index.html、mobile-prompts.css、src/mobile-prompts.js、src/v34-skill-cinematic-ui.js、tests/mobile-prompts.test.js。规则、AI、牌组、存档、主回合循环和 MP4 未改动。

以下为累计修改文件

- `index.html`：载入提示模块及样式，更新缓存版本。
- `mobile-prompts.css`：手机中央回合浮层、身份圆标及特殊牌结果布局。
- `src/mobile-prompts.js`：按实际玩家显示回合；从真实结算数据生成五张特殊牌提示。
- `src/main.js`：回合切换时显示身份提示；关闭普通操作步骤弹窗；传递大招发动者。
- `src/v34-skill-cinematic-ui.js`：动画结束展示结构化结算结果。
- `tests/mobile-prompts.test.js`：验证五张特殊牌的 AI 对玩家提示及状态不被展示层修改。

## 验证结果

- `node --test tests/*.test.js`：43 项通过，0 失败。
- Chrome 手机视口 390×844：实际点击五张特殊牌，均依次展示发动者/牌名/目标、真实 MP4 播放、真实结算结果。输入锁定与自动关闭后解锁正常，无页面脚本错误。
- 特殊牌包含真实烧毁牌名、双向地点交换与双方圣物名称；胜利检查现有测试通过。
- 测试刻意将玩家顺序调整为乙→甲→我，浮层正确跟随实际顺序。圆标和名称匹配，无普通 AI 步骤弹窗。
- 回合浮层实测宽 273px，占 390px 视口的 70%；可见约 850ms，再用 150ms 淡出。
- 对比修改前副本：rules.js、ai.js、catalog.js、state.js、storage.js 及 MP4 内容完全一致。

## 范围

浏览器自动化使用桌面 Chrome 模拟手机视口，未在实体 iPhone/Android 上测试。
自动化交互脚本与截图保存在工作目录 `evidence/`。可部署文件位于本目录，ZIP 根目录包含 index.html。
