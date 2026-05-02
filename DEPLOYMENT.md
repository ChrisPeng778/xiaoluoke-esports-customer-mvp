# 小洛克电竞部署方案

当前项目是 Next.js + React + Tailwind CSS 的 H5 / Web App。现阶段仍使用 mock 数据和 localStorage，不接真实微信支付、支付宝支付，也不改成微信小程序。

## 当前部署结论

- `package.json` 已有 `npm run build` 和 `npm start`，适合 Vercel 与 Node.js 服务器部署。
- `next.config.ts` 已开启 `reactStrictMode`，关闭 `X-Powered-By`，并预留 `DEPLOYMENT_VERSION`。
- `.env.example` 已预留生产环境、MongoDB、微信公众号网页授权、支付开关。
- Vercel 测试部署优先；后续可迁移到香港 VPS / Lighthouse。

## Vercel 测试部署

推荐先用 GitHub + Vercel：

1. 把项目推到 GitHub 仓库。
2. 登录 Vercel，Import Project。
3. Framework Preset 选择 Next.js，通常会自动识别。
4. Build Command 使用：

```bash
npm run build
```

5. Install Command 使用：

```bash
npm install
```

6. 在 Vercel Project Settings → Environment Variables 添加 `.env.example` 里的生产变量。
7. 点击 Deploy。
8. 部署完成后访问 Vercel 给出的域名。

当前 MVP 使用浏览器 localStorage，Vercel 上可以浏览和测试 mock 登录、mock 充值、洛克贝支付下单与打赏，但数据只保存在当前浏览器里。

## 香港 Ubuntu 服务器部署

以下以 Ubuntu 22.04 / 24.04 为例，域名示例使用 `example.com`，项目目录示例使用 `/var/www/xiaoluoke-web`。

### 1. 登录服务器

```bash
ssh root@your_server_ip
```

### 2. 安装 Node.js 和 npm

推荐 Node.js 22 LTS：

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. 安装 PM2

```bash
sudo npm install -g pm2
pm2 -v
```

### 4. 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. 上传或拉取项目

方式一：Git 拉取：

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone your_repo_url xiaoluoke-web
cd /var/www/xiaoluoke-web
```

方式二：用 `scp` / SFTP 上传项目到 `/var/www/xiaoluoke-web`。

### 6. 配置环境变量

```bash
cd /var/www/xiaoluoke-web
cp .env.example .env.production
nano .env.production
```

至少修改：

```env
NEXT_PUBLIC_SITE_URL=https://example.com
DEPLOYMENT_VERSION=release-001
DATA_SOURCE=mock
```

### 7. 安装依赖并构建

```bash
cd /var/www/xiaoluoke-web
npm install
npm run build
```

### 8. 用 PM2 启动 Next.js

```bash
PORT=3000 pm2 start npm --name xiaoluoke-web -- start
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条需要复制执行的 `sudo env ...` 命令，按它提示执行即可。

### 9. 配置 Nginx 反向代理

创建配置：

```bash
sudo nano /etc/nginx/sites-available/xiaoluoke-web
```

写入：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/xiaoluoke-web /etc/nginx/sites-enabled/xiaoluoke-web
sudo nginx -t
sudo systemctl reload nginx
```

### 10. 配置 HTTPS

先把域名 A 记录解析到香港服务器 IP，并确认 80 / 443 端口已放行。

安装 Certbot：

```bash
sudo apt install -y snapd
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

申请证书并自动改 Nginx：

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

测试自动续期：

```bash
sudo certbot renew --dry-run
```

### 11. 常用运维命令

```bash
pm2 status
pm2 logs xiaoluoke-web
pm2 restart xiaoluoke-web
pm2 stop xiaoluoke-web
```

重新发布：

```bash
cd /var/www/xiaoluoke-web
git pull
npm install
npm run build
DEPLOYMENT_VERSION=$(date +%Y%m%d%H%M%S) pm2 restart xiaoluoke-web --update-env
```

## 后续接 MongoDB Atlas

建议后续用 MongoDB Atlas 托管数据库，先建这些集合：

- `users`
- `products`
- `workers`
- `announcements`
- `orders`
- `wallet_accounts`
- `wallet_ledger`
- `recharge_orders`

生产环境变量：

```env
DATA_SOURCE=mongodb
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/xiaoluoke_esports
MONGODB_DB=xiaoluoke_esports
```

注意：

- MongoDB Atlas Network Access 需要允许 Vercel 出口或服务器 IP。
- 密码不要提交到 Git。
- 订单、钱包扣款、打赏入账需要放到服务端 API，不能继续只靠前端 localStorage。

## 从 mock 数据切换到真实数据库

建议分三步，不要一次性重构：

1. 保留当前页面组件，把 `src/lib/store.ts` 中的浏览器 localStorage 逻辑逐步替换为 API 调用。
2. 在 `src/app/api/customer/*` 中实现真实接口，例如商品、接单员、订单、充值、打赏。
3. 服务端 API 连接 MongoDB，并把关键写操作做成原子流程：
   - 洛克贝下单：创建订单、扣顾客可用余额、增加冻结余额、写钱包流水。
   - 确认结单：订单改 `settled`、扣冻结余额、增加累计消费、接单员收入入账。
   - 打赏：创建 `tip` 订单、扣顾客余额、加接单员余额、写双方流水。

上线真实支付前，必须先完成服务端订单校验和支付回调验签。

## 备案与服务器地区说明

如果服务器放在中国大陆以外，例如香港，通常可以先不做大陆 ICP 备案。但大陆访问体验仍受网络、DNS、CDN、支付和合规策略影响。正式商用前建议确认域名、支付、内容和用户协议的合规要求。

## 参考

- Vercel 会自动识别 Next.js，并使用 `package.json` 里的 `build` 脚本作为构建命令。
- Next.js 自托管推荐在 Next 服务前放 Nginx 等反向代理。
- NodeSource 提供 Ubuntu/Debian 的 Node.js 22.x 安装源。
- Certbot 官方推荐用 snap 安装并配合 Nginx 自动签发证书。
