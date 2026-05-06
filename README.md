# 小洛克电竞 Web App MVP

这是“小洛克电竞”网页版 H5 / Web App MVP，使用 Next.js + React + Tailwind CSS。

当前阶段以顾客端为主，并新增本地 mock 接单员端 MVP：

- `/login`
- `/customer/home`
- `/customer/categories`
- `/customer/workers`
- `/customer/worker/[id]`
- `/customer/product/[id]`
- `/customer/order-confirm/[productId]`
- `/customer/recharge`
- `/customer/orders`
- `/customer/order/[id]`
- `/customer/chat/[orderId]`
- `/customer/profile`
- `/customer/ranking`

接单员端测试入口：

- `/worker/login`
- `/worker/home`
- `/worker/orders`
- `/worker/order/[id]`
- `/worker/chat/[orderId]`
- `/worker/wallet`
- `/worker/profile`

本地开发阶段使用 `localStorage` 模拟数据，已预留 API 目录和 MongoDB 集合边界。

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000/login
```

## 数据结构

- `users`
- `products`
- `workers`
- `announcements`
- `orders`
- `wallet_accounts`
- `wallet_ledger`
- `recharge_orders`
- `chat_sessions`
- `chat_messages`

## 订单聊天 Mock 说明

当前聊天为本地 mock 聊天：`chat_sessions` 和 `chat_messages` 会写入浏览器 `localStorage`，图片消息使用 FileReader 转成 base64 临时保存。真实版本需要把聊天数据存入 MongoDB，图片上传到腾讯云 COS，实时消息改用 WebSocket / Socket.IO 或其他实时服务。顾客端和后续接单员端应共用同一套聊天 session，管理员端处理纠纷时可查看该订单聊天记录。

## 接单员端 Mock 说明

当前接单员端复用同一份 `orders`、`workers`、`wallet_accounts`、`wallet_ledger`、`chat_sessions` 和 `chat_messages` 数据。接单员可以 mock 登录、查看可接订单、接单、提交完成、查看订单沟通、发送文字/图片消息，并查看洛克贝钱包与收益流水。当前不包含真实接单员注册、提现审批、管理员派单、真实数据库或实时通信。

## 部署

部署方案、Vercel 测试部署、香港 Ubuntu 服务器部署、Nginx/HTTPS、MongoDB Atlas 切换说明见：

[DEPLOYMENT.md](/Users/chris/Documents/New project 2/DEPLOYMENT.md)

## Vercel 测试部署

当前版本适合先部署到 Vercel 做 H5 / Web App 测试。注意：本阶段仍使用浏览器 `localStorage` mock 数据，不接真实微信支付、支付宝支付和 MongoDB。

### 部署前准备

1. 一个 GitHub / GitLab / Bitbucket 仓库。
2. 一个 Vercel 账号。
3. 确认本地构建通过：

```bash
npm install
npm run build
```

4. 确认 `.env.example` 已存在。Vercel 测试阶段可以只配置这些环境变量：

```env
NEXT_PUBLIC_APP_NAME=小洛克电竞
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
DATA_SOURCE=mock
WECHAT_PAY_ENABLED=false
ALIPAY_ENABLED=false
LOCKE_COIN_PAY_ENABLED=true
```

### Vercel 控制台部署

1. 把项目推送到远程仓库。
2. 打开 Vercel Dashboard。
3. 点击 `Add New...` → `Project`。
4. 选择项目仓库并导入。
5. Framework Preset 选择 `Next.js`。
6. Install Command 使用：

```bash
npm install
```

7. Build Command 使用：

```bash
npm run build
```

8. Output Directory 留空，让 Vercel 自动识别 Next.js。
9. 在 Environment Variables 中添加上面的测试环境变量。
10. 点击 Deploy。

### 部署后重点测试页面

部署完成后，优先测试：

- `/login`
- `/customer/home`
- `/customer/categories`
- `/customer/product/fun-play`
- `/customer/workers`
- `/customer/worker/worker-silver-fish`
- `/customer/ranking`
- `/customer/profile`
- `/customer/recharge`
- `/customer/order-confirm/fun-play`
- `/customer/orders`
- `/customer/tip/worker-silver-fish`

建议测试流程：

1. 先浏览首页、分类、商品详情、接单员列表和排行榜。
2. 点击“微信一键登录”，确认 mock 登录正常。
3. 进入充值页，模拟充值洛克贝。
4. 进入商品确认下单页，使用洛克贝支付创建服务订单。
5. 在订单详情页使用开发测试按钮模拟接单和完成，再确认结单。
6. 进入接单员详情页，使用洛克贝打赏，确认生成打赏订单。

### 当前 Vercel 配置检查

- `package.json`：已包含 `npm run build` 和 `npm start`，并固定 `next/react/react-dom` 版本。
- `next.config.ts`：仅保留稳定生产配置，没有 `experimental` 或 `output` 配置。
- `vercel.json`：保留即可，用于明确 Next.js、安装命令和构建命令。
- `.env.example`：已包含测试部署和后续真实服务需要的占位变量。
