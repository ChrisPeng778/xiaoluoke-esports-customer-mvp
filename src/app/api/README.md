# API placeholders

当前 Customer MVP 使用浏览器 `localStorage` 模拟数据读写。

后续接 MongoDB、接单员端、管理员端时，建议保持这些资源边界：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/wechat/oauth-url`
- `GET /api/auth/wechat/callback`
- `GET /api/customer/products`
- `GET /api/customer/products/:id`
- `GET /api/customer/categories`
- `GET /api/customer/workers`
- `GET /api/customer/workers/:id`
- `GET /api/customer/announcements`
- `GET /api/customer/ranking`
- `GET /api/customer/wallet`
- `POST /api/customer/recharge`
- `GET /api/customer/orders`
- `POST /api/customer/orders`
- `GET /api/customer/orders/:id`
- `POST /api/customer/orders/:id/settle`
- `POST /api/customer/orders/:id/dispute`
- `POST /api/customer/tips`

预留集合：

- `users`
- `products`
- `workers`
- `announcements`
- `orders`
- `wallet_accounts`
- `wallet_ledger`
- `recharge_orders`

支付预留：

- 微信 H5 / 微信内网页支付
- 支付宝手机网站支付
- 洛克贝内部余额支付

登录预留：

- 当前 MVP 使用 mock 微信登录
- 真实版本走微信公众号网页授权
- 不使用微信小程序 `wx.login`
