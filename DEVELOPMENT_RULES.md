# 小洛克电竞后续开发规则

本文件是后续继续开发“小洛克电竞”三端系统的硬性规则。任何新 Codex 对话开始开发前必须先阅读。

## 1. 工作节奏

1. 每次只改一个模块。
2. 改之前先读：
   - `PROJECT_CONTEXT_HANDOFF.md`
   - `MODULE_STATUS.md`
   - 本次要改模块相关代码
3. 不允许凭压缩后的记忆直接大改。
4. 不允许一次性跨顾客端、接单员端、管理端做大范围重构。
5. 改完必须运行 `npm run build`。
6. 如果 build 报错，只修必要错误，不顺手重构业务。
7. 对不确定的模块，先扫描代码并在回复里说明不确定点。

## 2. 数据规则

1. 不允许新增重复数据源。
2. 不允许给顾客端、接单员端、管理端分别写三套假数据。
3. 三端必须使用 shared store/localStorage。
4. 当前主 store key 是 `xiaoluoke_customer_mvp_store`。
5. 所有关键业务数据必须尽量进入 `StoreShape` 或统一 shared store。
6. 管理端的任何列表、详情、统计、操作，都必须读取真实共享数据。
7. 管理端操作必须同步影响顾客端和接单员端。
8. 管理端关键操作必须写入 `admin_logs`。

## 3. 禁止内容

1. 不接 MongoDB。
2. 不接真实微信支付。
3. 不接真实支付宝支付。
4. 不接真实短信。
5. 不接真实 COS/OSS 上传。
6. 不接真实企业微信 API。
7. 不接真实公众号 H5 授权。
8. 不接真实接单员小程序提现。
9. 不改成微信小程序。
10. 不写 `wx.login`、小程序云开发、小程序页面逻辑。
11. 不恢复“分销、应用、装修、广告投放、裂变、邀请返佣、推广海报”等无关模块。
12. 不使用“打手”文案，统一使用“接单员”。

## 4. 三端互通规则

以下模块必须三端联动：

1. 商品：管理端上下架/编辑/分类后，顾客端同步。
2. 分类：管理端排序/上下架后，顾客端同步。
3. 订单：顾客下单、接单员接单、管理端处理，三端同步。
4. 聊天：顾客和接单员共用 chat_session/chat_messages，管理端读取。
5. 钱包：充值、下单、冻结、结算、退款、打赏、提现、保证金、管理员调整都写 wallet_ledger。
6. 接单员：管理端冻结、等级、头像、昵称、保证金、余额、抽成后，顾客端和接单员端同步。
7. 公告：管理端发布后，顾客端和接单员端按 visibleTo 同步。
8. 设置：管理端保存后，顾客端和接单员端读取同一设置。
9. 权限：管理端菜单、路由、按钮、危险操作都受权限控制。
10. 反馈/投诉/售后/评价：已统一进入 `feedback_tickets`、`order_complaints`、`aftersale_orders`、`order_reviews`，订单状态、评价、纠纷处理需要在三端相关页面同步。

## 5. 订单与财务规则

1. 服务订单只创建一条共享订单记录。
2. 打赏订单也是订单，`orderType = "tip"`。
3. 顾客洛克贝下单：扣 availableBalance，加 frozenBalance，订单 pending，写流水。
4. 接单员接单：订单 accepted，写 workerId/workerName，聊天 session active。
5. 接单员完成：订单 worker_completed。
6. 顾客确认：订单 settled，释放冻结，增加消费，更新会员等级，增加接单员收益，写流水。
7. 顾客确认结单需要五星评价，可附带简单文字评论和匿名状态，评价写入 `order_reviews`。
8. 顾客有疑问或投诉：订单可打 `complaintFlag` 并进入 `order_complaints`，必要时订单状态显示 `disputed`，等待管理端处理。
9. 管理员结单/退款/关闭/恢复必须更新 orders、wallet、chat_messages、admin_logs。
10. 平台抽成使用统一 `platformCommissionRate`，不再使用手游端/PC端两套抽成 UI。
11. 商品固定接单员收益优先；否则用接单员抽成；否则用系统默认抽成。
12. 订单/钱包/退款/状态一致性已完成：订单新增并迁移 `refundAmount`、`refundStatus`、`refundedAt`、`cancelledAt`、`refundRemark`。
13. 管理端退款、关闭、恢复、标记疑问已加入状态限制。
14. 已支付未完成订单关闭时会释放冻结余额、返还顾客本地余额、写 `order_refund` 流水、更新退款字段、写聊天系统消息和 `admin_logs`。
15. 未支付订单关闭不产生退款流水；退款会更新顾客余额、冻结、钱包流水。
16. 已结算订单退款会扣减顾客累计消费，并写接单员佣金/平台抽成反向流水或异常说明。
17. 恢复订单只允许未退款的已关闭订单恢复；标记疑问不触碰财务。
18. 售后 `resolved` 会做本地模拟退款并同步 `after_sale_refunded`；`complaintFlag` / `aftersaleFlag` 已根据活跃记录计算。
19. Dashboard、订单统计、商品 GMV、订单 AOV、财务退款/未结算/支付退款统计口径已收紧。
20. 真实微信/支付宝退款仍是占位；`payment_records` 未新增，支付记录仍由订单、充值、钱包流水派生。

## 6. 权限规则

1. 默认管理员是 `admin / 0000`。
2. 当前权限是前端 localStorage MVP，不是真实安全系统。
3. 必须封装和复用 `hasPermission`、`requirePermission`、`canAccessAdminPath` 等逻辑。
4. 权限必须控制：
   - 左侧菜单
   - 页面访问
   - 按钮显示
   - 操作执行
5. 不能只隐藏按钮，危险操作本身也要检查权限。
6. 超级管理员不能被删除、禁用、取消超级权限。
7. 当前登录管理员不能删除或禁用自己。
8. 权限相关操作必须写入 admin_logs。
9. 管理端权限与危险操作一致性已完成：危险操作权限已补齐，UI 层已对无权限按钮隐藏或 disabled，执行层已加 `requirePermission` / `requireAnyPermission`。
10. 已覆盖订单、用户、接单员、商品、分类、财务、提现、反馈、投诉、售后、评价、角色、管理员等危险操作。
11. 新增或补齐权限点包括 `orders.restore`、`orders.mark_issue`、`orders.update_status`、`orders.delete`、`users.export`、`workers.export`、`finance.wallet.adjust`、`feedback.reviews.hide`、`feedback.reviews.restore`、`permissions.roles.create/edit/delete`、`permissions.admin_users.create/edit/delete` 等。
12. `orders.delete` 只补权限点，未新增删除订单业务函数；导出仍是 MVP 占位；`/admin/permissions/menus` 仍按 `permissions.menus.manage` 控制，未拆更细权限。

## 7. 设置模块规则

1. 设置模块统一数据源已完成：当前设置模块统一使用 `StoreShape.system_settings`，持久化在主 store key `xiaoluoke_customer_mvp_store` 内。
2. 不允许新增独立写入的 `xiaoluoke_system_settings` localStorage key；若代码中保留该名称，只能作为旧数据读取/迁移兼容。
3. 不允许顾客端、接单员端、管理端各自维护设置。
4. 企业微信客服、公众号 H5、微信支付、小程序支付、接单员小程序提现只预留字段，不接真实服务。
5. 支付配置中密钥、证书、Secret 不能明文展示。
6. 客服配置不能写死真实手机号、银行卡、身份证等敏感信息。
7. 保存设置必须写 admin_logs。
8. 会员等级配置并入 shared store 已完成，不再作为设置模块后续优先项。

## 8. 会员等级规则

1. 会员等级配置并入 shared store 已完成，统一使用 `StoreShape.member_level_settings`，持久化在主 store key `xiaoluoke_customer_mvp_store` 内。
2. `member_level_settings` 字段至少包括 `id`、`name`、`minSpend`、`discountRate`、`upgradeReward`、`enabled`、`sort`、`createdAt`、`updatedAt`。
3. 不允许重新把 `xiaoluoke_admin_member_level_settings` 作为主要数据源；该 key 只能作为旧数据迁移来源。
4. `readStore()` 初始化时会迁移旧 key 到主 store，并移除旧 key。
5. `calculateMemberLevel` / `nextLevelGap` 必须读取统一会员等级规则。
6. 管理端会员等级页面保存后必须影响顾客端等级展示和下单折扣，保存时写入 `admin_logs` 并触发 `xiaoluoke_store_updated`。
7. 本轮会员等级修改后 `npm run build` 已通过。

## 9. 投诉 / 反馈 / 售后 / 评价规则

1. 投诉 / 反馈 / 售后 / 评价闭环已完成，统一持久化在主 store key `xiaoluoke_customer_mvp_store` 内。
2. `feedback_tickets` 用于普通反馈、疑问咨询、功能建议。
3. `order_complaints` 用于订单投诉和订单疑问，必须关联 `orderId`、`customerId`、`workerId`。
4. `aftersale_orders` 用于售后申请，必须关联 `orderId`、`customerId`、`workerId`、`refundAmount`、`reason`、`status`。
5. `order_reviews` 用于订单评价，必须关联 `orderId`、`customerId`、`workerId`、`rating`、`content`、`isAnonymous`、`status`。
6. 订单已增加 `complaintFlag`、`aftersaleFlag`、`reviewId`，只做轻量联动，不大改待支付、待接单、服务中、待确认、已完成、已取消流程。
7. 接单员已增加 `ratingAvg`、`reviewCount`，接单员评分展示可读取 `order_reviews`。
8. 顾客端 `/customer/report`、`/customer/after-sale`、`/customer/order/[id]` 已接入反馈、投诉、售后、评价。
9. 接单员端 `/worker/home`、`/worker/messages`、`/worker/order/[id]` 已显示投诉、售后、评价提醒和状态。
10. 管理端 `/admin/feedback`、`/admin/disputes`、`/admin/feedback/reviews` 已可处理反馈、投诉、售后、评价管理。
11. 管理端处理动作必须继续写入 `admin_logs`。
12. 所有新增和处理动作必须继续触发 `xiaoluoke_store_updated`。
13. 真实退款到账、真实客服、短信、微信支付、企业微信、COS/OSS 图片上传、复杂评价审核流仍为占位，不要在联动检查中顺手接真实服务。

## 10. 下一轮优先项

1. 设置模块统一数据源已完成。
2. 会员等级配置并入 shared store 已完成。
3. 投诉 / 反馈 / 售后 / 评价闭环已完成。
4. 管理端权限与危险操作一致性已完成。
5. 订单/钱包/退款/状态一致性已完成。
6. 下一轮建议做“小问题清理与上线前检查”，包括 `/customer/must-read` 同步设置、旧提现页面文案统一、接单员钱包流水正负号显示、全站“打手”文案检查。
7. 不要顺手接真实退款到账、真实提现、真实支付、短信、企业微信、COS/OSS 或 MongoDB。
8. 不要重做设置、会员等级、投诉/反馈/售后/评价闭环、权限结构或订单状态机。

## 11. 文案与 UI 规则

1. 后台可以参考第三方截图的信息架构和布局，但不能复制品牌、Logo、文案和独特视觉。
2. 所有“打手”必须改成“接单员”。
3. 不要加入分销、营销推广、广告投放、裂变等用户没有要求的模块。
4. 顾客端保持移动端 H5 风格。
5. 接单员端保持移动端 H5 风格。
6. 管理端保持桌面后台风格。
7. 不要为了 UI 改动破坏业务流程。

## 12. Git 与部署规则

1. 没有用户明确要求，不要自动提交、推送或部署。
2. 不要删除用户已有文件。
3. 不要使用 destructive git 命令。
4. 腾讯云/Vercel 部署属于单独任务，不能夹带在功能开发中。
