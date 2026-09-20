# V34 手机 9:16 测试报告

测试日期：2026-09-13

## 自动化测试

- 命令：`node --test tests/*.test.js`
- 结果：27 tests，27 pass，0 fail，0 skipped。
- 覆盖：V25/V27 手机棋盘布局、V33 手牌换牌布局、V34 五张技能动画、抽牌仪式、统计逻辑和新手辅助。

## 浏览器竖屏检查

静态服务器：`python3 -m http.server 8875 --bind 127.0.0.1 --directory dist-mobile`

| 视口 | 棋盘 | 地点 | 手牌 | 横向滚动 |
|---|---:|---:|---:|---:|
| 390×844 | 1 | 4 | 3 | 无（scrollWidth=390） |
| 393×852 | 1 | 4 | 3 | 无（scrollWidth=393） |
| 430×932 | 1 | 4 | 3 | 无（scrollWidth=430） |

桌面兼容检查：1280×800 视口可见中央棋盘与 3 张手牌，页面主体宽度为 1280px。

## 玩法 smoke test

- 新开局后玩家可见 3 张真实手牌，点击“换1张并结束”进入换牌流程。
- 完成玩家换牌后，AI 玩家一和 AI 玩家二均自动行动，状态回到玩家回合（turn 4）。
- 保存牌局写入 `localStorage` 的 `jiaqing-webgame-v12`；刷新后恢复 3 名玩家、`action` 阶段和 turn 1 状态。
- 直接触发 `jiaqingOrder` 技能时中央层打开，视频源为 `assets/video/jiaqing-order.mp4`，`skill-cinematic-active` 锁定输入；关闭后锁定解除。

## 资源检查

以下五个 MP4 均存在且为非空文件：

- `assets/video/jiaqing-order.mp4`
- `assets/video/wang-order.mp4`
- `assets/video/bully.mp4`
- `assets/video/fire.mp4`
- `assets/video/flower.mp4`
