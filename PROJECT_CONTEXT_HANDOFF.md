# 小洛克电竞三端项目上下文交接文档

生成时间：2026-05-06  
项目路径：`/Users/chris/Documents/New project 2`

## 1. 当前边界

本文件用于上下文压缩后的项目交接与恢复。当前任务只做项目核对和文档固化，不继续新增功能、不大改代码、不调整业务逻辑。

后续任何 Codex 接手本项目时，必须先阅读：

1. `PROJECT_CONTEXT_HANDOFF.md`
2. `NEXT_CODEX_PROMPT.md`
3. `MODULE_STATUS.md`
4. `DEVELOPMENT_RULES.md`

## 2. 项目目标

“小洛克电竞”是一个 Next.js + React + Tailwind CSS 的三端 Web/H5 系统：

1. 顾客端 Customer：浏览商品、充值洛克贝、下单、打赏、查看订单、聊天、评价、提交疑问。
2. 接单员端 Worker：登录、设置在线/离线、抢单/接单、订单沟通、完成订单、钱包/提现相关能力。
3. 管理端 Admin Dashboard：作为三端数据中枢，管理用户、商品、订单、接单员、财务、公告、权限、设置、反馈/纠纷。

核心原则：顾客端、接单员端、管理端必须共用同一套数据结构和同一个 shared store。管理端不是静态后台，所有列表、详情、按钮、统计都应读取和写入真实共享数据。

## 3. 技术栈与项目结构

技术栈：

1. Next.js App Router
2. React
3. Tailwind CSS
4. 当前数据源：mock/localStorage
5. API 目录存在，但当前主要是接口占位，不接真实数据库

关键目录：

1. `src/app`：三端页面路由和 API 占位。
2. `src/lib/types.ts`：主要业务类型。
3. `src/lib/mockData.ts`：初始 mock 数据。
4. `src/lib/store.ts`：shared store、localStorage 读写、三端业务逻辑。
5. `src/lib/hooks.ts`：session/store 同步 hooks。
6. `src/lib/status.ts`：订单状态文案与样式映射。
7. `src/components/admin`：管理端布局与通用组件。

## 4. 禁止和暂不接入内容

必须遵守：

1. 不接 MongoDB，当前只使用 shared store/localStorage。
2. 暂不接真实微信支付。
3. 暂不接真实支付宝支付。
4. 暂不接真实短信。
5. 暂不接真实 COS/OSS 上传。
6. 暂不接真实企业微信 API。
7. 暂不接真实公众号 H5 授权和公众号客服。
8. 暂不接真实接单员小程序提现。
9. 不改成微信小程序，不写 `wx.login`、云开发、小程序页面逻辑。
10. 所有“打手”文案统一改成“接单员”。
11. 不恢复“分销、应用、装修、广告投放、裂变、邀请返佣、推广海报”等无关模块。
12. 不为顾客端、接单员端、管理端分别写三套假数据。

企业微信客服、公众号 H5、微信支付、接单员小程序提现等，只能先预留字段、配置入口和接口结构。

## 5. 当前真实存在的路由

扫描来源：`src/app/**/page.tsx`

### 5.1 顾客端路由

1. `/customer`
2. `/customer/home`
3. `/customer/categories`
4. `/customer/workers`
5. `/customer/worker/[id]`
6. `/customer/select-worker`
7. `/customer/product/[id]`
8. `/customer/order-confirm/[productId]`
9. `/customer/orders`
10. `/customer/order/[id]`
11. `/customer/chat/[orderId]`
12. `/customer/recharge`
13. `/customer/tip/[workerId]`
14. `/customer/profile`
15. `/customer/ranking`
16. `/customer/notice`
17. `/customer/must-read`
18. `/customer/messages`
19. `/customer/after-sale`
20. `/customer/referral`
21. `/customer/agreement`
22. `/customer/privacy`
23. `/customer/business`
24. `/customer/report`
25. `/customer/service`
26. `/customer/worker-apply`
27. `/login`
28. `/`

### 5.2 接单员端路由

1. `/worker`
2. `/worker/login`
3. `/worker/home`
4. `/worker/orders`
5. `/worker/order/[id]`
6. `/worker/chat/[orderId]`
7. `/worker/profile`
8. `/worker/wallet`
9. `/worker/messages`
10. `/worker/user-center`
11. `/worker/business-agreement`
12. `/worker/privacy`

### 5.3 管理端路由

1. `/admin`
2. `/admin/login`
3. `/admin/dashboard`
4. `/admin/order-statistics`
5. `/admin/users`
6. `/admin/user/[id]`
7. `/admin/users/member-levels`
8. `/admin/products`
9. `/admin/product/[id]`
10. `/admin/product/create`
11. `/admin/product-categories`
12. `/admin/orders`
13. `/admin/orders/create`
14. `/admin/order/[id]`
15. `/admin/workers`
16. `/admin/worker/[id]`
17. `/admin/finance`
18. `/admin/finance/payments`
19. `/admin/finance/recharge-packages`
20. `/admin/finance/tips`
21. `/admin/finance/ledger`
22. `/admin/finance/withdrawals`
23. `/admin/wallet`
24. `/admin/recharges`
25. `/admin/withdrawals`
26. `/admin/announcements`
27. `/admin/feedback`
28. `/admin/disputes`
29. `/admin/feedback/reviews`
30. `/admin/logs`
31. `/admin/permissions`
32. `/admin/permissions/roles`
33. `/admin/permissions/admin-users`
34. `/admin/permissions/menus`
35. `/admin/settings`
36. `/admin/settings/basic`
37. `/admin/settings/tip`
38. `/admin/settings/customer-service`
39. `/admin/settings/sms`
40. `/admin/settings/notification`
41. `/admin/settings/agreement`
42. `/admin/settings/worker`
43. `/admin/settings/payment`
44. `/admin/settings/order`
45. `/admin/settings/business-target`
46. `/admin/settings/finance`
47. `/admin/settings/resources`

设置模块本轮已新增或完善 `/admin/settings/basic` 到 `/admin/settings/resources`，`/admin/settings` 会进入基础设置。

### 5.4 API 占位路由

当前存在 API 占位：

1. `/api/auth/login`
2. `/api/auth/register`
3. `/api/customer/announcements`
4. `/api/customer/orders`
5. `/api/customer/products`
6. `/api/customer/ranking`
7. `/api/customer/recharge`
8. `/api/customer/tips`
9. `/api/customer/workers`
10. `/api/customer-service/enterprise-wechat`
11. `/api/payment/callback/wechat_pay`
12. `/api/withdrawals/worker`

`src/app/api/README.md` 说明当前 MVP 仍以浏览器 localStorage mock data 为主，API 结构用于后续接数据库。

企业微信客服、公众号 H5、微信支付、接单员提现、短信、资源上传当前均只预留字段、配置入口或接口结构，不接真实服务。

## 6. shared store 与 localStorage key

主要来源：`src/lib/store.ts`

### 6.1 主 store key

`xiaoluoke_customer_mvp_store`

该 key 保存 `StoreShape`，包含当前三端共享核心数据：

1. `users`
2. `products`
3. `product_categories`
4. `workers`
5. `announcements`
6. `orders`
7. `wallet_accounts`
8. `wallet_ledger`
9. `recharge_orders`
10. `recharge_packages`
11. `withdraw_requests`
12. `deposit_refunds`
13. `chat_sessions`
14. `chat_messages`
15. `admin_roles`
16. `admin_users`
17. `admin_menus`
18. `admin_logs`
19. `system_settings`
20. `member_level_settings`
21. `feedback_tickets`
22. `order_complaints`
23. `aftersale_orders`
24. `order_reviews`

本轮设置模块统一数据源已完成：`system_settings` 已并入 `xiaoluoke_customer_mvp_store` 的 `StoreShape`。不要新增独立写入的 `xiaoluoke_system_settings` localStorage key；代码中若保留该名称，只能作为旧数据读取/迁移兼容。

本轮会员等级配置并入 shared store 已完成：新增 `member_level_settings`，统一持久化在主 store key `xiaoluoke_customer_mvp_store` 内。`xiaoluoke_admin_member_level_settings` 不再作为主要数据源，只作为旧数据迁移来源；`readStore()` 初始化时会迁移旧 key 到主 store，并移除旧 key。`npm run build` 已通过。

本轮投诉 / 反馈 / 售后 / 评价闭环已完成：`feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews` 已并入 `xiaoluoke_customer_mvp_store` 的 `StoreShape`，不新增独立 localStorage key。订单已增加 `complaintFlag`、`aftersaleFlag`、`reviewId`；接单员已增加 `ratingAvg`、`reviewCount`。顾客端 `/customer/report`、`/customer/after-sale`、`/customer/order/[id]` 已接入反馈、投诉、售后、评价；接单员端 `/worker/home`、`/worker/messages`、`/worker/order/[id]` 已显示投诉、售后、评价提醒和状态；管理端 `/admin/feedback`、`/admin/disputes`、`/admin/feedback/reviews` 已可处理反馈、投诉、售后、评价管理。管理端处理动作已写入 `admin_logs`，所有新增和处理动作已触发 `xiaoluoke_store_updated`。

本轮管理端权限与危险操作一致性已完成：管理端危险操作权限已补齐，UI 层已对无权限按钮隐藏或 disabled 并提示“无权限操作”，执行层已在危险操作函数内部加 `requirePermission` / `requireAnyPermission` 二次校验，避免绕过按钮直接写入 store。已覆盖订单、用户、接单员、商品、分类、财务、提现、反馈、投诉、售后、评价、角色、管理员等危险操作。新增或补齐权限点包括 `orders.restore`、`orders.mark_issue`、`orders.update_status`、`orders.delete`、`users.export`、`workers.export`、`finance.wallet.adjust`、`feedback.feedback.delete`、`feedback.reviews.hide`、`feedback.reviews.restore`、`permissions.roles.create`、`permissions.roles.edit`、`permissions.roles.delete`、`permissions.admin_users.create`、`permissions.admin_users.edit`、`permissions.admin_users.delete` 等。`orders.delete` 只补权限点，未新增删除订单业务函数；导出仍是 MVP 占位；`/admin/permissions/menus` 仍按 `permissions.menus.manage` 控制，未拆更细权限。

真实退款到账、真实客服、短信、微信支付、企业微信、COS/OSS 图片上传、复杂评价审核流仍为占位，不接真实服务。最近一次 `npm run build` 已通过，生成 78 个页面/API 路由。

### 6.2 session / 状态 key

1. 顾客当前登录：`xiaoluoke_customer_mvp_current_user_id`
2. 接单员当前登录：`xiaoluoke_worker_mvp_current_worker_id`
3. 管理员 session：`xiaoluoke_admin_session`
4. 旧管理员登录兼容：`xiaoluoke_admin_mvp_logged_in`
5. store 更新事件：`xiaoluoke_store_updated`
6. 顾客公告已读：`xiaoluoke_announcement_read_customer`
7. 接单员公告已读：`xiaoluoke_announcement_read_worker`

### 6.3 其他发现的 key

`src/app/admin/users/member-levels/page.tsx` 中存在：

`xiaoluoke_admin_member_level_settings`

该 key 只作为旧数据迁移来源，不再作为主要数据源；会员等级配置已统一迁入 `StoreShape.member_level_settings`。

## 7. 当前核心数据结构

来源：`src/lib/types.ts`

### 7.1 User

顾客/用户结构包含：

1. `id`
2. `openid?`
3. `username?`
4. `password?`
5. `role`
6. `displayId`
7. `nickname`
8. `nicknameEditable`
9. `avatarUrl`
10. `memberLevel`
11. `totalSpent`
12. `availableBalance`
13. `frozenBalance`
14. `createdAt`
15. `updatedAt?`
16. `status?`
17. `remark?`

会员等级规则已从硬编码改为读取 `StoreShape.member_level_settings`：

1. 默认白金会员：消费门槛 100，折扣 1.00
2. 默认钻石会员：消费门槛 520，折扣 1.00
3. 默认至尊会员：消费门槛 1000，折扣 0.93
4. 默认超级黑卡会员：消费门槛 3000，折扣 0.90
5. `calculateMemberLevel`、`nextLevelGap` 和下单折扣读取同一套会员等级规则。

### 7.2 Worker

接单员结构包含：

1. `id`
2. `userId?`
3. `userName?`
4. `name`
5. `avatarUrl`
6. `gender`
7. `level`
8. `onlineStatus`
9. `accountStatus?`
10. `status?`
11. `servicePort?`
12. `intro`
13. `completedOrderCount`
14. `rating`
15. `ratingAvg?`
16. `dynamicText?`
17. `availableBalance`
18. `frozenBalance?`
19. `totalEarned`
20. `tipEarned?`
21. `depositPaid?`
22. `depositAmount?`
23. `depositStatus?`
24. `platformCommissionRate?`
25. `mobilePlatformCommission?`
26. `pcPlatformCommission?`
27. `gameId?`
28. `gameNickname?`
29. `createdAt?`
30. `updatedAt?`

接单员等级只能使用：

1. 明星
2. 金牌
3. 银牌
4. 铜牌
5. 见习

业务文案统一使用“接单员”，不能使用“打手”。

### 7.3 Product

商品结构包含：

1. `id`
2. `name`
3. `shortDescription?`
4. `category`
5. `categoryId?`
6. `priceRmb`
7. `priceLockeCoin`
8. `costPrice?`
9. `sales`
10. `imageUrl`
11. `homeImageUrl?`
12. `detailImages?`
13. `tags`
14. `description`
15. `serviceDescription`
16. `status`
17. `deleted?`
18. `servicePort?`
19. `sortOrder?`
20. `virtualSales?`
21. `realSales?`
22. `isRecommended?`
23. `purchaseLimitEnabled?`
24. `purchaseLimitPerUser?`
25. `workerIncomeType?`
26. `workerIncomeAmount?`
27. `estimatedDuration?`
28. `requireGameId?`
29. `requireGameNickname?`
30. `requireRemark?`
31. `allowAssignedWorker?`
32. `createdAt`
33. `updatedAt?`

商品分类类型：

1. `PVP专区`
2. `陪玩专区`
3. `资源专区`
4. `异色专区`

顾客端商品列表应只展示 active/on 且未 deleted 的商品。

### 7.4 ProductCategoryRecord

商品分类结构包含：

1. `id`
2. `name`
3. `parentId`
4. `iconUrl?`
5. `sortOrder`
6. `status`
7. `createdAt`
8. `updatedAt?`

分类上下架应影响顾客端分类页和商品展示。

### 7.5 Order

订单结构包含：

1. `id`
2. `orderNo`
3. `orderType`
4. `productId?`
5. `productName`
6. `productCategory?`
7. `productImageUrl?`
8. `productSnapshot?`
9. `customProductInfo?`
10. `customerId`
11. `customerName`
12. `workerId?`
13. `workerName?`
14. `amount`
15. `amountRmb`
16. `amountLockeCoin`
17. `paidAmount?`
18. `totalAmount?`
19. `paymentMethod`
20. `paymentStatus?`
21. `gameNickname?`
22. `gameId?`
23. `quantity?`
24. `remark?`
25. `assignmentType?`
26. `specifiedWorkerId?`
27. `specifiedWorkerName?`
28. `assignedByAdmin?`
29. `servicePort?`
30. `platform?`
31. `status`
32. `statusHistory?`
33. `workerCommissionRate?`
34. `workerIncome?`
35. `platformIncome?`
36. `customerRating?`
37. `reviewedAt?`
38. `disputeReason?`
39. `paidAt?`
40. `assignedAt?`
41. `acceptedAt?`
42. `startedAt?`
43. `workerCompletedAt?`
44. `settledAt?`
45. `cancelledAt?`
46. `refundedAt?`
47. `createdAt`
48. `updatedAt?`

订单类型：

1. `service`：服务订单
2. `tip`：打赏订单

订单状态：

1. `unpaid`
2. `pending`
3. `accepted`
4. `worker_completed`
5. `settled`
6. `disputed`
7. `cancelled`
8. `refunded`
9. `after_sale`
10. `after_sale_refunded`
11. `paid`
12. `failed`

当前生命周期进度统一映射为：

下单 → 收款 → 派单 → 服务中 → 待确认 → 已完成

### 7.6 WalletAccount / WalletLedger

`WalletAccount`：

1. `id`
2. `userId`
3. `ownerType`
4. `availableBalance`
5. `frozenBalance`
6. `totalIncome`
7. `totalExpense`
8. `updatedAt`

`WalletLedger`：

1. `id`
2. `userId`
3. `ownerType?`
4. `type`
5. `direction`
6. `amount`
7. `beforeBalance?`
8. `afterBalance?`
9. `description`
10. `relatedOrderId?`
11. `relatedType?`
12. `relatedId?`
13. `targetType?`
14. `remark?`
15. `createdAt`

流水类型包含充值、下单支付、冻结、结算、退款、打赏、提现、保证金、管理员调整、平台抽成等。

### 7.7 RechargeOrder / RechargePackage

`RechargeOrder`：

1. `id`
2. `userId`
3. `amountRmb`
4. `amountLockeCoin`
5. `paymentMethod`
6. `status`
7. `createdAt`
8. `paidAt?`

`RechargePackage`：

1. `id`
2. `sortOrder`
3. `amountRmb`
4. `bonusLockeCoin`
5. `totalLockeCoin`
6. `status`
7. `deleted?`
8. `createdAt`
9. `updatedAt?`

### 7.8 PaymentRecord

`PaymentRecord` 类型存在，但当前 store 中没有持久化 `payment_records` 数组。`store.ts` 中存在 `buildPaymentRecords`，应视为基于订单/充值/打赏/流水生成的统一支付视图。

### 7.9 WithdrawRequest / DepositRefundRequest

`WithdrawRequest`：

1. `id`
2. `workerId`
3. `workerName`
4. `amount`
5. `fee`
6. `actualAmount`
7. `status`
8. `paymentInfo?`
9. `adminRemark?`
10. `createdAt`
11. `approvedAt?`
12. `paidAt?`
13. `rejectedAt?`

`DepositRefundRequest`：

1. `id`
2. `workerId`
3. `workerName`
4. `amount`
5. `status`
6. `reason`
7. `adminRemark?`
8. `createdAt`
9. `reviewedAt?`

### 7.10 ChatSession / ChatMessage

`ChatSession`：

1. `id`
2. `orderId`
3. `customerId`
4. `workerId`
5. `workerName?`
6. `status`
7. `createdAt`
8. `updatedAt`

`ChatMessage`：

1. `id`
2. `sessionId`
3. `orderId`
4. `senderId`
5. `senderRole`
6. `senderName`
7. `messageType`
8. `content`
9. `imageUrl?`
10. `createdAt`
11. `isRead`

聊天当前是 localStorage/mock 逻辑，不是真实 WebSocket。

### 7.11 Announcement

公告结构包含：

1. `id`
2. `title`
3. `type`
4. `visibleTo`
5. `coverImage?`
6. `content`
7. `isPinned`
8. `sortOrder`
9. `status`
10. `viewCount`
11. `publishAt?`
12. `expireAt?`
13. `deleted?`
14. `createdAt`
15. `updatedAt`

公告必须共用 `announcements`，顾客端和接单员端按 `visibleTo`、`status`、发布时间、过期时间过滤显示。

### 7.12 AdminRole / AdminUser / AdminMenu / AdminSession

`AdminRole`：

1. `id`
2. `name`
3. `code`
4. `description`
5. `status`
6. `permissions`
7. `createdAt`
8. `updatedAt?`

`AdminUser`：

1. `id`
2. `username`
3. `password`
4. `name`
5. `avatarUrl?`
6. `roleIds`
7. `status`
8. `lastLoginAt?`
9. `lastLoginIp?`
10. `createdAt`
11. `updatedAt?`

`AdminMenu`：

1. `id`
2. `parentId`
3. `name`
4. `type`
5. `routeName?`
6. `path?`
7. `componentPath?`
8. `icon?`
9. `externalUrl?`
10. `activePath?`
11. `permissionKey?`
12. `sortOrder`
13. `visible`
14. `cache`
15. `hidden`
16. `embedded`
17. `hideTab`
18. `status`
19. `createdAt`
20. `updatedAt?`

默认超级管理员：

1. username: `admin`
2. password: `0000`
3. role: `超级管理员`

### 7.13 AdminLog

`AdminLog`：

1. `id`
2. `adminId`
3. `adminName`
4. `action`
5. `targetType`
6. `targetId`
7. `amount?`
8. `detail`
9. `remark?`
10. `createdAt`

管理端关键操作必须写入 `admin_logs`。

### 7.14 投诉 / 反馈 / 售后 / 评价结构

投诉 / 反馈 / 售后 / 评价闭环已并入 `StoreShape`：

1. `feedback_tickets`：普通反馈、疑问咨询、功能建议。
2. `order_complaints`：订单投诉和订单疑问，关联 `orderId`、`customerId`、`workerId`。
3. `aftersale_orders`：售后申请，关联 `orderId`、`customerId`、`workerId`、`refundAmount`、`reason`、`status`。
4. `order_reviews`：订单评价，关联 `orderId`、`customerId`、`workerId`、`rating`、`content`、`isAnonymous`、`status`。
5. 订单增加 `complaintFlag`、`aftersaleFlag`、`reviewId`。
6. 接单员增加 `ratingAvg`、`reviewCount`。

管理端 `/admin/feedback`、`/admin/disputes`、`/admin/feedback/reviews` 已接入上述结构；管理端处理动作写入 `admin_logs` 并触发 `xiaoluoke_store_updated`。

## 8. 当前 store 关键能力

`src/lib/store.ts` 已经包含大量三端业务函数：

1. 读写 store：`readStore`、`writeStore`
2. 顾客登录/退出/资料：`mockWechatLogin`、`registerCustomer`、`loginCustomer`、`logout`、`updateCurrentNickname`、`updateCurrentUserAvatar`
3. 接单员登录/退出/资料：`mockWorkerLogin`、`logoutWorker`、`setCurrentWorkerOnlineStatus`、`updateCurrentWorkerIntro`、`updateCurrentWorkerAvatar`、`updateCurrentWorkerName`
4. 管理员登录/权限：`adminLogin`、`adminLogout`、`hasPermission`、`requirePermission`、`canAccessAdminPath`
5. 商品与分类：`getProducts`、`getProduct`、`getVisibleProductCategories`、`adminCreateProduct`、`adminUpdateProduct`、`adminSetProductStatus`、`adminSoftDeleteProduct`、`adminUpsertProductCategory`
6. 公告：`getAnnouncements`、`getVisibleAnnouncements`、`incrementAnnouncementView`、`markAnnouncementRead`、`getUnreadPinnedAnnouncement`、`adminUpsertAnnouncement`
7. 订单：`createServiceOrder`、`createOrder`、`createTipOrder`、`settleOrder`、`disputeOrder`、`simulateAcceptOrder`、`simulateWorkerComplete`
8. 接单员订单：`acceptOrderAsCurrentWorker`、`completeOrderAsCurrentWorker`
9. 管理订单：`adminSettleOrder`、`adminRefundOrder`、`adminUpdateOrderStatus`、`adminCreateOrder`
10. 聊天：`getOrderChat`、`sendChatTextMessage`、`sendChatImageMessage`、`simulateWorkerChatMessage`、`getWorkerOrderChat`、`sendWorkerChatTextMessage`
11. 钱包/财务：`rechargeCurrentCustomer`、`adminAdjustWallet`、`buildPaymentRecords`、`adminCreateWithdrawRequest`、`adminUpdateWithdrawStatus`
12. 接单员管理：`adminUpdateWorkerProfile`、`adminSetWorkerFrozen`、`adminAdjustWorkerDeposit`、`adminUpdateWorkerCommission`、`adminAdjustWorkerBalance`
13. 充值套餐：`adminUpsertRechargePackage`、`adminSetRechargePackageStatus`、`adminDeleteRechargePackage`
14. 权限：`adminUpsertRole`、`adminUpdateRolePermissions`、`adminUpsertAdminUser`、`adminUpsertAdminMenu`
15. 投诉 / 反馈 / 售后 / 评价：`submitFeedbackTicket`、`submitOrderComplaint`、`submitAfterSaleOrder`、`getCurrentCustomerSupportRecords`、`getCurrentWorkerSupportRecords`、`adminUpdateFeedbackTicket`、`adminDeleteFeedbackTicket`、`adminUpdateOrderComplaint`、`adminUpdateAfterSaleOrder`、`adminUpdateOrderReview`

## 9. 已确认业务规则

### 9.1 顾客端

1. 顾客首次进入可以浏览首页、分类、商品详情、接单员列表、接单员详情、排行榜、公告、下单必看。
2. 下单、充值、我的、我的订单、指定接单员、提交订单、打赏、洛克贝支付等需要登录。
3. 当前登录为 mock 微信登录，后续预留公众号 H5 网页授权，不走小程序登录。
4. 账号密码登录不是主入口，可作为隐藏/开发入口。
5. 洛克贝是平台内部服务积分，1 RMB = 1 洛克贝。
6. 顾客端商品展示使用 RMB 价格，支付时显示微信/支付宝/洛克贝三种方式；当前只有洛克贝支付可完成 mock 流程。

### 9.2 商品与分类

当前业务分类应使用：

1. 异色专区
2. PVP专区
3. 陪玩专区
4. 资源专区

用户后来要求：异色专区放在最前，PVP专区在后。后续检查 mockData 时应确认排序是否符合。

商品内容需求曾确认：

1. 陪玩专区只保留：技术陪、娱乐陪。
2. 资源专区保留：锚点解锁、等级提升、眠枭之星、副本托管、日常接管、全力接管、跑花服务、跑矿服务、洛克贝服务。
3. 异色专区放最前，保留：指定异色、随机异色、全部异色。
4. PVP专区保留段位相关测试商品。

商品图片：

1. 首页 Banner 使用 `/images/banners/home-main.jpg`。
2. 商品默认图使用 `/images/products/default-product.jpg`。
3. 顾客端商品卡片保持小尺寸正方形/紧凑网格。

### 9.3 接单员端

1. 接单员统一叫“接单员”，不叫“打手”。
2. 接单员测试名称曾要求改为：双灯鱼、星火、妮蔻、清禾、橙子。
3. 接单员端需要在线/离线状态按钮。
4. 接单员冻结后不能抢单。
5. 保证金不足时不能接单，并应在接单员端提醒。
6. 接单员可以编辑头像、用户名/昵称、接单员说明。
7. 接单员详情中用户曾要求删除“评价”和“动态”展示。

### 9.4 订单流程

服务订单只创建一条共享订单记录，不为顾客端和接单员端分别创建。

普通服务订单：

1. 顾客洛克贝支付成功后创建订单。
2. 扣顾客 availableBalance。
3. 增加顾客 frozenBalance。
4. 订单状态 `pending`。
5. 写入 wallet_ledger。
6. 创建 chat_session 和系统消息。

接单员接单：

1. 订单状态变为 `accepted`。
2. 写入 workerId/workerName。
3. chat_session 变为 active。
4. 写入系统聊天消息。

接单员完成：

1. 订单状态变为 `worker_completed`。
2. 顾客端显示确认结单/有疑问。

顾客确认结单：

1. 订单状态变为 `settled`。
2. 顾客 frozenBalance 减少。
3. 顾客 totalSpent 增加。
4. 自动更新会员等级。
5. 接单员收益增加。
6. 写入 wallet_ledger。
7. 需要五颗星评价，不需要文字评论。

顾客有疑问：

1. 订单状态变为 `disputed`。
2. 等待管理员处理。

管理员结单：

1. 可处理 `worker_completed` 或 `disputed`。
2. 更新订单、顾客、接单员、wallet_ledger、chat_messages、admin_logs。

管理员退款：

1. 可处理 pending/accepted/worker_completed/disputed 等未最终结算订单。
2. 订单状态变为 `refunded`。
3. 顾客 frozenBalance 减少，availableBalance 返还。
4. 接单员不获得收益。
5. 写入 wallet_ledger、admin_logs、系统聊天消息。

### 9.5 打赏

打赏是特殊订单：

1. `orderType = "tip"`
2. 打赏订单不进入待接单/服务中/待结单流程。
3. 洛克贝打赏成功后直接 settled。
4. 扣顾客 availableBalance。
5. 增加接单员 availableBalance 和 totalEarned。
6. 顾客流水：`tip_out`
7. 接单员流水：`tip_in` 或兼容 `tip_income`
8. 写入 orders、wallet_ledger。

### 9.6 聊天

1. 订单创建后自动创建 chat_session。
2. pending 状态显示“等待接单员接单后即可沟通”。
3. accepted、worker_completed、disputed、settled 可进入聊天。
4. 支持 text 和 image。
5. 图片当前用 FileReader/base64 存 localStorage，最大 2MB，只支持 jpg/jpeg/png/webp。
6. 当前是每 2 秒轮询 localStorage 的 mock 实时体验，不接 WebSocket。
7. 管理端订单详情应能读取真实 chat_messages，只查看，不发送。

### 9.7 财务与钱包

1. 所有余额变化必须走 shared wallet/wallet_ledger。
2. 顾客充值为 mock 充值，写入 recharge_orders 和 wallet_ledger。
3. 订单支付、冻结、结算、退款、打赏、提现、保证金、管理员调整都应写流水。
4. 支付记录当前应优先由 `buildPaymentRecords` 从 orders/recharge_orders/tip orders/wallet_ledger 生成，不应单独写一套假数据。
5. 提现后续真实版预留微信商家转账/支付宝/银行卡，当前只做 manual_offline。
6. 提现审核、拒绝、标记已打款必须更新接单员钱包并写 admin_logs。
7. 平台抽成统一为 `platformCommissionRate`，不再区分手游端和 PC端两个抽成。
8. 商品固定收益优先于接单员抽成比例；否则使用 worker.platformCommissionRate；再否则使用系统默认抽成。

### 9.8 公告

1. 公告统一使用 `announcements`。
2. 管理端新增/编辑/归档/置顶/删除公告后，顾客端和接单员端同步。
3. 顾客端读取 visibleTo = all/customer。
4. 接单员端读取 visibleTo = all/worker。
5. 只展示 published、未过期、已到发布时间公告。
6. 置顶优先，其次 sortOrder，再按 publishAt/createdAt。
7. 点击公告详情时 viewCount + 1。
8. 已读 key 用于避免重复自动弹窗。

### 9.9 权限

1. 当前是前端 localStorage MVP 权限，不能当成真实安全系统。
2. 默认 admin / 0000。
3. 需要控制左侧菜单、页面访问、按钮显示、操作执行。
4. 已有 `hasPermission`、`requirePermission`、`canAccessAdminPath` 等函数。
5. 超级管理员不能删除、禁用、取消自己的超级权限。
6. 普通管理员不能操作超级管理员。
7. 所有权限操作写入 admin_logs。
8. 管理端权限与危险操作一致性已完成：按钮层已隐藏或禁用无权限危险操作，执行层已补 `requirePermission`，覆盖订单、用户、接单员、商品、分类、财务、提现、反馈、投诉、售后、评价、角色、管理员等。`orders.delete` 仅作为权限点存在，未新增删除订单业务函数；导出仍是 MVP 占位；菜单管理仍统一走 `permissions.menus.manage`。

### 9.10 设置

设置模块本轮已完成统一数据源和管理端页面整合：

1. `basic`
2. `tip`
3. `customerService`
4. `sms`
5. `notification`
6. `agreements`
7. `worker`
8. `payment`
9. `order`
10. `businessTarget`
11. `finance`
12. `resources`

当前实现为 `StoreShape.system_settings`，持久化在主 store key `xiaoluoke_customer_mvp_store` 内，不新增独立 `xiaoluoke_system_settings` 写入。

管理端已新增或完善：

1. `/admin/settings/basic`
2. `/admin/settings/tip`
3. `/admin/settings/customer-service`
4. `/admin/settings/sms`
5. `/admin/settings/notification`
6. `/admin/settings/agreement`
7. `/admin/settings/worker`
8. `/admin/settings/payment`
9. `/admin/settings/order`
10. `/admin/settings/business-target`
11. `/admin/settings/finance`
12. `/admin/settings/resources`

顾客端已读取：基础设置、客服、用户协议/隐私协议、打赏开关和快捷金额、可用支付方式、下单必看。

接单员端已读取：基础设置、客服、接单员协议、保证金规则、最低保证金、财务提现规则。

企业微信客服、公众号 H5、微信支付、提现、短信、资源上传均只是预留接口和字段，没有接真实服务。

### 9.11 会员等级

会员等级配置并入 shared store 已完成：

1. `StoreShape.member_level_settings` 保存统一会员等级配置。
2. 字段包括 `id`、`name`、`minSpend`、`discountRate`、`upgradeReward`、`enabled`、`sort`、`createdAt`、`updatedAt`。
3. `xiaoluoke_admin_member_level_settings` 不再作为主要数据源，只作为旧数据迁移来源。
4. `readStore()` 初始化时会迁移旧 key 到主 store，并移除旧 key。
5. `calculateMemberLevel` / `nextLevelGap` 已读取统一会员等级规则。
6. 管理端 `/admin/users/member-levels` 保存后会写入 `admin_logs`、触发 `xiaoluoke_store_updated`，并影响顾客端等级展示和下单折扣。
7. 本轮修改后 `npm run build` 已通过。

### 9.12 投诉 / 反馈 / 售后 / 评价

投诉 / 反馈 / 售后 / 评价闭环已完成：

1. `feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews` 已并入 `xiaoluoke_customer_mvp_store`，不新增独立 localStorage key。
2. 订单已增加 `complaintFlag`、`aftersaleFlag`、`reviewId`，只做必要轻量联动，不破坏订单主流程。
3. 接单员已增加 `ratingAvg`、`reviewCount`，评价可影响接单员评分展示。
4. 顾客端 `/customer/report`、`/customer/after-sale`、`/customer/order/[id]` 已接入反馈、投诉、售后、评价。
5. 接单员端 `/worker/home`、`/worker/messages`、`/worker/order/[id]` 已显示投诉、售后、评价提醒和状态。
6. 管理端 `/admin/feedback`、`/admin/disputes`、`/admin/feedback/reviews` 已可处理反馈、投诉、售后、评价管理。
7. 管理端处理动作已写入 `admin_logs`。
8. 所有新增和处理动作已触发 `xiaoluoke_store_updated`。
9. 真实退款到账、真实客服、短信、微信支付、企业微信、COS/OSS 图片上传、复杂评价审核流仍为占位。
10. 本轮修改后 `npm run build` 已通过，生成 78 个页面/API 路由。

## 10. 管理端菜单结构要求

默认一级菜单应为：

1. 统计
   - 综合面板
   - 订单统计
2. 用户
   - 用户列表
   - 会员等级
3. 订单
   - 订单列表
   - 后台派单
   - 订单详情，隐藏菜单
4. 商品
   - 商品列表
   - 商品分类
   - 商品详情，隐藏菜单
5. 接单员
   - 接单员列表
   - 接单员申请
   - 接单员等级
   - 接单员详情，隐藏菜单
6. 财务
   - 支付记录
   - 充值套餐
   - 打赏记录
   - 财务流水
   - 提现审核
7. 营销
   - 公告列表
8. 反馈
   - 评价管理
   - 订单投诉
   - 反馈列表
9. 权限
   - 角色管理
   - 管理员管理
   - 菜单管理
10. 设置
   - 基础设置
   - 打赏设置
   - 客服设置
   - 短信配置
   - 通知设置
   - 政策协议
   - 接单员配置
   - 支付配置
   - 订单设置
   - 经营目标
   - 财务配置
   - 资源管理

不得默认显示：分销、应用、装修、广告投放、邀请返佣、裂变海报。

## 11. 三端必须互通的模块

以下模块必须三端共享：

1. 订单：顾客创建、接单员接取、管理端处理，三端状态同步。
2. 聊天：顾客端/接单员端发送，管理端订单详情读取。
3. 商品：管理端上下架/编辑后，顾客端首页、分类页、详情页同步。
4. 分类：管理端上下架/排序后，顾客端分类同步。
5. 接单员：管理端冻结/等级/保证金/头像/昵称后，顾客端和接单员端同步。
6. 钱包/财务：充值、打赏、订单结算、退款、提现、保证金、管理员调整同步。
7. 公告：管理端发布后，顾客端和接单员端按 visibleTo 同步。
8. 设置：管理端配置后，顾客端和接单员端读取同一配置。
9. 权限：管理端菜单、路由、按钮和危险操作受权限控制。
10. 评价/投诉/纠纷：`feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews`、订单轻量标记、接单员评分和管理端处理联动。

## 12. 当前不确定或需人工确认的内容

1. `payment_records` 类型存在，但持久化数组未发现，当前应是 `buildPaymentRecords` 生成视图。
2. 用户后续多次要求的 UI 微调是否全部完成，需要浏览器人工确认。
3. 设置模块已并入共享 `system_settings`，会员等级配置已并入共享 `member_level_settings`，投诉 / 反馈 / 售后 / 评价闭环已并入主 store，订单/钱包/退款/状态一致性已完成，但企业微信客服、公众号 H5、微信支付、真实退款到账、提现、短信、资源上传仍是占位，不是真实服务。
4. 腾讯云部署相关步骤曾讨论过，但当前文档任务不做部署操作。

## 13. 下一轮 Codex 优先检查清单

1. 先运行 `npm run build`，确认当前代码可构建。
2. 先读本文件和 `MODULE_STATUS.md`，不要凭记忆开发。
3. 设置模块统一数据源已完成；会员等级配置并入 shared store 已完成；投诉 / 反馈 / 售后 / 评价闭环已完成；管理端权限与危险操作一致性已完成；订单/钱包/退款/状态一致性已完成。
4. 下一轮建议做“小问题清理与上线前检查”，包括 `/customer/must-read` 同步设置、旧提现页面文案统一、接单员钱包流水正负号显示、全站“打手”文案检查。
5. 不要顺手接真实退款到账、真实财务提现打款、真实支付、短信、企业微信、COS/OSS 或 MongoDB。
6. 不要在小问题清理时重做设置、会员等级、投诉/反馈/售后/评价闭环、权限结构或订单状态机。
7. 改完任何模块必须跑 `npm run build`。

## 14. 本轮完成：订单/钱包/退款/状态一致性

本轮只修订单关闭/恢复/退款与钱包冻结、支付状态、售后投诉标记一致性，没有新增独立 localStorage key，所有数据仍进入 `xiaoluoke_customer_mvp_store`。

1. 订单新增并迁移 `refundAmount`、`refundStatus`、`refundedAt`、`cancelledAt`、`refundRemark`。
2. 管理端退款、关闭、恢复、标记疑问已加入状态限制。
3. 已支付未完成订单关闭时会释放冻结余额、返还顾客本地余额、写 `order_refund` 流水、更新退款字段、写聊天系统消息和 `admin_logs`。
4. 未支付订单关闭不产生退款流水。
5. 退款会更新顾客余额、冻结、钱包流水。
6. 已结算订单退款会扣减顾客累计消费，并写接单员佣金/平台抽成反向流水或异常说明。
7. 恢复订单只允许未退款的已关闭订单恢复。
8. 标记疑问不触碰财务。
9. 售后 `resolved` 会做本地模拟退款并同步 `after_sale_refunded`。
10. `complaintFlag` / `aftersaleFlag` 已根据活跃记录计算。
11. Dashboard、订单统计、商品 GMV、订单 AOV、财务退款/未结算/支付退款统计口径已收紧。
12. 真实微信/支付宝退款仍是占位；`payment_records` 未新增，支付记录仍由订单、充值、钱包流水派生。
13. 本轮 `npm run build` 已通过，生成 78 个页面/API 路由。
