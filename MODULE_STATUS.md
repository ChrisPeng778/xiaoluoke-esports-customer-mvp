# 小洛克电竞模块状态表

生成时间：2026-05-06  
说明：本表基于当前对话上下文压缩后的记忆和代码扫描结果。状态为“部分完成”或“不确定”的模块，继续开发前必须重新阅读对应代码。

| 模块 | 状态 | 当前确认 | 不确定 / 待补齐 |
|---|---|---|---|
| 项目基础结构 | 已完成 | Next.js App Router、React、Tailwind 项目结构存在，三端路由均在 `src/app` 下；本轮 `npm run build` 已通过并生成 77 个页面/API 路由。 | 需要持续确认后续修改后的 build 状态。 |
| shared store / localStorage | 部分完成 | `src/lib/store.ts` 和 `src/lib/types.ts` 已包含主 store、session、三端大量业务函数；`system_settings` 已并入 `xiaoluoke_customer_mvp_store`；会员等级配置已新增 `member_level_settings` 并并入主 store。`xiaoluoke_admin_member_level_settings` 不再作为主要数据源，只作为旧数据迁移来源；`readStore()` 初始化时会迁移旧 key 到主 store，并移除旧 key。 | 投诉 / 反馈 / 售后 / 评价闭环尚未修复，下一轮建议优先处理。 |
| 顾客端首页/分类/商品 | 部分完成 | `/customer/home`、`/customer/categories`、`/customer/product/[id]` 存在。商品、分类、图片逻辑曾多次调整。 | 商品分类顺序、商品清单、下架分类联动需人工确认。 |
| 顾客端下单/订单/详情 | 部分完成 | `/customer/order-confirm/[productId]`、`/customer/orders`、`/customer/order/[id]` 存在，store 有下单、结单、疑问逻辑。 | 五星评价是否所有 UI 都稳定，需要浏览器确认。 |
| 顾客端充值 | 已完成 | `/customer/recharge` 存在，store 有 `validateRechargeAmount`、`rechargeCurrentCustomer`。 | 充值套餐是否已接入顾客端，需确认。 |
| 顾客端打赏 | 已完成 / 待体验验证 | `/customer/tip/[workerId]` 存在，store 有 `createTipOrder`，已读取 `system_settings.tip` 的开关和快捷金额，并读取可用支付方式。 | 多浏览器实际交互仍可人工验证。 |
| 顾客端聊天 | 已完成 | `/customer/chat/[orderId]` 存在，store 有文字/图片消息和模拟接单员回复。 | 跨两个浏览器窗口实时同步需要人工测试。 |
| 顾客端 profile | 部分完成 | `/customer/profile` 存在，头像、昵称、订单入口多次调整。 | 是否完全移除分销佣金/我的分销/商务合作需确认。 |
| 接单员端登录/首页 | 部分完成 | `/worker/login`、`/worker/home` 存在，store 有 mockWorkerLogin 和在线状态更新；接单员端已读取基础设置、客服、最低保证金和保证金规则。 | 冻结拦截、公告联动需确认。 |
| 接单员端订单 | 部分完成 | `/worker/orders`、`/worker/order/[id]` 存在，store 有接单、完成订单逻辑。 | 与顾客端/管理端多窗口同步需人工测试。 |
| 接单员端聊天 | 已完成 | `/worker/chat/[orderId]` 存在，store 有接单员发送文本/图片。 | 图片存储为 base64，仅测试用。 |
| 接单员端资料 | 部分完成 | `/worker/profile` 存在，store 有头像、名称、说明修改。 | 用户要求删除评价/动态，需确认最终页面。 |
| 接单员端钱包/提现 | 部分完成 | `/worker/wallet` 存在，withdraw_requests 类型和管理函数存在；已读取 `system_settings.finance` 的最低提现金额、手续费、留存金额、提现方式。 | 当前只创建提现申请并预留接口，不接真实打款或小程序提现。 |
| 管理端登录 | 部分完成 | `/admin/login` 存在，store 有 adminLogin/adminLogout/session。 | 权限路由拦截是否覆盖所有管理端页面需确认。 |
| 管理端布局 | 部分完成 | `src/components/admin/AdminLayout.tsx` 存在。 | 左侧菜单是否完全移除无关“分销/应用/装修”需持续确认。 |
| 管理端统计面板 | 部分完成 | `/admin/dashboard`、`/admin/order-statistics` 存在；综合面板已读取经营目标设置展示进度。 | KPI、图表、风险告警、智能洞察是否全按真实数据实现需确认。 |
| 管理端订单管理 | 部分完成 | `/admin/orders`、`/admin/order/[id]`、`/admin/orders/create` 存在；store 有 adminCreateOrder/adminSettleOrder/adminRefundOrder。 | 筛选、详情进度条、聊天记录、费用明细是否完整需确认。 |
| 管理端用户管理 | 部分完成 | `/admin/users`、`/admin/user/[id]`、`/admin/users/member-levels` 存在；会员等级页面已读取和保存 `StoreShape.member_level_settings`，保存后会写入 `admin_logs`、触发 `xiaoluoke_store_updated`，并影响顾客端等级展示和下单折扣。`calculateMemberLevel` / `nextLevelGap` 已读取统一会员等级规则。本轮 `npm run build` 已通过。 | 用户详情/列表仍需后续浏览器体验验证；投诉 / 反馈 / 售后 / 评价闭环尚未修复。 |
| 管理端商品管理 | 部分完成 | `/admin/products`、`/admin/product/[id]`、`/admin/product/create`、`/admin/product-categories` 存在，store 有商品 CRUD 和分类 CRUD。 | 商品新增/编辑/分类弹窗/推荐排序/销售数据是否完全完成需确认。 |
| 管理端接单员管理 | 部分完成 | `/admin/workers`、`/admin/worker/[id]` 存在，store 有资料、冻结、保证金、余额、抽成函数。 | Drawer 五个 Tab、退保/提现记录、统一抽成 UI 需人工确认。 |
| 管理端财务模块 | 部分完成 | `/admin/finance/payments`、`recharge-packages`、`tips`、`ledger`、`withdrawals` 存在，store 有充值套餐、提现、支付视图函数。 | 提现冻结余额、充值套餐同步顾客端、支付详情弹窗需确认。 |
| 管理端公告管理 | 部分完成 | `/admin/announcements` 存在，store 有公告 CRUD、可见范围、已读和 viewCount。 | 顾客端/接单员端公告弹窗和已读逻辑需人工确认。 |
| 管理端权限模块 | 部分完成 | `/admin/permissions/roles`、`admin-users`、`menus` 存在，types/store 有 roles/users/menus/session/permission。 | 按钮权限、路由权限、危险操作权限是否全覆盖需确认。 |
| 管理端设置模块 | 已完成 / 待体验验证 | `/admin/settings/basic` 到 `/admin/settings/resources` 已新增或完善，统一写入 `StoreShape.system_settings`，保存设置写 `admin_logs`。 | 企业微信客服、公众号 H5、微信支付、提现、短信、资源上传仅预留接口和字段，不接真实服务。 |
| 投诉 / 反馈 / 售后 / 评价 | 部分完成 / 不确定 | `/admin/feedback`、`/admin/disputes`、顾客端售后/举报/订单疑问相关路由存在，订单有 disputed、customerRating 字段。 | 闭环尚未修复；独立 feedback/reviews/disputes 数据结构未在 StoreShape 中发现。下一轮建议优先修复该模块。 |
| API 结构 | 部分完成 | `src/app/api` 下有 auth/customer API 占位，并新增企业微信客服、微信支付回调、接单员提现占位入口。 | 当前仍以 localStorage 为主，API 未接数据库，且不接真实第三方服务。 |
| 部署文档/部署准备 | 部分完成 | 之前曾准备 Vercel/香港服务器部署说明。 | 当前请求未扫描 README 等部署文档，需后续单独确认。 |
| 文案规范 | 需要持续检查 | 本次 `rg` 未在 `src` 中发现“打手/分销/应用/装修”关键词。 | 后续新增后台菜单时仍需禁止这些无关模块和“打手”文案。 |
