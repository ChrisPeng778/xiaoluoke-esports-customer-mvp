# 下一轮 Codex 接手提示

你接手的是 `/Users/chris/Documents/New project 2`，项目是“小洛克电竞”三端 Web/H5 系统，技术栈是 Next.js App Router + React + Tailwind CSS。当前用户明确要求：不要继续新增功能，不要凭压缩后的上下文乱改；每次继续开发前必须先读项目根目录的 `PROJECT_CONTEXT_HANDOFF.md`、`MODULE_STATUS.md`、`DEVELOPMENT_RULES.md`。

项目目标是三端互通：

1. 顾客端 Customer：浏览商品、分类、商品详情、接单员列表/详情、排行榜、公告、充值洛克贝、下单、打赏、订单沟通、确认结单、五星评价、有疑问。
2. 接单员端 Worker：mock 登录、在线/离线、抢单/接单、订单详情、聊天、完成订单、个人资料、头像/昵称/说明、钱包/提现/保证金相关。
3. 管理端 Admin Dashboard：电脑后台布局，作为数据中枢，管理统计、用户、商品、订单、接单员、财务、公告、权限、设置、反馈/纠纷。

核心原则：三端必须共用同一套 shared store/localStorage，不允许给顾客端、接单员端、管理端各写一套假数据。主 store key 是 `xiaoluoke_customer_mvp_store`，由 `src/lib/store.ts` 读写，结构在 `src/lib/types.ts` 的 `StoreShape`。当前 store 包含 `users`、`products`、`product_categories`、`workers`、`announcements`、`orders`、`wallet_accounts`、`wallet_ledger`、`recharge_orders`、`recharge_packages`、`withdraw_requests`、`deposit_refunds`、`chat_sessions`、`chat_messages`、`admin_roles`、`admin_users`、`admin_menus`、`admin_logs`。session key 包括顾客、接单员、管理员 session 和公告已读 key。

绝对不要做：不接 MongoDB，不接真实微信支付/支付宝支付，不接真实短信，不接真实 COS/OSS 上传，不接真实企业微信 API，不接真实公众号 H5 授权，不接真实接单员小程序提现，不改成微信小程序，不写 `wx.login`。所有“打手”文案必须改成“接单员”。不要恢复“分销、应用、装修、广告投放、裂变、邀请返佣、推广海报”等无关模块。

当前真实路由已经很多，扫描 `src/app/**/page.tsx`。顾客端主要在 `/customer/*`，接单员端在 `/worker/*`，管理端在 `/admin/*`。已存在管理端路由包括 dashboard、order-statistics、users、products、product-categories、orders、orders/create、workers、finance/payments、finance/recharge-packages、finance/tips、finance/ledger、finance/withdrawals、announcements、feedback、disputes、permissions/roles、permissions/admin-users、permissions/menus、settings 等。注意：设置模块用户要求了很多子路由，如 `/admin/settings/basic`、`/admin/settings/tip`、`/admin/settings/customer-service` 等，但当前扫描只确认 `/admin/settings` 存在，继续前必须核对真实代码。

重要业务规则：

1. 顾客可先浏览，敏感操作才 mock 微信登录。真实版预留公众号 H5 授权，不走小程序。
2. 商品分类业务上应是：异色专区、PVP专区、陪玩专区、资源专区。陪玩只保留技术陪、娱乐陪；资源保留锚点解锁、等级提升、眠枭之星、副本托管、日常接管、全力接管、跑花服务、跑矿服务、洛克贝服务；异色保留指定异色、随机异色、全部异色。
3. 商品 active/on 且未 deleted 才给顾客端显示。管理端上下架、编辑、分类调整、推荐排序必须影响顾客端。
4. 服务订单只创建一条共享订单。顾客洛克贝支付后扣 availableBalance、加 frozenBalance、订单 pending、写 wallet_ledger、建 chat_session。接单员接单后 accepted，完成后 worker_completed，顾客确认后 settled 并五星评价。管理员可结单、退款、标记疑问、关闭/恢复，必须更新 orders、wallet、chat、admin_logs。
5. 打赏是 `orderType = "tip"` 的特殊订单。洛克贝打赏成功后直接 settled，扣顾客余额，增接单员余额与 totalEarned，写 wallet_ledger。
6. 聊天是 mock localStorage 轮询，不接 WebSocket。支持 text/image，图片 base64 当前仅测试用。管理端订单详情应读取真实 chat_messages。
7. 接单员统一等级：明星、金牌、银牌、铜牌、见习。冻结后不能抢单；保证金不足不能接单。接单员名字曾要求为双灯鱼、星火、妮蔻、清禾、橙子。
8. 会员等级：普通 0-199.99，中级 200-499.99，高级 500-999.99，顶级 1000+。
9. 财务必须统一走 wallet_ledger。支付记录可由 `buildPaymentRecords` 从订单/充值/打赏/流水生成，不要单独写假 payment_records。
10. 平台抽成统一字段 `platformCommissionRate`，不再区分手游端/PC端。商品固定收益优先，否则用接单员抽成，否则默认抽成。
11. 公告统一 `announcements`，按 `visibleTo`、`published`、发布时间和过期时间过滤。顾客端读 all/customer，接单员端读 all/worker，点击 viewCount +1。
12. 权限是 localStorage MVP。默认 admin/0000，超级管理员不能被删除或禁用。已有 `hasPermission`、`requirePermission`、`canAccessAdminPath` 等，需要核对是否真的控制菜单、页面、按钮和危险操作。
13. 设置模块用户提出统一 `xiaoluoke_system_settings`，包含 basic、tip、customerService、sms、notification、agreements、worker、payment、order、businessTarget、finance、resources。但当前 `StoreShape` 未发现该结构，继续设置模块前必须先设计兼容方案。

下一步优先事项：不要一口气做大模块。先跑 `npm run build`。若继续开发，优先选择一个模块，例如“设置模块核对与统一 settings store”或“反馈/评价/投诉结构补齐”，先读相关页面和 store，再最小范围修改。所有修改必须保留顾客端和接单员端现有流程，不新增重复数据源，不写三套假数据，改完必须 `npm run build`。

