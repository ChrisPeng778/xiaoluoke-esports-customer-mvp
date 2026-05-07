# 下一轮 Codex 接手提示

你接手的是 `/Users/chris/Documents/New project 2`，项目是“小洛克电竞”三端 Web/H5 系统，技术栈是 Next.js App Router + React + Tailwind CSS。当前用户明确要求：不要继续新增功能，不要凭压缩后的上下文乱改；每次继续开发前必须先读项目根目录的 `PROJECT_CONTEXT_HANDOFF.md`、`MODULE_STATUS.md`、`DEVELOPMENT_RULES.md`。

项目目标是三端互通：

1. 顾客端 Customer：浏览商品、分类、商品详情、接单员列表/详情、排行榜、公告、充值洛克贝、下单、打赏、订单沟通、确认结单、五星评价、有疑问。
2. 接单员端 Worker：mock 登录、在线/离线、抢单/接单、订单详情、聊天、完成订单、个人资料、头像/昵称/说明、钱包/提现/保证金相关。
3. 管理端 Admin Dashboard：电脑后台布局，作为数据中枢，管理统计、用户、商品、订单、接单员、财务、公告、权限、设置、反馈/纠纷。

核心原则：三端必须共用同一套 shared store/localStorage，不允许给顾客端、接单员端、管理端各写一套假数据。主 store key 是 `xiaoluoke_customer_mvp_store`，由 `src/lib/store.ts` 读写，结构在 `src/lib/types.ts` 的 `StoreShape`。当前 store 包含 `users`、`products`、`product_categories`、`workers`、`announcements`、`orders`、`wallet_accounts`、`wallet_ledger`、`recharge_orders`、`recharge_packages`、`withdraw_requests`、`deposit_refunds`、`chat_sessions`、`chat_messages`、`admin_roles`、`admin_users`、`admin_menus`、`admin_logs`、`system_settings`、`member_level_settings`、`feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews`。session key 包括顾客、接单员、管理员 session 和公告已读 key。

绝对不要做：不接 MongoDB，不接真实微信支付/支付宝支付，不接真实短信，不接真实 COS/OSS 上传，不接真实企业微信 API，不接真实公众号 H5 授权，不接真实接单员小程序提现，不改成微信小程序，不写 `wx.login`。所有“打手”文案必须改成“接单员”。不要恢复“分销、应用、装修、广告投放、裂变、邀请返佣、推广海报”等无关模块。

当前真实路由已经很多，扫描 `src/app/**/page.tsx`。顾客端主要在 `/customer/*`，接单员端在 `/worker/*`，管理端在 `/admin/*`。已存在管理端路由包括 dashboard、order-statistics、users、products、product-categories、orders、orders/create、workers、finance/payments、finance/recharge-packages、finance/tips、finance/ledger、finance/withdrawals、announcements、feedback、disputes、permissions/roles、permissions/admin-users、permissions/menus、settings 等。设置模块本轮已新增或完善 `/admin/settings/basic`、`/admin/settings/tip`、`/admin/settings/customer-service`、`/admin/settings/sms`、`/admin/settings/notification`、`/admin/settings/agreement`、`/admin/settings/worker`、`/admin/settings/payment`、`/admin/settings/order`、`/admin/settings/business-target`、`/admin/settings/finance`、`/admin/settings/resources`。

重要业务规则：

1. 顾客可先浏览，敏感操作才 mock 微信登录。真实版预留公众号 H5 授权，不走小程序。
2. 商品分类业务上应是：异色专区、PVP专区、陪玩专区、资源专区。陪玩只保留技术陪、娱乐陪；资源保留锚点解锁、等级提升、眠枭之星、副本托管、日常接管、全力接管、跑花服务、跑矿服务、洛克贝服务；异色保留指定异色、随机异色、全部异色。
3. 商品 active/on 且未 deleted 才给顾客端显示。管理端上下架、编辑、分类调整、推荐排序必须影响顾客端。
4. 服务订单只创建一条共享订单。顾客洛克贝支付后扣 availableBalance、加 frozenBalance、订单 pending、写 wallet_ledger、建 chat_session。接单员接单后 accepted，完成后 worker_completed，顾客确认后 settled 并五星评价。管理员可结单、退款、标记疑问、关闭/恢复，必须更新 orders、wallet、chat、admin_logs。
5. 打赏是 `orderType = "tip"` 的特殊订单。洛克贝打赏成功后直接 settled，扣顾客余额，增接单员余额与 totalEarned，写 wallet_ledger。
6. 聊天是 mock localStorage 轮询，不接 WebSocket。支持 text/image，图片 base64 当前仅测试用。管理端订单详情应读取真实 chat_messages。
7. 接单员统一等级：明星、金牌、银牌、铜牌、见习。冻结后不能抢单；保证金不足不能接单。接单员名字曾要求为双灯鱼、星火、妮蔻、清禾、橙子。
8. 会员等级配置并入 shared store 已完成：统一保存在 `StoreShape.member_level_settings`。默认等级为白金会员 100 / 1.00、钻石会员 520 / 1.00、至尊会员 1000 / 0.93、超级黑卡会员 3000 / 0.90。`xiaoluoke_admin_member_level_settings` 不再作为主要数据源，只作为旧数据迁移来源；`readStore()` 初始化时会迁移旧 key 到主 store，并移除旧 key。`calculateMemberLevel` / `nextLevelGap` 已读取统一会员等级规则，管理端会员等级页面保存后会影响顾客端等级展示和下单折扣。
9. 财务必须统一走 wallet_ledger。支付记录可由 `buildPaymentRecords` 从订单/充值/打赏/流水生成，不要单独写假 payment_records。
10. 平台抽成统一字段 `platformCommissionRate`，不再区分手游端/PC端。商品固定收益优先，否则用接单员抽成，否则默认抽成。
11. 公告统一 `announcements`，按 `visibleTo`、`published`、发布时间和过期时间过滤。顾客端读 all/customer，接单员端读 all/worker，点击 viewCount +1。
12. 权限是 localStorage MVP。默认 admin/0000，超级管理员不能被删除或禁用。管理端权限与危险操作一致性已完成：已复用 `hasPermission`、`requirePermission`、`canAccessAdminPath`，UI 层已对无权限按钮隐藏或 disabled 并提示，执行层已在危险操作函数内部加 `requirePermission` / `requireAnyPermission` 二次校验。已覆盖订单、用户、接单员、商品、分类、财务、提现、反馈、投诉、售后、评价、角色、管理员等危险操作。
13. 设置模块统一数据源已完成：`system_settings` 已并入 `xiaoluoke_customer_mvp_store` 的 `StoreShape`，包含 basic、tip、customerService、sms、notification、agreements、worker、payment、order、businessTarget、finance、resources。不要新增独立写入的 `xiaoluoke_system_settings` key；若代码中保留该名称，只能作为旧数据读取/迁移兼容。顾客端已读取基础设置、客服、协议、打赏、支付方式、下单必看；接单员端已读取基础设置、客服、接单员协议、保证金规则、最低保证金、财务提现规则。企业微信客服、公众号 H5、微信支付、提现、短信、资源上传都只是预留接口，没有接真实服务。
14. 会员等级配置并入 shared store 已完成：管理端保存写入 `admin_logs` 并触发 `xiaoluoke_store_updated`，本轮 `npm run build` 已通过。
15. 投诉 / 反馈 / 售后 / 评价闭环已完成：`feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews` 已并入主 store；订单已增加 `complaintFlag`、`aftersaleFlag`、`reviewId`；接单员已增加 `ratingAvg`、`reviewCount`。顾客端 `/customer/report`、`/customer/after-sale`、`/customer/order/[id]` 已接入反馈、投诉、售后、评价；接单员端 `/worker/home`、`/worker/messages`、`/worker/order/[id]` 已显示投诉、售后、评价提醒和状态；管理端 `/admin/feedback`、`/admin/disputes`、`/admin/feedback/reviews` 已可处理反馈、投诉、售后、评价管理。管理端处理动作写入 `admin_logs`，所有新增和处理动作触发 `xiaoluoke_store_updated`。真实退款到账、真实客服、短信、微信支付、企业微信、COS/OSS 图片上传、复杂评价审核流仍为占位。
16. 本轮新增或补齐权限点包括 `orders.restore`、`orders.mark_issue`、`orders.update_status`、`orders.delete`、`users.export`、`workers.export`、`finance.wallet.adjust`、`feedback.feedback.delete`、`feedback.reviews.hide`、`feedback.reviews.restore`、`permissions.roles.create`、`permissions.roles.edit`、`permissions.roles.delete`、`permissions.admin_users.create`、`permissions.admin_users.edit`、`permissions.admin_users.delete` 等。`orders.delete` 只补权限点，未新增删除订单业务函数；导出仍是 MVP 占位；`/admin/permissions/menus` 仍按 `permissions.menus.manage` 控制，未拆更细权限。

17. 订单/钱包/退款/状态一致性已完成：订单新增并迁移 `refundAmount`、`refundStatus`、`refundedAt`、`cancelledAt`、`refundRemark`。管理端退款、关闭、恢复、标记疑问已加入状态限制；已支付未完成订单关闭时会释放冻结余额、返还顾客本地余额、写 `order_refund` 流水、更新退款字段、写聊天系统消息和 `admin_logs`；未支付订单关闭不产生退款流水；退款会更新顾客余额、冻结、钱包流水；已结算订单退款会扣减顾客累计消费，并写接单员佣金/平台抽成反向流水或异常说明；恢复订单只允许未退款的已关闭订单恢复；标记疑问不触碰财务；售后 `resolved` 会做本地模拟退款并同步 `after_sale_refunded`；`complaintFlag` / `aftersaleFlag` 已根据活跃记录计算；Dashboard、订单统计、商品 GMV、订单 AOV、财务退款/未结算/支付退款统计口径已收紧。真实微信/支付宝退款仍是占位，`payment_records` 未新增，支付记录仍由订单、充值、钱包流水派生。

18. 管理端用户详情页调整用户余额和调整累计消费金额已完成：修改文件为 `src/lib/store.ts`、`src/app/admin/user/[id]/page.tsx`。用户详情页余额卡片已支持“调整余额”，累计消费卡片已支持“调整累计消费”。余额调整支持增加、扣减、直接设置，备注必填且最多 200 字，金额校验到 2 位小数，不允许调整后余额小于 0，会同步 `users.availableBalance` 和 `wallet_accounts.availableBalance`，并写入 `wallet_ledger`。累计消费调整支持增加、扣减、直接设置，金额校验到 2 位小数，备注可选且最多 200 字，不允许调整后累计消费小于 0；累计消费调整不影响余额、不改订单、不改 GMV、不碰真实支付/退款，调整后按 `member_level_settings` 重新计算 `memberLevel`。余额调整权限使用 `users.adjust_balance` 或 `finance.wallet.adjust`，累计消费调整权限使用 `users.edit`。本轮 `npm run build` 已通过，生成 78/78 页面/API 路由。

当前优先模块状态：设置模块统一数据源已完成；会员等级配置并入 shared store 已完成；投诉 / 反馈 / 售后 / 评价闭环已完成；管理端权限与危险操作一致性已完成；订单/钱包/退款/状态一致性已完成；小问题清理与上线前检查已完成；管理端用户余额和累计消费调整已完成。`/customer/must-read` 已读取 `system_settings.order.mustReadContent`；`/admin/withdrawals` 已统一跳转到 `/admin/finance/withdrawals`；接单员钱包流水正负号已修复；UI 文案“打手”已清理为“接单员”。最近一次本地和服务器 `npm run build` 均已通过，生成 78 个页面/API 路由。

服务器测试网部署状态：服务器 IP `43.134.164.29`，服务器项目路径 `~/xiaoluoke-esports-customer-mvp`，PM2 进程 `xiaoluoke-web`。服务器已同步到 GitHub 最新 `main`，当前部署 commit 为 `d86a002 Clean up must-read withdrawals wallet ledger wording`。部署前已备份旧服务器代码到 `/home/ubuntu/xiaoluoke-server-backups/xiaoluoke-before-deploy-20260506-224824.tar.gz`，并单独备份 `.env.production` 到 `/home/ubuntu/xiaoluoke-server-backups/.env.production.backup.20260506-224824`；`.env.production` 已保留为未跟踪文件。服务器 `git reset --hard origin/main` 成功，`src/app/admin/login/page.tsx` 存在，服务器 `npm run build` 通过，PM2 `xiaoluoke-web` online。公网测试 `http://43.134.164.29/customer/home`、`http://43.134.164.29/worker/login`、`http://43.134.164.29/admin/login` 均返回 200 OK；服务器本机 `http://127.0.0.1:3000/customer/home`、`http://127.0.0.1:3000/worker/login`、`http://127.0.0.1:3000/admin/login` 均返回 200 OK。注意当前仍是 localStorage/mock MVP，不同设备不会真正共享业务数据。

下一轮建议事项：不要继续接真实支付、真实退款、真实提现、短信、企业微信、COS/OSS 或 MongoDB；不要重做设置、会员等级、投诉/反馈/售后/评价闭环、权限结构、订单状态机或本轮用户余额/累计消费调整。建议先做现有三端联动的浏览器体验检查，重点看用户详情余额/累计消费调整后，用户列表、用户详情、顾客端个人中心余额、会员等级展示是否同步刷新。
