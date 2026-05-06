"use client";

import { initialStore } from "./mockData";
import type {
  AssignmentType,
  AdminMenu,
  AdminRole,
  AdminSession,
  AdminUser,
  AdminLog,
  Announcement,
  AnnouncementStatus,
  AnnouncementType,
  AnnouncementVisibleTo,
  ChatMessage,
  ChatMessageType,
  ChatSession,
  CustomerSession,
  DepositRefundRequest,
  LedgerDirection,
  LedgerType,
  MemberLevel,
  Order,
  OrderStatus,
  PaymentRecord,
  PaymentRecordChannel,
  PaymentRecordStatus,
  PaymentMethod,
  Product,
  ProductCategoryRecord,
  ProductCategory,
  RechargePackage,
  RechargeOrder,
  ResourceRecord,
  StoreShape,
  SystemSettings,
  User,
  WalletAccount,
  WalletLedger,
  Worker,
  WorkerLevel,
  ServicePort,
  WorkerSession,
  WithdrawRequest,
  WithdrawStatus,
} from "./types";

const STORE_KEY = "xiaoluoke_customer_mvp_store";
const SESSION_KEY = "xiaoluoke_customer_mvp_current_user_id";
const WORKER_SESSION_KEY = "xiaoluoke_worker_mvp_current_worker_id";
const ADMIN_SESSION_KEY = "xiaoluoke_admin_session";
const LEGACY_ADMIN_SESSION_KEY = "xiaoluoke_admin_mvp_logged_in";
const LEGACY_SYSTEM_SETTINGS_KEY = "xiaoluoke_system_settings";
export const STORE_UPDATED_EVENT = "xiaoluoke_store_updated";

const now = () => new Date().toISOString();

const freshInitialStore = (): StoreShape => JSON.parse(JSON.stringify(initialStore)) as StoreShape;

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const makeNo = (prefix: string) => {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  return `${prefix}${ymd}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

const makeDisplayId = () => String(2200 + Math.floor(Math.random() * 7800));

const makeStatusHistory = (status: string, title: string, operator: "customer" | "worker" | "admin" | "system", detail?: string) => ({
  id: makeId("status"),
  status,
  title,
  detail,
  operator,
  createdAt: now(),
});

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const formatRock = (value: number) =>
  money(value).toLocaleString("zh-CN", {
    minimumFractionDigits: Number.isInteger(money(value)) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const formatCurrency = (value: number) =>
  money(value).toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  });

export const formatTime = (iso?: string) => {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

export function isProductActive(product: Pick<Product, "status" | "deleted">) {
  return !product.deleted && (product.status === "on" || product.status === "active");
}

export function productStatusLabel(status: Product["status"]) {
  return status === "on" || status === "active" ? "上架" : "下架";
}

export function calculateMemberLevel(totalSpent: number): MemberLevel {
  if (totalSpent >= 1000) return "顶级会员";
  if (totalSpent >= 500) return "高级会员";
  if (totalSpent >= 200) return "中级会员";
  return "普通会员";
}

export function nextLevelGap(totalSpent: number) {
  if (totalSpent < 200) return { next: "中级会员", gap: money(200 - totalSpent), progress: totalSpent / 200 };
  if (totalSpent < 500) return { next: "高级会员", gap: money(500 - totalSpent), progress: (totalSpent - 200) / 300 };
  if (totalSpent < 1000) return { next: "顶级会员", gap: money(1000 - totalSpent), progress: (totalSpent - 500) / 500 };
  return { next: "已达最高等级", gap: 0, progress: 1 };
}

function hasStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function cloneSettings(settings: SystemSettings): SystemSettings {
  return JSON.parse(JSON.stringify(settings)) as SystemSettings;
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object") return base;
  const output = Array.isArray(base) ? [...base] : { ...(base as Record<string, unknown>) };
  Object.entries(patch as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined) return;
    const current = (output as Record<string, unknown>)[key];
    if (Array.isArray(current)) {
      (output as Record<string, unknown>)[key] = Array.isArray(value) ? value : current;
    } else if (current && typeof current === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      (output as Record<string, unknown>)[key] = deepMerge(current, value);
    } else {
      (output as Record<string, unknown>)[key] = value;
    }
  });
  return output as T;
}

function normalizeTipAmounts(amounts: unknown): number[] {
  const raw = Array.isArray(amounts) ? amounts : initialStore.system_settings.tip.quickAmounts;
  const values = Array.from(new Set(raw.map((amount) => money(Number(amount))).filter((amount) => amount >= 0.01 && amount <= 9999.99)));
  return (values.length ? values : [10]).sort((a, b) => a - b).slice(0, 8);
}

function normalizePaymentChannels(settings: SystemSettings) {
  const defaults = initialStore.system_settings.payment.channels;
  settings.payment.channels = defaults.map((defaultChannel) => {
    const existing = settings.payment.channels.find((channel) => channel.key === defaultChannel.key);
    return { ...defaultChannel, ...existing };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

function migrateSystemSettings(raw?: Partial<SystemSettings>): SystemSettings {
  let settings = deepMerge(cloneSettings(initialStore.system_settings), raw ?? {});
  if (!raw && hasStorage()) {
    try {
      const legacy = window.localStorage.getItem(LEGACY_SYSTEM_SETTINGS_KEY);
      if (legacy) settings = deepMerge(settings, JSON.parse(legacy) as Partial<SystemSettings>);
    } catch {
      settings = cloneSettings(initialStore.system_settings);
    }
  }
  settings.tip.quickAmounts = normalizeTipAmounts(settings.tip.quickAmounts);
  settings.worker.minimumDepositAmount = Math.max(0, money(Number(settings.worker.minimumDepositAmount) || 0));
  settings.finance.minimumWithdrawAmount = Math.max(0, money(Number(settings.finance.minimumWithdrawAmount) || 0));
  settings.finance.withdrawFeeRate = Math.max(0, Math.min(0.5, Number(settings.finance.withdrawFeeRate) || 0));
  settings.finance.walletReserveAmount = Math.max(0, money(Number(settings.finance.walletReserveAmount) || 0));
  settings.notification.unreadChatReminderMinutes = Math.max(0, Math.round(Number(settings.notification.unreadChatReminderMinutes) || 0));
  settings.notification.unacceptedOrderReminderMinutes = Math.max(0, Math.round(Number(settings.notification.unacceptedOrderReminderMinutes) || 0));
  settings.order.paymentTimeoutMinutes = Math.max(1, Math.round(Number(settings.order.paymentTimeoutMinutes) || 30));
  settings.order.autoConfirmHours = Math.max(1, Math.round(Number(settings.order.autoConfirmHours) || 72));
  normalizePaymentChannels(settings);
  return settings;
}

function migrateResourceRecord(raw: Partial<ResourceRecord>, index = 0): ResourceRecord {
  const rawType = raw.type;
  const type = rawType === "image" || rawType === "video" || rawType === "audio" || rawType === "file" ? rawType : "image";
  return {
    id: raw.id ?? makeId("resource"),
    name: raw.name?.trim() || `资源 ${index + 1}`,
    type,
    url: raw.url?.trim() || "",
    size: Number(raw.size ?? 0) || 0,
    createdAt: raw.createdAt ?? now(),
  };
}

function migrateProduct(raw: Partial<Product> & { price?: number; enabled?: boolean }, index: number): Product {
  const seed = initialStore.products[index % initialStore.products.length];
  const rawCategory = raw.category as string | undefined;
  const category =
    rawCategory === "趣味单"
      ? "陪玩专区"
      : rawCategory === "异色单"
        ? "异色专区"
        : rawCategory === "资源单"
          ? "资源专区"
          : raw.category ?? seed.category;
  const status = raw.status ?? (raw.enabled === false ? "off" : seed.status ?? "on");
  const priceRmb = money(raw.priceRmb ?? raw.price ?? seed.priceRmb);
  const priceLockeCoin = money(raw.priceLockeCoin ?? raw.price ?? seed.priceLockeCoin);
  return {
    id: raw.id ?? seed.id,
    name: raw.name ?? seed.name,
    shortDescription: raw.shortDescription ?? seed.shortDescription ?? raw.description ?? seed.description,
    category,
    categoryId: raw.categoryId ?? seed.categoryId ?? category,
    priceRmb,
    priceLockeCoin,
    costPrice: money(raw.costPrice ?? seed.costPrice ?? 0),
    sales: raw.sales ?? seed.sales,
    virtualSales: raw.virtualSales ?? seed.virtualSales ?? 0,
    realSales: raw.realSales ?? raw.sales ?? seed.realSales ?? seed.sales ?? 0,
    imageUrl: raw.imageUrl || seed.imageUrl,
    homeImageUrl: raw.homeImageUrl ?? seed.homeImageUrl,
    detailImages: raw.detailImages ?? seed.detailImages ?? [],
    tags: raw.tags ?? seed.tags,
    description: raw.description ?? seed.description,
    serviceDescription: raw.serviceDescription ?? seed.serviceDescription,
    servicePort: raw.servicePort ?? seed.servicePort ?? "mobile",
    sortOrder: raw.sortOrder ?? seed.sortOrder ?? 0,
    isRecommended: raw.isRecommended ?? seed.isRecommended ?? false,
    purchaseLimitEnabled: raw.purchaseLimitEnabled ?? seed.purchaseLimitEnabled ?? false,
    purchaseLimitPerUser: raw.purchaseLimitPerUser ?? seed.purchaseLimitPerUser ?? 1,
    deleted: raw.deleted ?? seed.deleted ?? false,
    workerIncomeType: raw.workerIncomeType ?? seed.workerIncomeType ?? "fixed",
    workerIncomeAmount: money(raw.workerIncomeAmount ?? seed.workerIncomeAmount ?? priceLockeCoin),
    estimatedDuration: raw.estimatedDuration ?? seed.estimatedDuration ?? "预计 24 小时内完成",
    requireGameId: raw.requireGameId ?? seed.requireGameId ?? true,
    requireGameNickname: raw.requireGameNickname ?? seed.requireGameNickname ?? true,
    requireRemark: raw.requireRemark ?? seed.requireRemark ?? false,
    allowAssignedWorker: raw.allowAssignedWorker ?? seed.allowAssignedWorker ?? true,
    status,
    createdAt: raw.createdAt ?? seed.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? seed.updatedAt ?? seed.createdAt,
  };
}

function defaultProductCategories(): ProductCategoryRecord[] {
  const createdAt = "2026-05-03T00:00:00.000Z";
  const roots: Array<{ id: string; name: ProductCategory; sortOrder: number }> = [
    { id: "cat-shiny", name: "异色专区", sortOrder: 10 },
    { id: "cat-pvp", name: "PVP专区", sortOrder: 20 },
    { id: "cat-play", name: "陪玩专区", sortOrder: 30 },
    { id: "cat-resource", name: "资源专区", sortOrder: 40 },
  ];
  const children: Array<{ parentId: string; name: string; sortOrder: number }> = [
    { parentId: "cat-shiny", name: "指定异色", sortOrder: 11 },
    { parentId: "cat-shiny", name: "随机异色", sortOrder: 12 },
    { parentId: "cat-shiny", name: "全部异色", sortOrder: 13 },
    { parentId: "cat-pvp", name: "见习-初级", sortOrder: 21 },
    { parentId: "cat-pvp", name: "初级-中级", sortOrder: 22 },
    { parentId: "cat-pvp", name: "中级-高级", sortOrder: 23 },
    { parentId: "cat-pvp", name: "高级-特级", sortOrder: 24 },
    { parentId: "cat-pvp", name: "特级-首席", sortOrder: 25 },
    { parentId: "cat-pvp", name: "首席-大师", sortOrder: 26 },
    { parentId: "cat-play", name: "娱乐陪", sortOrder: 31 },
    { parentId: "cat-play", name: "技术陪", sortOrder: 32 },
    { parentId: "cat-resource", name: "等级提升", sortOrder: 41 },
    { parentId: "cat-resource", name: "精灵球", sortOrder: 42 },
    { parentId: "cat-resource", name: "日常托管", sortOrder: 43 },
    { parentId: "cat-resource", name: "全力托管", sortOrder: 44 },
    { parentId: "cat-resource", name: "活动福利", sortOrder: 45 },
  ];
  return [
    ...roots.map((item) => ({ ...item, parentId: null, iconUrl: "", status: "on" as const, createdAt })),
    ...children.map((item) => ({ id: `cat-${item.parentId}-${item.sortOrder}`, ...item, iconUrl: "", status: "on" as const, createdAt })),
  ];
}

function migrateProductCategory(raw: Partial<ProductCategoryRecord>, index: number): ProductCategoryRecord {
  const seed = defaultProductCategories()[index % defaultProductCategories().length];
  return {
    id: raw.id ?? seed.id,
    parentId: raw.parentId ?? seed.parentId ?? null,
    name: raw.name ?? seed.name,
    iconUrl: raw.iconUrl ?? seed.iconUrl ?? "",
    sortOrder: Number(raw.sortOrder ?? seed.sortOrder ?? 0),
    status: raw.status ?? seed.status ?? "on",
    createdAt: raw.createdAt ?? seed.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? seed.updatedAt ?? seed.createdAt ?? now(),
  };
}

function migrateUser(raw: Partial<User> & { username?: string; password?: string }, index: number): User {
  const totalSpent = money(raw.totalSpent ?? 0);
  return {
    id: raw.id ?? makeId("user"),
    openid: raw.openid,
    username: raw.username,
    password: raw.password,
    displayId: raw.displayId ?? String(2201 + index),
    nickname: raw.nickname ?? raw.username ?? "微信用户",
    nicknameEditable: raw.nicknameEditable ?? true,
    avatarUrl: raw.avatarUrl ?? "",
    role: raw.role ?? "customer",
    status: raw.status ?? "active",
    adminRemark: raw.adminRemark,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now(),
    memberLevel: raw.memberLevel ?? calculateMemberLevel(totalSpent),
    totalSpent,
    availableBalance: money(raw.availableBalance ?? 0),
    frozenBalance: money(raw.frozenBalance ?? 0),
    createdAt: raw.createdAt ?? now(),
  };
}

function migrateWallet(raw: Partial<WalletAccount>, user?: User): WalletAccount {
  const totalSpent = money(raw.totalSpent ?? user?.totalSpent ?? 0);
  return {
    id: raw.id ?? makeId("wallet"),
    userId: raw.userId ?? user?.id ?? makeId("unknown"),
    ownerType: raw.ownerType ?? user?.role ?? "customer",
    availableBalance: money(raw.availableBalance ?? user?.availableBalance ?? 0),
    frozenBalance: money(raw.frozenBalance ?? user?.frozenBalance ?? 0),
    totalSpent,
    totalEarned: money(raw.totalEarned ?? 0),
    memberLevel: raw.memberLevel ?? calculateMemberLevel(totalSpent),
    updatedAt: raw.updatedAt ?? now(),
  };
}

function migrateWorker(raw: Partial<Worker>, index: number): Worker {
  const seed = initialStore.workers[index % initialStore.workers.length];
  return {
    id: raw.id ?? seed.id,
    userName: raw.userName ?? seed.userName ?? "",
    name: raw.name ?? seed.name,
    avatarUrl: raw.avatarUrl ?? seed.avatarUrl,
    gender: raw.gender ?? seed.gender ?? "unknown",
    gameId: raw.gameId ?? seed.gameId ?? "",
    gameNickname: raw.gameNickname ?? seed.gameNickname ?? "",
    level: raw.level ?? seed.level,
    onlineStatus: raw.onlineStatus ?? seed.onlineStatus,
    status: raw.status ?? "normal",
    depositStatus: raw.depositStatus ?? seed.depositStatus ?? "unpaid",
    servicePort: raw.servicePort ?? seed.servicePort ?? "both",
    depositAmount: money(raw.depositAmount ?? seed.depositAmount ?? (raw.depositStatus === "paid" ? 100 : 0)),
    platformCommissionRate: raw.platformCommissionRate ?? seed.platformCommissionRate ?? 0,
    createdAt: raw.createdAt ?? seed.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? seed.updatedAt ?? raw.createdAt ?? now(),
    intro: raw.intro ?? seed.intro,
    completedOrderCount: raw.completedOrderCount ?? seed.completedOrderCount,
    rating: raw.rating ?? seed.rating,
    dynamicText: raw.dynamicText ?? seed.dynamicText,
    availableBalance: money(raw.availableBalance ?? seed.availableBalance ?? 0),
    totalEarned: money(raw.totalEarned ?? seed.totalEarned ?? 0),
    serviceIncome: money(raw.serviceIncome ?? seed.serviceIncome ?? 0),
    tipIncome: money(raw.tipIncome ?? seed.tipIncome ?? 0),
  };
}

function migrateOrder(raw: Partial<Order> & { amount?: number; userId?: string }, index: number): Order {
  const amountLockeCoin = money(raw.amountLockeCoin ?? raw.amount ?? raw.amountRmb ?? 1);
  return {
    id: raw.id ?? makeId("order"),
    orderNo: raw.orderNo ?? makeNo(index % 2 === 0 ? "XLK" : "TIP"),
    orderType: raw.orderType ?? "service",
    userId: raw.userId ?? raw.customerId,
    customerId: raw.customerId ?? raw.userId ?? "",
    customerName: raw.customerName ?? "微信用户",
    productId: raw.productId,
    productName: raw.productName,
    productDescription: raw.productDescription,
    productImageUrl: raw.productImageUrl,
    productCategory: raw.productCategory,
    productSnapshot: raw.productSnapshot,
    servicePort: raw.servicePort ?? "mobile",
    customProductInfo: raw.customProductInfo,
    workerId: raw.workerId ?? raw.specifiedWorkerId ?? null,
    workerName: raw.workerName ?? raw.specifiedWorkerName ?? null,
    gameNickname: raw.gameNickname,
    gameId: raw.gameId,
    quantity: raw.quantity ?? 1,
    remark: raw.remark,
    assignmentType: raw.assignmentType ?? "random",
    specifiedWorkerId: raw.specifiedWorkerId ?? null,
    specifiedWorkerName: raw.specifiedWorkerName ?? null,
    paymentMethod: raw.paymentMethod ?? "locke_coin",
    paymentStatus: raw.paymentStatus ?? (raw.paidAt || raw.status !== "unpaid" ? "paid" : "unpaid"),
    assignedByAdmin: raw.assignedByAdmin ?? false,
    amountRmb: money(raw.amountRmb ?? amountLockeCoin),
    amountLockeCoin,
    amount: amountLockeCoin,
    status: raw.status ?? "pending",
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now(),
    paidAt: raw.paidAt,
    assignedAt: raw.assignedAt,
    startedAt: raw.startedAt,
    submittedAt: raw.submittedAt,
    settledAt: raw.settledAt,
    statusHistory: raw.statusHistory ?? [],
    customerRating: raw.customerRating,
    ratedAt: raw.ratedAt,
  };
}

function migrateChatSession(raw: Partial<ChatSession>): ChatSession {
  return {
    id: raw.id ?? makeId("chat_session"),
    orderId: raw.orderId ?? "",
    customerId: raw.customerId ?? "",
    workerId: raw.workerId ?? null,
    workerName: raw.workerName ?? null,
    status: raw.status ?? (raw.workerId ? "active" : "waiting_worker"),
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now(),
  };
}

function migrateChatMessage(raw: Partial<ChatMessage>): ChatMessage {
  return {
    id: raw.id ?? makeId("chat_msg"),
    sessionId: raw.sessionId ?? "",
    orderId: raw.orderId ?? "",
    senderId: raw.senderId ?? "system",
    senderRole: raw.senderRole ?? "system",
    senderName: raw.senderName ?? "系统",
    messageType: raw.messageType ?? (raw.imageUrl ? "image" : "text"),
    content: raw.content ?? "",
    imageUrl: raw.imageUrl,
    createdAt: raw.createdAt ?? now(),
    isRead: raw.isRead ?? true,
  };
}

function migrateWithdrawRequest(raw: Partial<WithdrawRequest>): WithdrawRequest {
  const legacyStatus = raw.status === "completed" ? "paid" : raw.status;
  return {
    id: raw.id ?? makeId("withdraw"),
    requestNo: raw.requestNo ?? makeNo("WD"),
    workerId: raw.workerId ?? "",
    workerName: raw.workerName ?? "接单员",
    amountLockeCoin: money(raw.amountLockeCoin ?? 0),
    feeLockeCoin: money(raw.feeLockeCoin ?? 0),
    actualAmountLockeCoin: money(raw.actualAmountLockeCoin ?? raw.amountLockeCoin ?? 0),
    receiveInfo: raw.receiveInfo,
    remark: raw.remark,
    status: legacyStatus ?? "pending",
    adminRemark: raw.adminRemark,
    createdAt: raw.createdAt ?? now(),
    approvedAt: raw.approvedAt,
    rejectedAt: raw.rejectedAt,
    paidAt: raw.paidAt ?? raw.completedAt,
    completedAt: raw.completedAt,
  };
}

function migrateDepositRefundRequest(raw: Partial<DepositRefundRequest>): DepositRefundRequest {
  return {
    id: raw.id ?? makeId("deposit_refund"),
    workerId: raw.workerId ?? "",
    workerName: raw.workerName ?? "接单员",
    amountLockeCoin: money(raw.amountLockeCoin ?? 0),
    status: raw.status ?? "pending",
    reason: raw.reason,
    adminRemark: raw.adminRemark,
    createdAt: raw.createdAt ?? now(),
    reviewedAt: raw.reviewedAt,
  };
}

function migrateAnnouncement(raw: Partial<Announcement>, index = 0): Announcement {
  const createdAt = raw.createdAt ?? now();
  const status = (raw.status === "archived" || raw.status === "draft" || raw.status === "published") ? raw.status : "published";
  return {
    id: raw.id ?? makeId("announcement"),
    title: raw.title ?? "公告",
    type: raw.type ?? "notice",
    visibleTo: raw.visibleTo ?? "all",
    coverImage: raw.coverImage ?? "",
    content: raw.content ?? "",
    isPinned: Boolean(raw.isPinned ?? index === 0),
    sortOrder: Number(raw.sortOrder ?? 0),
    status,
    viewCount: Number(raw.viewCount ?? 0),
    publishAt: raw.publishAt ?? createdAt,
    expireAt: raw.expireAt ?? "",
    deleted: Boolean(raw.deleted ?? false),
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
  };
}

function migrateAdminLog(raw: Partial<AdminLog>): AdminLog {
  const actionType = raw.actionType ?? raw.action ?? "unknown";
  return {
    id: raw.id ?? makeId("admin_log"),
    adminId: raw.adminId,
    adminName: raw.adminName ?? "admin",
    action: raw.action ?? actionType,
    actionType,
    targetType: raw.targetType ?? "system",
    targetId: raw.targetId,
    detail: raw.detail ?? "管理员操作",
    operationAmount: raw.operationAmount,
    remark: raw.remark,
    createdAt: raw.createdAt ?? now(),
  };
}

function migrateAdminRole(raw: Partial<AdminRole>, index = 0): AdminRole {
  const createdAt = raw.createdAt ?? now();
  return {
    id: raw.id ?? makeId("admin_role"),
    name: raw.name ?? `角色 ${index + 1}`,
    code: raw.code ?? `role_${index + 1}`,
    description: raw.description ?? "",
    status: raw.status === "disabled" ? "disabled" : "enabled",
    permissions: Array.isArray(raw.permissions) ? Array.from(new Set(raw.permissions.filter(Boolean))) : [],
    builtIn: Boolean(raw.builtIn),
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
  };
}

function migrateAdminUser(raw: Partial<AdminUser>, index = 0): AdminUser {
  const createdAt = raw.createdAt ?? now();
  return {
    id: raw.id ?? makeId("admin_user"),
    username: raw.username ?? `admin_${index + 1}`,
    password: raw.password ?? "",
    name: raw.name ?? raw.username ?? `管理员 ${index + 1}`,
    avatarUrl: raw.avatarUrl ?? "",
    status: raw.status === "disabled" ? "disabled" : "enabled",
    roleIds: Array.isArray(raw.roleIds) ? raw.roleIds : [],
    lastLoginAt: raw.lastLoginAt ?? "",
    lastLoginIp: raw.lastLoginIp ?? "",
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
    builtIn: Boolean(raw.builtIn),
  };
}

function migrateAdminMenu(raw: Partial<AdminMenu>, index = 0): AdminMenu {
  const createdAt = raw.createdAt ?? now();
  return {
    id: raw.id ?? makeId("admin_menu"),
    parentId: raw.parentId ?? null,
    type: raw.type ?? "menu",
    name: raw.name ?? `菜单 ${index + 1}`,
    routeName: raw.routeName ?? "",
    path: raw.path ?? "",
    componentPath: raw.componentPath ?? "",
    icon: raw.icon ?? "",
    externalUrl: raw.externalUrl ?? "",
    activePath: raw.activePath ?? "",
    sortOrder: Number(raw.sortOrder ?? 0),
    visible: Boolean(raw.visible ?? true),
    cache: Boolean(raw.cache ?? false),
    hidden: Boolean(raw.hidden ?? false),
    embedded: Boolean(raw.embedded ?? false),
    hiddenTag: Boolean(raw.hiddenTag ?? false),
    permissionKey: raw.permissionKey ?? "",
    status: raw.status === "hidden" ? "hidden" : "visible",
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
    builtIn: Boolean(raw.builtIn),
  };
}

function collectPermissionKeys(menus: AdminMenu[]) {
  return Array.from(new Set(menus.map((menu) => menu.permissionKey).filter(Boolean))) as string[];
}

function migrateRechargePackage(raw: Partial<RechargePackage>, index = 0): RechargePackage {
  const amountRmb = money(raw.amountRmb ?? 50);
  const bonusLockeCoin = money(raw.bonusLockeCoin ?? 0);
  return {
    id: raw.id ?? makeId("recharge_package"),
    sortOrder: Number(raw.sortOrder ?? (index + 1) * 10),
    amountRmb,
    bonusLockeCoin,
    amountLockeCoin: money(raw.amountLockeCoin ?? amountRmb + bonusLockeCoin),
    status: raw.status ?? "active",
    deleted: Boolean(raw.deleted ?? false),
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt,
  };
}

function ensureStoreShape(parsed: Partial<StoreShape>): StoreShape {
  const fresh = freshInitialStore();
  const users = (parsed.users ?? []).map(migrateUser);
  const wallet_accounts = (parsed.wallet_accounts ?? []).map((wallet) =>
    migrateWallet(wallet, users.find((user) => user.id === wallet.userId)),
  );
  const freshProductIds = fresh.products.map((product) => product.id).join("|");
  const storedProductIds = (parsed.products ?? []).map((product) => product.id).join("|");
  const products =
    parsed.products?.length && storedProductIds === freshProductIds
      ? parsed.products.map(migrateProduct)
      : fresh.products;
  const seededCategories = defaultProductCategories();
  const product_categories = (parsed.product_categories?.length ? parsed.product_categories : seededCategories).map(migrateProductCategory);
  seededCategories.forEach((category) => {
    if (!product_categories.some((item) => item.id === category.id)) product_categories.push(migrateProductCategory(category, product_categories.length));
  });
  const workers = parsed.workers?.length ? parsed.workers.map(migrateWorker) : fresh.workers.map(migrateWorker);
  fresh.workers.forEach((worker) => {
    const existing = workers.find((item) => item.id === worker.id);
    if (existing) {
      if (!existing.name) existing.name = worker.name;
    } else {
      workers.push(migrateWorker(worker, workers.length));
    }
  });
  const announcements = (parsed.announcements?.length ? parsed.announcements : fresh.announcements).map(migrateAnnouncement);
  fresh.announcements.forEach((announcement) => {
    if (!announcements.some((item) => item.id === announcement.id)) announcements.push(migrateAnnouncement(announcement, announcements.length));
  });

  users.forEach((user) => {
    const wallet = wallet_accounts.find((item) => item.userId === user.id);
    if (!wallet) {
      wallet_accounts.push(migrateWallet({}, user));
    } else {
      user.availableBalance = wallet.availableBalance;
      user.frozenBalance = wallet.frozenBalance;
      user.totalSpent = wallet.totalSpent;
      user.memberLevel = wallet.memberLevel;
    }
  });

  workers.forEach((worker) => {
    const wallet = wallet_accounts.find((item) => item.userId === worker.id);
    if (!wallet) {
      wallet_accounts.push({
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance ?? 0),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned ?? 0),
        memberLevel: "普通会员",
        updatedAt: now(),
      });
    } else {
      worker.availableBalance = wallet.availableBalance;
      worker.totalEarned = wallet.totalEarned;
    }
  });
  const recharge_packages = (parsed.recharge_packages?.length ? parsed.recharge_packages : fresh.recharge_packages).map(migrateRechargePackage);
  fresh.recharge_packages.forEach((item) => {
    if (!recharge_packages.some((existing) => existing.id === item.id)) recharge_packages.push(migrateRechargePackage(item, recharge_packages.length));
  });
  const admin_menus = (parsed.admin_menus?.length ? parsed.admin_menus : fresh.admin_menus).map(migrateAdminMenu);
  fresh.admin_menus.forEach((menu) => {
    if (!admin_menus.some((item) => item.id === menu.id)) admin_menus.push(migrateAdminMenu(menu, admin_menus.length));
  });
  const allAdminPermissions = collectPermissionKeys(admin_menus);
  const admin_roles = (parsed.admin_roles?.length ? parsed.admin_roles : fresh.admin_roles).map(migrateAdminRole);
  fresh.admin_roles.forEach((role) => {
    if (!admin_roles.some((item) => item.id === role.id || item.code === role.code)) {
      admin_roles.push(migrateAdminRole(role, admin_roles.length));
    }
  });
  const superRole = admin_roles.find((role) => role.code === "super_admin") ?? admin_roles.find((role) => role.id === "role-super-admin");
  if (superRole) {
    superRole.name = superRole.name || "超级管理员";
    superRole.code = "super_admin";
    superRole.status = "enabled";
    superRole.permissions = allAdminPermissions;
    superRole.builtIn = true;
    superRole.updatedAt = superRole.updatedAt ?? now();
  }
  const admin_users = (parsed.admin_users?.length ? parsed.admin_users : fresh.admin_users).map(migrateAdminUser);
  fresh.admin_users.forEach((user) => {
    if (!admin_users.some((item) => item.id === user.id || item.username === user.username)) {
      admin_users.push(migrateAdminUser(user, admin_users.length));
    }
  });
  const rootAdmin = admin_users.find((user) => user.username === "admin") ?? admin_users.find((user) => user.id === "admin-user-root");
  if (rootAdmin) {
    rootAdmin.username = "admin";
    rootAdmin.password = rootAdmin.password || "0000";
    rootAdmin.name = rootAdmin.name || "管理员";
    rootAdmin.status = "enabled";
    rootAdmin.builtIn = true;
    const superRoleId = superRole?.id ?? "role-super-admin";
    if (!rootAdmin.roleIds.includes(superRoleId)) rootAdmin.roleIds.unshift(superRoleId);
  }
  const system_settings = migrateSystemSettings(parsed.system_settings);
  const resources = (parsed.system_settings?.resources?.records?.length ? parsed.system_settings.resources.records : fresh.system_settings.resources.records).map(migrateResourceRecord);
  fresh.system_settings.resources.records.forEach((resource) => {
    if (!resources.some((item) => item.id === resource.id || item.url === resource.url)) {
      resources.push(migrateResourceRecord(resource, resources.length));
    }
  });
  system_settings.resources.records = resources;

  return {
    users,
    products,
    product_categories,
    workers,
    announcements,
    orders: (parsed.orders ?? []).map(migrateOrder),
    wallet_accounts,
    wallet_ledger: (parsed.wallet_ledger ?? []).map((entry: Partial<WalletLedger> & {
      type?: LedgerType | "recharge";
      orderId?: string;
      title?: string;
      availableChange?: number;
    }) => {
      const legacyType = entry.type as string | undefined;
      return {
        id: entry.id ?? makeId("ledger"),
        userId: entry.userId ?? "",
        type: (legacyType === "recharge" ? "mock_recharge" : entry.type ?? "admin_adjust") as LedgerType,
        direction: entry.direction ?? ((entry.availableChange ?? 0) >= 0 ? "in" : "out"),
        amount: money(entry.amount ?? Math.abs(entry.availableChange ?? 0)),
        beforeBalance: entry.beforeBalance,
        afterBalance: entry.afterBalance,
        targetType: entry.targetType,
        relatedType: entry.relatedType,
        description: entry.description ?? entry.title ?? "钱包流水",
        relatedOrderId: entry.relatedOrderId ?? entry.orderId,
        rechargeOrderId: entry.rechargeOrderId,
        createdAt: entry.createdAt ?? now(),
      };
    }),
    recharge_orders: (parsed.recharge_orders ?? []).map((order: Partial<Omit<RechargeOrder, "status">> & {
      status?: RechargeOrder["status"] | "mock_paid";
      amount?: number;
      rmbAmount?: number;
    }) => {
      const legacyStatus = order.status as string | undefined;
      return {
        id: order.id ?? makeId("recharge"),
        rechargeNo: order.rechargeNo ?? makeNo("RC"),
        userId: order.userId ?? "",
        amountRmb: money(order.amountRmb ?? order.rmbAmount ?? order.amount ?? 0),
        amountLockeCoin: money(order.amountLockeCoin ?? order.amount ?? 0),
        paymentMethod: order.paymentMethod ?? "locke_coin",
        status: (legacyStatus === "mock_paid" ? "paid" : order.status ?? "paid") as RechargeOrder["status"],
        createdAt: order.createdAt ?? now(),
        paidAt: order.paidAt ?? order.createdAt,
      };
    }),
    withdraw_requests: (parsed.withdraw_requests ?? []).map(migrateWithdrawRequest),
    recharge_packages,
    deposit_refunds: (parsed.deposit_refunds ?? []).map(migrateDepositRefundRequest),
    chat_sessions: (parsed.chat_sessions ?? []).map(migrateChatSession),
    chat_messages: (parsed.chat_messages ?? []).map(migrateChatMessage),
    admin_roles,
    admin_users,
    admin_menus,
    admin_logs: (parsed.admin_logs ?? []).map(migrateAdminLog),
    system_settings,
  };
}

export function readStore(): StoreShape {
  if (!hasStorage()) return freshInitialStore();

  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const fresh = freshInitialStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const merged = ensureStoreShape(JSON.parse(raw) as Partial<StoreShape>);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    const fresh = freshInitialStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

export function writeStore(store: StoreShape) {
  if (!hasStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(STORE_UPDATED_EVENT));
}

function updateStore<T>(updater: (store: StoreShape) => T): T {
  const store = readStore();
  const result = updater(store);
  writeStore(store);
  return result;
}

export function getCurrentUserId() {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setCurrentUserId(userId: string) {
  if (!hasStorage()) return;
  window.localStorage.setItem(SESSION_KEY, userId);
}

export function logout() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentWorkerId() {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(WORKER_SESSION_KEY);
}

export function setCurrentWorkerId(workerId: string) {
  if (!hasStorage()) return;
  window.localStorage.setItem(WORKER_SESSION_KEY, workerId);
}

export function logoutWorker() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(WORKER_SESSION_KEY);
}

function legacyAdminSession(): AdminSession {
  const fresh = freshInitialStore();
  return {
    adminId: "admin-user-root",
    username: "admin",
    name: "管理员",
    roles: ["super_admin"],
    permissions: collectPermissionKeys(fresh.admin_menus),
    loginAt: now(),
  };
}

function readRawAdminSession(): AdminSession | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AdminSession | true;
      if (parsed === true) return legacyAdminSession();
      if (parsed && typeof parsed === "object" && "adminId" in parsed) return parsed;
    } catch {
      if (raw === "true") return legacyAdminSession();
    }
  }
  if (window.localStorage.getItem(LEGACY_ADMIN_SESSION_KEY) === "true") return legacyAdminSession();
  return null;
}

function writeAdminSession(session: AdminSession) {
  if (!hasStorage()) return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

function getAdminRolesForUser(store: StoreShape, user: AdminUser) {
  return user.roleIds
    .map((roleId) => store.admin_roles.find((role) => role.id === roleId))
    .filter((role): role is AdminRole => Boolean(role && role.status === "enabled"));
}

function buildAdminSession(store: StoreShape, user: AdminUser, loginAt = now()): AdminSession {
  const roles = getAdminRolesForUser(store, user);
  const roleCodes = roles.map((role) => role.code);
  const permissions = roleCodes.includes("super_admin")
    ? collectPermissionKeys(store.admin_menus)
    : Array.from(new Set(roles.flatMap((role) => role.permissions)));

  return {
    adminId: user.id,
    username: user.username,
    name: user.name,
    roles: roleCodes,
    permissions,
    loginAt,
  };
}

function refreshCurrentAdminSession(store: StoreShape) {
  const raw = readRawAdminSession();
  if (!raw) return;
  const user = store.admin_users.find((item) => item.id === raw.adminId || item.username === raw.username);
  if (!user || user.status !== "enabled") {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    return;
  }
  writeAdminSession(buildAdminSession(store, user, raw.loginAt || now()));
}

export function getCurrentAdminSession(): AdminSession | null {
  const raw = readRawAdminSession();
  if (!raw) return null;
  const store = readStore();
  const user = store.admin_users.find((item) => item.id === raw.adminId || item.username === raw.username);
  if (!user || user.status !== "enabled") {
    if (hasStorage()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    }
    return null;
  }
  const session = buildAdminSession(store, user, raw.loginAt || now());
  writeAdminSession(session);
  return session;
}

export function isAdminLoggedIn() {
  return Boolean(getCurrentAdminSession());
}

export function adminLogin(usernameOrPassword: string, maybePassword?: string): { ok: true } | { ok: false; message: string } {
  const username = maybePassword === undefined ? "admin" : usernameOrPassword.trim();
  const password = maybePassword === undefined ? usernameOrPassword : maybePassword;
  const store = readStore();
  const user = store.admin_users.find((item) => item.username === username);
  if (!user || user.password !== password) return { ok: false, message: "管理员账号或密码不正确" };
  if (user.status !== "enabled") return { ok: false, message: "当前管理员账号已禁用，请联系超级管理员" };

  user.lastLoginAt = now();
  user.lastLoginIp = "127.0.0.1";
  user.updatedAt = user.lastLoginAt;
  const session = buildAdminSession(store, user, user.lastLoginAt);
  store.admin_logs.push({
    id: makeId("admin_log"),
    adminId: user.id,
    adminName: user.name,
    action: "admin_login",
    actionType: "admin_login",
    targetType: "admin_user",
    targetId: user.id,
    detail: `${user.name} 登录管理端`,
    createdAt: now(),
  });
  writeStore(store);
  writeAdminSession(session);
  return { ok: true };
}

export function adminLogout() {
  if (!hasStorage()) return;
  const session = readRawAdminSession();
  if (session) appendAdminLog("admin_logout", "admin_user", session.adminId, `${session.name} 退出管理端`);
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

export function hasPermission(permissionKey?: string) {
  if (!permissionKey) return true;
  const session = getCurrentAdminSession();
  if (!session) return false;
  if (session.roles.includes("super_admin")) return true;
  return session.permissions.includes(permissionKey);
}

export function hasAnyPermission(permissionKeys: string[]) {
  if (!permissionKeys.length) return true;
  return permissionKeys.some((permissionKey) => hasPermission(permissionKey));
}

export function requirePermission(permissionKey: string) {
  if (hasPermission(permissionKey)) return;
  appendAdminLog("permission_denied", "permission", permissionKey, `无权限执行：${permissionKey}`);
  throw new Error("无权限执行该操作，请联系管理员");
}

const ADMIN_PATH_PERMISSIONS: Array<[string, string]> = [
  ["/admin/order-statistics", "statistics.view"],
  ["/admin/dashboard", "dashboard.view"],
  ["/admin/users/member-levels", "users.member_levels.manage"],
  ["/admin/users", "users.view"],
  ["/admin/user", "users.view"],
  ["/admin/orders/create", "orders.create"],
  ["/admin/orders", "orders.view"],
  ["/admin/order", "orders.view"],
  ["/admin/product-categories", "products.category_manage"],
  ["/admin/product/create", "products.create"],
  ["/admin/products", "products.view"],
  ["/admin/product", "products.view"],
  ["/admin/workers", "workers.view"],
  ["/admin/worker", "workers.view"],
  ["/admin/finance/payments", "finance.payments.view"],
  ["/admin/finance/recharge-packages", "finance.recharge_package.manage"],
  ["/admin/finance/tips", "finance.tips.view"],
  ["/admin/finance/ledger", "finance.ledger.view"],
  ["/admin/finance/withdrawals", "finance.withdraw.view"],
  ["/admin/finance", "finance.payments.view"],
  ["/admin/recharges", "finance.payments.view"],
  ["/admin/withdrawals", "finance.withdraw.view"],
  ["/admin/wallet", "finance.ledger.view"],
  ["/admin/announcements", "announcements.view"],
  ["/admin/disputes", "feedback.complaints.view"],
  ["/admin/feedback", "feedback.feedback.view"],
  ["/admin/permissions/admin-users", "permissions.admin_users.manage"],
  ["/admin/permissions/menus", "permissions.menus.manage"],
  ["/admin/permissions/roles", "permissions.roles.manage"],
  ["/admin/permissions", "permissions.roles.manage"],
  ["/admin/settings", "settings.view"],
  ["/admin/logs", "permissions.roles.manage"],
];

export function canAccessAdminPath(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/login") return true;
  const match = [...ADMIN_PATH_PERMISSIONS]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!match) return true;
  return hasPermission(match[1]);
}

function syncUserWallet(user: User, wallet: WalletAccount) {
  user.availableBalance = wallet.availableBalance;
  user.frozenBalance = wallet.frozenBalance;
  user.totalSpent = wallet.totalSpent;
  user.memberLevel = wallet.memberLevel;
}

function syncWorkerWallet(worker: Worker, wallet: WalletAccount) {
  worker.availableBalance = wallet.availableBalance;
  worker.totalEarned = wallet.totalEarned;
}

function ensureWorkerWallet(store: StoreShape, worker: Worker): WalletAccount {
  let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
  if (!wallet) {
    wallet = {
      id: makeId("wallet"),
      userId: worker.id,
      ownerType: "worker",
      availableBalance: money(worker.availableBalance),
      frozenBalance: 0,
      totalSpent: 0,
      totalEarned: money(worker.totalEarned),
      memberLevel: "普通会员",
      updatedAt: now(),
    };
    store.wallet_accounts.push(wallet);
  }
  return wallet;
}

export function getCurrentSession(): CustomerSession | null {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const store = readStore();
  const user = store.users.find((item) => item.id === userId && item.role === "customer");
  const wallet = store.wallet_accounts.find((item) => item.userId === userId);
  if (!user || !wallet) return null;

  return { user, wallet };
}

export function getCurrentWorkerSession(): WorkerSession | null {
  const workerId = getCurrentWorkerId();
  if (!workerId) return null;

  const store = readStore();
  const worker = store.workers.find((item) => item.id === workerId);
  if (!worker) return null;

  let wallet = store.wallet_accounts.find((item) => item.userId === workerId && item.ownerType === "worker");
  if (!wallet) {
    wallet = {
      id: makeId("wallet"),
      userId: worker.id,
      ownerType: "worker",
      availableBalance: money(worker.availableBalance),
      frozenBalance: 0,
      totalSpent: 0,
      totalEarned: money(worker.totalEarned),
      memberLevel: "普通会员",
      updatedAt: now(),
    };
    store.wallet_accounts.push(wallet);
    writeStore(store);
  }

  return { worker, wallet };
}

export function mockWorkerLogin(workerId: string): WorkerSession {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (!wallet) {
      wallet = {
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned),
        memberLevel: "普通会员",
        updatedAt: now(),
      };
      store.wallet_accounts.push(wallet);
    }
    setCurrentWorkerId(worker.id);
    return { worker, wallet };
  });
}

export function setCurrentWorkerOnlineStatus(onlineStatus: Worker["onlineStatus"]): WorkerSession {
  const workerId = getCurrentWorkerId();
  if (!workerId) throw new Error("请先登录接单员账号");

  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.onlineStatus = onlineStatus;

    let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (!wallet) {
      wallet = {
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned),
        memberLevel: "普通会员",
        updatedAt: now(),
      };
      store.wallet_accounts.push(wallet);
    }

    return { worker, wallet };
  });
}

export function updateCurrentWorkerIntro(intro: string): WorkerSession {
  const workerId = getCurrentWorkerId();
  if (!workerId) throw new Error("请先登录接单员账号");
  const cleanIntro = intro.trim();
  if (!cleanIntro) throw new Error("接单员说明不能为空");
  if (cleanIntro.length > 120) throw new Error("接单员说明最多 120 个字");

  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.intro = cleanIntro;

    let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (!wallet) {
      wallet = {
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned),
        memberLevel: "普通会员",
        updatedAt: now(),
      };
      store.wallet_accounts.push(wallet);
    }

    return { worker, wallet };
  });
}

export function updateCurrentWorkerAvatar(avatarUrl: string): WorkerSession {
  const workerId = getCurrentWorkerId();
  if (!workerId) throw new Error("请先登录接单员账号");
  if (!avatarUrl) throw new Error("头像读取失败");

  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.avatarUrl = avatarUrl;

    let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (!wallet) {
      wallet = {
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned),
        memberLevel: "普通会员",
        updatedAt: now(),
      };
      store.wallet_accounts.push(wallet);
    }

    return { worker, wallet };
  });
}

export function updateCurrentWorkerName(name: string): WorkerSession {
  const workerId = getCurrentWorkerId();
  if (!workerId) throw new Error("请先登录接单员账号");
  const cleanName = name.trim();
  if (!cleanName) throw new Error("接单员名称不能为空");
  if (cleanName.length > 12) throw new Error("接单员名称最多 12 个字");

  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.name = cleanName;

    let wallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (!wallet) {
      wallet = {
        id: makeId("wallet"),
        userId: worker.id,
        ownerType: "worker",
        availableBalance: money(worker.availableBalance),
        frozenBalance: 0,
        totalSpent: 0,
        totalEarned: money(worker.totalEarned),
        memberLevel: "普通会员",
        updatedAt: now(),
      };
      store.wallet_accounts.push(wallet);
    }

    return { worker, wallet };
  });
}

export function mockWechatLogin(): CustomerSession {
  return updateStore((store) => {
    const existing = store.users.find((user) => user.openid?.startsWith("mock_openid_"));
    if (existing) {
      const wallet = store.wallet_accounts.find((item) => item.userId === existing.id) ?? migrateWallet({}, existing);
      if (!store.wallet_accounts.some((item) => item.userId === existing.id)) store.wallet_accounts.push(wallet);
      setCurrentUserId(existing.id);
      return { user: existing, wallet };
    }

    const user: User = {
      id: makeId("user"),
      openid: `mock_openid_${Math.random().toString(36).slice(2, 10)}`,
      displayId: makeDisplayId(),
      nickname: "微信用户",
      nicknameEditable: true,
      avatarUrl: "",
      role: "customer",
      memberLevel: "普通会员",
      totalSpent: 0,
      availableBalance: 0,
      frozenBalance: 0,
      createdAt: now(),
    };
    const wallet = migrateWallet({}, user);
    store.users.push(user);
    store.wallet_accounts.push(wallet);
    setCurrentUserId(user.id);
    return { user, wallet };
  });
}

export function updateCurrentNickname(nickname: string) {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");
  const clean = nickname.trim();
  if (!clean) throw new Error("昵称不能为空");

  updateStore((store) => {
    const user = store.users.find((item) => item.id === session.user.id);
    if (!user) throw new Error("用户不存在");
    user.nickname = clean;
  });
}

export function updateCurrentUserAvatar(avatarUrl: string) {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");
  if (!avatarUrl) throw new Error("头像读取失败");

  updateStore((store) => {
    const user = store.users.find((item) => item.id === session.user.id);
    if (!user) throw new Error("用户不存在");
    user.avatarUrl = avatarUrl;
  });
}

export function registerCustomer(input: {
  username: string;
  password: string;
  nickname?: string;
}): { ok: true; user: User } | { ok: false; message: string } {
  const username = input.username.trim();
  const password = input.password.trim();
  const nickname = input.nickname?.trim() || username;

  if (username.length < 3) return { ok: false, message: "账号至少需要 3 个字符" };
  if (password.length < 6) return { ok: false, message: "密码至少需要 6 个字符" };

  return updateStore((store) => {
    const exists = store.users.some((item) => item.username === username);
    if (exists) return { ok: false, message: "该账号已注册，请直接登录" };

    const user: User = {
      id: makeId("user"),
      username,
      password,
      displayId: makeDisplayId(),
      nickname,
      nicknameEditable: true,
      avatarUrl: "",
      role: "customer",
      memberLevel: "普通会员",
      totalSpent: 0,
      availableBalance: 0,
      frozenBalance: 0,
      createdAt: now(),
    };
    const wallet = migrateWallet({}, user);

    store.users.push(user);
    store.wallet_accounts.push(wallet);
    setCurrentUserId(user.id);

    return { ok: true, user };
  });
}

export function loginCustomer(input: {
  username: string;
  password: string;
}): { ok: true; user: User } | { ok: false; message: string } {
  const username = input.username.trim();
  const password = input.password.trim();
  const store = readStore();
  const user = store.users.find(
    (item) => item.username === username && item.password === password && item.role === "customer",
  );

  if (!user) return { ok: false, message: "账号或密码不正确" };

  setCurrentUserId(user.id);
  return { ok: true, user };
}

export function getVisibleProductCategories() {
  return readStore().product_categories
    .filter((category) => !category.parentId && isProductActive(category))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProducts(category?: ProductCategory | "全部" | "全部分类" | string): Product[] {
  const store = readStore();
  const activeCategoryNames = new Set(
    store.product_categories.filter((item) => isProductActive(item)).map((item) => item.name),
  );
  return store.products
    .filter(isProductActive)
    .filter((product) => !product.category || activeCategoryNames.has(product.category))
    .filter((product) => !category || category === "全部" || category === "全部分类" || product.category === category || product.categoryId === category)
    .sort((a, b) => {
      if (Boolean(a.isRecommended) !== Boolean(b.isRecommended)) return a.isRecommended ? -1 : 1;
      if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function getProduct(productId: string): Product | null {
  return readStore().products.find((product) => product.id === productId && isProductActive(product)) ?? null;
}

function announcementIsVisible(
  announcement: Announcement,
  audience: Exclude<AnnouncementVisibleTo, "admin"> | "admin" = "customer",
  at = new Date(),
) {
  if (announcement.deleted || announcement.status !== "published") return false;
  if (announcement.visibleTo !== "all" && announcement.visibleTo !== audience) return false;
  const publishAt = announcement.publishAt ? new Date(announcement.publishAt) : null;
  const expireAt = announcement.expireAt ? new Date(announcement.expireAt) : null;
  if (publishAt && !Number.isNaN(publishAt.getTime()) && publishAt > at) return false;
  if (expireAt && !Number.isNaN(expireAt.getTime()) && expireAt < at) return false;
  return true;
}

function sortAnnouncements(a: Announcement, b: Announcement) {
  if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return b.sortOrder - a.sortOrder;
  const aTime = a.publishAt || a.createdAt;
  const bTime = b.publishAt || b.createdAt;
  if (aTime !== bTime) return bTime.localeCompare(aTime);
  return b.createdAt.localeCompare(a.createdAt);
}

export function getAnnouncements(audience: AnnouncementVisibleTo = "customer") {
  return readStore().announcements
    .filter((announcement) => (audience === "admin" ? !announcement.deleted : announcementIsVisible(announcement, audience)))
    .sort(sortAnnouncements);
}

export function getVisibleAnnouncements(audience: Exclude<AnnouncementVisibleTo, "admin">) {
  return getAnnouncements(audience);
}

export function incrementAnnouncementView(announcementId: string) {
  updateStore((store) => {
    const announcement = store.announcements.find((item) => item.id === announcementId);
    if (!announcement) return;
    announcement.viewCount = Number(announcement.viewCount ?? 0) + 1;
    announcement.updatedAt = now();
  });
}

const announcementReadKey = (audience: "customer" | "worker") => `xiaoluoke_announcement_read_${audience}`;

function readAnnouncementReadRecord(audience: "customer" | "worker", userId: string) {
  if (!hasStorage()) return { userId, readAnnouncementIds: [] as string[] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(announcementReadKey(audience)) || "{}") as {
      userId?: string;
      readAnnouncementIds?: string[];
    };
    if (parsed.userId !== userId) return { userId, readAnnouncementIds: [] as string[] };
    return { userId, readAnnouncementIds: parsed.readAnnouncementIds ?? [] };
  } catch {
    return { userId, readAnnouncementIds: [] as string[] };
  }
}

export function markAnnouncementRead(audience: "customer" | "worker", userId: string, announcementId: string) {
  if (!hasStorage()) return;
  const record = readAnnouncementReadRecord(audience, userId);
  if (!record.readAnnouncementIds.includes(announcementId)) record.readAnnouncementIds.push(announcementId);
  window.localStorage.setItem(announcementReadKey(audience), JSON.stringify(record));
}

export function getUnreadPinnedAnnouncement(audience: "customer" | "worker", userId: string) {
  const record = readAnnouncementReadRecord(audience, userId);
  return getVisibleAnnouncements(audience).find((announcement) => announcement.isPinned && !record.readAnnouncementIds.includes(announcement.id)) ?? null;
}

const levelRank: Record<Worker["level"], number> = {
  明星: 5,
  金牌: 4,
  银牌: 3,
  铜牌: 2,
  见习: 1,
};

export function workerLevelLabel(level: Worker["level"]) {
  const icon = level === "明星" ? "⭐" : level === "金牌" ? "🥇" : level === "银牌" ? "🥈" : level === "铜牌" ? "🥉" : "🌱";
  return `${icon} ${level}接单员`;
}

export const DEFAULT_PLATFORM_COMMISSION_RATE = 20;

export function workerStatusText(worker: Pick<Worker, "status" | "onlineStatus">) {
  if (worker.status === "frozen") return "冻结";
  return worker.onlineStatus === "online" ? "在线" : "离线";
}

export function workerAccountText(worker: Pick<Worker, "status">) {
  return worker.status === "frozen" ? "冻结" : "活跃";
}

export function getWorkerCommissionRate(worker?: Pick<Worker, "platformCommissionRate"> | null) {
  const raw = Number(worker?.platformCommissionRate);
  return Number.isFinite(raw) && raw >= 0 ? Math.min(100, raw) : DEFAULT_PLATFORM_COMMISSION_RATE;
}

function calculateOrderSettlementFromStore(store: StoreShape, order: Pick<Order, "amountLockeCoin" | "productSnapshot" | "productId">, worker?: Worker | null) {
  const product = order.productId ? store.products.find((item) => item.id === order.productId) : null;
  const incomeType = order.productSnapshot?.workerIncomeType ?? product?.workerIncomeType;
  const incomeAmount = order.productSnapshot?.workerIncomeAmount ?? product?.workerIncomeAmount;
  const amount = money(order.amountLockeCoin);
  const commissionRate = getWorkerCommissionRate(worker);
  const workerIncome = incomeType === "fixed" && Number(incomeAmount) > 0
    ? Math.min(amount, money(Number(incomeAmount)))
    : money(amount * (100 - commissionRate) / 100);
  const platformIncome = money(Math.max(0, amount - workerIncome));
  return { amount, commissionRate, workerIncome, platformIncome };
}

export function calculateOrderSettlement(order: Pick<Order, "amountLockeCoin" | "productSnapshot" | "productId">, worker?: Worker | null) {
  return calculateOrderSettlementFromStore(readStore(), order, worker);
}

export function getWorkers(search = ""): Worker[] {
  const keyword = search.trim();
  return [...readStore().workers]
    .filter((worker) => !keyword || worker.name.includes(keyword))
    .sort((a, b) => {
      if (a.onlineStatus !== b.onlineStatus) return a.onlineStatus === "online" ? -1 : 1;
      if (levelRank[a.level] !== levelRank[b.level]) return levelRank[b.level] - levelRank[a.level];
      if (a.completedOrderCount !== b.completedOrderCount) return b.completedOrderCount - a.completedOrderCount;
      return b.rating - a.rating;
    });
}

export function getWorker(workerId: string): Worker | null {
  return readStore().workers.find((worker) => worker.id === workerId) ?? null;
}

export function validateRechargeAmount(raw: string): { ok: true; amount: number } | { ok: false; message: string } {
  return validateAmount(raw, 1, 1000, "请输入充值洛克贝数量");
}

export function validateTipAmount(raw: string): { ok: true; amount: number } | { ok: false; message: string } {
  return validateAmount(raw, 1, 100, "请输入打赏金额");
}

export function getActiveRechargePackages(): RechargePackage[] {
  return readStore().recharge_packages
    .filter((item) => item.status === "active" && !item.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.amountRmb - b.amountRmb);
}

function validateAmount(raw: string, min: number, max: number, emptyMessage: string) {
  const value = raw.trim();
  if (!value) return { ok: false as const, message: emptyMessage };
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return { ok: false as const, message: "请输入合法数字，最多 2 位小数" };

  const amount = Number(value);
  if (!Number.isFinite(amount)) return { ok: false as const, message: "请输入合法数字" };
  if (amount <= 0) return { ok: false as const, message: "金额必须大于 0" };
  if (amount < min) return { ok: false as const, message: `最低 ${min} 洛克贝` };
  if (amount > max) return { ok: false as const, message: `最高单次 ${max} 洛克贝` };

  return { ok: true as const, amount: money(amount) };
}

function addLedger(
  store: StoreShape,
  entry: Omit<WalletLedger, "id" | "createdAt"> & {
    type: LedgerType;
    direction: LedgerDirection;
  },
) {
  store.wallet_ledger.unshift({
    ...entry,
    id: makeId("ledger"),
    createdAt: now(),
  });
}

function addAdminLog(
  store: StoreShape,
  actionType: string,
  targetType: string,
  targetId: string | undefined,
  detail: string,
  extras?: Pick<AdminLog, "operationAmount" | "remark">,
) {
  const session = readRawAdminSession();
  store.admin_logs.unshift({
    id: makeId("admin_log"),
    adminId: session?.adminId,
    adminName: session?.name ?? session?.username ?? "admin",
    action: actionType,
    actionType,
    targetType,
    targetId,
    detail,
    operationAmount: extras?.operationAmount,
    remark: extras?.remark,
    createdAt: now(),
  });
}

export function appendAdminLog(actionType: string, targetType: string, targetId: string | undefined, detail: string) {
  updateStore((store) => {
    addAdminLog(store, actionType, targetType, targetId, detail);
  });
}

export function getSystemSettings(): SystemSettings {
  return readStore().system_settings;
}

export function getResourceRecords(): ResourceRecord[] {
  return readStore().system_settings.resources.records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function adminUpdateSystemSettings<K extends keyof SystemSettings>(
  section: K,
  value: SystemSettings[K],
  actionType: string,
  detail: string,
): SystemSettings {
  requirePermission("settings.edit");
  return updateStore((store) => {
    const nextSettings = migrateSystemSettings({
      ...store.system_settings,
      [section]: value,
    } as Partial<SystemSettings>);
    store.system_settings = nextSettings;
    addAdminLog(store, actionType, "settings", String(section), detail);
    return store.system_settings;
  });
}

export function adminUpsertResource(input: {
  id?: string;
  name: string;
  type: ResourceRecord["type"];
  url: string;
  size?: number;
}): ResourceRecord {
  requirePermission("settings.edit");
  return updateStore((store) => {
    const resource = migrateResourceRecord({
      id: input.id,
      name: input.name,
      type: input.type,
      url: input.url,
      size: input.size ?? 0,
      createdAt: input.id ? store.system_settings.resources.records.find((item) => item.id === input.id)?.createdAt : now(),
    }, store.system_settings.resources.records.length);
    const resources = store.system_settings.resources.records;
    const existingIndex = resources.findIndex((item) => item.id === resource.id);
    if (existingIndex >= 0) resources[existingIndex] = resource;
    else resources.unshift(resource);
    addAdminLog(store, input.id ? "update_resource_settings" : "create_resource", "resource", resource.id, `${input.id ? "编辑" : "新增"}资源：${resource.name}`);
    return resource;
  });
}

export function adminDeleteResource(resourceId: string) {
  requirePermission("settings.edit");
  updateStore((store) => {
    const resource = store.system_settings.resources.records.find((item) => item.id === resourceId);
    store.system_settings.resources.records = store.system_settings.resources.records.filter((item) => item.id !== resourceId);
    addAdminLog(store, "delete_resource", "resource", resourceId, `删除资源：${resource?.name ?? resourceId}`);
  });
}

export function getAvailablePaymentMethods(): PaymentMethod[] {
  const channels = getSystemSettings().payment.channels.filter((channel) => channel.enabled && channel.configured);
  const methods: PaymentMethod[] = [];
  if (channels.some((channel) => channel.key === "balance")) methods.push("locke_coin");
  if (channels.some((channel) => channel.key === "wechat_jsapi" || channel.key === "wechat_mini")) methods.push("wechat");
  return methods.length ? methods : ["locke_coin"];
}

export function getMinimumWorkerDeposit() {
  return money(Number(getSystemSettings().worker.minimumDepositAmount) || 0);
}

function assertRoleEditable(role: AdminRole, action: "edit" | "delete" | "disable") {
  if (action === "delete" && (role.code === "super_admin" || role.builtIn)) throw new Error("内置角色不能删除");
  if (action === "disable" && role.code === "super_admin") throw new Error("超级管理员角色不能禁用");
}

export function adminUpsertRole(input: {
  id?: string;
  name: string;
  code: string;
  description?: string;
  status?: AdminRole["status"];
  permissions?: string[];
}) {
  requirePermission("permissions.roles.manage");
  const name = input.name.trim();
  const code = input.code.trim();
  if (!name) throw new Error("角色名称不能为空");
  if (!code) throw new Error("角色编码不能为空");
  if (!/^[A-Za-z0-9_]+$/.test(code)) throw new Error("角色编码只允许英文、数字、下划线");

  return updateStore((store) => {
    const existing = input.id ? store.admin_roles.find((role) => role.id === input.id) : null;
    const duplicate = store.admin_roles.some((role) => role.code === code && role.id !== input.id);
    if (duplicate) throw new Error("角色编码不能重复");
    const timestamp = now();
    if (existing) {
      assertRoleEditable(existing, input.status === "disabled" ? "disable" : "edit");
      existing.name = name;
      existing.code = existing.code === "super_admin" ? "super_admin" : code;
      existing.description = input.description?.trim() ?? "";
      existing.status = existing.code === "super_admin" ? "enabled" : input.status ?? "enabled";
      existing.updatedAt = timestamp;
      addAdminLog(store, "update_admin_role", "admin_role", existing.id, `编辑角色：${existing.name}`);
      refreshCurrentAdminSession(store);
      return existing;
    }
    const role: AdminRole = {
      id: makeId("admin_role"),
      name,
      code,
      description: input.description?.trim() ?? "",
      status: input.status ?? "enabled",
      permissions: input.permissions ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.admin_roles.unshift(role);
    addAdminLog(store, "create_admin_role", "admin_role", role.id, `新增角色：${role.name}`);
    refreshCurrentAdminSession(store);
    return role;
  });
}

export function adminUpdateRolePermissions(roleId: string, permissions: string[]) {
  requirePermission("permissions.roles.manage");
  return updateStore((store) => {
    const role = store.admin_roles.find((item) => item.id === roleId);
    if (!role) throw new Error("角色不存在");
    role.permissions = role.code === "super_admin" ? collectPermissionKeys(store.admin_menus) : Array.from(new Set(permissions));
    role.updatedAt = now();
    addAdminLog(store, "update_role_permissions", "admin_role", role.id, `分配角色权限：${role.name}`);
    refreshCurrentAdminSession(store);
    return role;
  });
}

export function adminDeleteRole(roleId: string) {
  requirePermission("permissions.roles.manage");
  updateStore((store) => {
    const role = store.admin_roles.find((item) => item.id === roleId);
    if (!role) throw new Error("角色不存在");
    assertRoleEditable(role, "delete");
    if (store.admin_users.some((user) => user.roleIds.includes(roleId))) throw new Error("当前角色仍有关联管理员，请先调整管理员角色");
    store.admin_roles = store.admin_roles.filter((item) => item.id !== roleId);
    addAdminLog(store, "delete_admin_role", "admin_role", roleId, `删除角色：${role.name}`);
    refreshCurrentAdminSession(store);
  });
}

export function adminUpsertAdminUser(input: {
  id?: string;
  name: string;
  avatarUrl?: string;
  username: string;
  password?: string;
  roleIds: string[];
  status?: AdminUser["status"];
}) {
  requirePermission("permissions.admin_users.manage");
  const name = input.name.trim();
  const username = input.username.trim();
  if (!name) throw new Error("姓名不能为空");
  if (!username) throw new Error("用户名不能为空");
  if (!input.roleIds.length) throw new Error("请至少选择一个角色");

  return updateStore((store) => {
    const session = readRawAdminSession();
    const existing = input.id ? store.admin_users.find((user) => user.id === input.id) : null;
    if (store.admin_users.some((user) => user.username === username && user.id !== input.id)) throw new Error("用户名不能重复");
    const timestamp = now();
    if (existing) {
      if (existing.id === session?.adminId && input.status === "disabled") throw new Error("不能禁用当前登录账号");
      if (existing.username === "admin" && input.status === "disabled") throw new Error("超级管理员账号不能禁用");
      if (input.password && input.password.length < 8) throw new Error("密码至少 8 位");
      existing.name = name;
      existing.avatarUrl = input.avatarUrl ?? "";
      existing.username = existing.username === "admin" ? "admin" : username;
      if (input.password) existing.password = input.password;
      existing.roleIds = existing.username === "admin" ? Array.from(new Set(["role-super-admin", ...input.roleIds])) : input.roleIds;
      existing.status = existing.username === "admin" ? "enabled" : input.status ?? "enabled";
      existing.updatedAt = timestamp;
      addAdminLog(store, "update_admin_user", "admin_user", existing.id, `编辑管理员：${existing.username}`);
      refreshCurrentAdminSession(store);
      return existing;
    }
    if (!input.password || input.password.length < 8) throw new Error("密码至少 8 位");
    const user: AdminUser = {
      id: makeId("admin_user"),
      name,
      username,
      password: input.password,
      avatarUrl: input.avatarUrl ?? "",
      roleIds: input.roleIds,
      status: input.status ?? "enabled",
      lastLoginAt: "",
      lastLoginIp: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.admin_users.unshift(user);
    addAdminLog(store, "create_admin_user", "admin_user", user.id, `新增管理员：${user.username}`);
    return user;
  });
}

export function adminDeleteAdminUser(userId: string) {
  requirePermission("permissions.admin_users.manage");
  updateStore((store) => {
    const session = readRawAdminSession();
    const user = store.admin_users.find((item) => item.id === userId);
    if (!user) throw new Error("管理员不存在");
    if (user.id === session?.adminId) throw new Error("不能删除当前登录账号");
    if (user.username === "admin" || user.builtIn) throw new Error("超级管理员账号不能删除");
    store.admin_users = store.admin_users.filter((item) => item.id !== userId);
    addAdminLog(store, "delete_admin_user", "admin_user", userId, `删除管理员：${user.username}`);
  });
}

export function adminToggleAdminUserStatus(userId: string, status?: AdminUser["status"]) {
  requirePermission("permissions.admin_users.manage");
  return updateStore((store) => {
    const session = readRawAdminSession();
    const user = store.admin_users.find((item) => item.id === userId);
    if (!user) throw new Error("管理员不存在");
    const nextStatus = status ?? (user.status === "enabled" ? "disabled" : "enabled");
    if (user.id === session?.adminId && nextStatus === "disabled") throw new Error("不能禁用当前登录账号");
    if ((user.username === "admin" || user.builtIn) && nextStatus === "disabled") throw new Error("超级管理员账号不能禁用");
    user.status = nextStatus;
    user.updatedAt = now();
    addAdminLog(store, nextStatus === "enabled" ? "enable_admin_user" : "disable_admin_user", "admin_user", user.id, `${nextStatus === "enabled" ? "启用" : "禁用"}管理员：${user.username}`);
    refreshCurrentAdminSession(store);
    return user;
  });
}

export function adminUpsertAdminMenu(input: {
  id?: string;
  parentId?: string | null;
  type: AdminMenu["type"];
  name: string;
  routeName?: string;
  path?: string;
  componentPath?: string;
  icon?: string;
  externalUrl?: string;
  activePath?: string;
  sortOrder?: number;
  visible?: boolean;
  cache?: boolean;
  hidden?: boolean;
  embedded?: boolean;
  hiddenTag?: boolean;
  permissionKey?: string;
  status?: AdminMenu["status"];
}) {
  requirePermission("permissions.menus.manage");
  const name = input.name.trim();
  const path = input.path?.trim() ?? "";
  const permissionKey = input.permissionKey?.trim() ?? "";
  if (!name) throw new Error("显示名称不能为空");
  if (input.type === "menu" && !path) throw new Error("菜单路由地址不能为空");
  if (input.type === "button" && !permissionKey) throw new Error("按钮权限标识不能为空");

  return updateStore((store) => {
    if (path && store.admin_menus.some((menu) => menu.path === path && menu.id !== input.id)) throw new Error("路由地址不能重复");
    if (permissionKey && store.admin_menus.some((menu) => menu.permissionKey === permissionKey && menu.id !== input.id)) throw new Error("权限标识不能重复");
    const timestamp = now();
    const existing = input.id ? store.admin_menus.find((menu) => menu.id === input.id) : null;
    if (existing) {
      existing.parentId = input.parentId ?? null;
      existing.type = input.type;
      existing.name = name;
      existing.routeName = input.routeName?.trim() ?? "";
      existing.path = path;
      existing.componentPath = input.componentPath?.trim() ?? "";
      existing.icon = input.icon?.trim() ?? "";
      existing.externalUrl = input.externalUrl?.trim() ?? "";
      existing.activePath = input.activePath?.trim() ?? "";
      existing.sortOrder = Number(input.sortOrder ?? 0);
      existing.visible = input.visible ?? true;
      existing.cache = input.cache ?? false;
      existing.hidden = input.hidden ?? false;
      existing.embedded = input.embedded ?? false;
      existing.hiddenTag = input.hiddenTag ?? false;
      existing.permissionKey = permissionKey;
      existing.status = input.status ?? "visible";
      existing.updatedAt = timestamp;
      addAdminLog(store, "update_admin_menu", "admin_menu", existing.id, `编辑菜单：${existing.name}`);
      refreshCurrentAdminSession(store);
      return existing;
    }
    const menu: AdminMenu = {
      id: makeId("admin_menu"),
      parentId: input.parentId ?? null,
      type: input.type,
      name,
      routeName: input.routeName?.trim() ?? "",
      path,
      componentPath: input.componentPath?.trim() ?? "",
      icon: input.icon?.trim() ?? "",
      externalUrl: input.externalUrl?.trim() ?? "",
      activePath: input.activePath?.trim() ?? "",
      sortOrder: Number(input.sortOrder ?? 0),
      visible: input.visible ?? true,
      cache: input.cache ?? false,
      hidden: input.hidden ?? false,
      embedded: input.embedded ?? false,
      hiddenTag: input.hiddenTag ?? false,
      permissionKey,
      status: input.status ?? "visible",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.admin_menus.unshift(menu);
    addAdminLog(store, "create_admin_menu", "admin_menu", menu.id, `新增菜单：${menu.name}`);
    refreshCurrentAdminSession(store);
    return menu;
  });
}

export function adminDeleteAdminMenu(menuId: string) {
  requirePermission("permissions.menus.manage");
  updateStore((store) => {
    const menu = store.admin_menus.find((item) => item.id === menuId);
    if (!menu) throw new Error("菜单不存在");
    if (store.admin_menus.some((item) => item.parentId === menuId)) throw new Error("请先删除子菜单");
    store.admin_menus = store.admin_menus.filter((item) => item.id !== menuId);
    addAdminLog(store, "delete_admin_menu", "admin_menu", menuId, `删除菜单：${menu.name}`);
    refreshCurrentAdminSession(store);
  });
}

export function adminUpsertAnnouncement(input: {
  id?: string;
  title: string;
  type: AnnouncementType;
  visibleTo: AnnouncementVisibleTo;
  coverImage?: string;
  content: string;
  isPinned: boolean;
  sortOrder: number;
  status: AnnouncementStatus;
  publishAt?: string;
  expireAt?: string;
}) {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) throw new Error("公告标题不能为空");
  if (title.length > 100) throw new Error("公告标题最多 100 字");
  if (!content) throw new Error("公告内容不能为空");
  return updateStore((store) => {
    const existing = input.id ? store.announcements.find((item) => item.id === input.id) : null;
    const timestamp = now();
    if (existing) {
      existing.title = title;
      existing.type = input.type;
      existing.visibleTo = input.visibleTo;
      existing.coverImage = input.coverImage?.trim() ?? "";
      existing.content = content;
      existing.isPinned = input.isPinned;
      existing.sortOrder = Number(input.sortOrder) || 0;
      existing.status = input.status;
      existing.publishAt = input.publishAt || "";
      existing.expireAt = input.expireAt || "";
      existing.updatedAt = timestamp;
      addAdminLog(store, "update_announcement", "announcement", existing.id, `编辑公告：${existing.title}`);
      return existing;
    }

    const announcement: Announcement = {
      id: makeId("announcement"),
      title,
      type: input.type,
      visibleTo: input.visibleTo,
      coverImage: input.coverImage?.trim() ?? "",
      content,
      isPinned: input.isPinned,
      sortOrder: Number(input.sortOrder) || 0,
      status: input.status,
      viewCount: 0,
      publishAt: input.publishAt || timestamp,
      expireAt: input.expireAt || "",
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.announcements.unshift(announcement);
    addAdminLog(store, "create_announcement", "announcement", announcement.id, `新增公告：${announcement.title}`);
    return announcement;
  });
}

export function adminArchiveAnnouncement(id: string) {
  updateStore((store) => {
    const announcement = store.announcements.find((item) => item.id === id);
    if (!announcement) throw new Error("公告不存在");
    announcement.status = "archived";
    announcement.updatedAt = now();
    addAdminLog(store, "archive_announcement", "announcement", id, `归档公告：${announcement.title}`);
  });
}

export function adminToggleAnnouncementPin(id: string) {
  updateStore((store) => {
    const announcement = store.announcements.find((item) => item.id === id);
    if (!announcement) throw new Error("公告不存在");
    announcement.isPinned = !announcement.isPinned;
    announcement.updatedAt = now();
    addAdminLog(store, announcement.isPinned ? "pin_announcement" : "unpin_announcement", "announcement", id, `${announcement.isPinned ? "置顶" : "取消置顶"}公告：${announcement.title}`);
  });
}

export function adminSoftDeleteAnnouncement(id: string) {
  updateStore((store) => {
    const announcement = store.announcements.find((item) => item.id === id);
    if (!announcement) throw new Error("公告不存在");
    announcement.deleted = true;
    announcement.status = "archived";
    announcement.updatedAt = now();
    addAdminLog(store, "delete_announcement", "announcement", id, `删除公告：${announcement.title}`);
  });
}

function addChatMessage(
  store: StoreShape,
  entry: Omit<ChatMessage, "id" | "createdAt" | "isRead"> & {
    isRead?: boolean;
    createdAt?: string;
  },
) {
  store.chat_messages.push({
    ...entry,
    id: makeId("chat_msg"),
    createdAt: entry.createdAt ?? now(),
    isRead: entry.isRead ?? entry.senderRole === "customer",
  });
}

function ensureChatSessionForOrder(store: StoreShape, order: Order): ChatSession {
  let chatSession = store.chat_sessions.find((item) => item.orderId === order.id);
  if (!chatSession) {
    chatSession = {
      id: makeId("chat_session"),
      orderId: order.id,
      customerId: order.customerId,
      workerId: order.workerId ?? null,
      workerName: order.workerName ?? null,
      status: order.workerId ? "active" : "waiting_worker",
      createdAt: now(),
      updatedAt: now(),
    };
    store.chat_sessions.push(chatSession);
  }

  if (!store.chat_messages.some((message) => message.sessionId === chatSession.id)) {
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: "system",
      senderRole: "system",
      senderName: "系统",
      messageType: "system",
      content: order.workerId ? "接单员已接单，可以开始沟通。" : "订单已创建，等待接单员接单。",
      isRead: true,
    });
  }

  return chatSession;
}

export function rechargeCurrentCustomer(amount: number, rechargePackageId?: string): RechargeOrder {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");

  return updateStore((store) => {
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    if (!user || !wallet) throw new Error("钱包不存在");

    const rechargePackage = rechargePackageId
      ? store.recharge_packages.find((item) => item.id === rechargePackageId && item.status === "active" && !item.deleted)
      : null;
    const amountRmb = money(rechargePackage?.amountRmb ?? amount);
    const amountLockeCoin = money(rechargePackage?.amountLockeCoin ?? amount);

    const rechargeOrder: RechargeOrder = {
      id: makeId("recharge"),
      rechargeNo: makeNo("RC"),
      userId: session.user.id,
      amountRmb,
      amountLockeCoin,
      paymentMethod: "locke_coin",
      status: "paid",
      createdAt: now(),
      paidAt: now(),
    };

    wallet.availableBalance = money(wallet.availableBalance + amountLockeCoin);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);
    store.recharge_orders.unshift(rechargeOrder);
    addLedger(store, {
      userId: session.user.id,
      rechargeOrderId: rechargeOrder.id,
      type: "recharge_in",
      direction: "in",
      amount: amountLockeCoin,
      description: rechargePackage ? `套餐充值到账：支付 ${formatCurrency(amountRmb)}，到账 ${formatRock(amountLockeCoin)}` : "模拟充值到账",
    });

    return rechargeOrder;
  });
}

export function createServiceOrder(input: {
  productId: string;
  gameNickname: string;
  gameId: string;
  quantity: number;
  remark?: string;
  assignmentType: AssignmentType;
  specifiedWorkerId?: string | null;
  paymentMethod: PaymentMethod;
}): { ok: true; order: Order } | { ok: false; message: string } {
  const session = getCurrentSession();
  if (!session) return { ok: false, message: "请先微信登录" };

  return updateStore((store) => {
    const product = store.products.find((item) => item.id === input.productId && isProductActive(item));
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    const worker = input.specifiedWorkerId && product?.allowAssignedWorker !== false
      ? store.workers.find((item) => item.id === input.specifiedWorkerId)
      : null;
    if (!product) return { ok: false, message: "商品不存在" };
    if (!user || !wallet) return { ok: false, message: "钱包不存在" };
    if (product.requireGameNickname !== false && !input.gameNickname.trim()) return { ok: false, message: "请填写游戏昵称" };
    if (product.requireGameId !== false && !input.gameId.trim()) return { ok: false, message: "请填写 ID 编号" };
    if (input.quantity < 1) return { ok: false, message: "下单数量至少为 1" };
    if (input.paymentMethod === "wechat") return { ok: false, message: "微信支付功能待接入" };
    if (input.paymentMethod === "alipay") return { ok: false, message: "支付宝支付功能待接入" };

    const quantity = Math.max(1, input.quantity);
    const amountLockeCoin = money(product.priceLockeCoin * quantity);
    const amountRmb = money(product.priceRmb * quantity);
    if (wallet.availableBalance < amountLockeCoin) return { ok: false, message: "洛克贝不足，请先充值" };

    const order: Order = {
      id: makeId("order"),
      orderNo: makeNo("XLK"),
      orderType: "service",
      userId: user.id,
      customerId: user.id,
      customerName: user.nickname,
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productImageUrl: product.imageUrl,
      productCategory: product.category,
      productSnapshot: {
        name: product.name,
        priceRmb: product.priceRmb,
        priceLockeCoin: product.priceLockeCoin,
        category: product.category,
        servicePort: product.servicePort,
        workerIncomeType: product.workerIncomeType,
        workerIncomeAmount: product.workerIncomeAmount,
      },
      servicePort: product.servicePort ?? "mobile",
      workerId: worker?.id ?? null,
      workerName: worker?.name ?? null,
      gameNickname: input.gameNickname.trim(),
      gameId: input.gameId.trim(),
      quantity,
      remark: input.remark?.trim(),
      assignmentType: input.assignmentType,
      specifiedWorkerId: worker?.id ?? null,
      specifiedWorkerName: worker?.name ?? null,
      paymentMethod: "locke_coin",
      amountRmb,
      amountLockeCoin,
      amount: amountLockeCoin,
      status: "pending",
      paymentStatus: "paid",
      createdAt: now(),
      updatedAt: now(),
      paidAt: now(),
      statusHistory: [makeStatusHistory("pending", "顾客下单并支付，等待接单员接单", "customer")],
    };

    wallet.availableBalance = money(wallet.availableBalance - amountLockeCoin);
    wallet.frozenBalance = money(wallet.frozenBalance + amountLockeCoin);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);
    product.sales += quantity;
    store.orders.unshift(order);
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = "waiting_worker";
    chatSession.updatedAt = now();
    addLedger(store, {
      userId: user.id,
      relatedOrderId: order.id,
      type: "order_freeze",
      direction: "freeze",
      amount: amountLockeCoin,
      description: `下单冻结：${product.name}`,
    });

    return { ok: true, order };
  });
}

export function createOrder(productId: string): { ok: true; order: Order } | { ok: false; message: string } {
  return createServiceOrder({
    productId,
    gameNickname: "开发测试昵称",
    gameId: "DEV-ID",
    quantity: 1,
    assignmentType: "random",
    paymentMethod: "locke_coin",
  });
}

export function createTipOrder(input: {
  workerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  remark?: string;
}): { ok: true; order: Order } | { ok: false; message: string } {
  const session = getCurrentSession();
  if (!session) return { ok: false, message: "请先微信登录" };

  return updateStore((store) => {
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    const worker = store.workers.find((item) => item.id === input.workerId);
    if (!user || !wallet) return { ok: false, message: "钱包不存在" };
    if (!worker) return { ok: false, message: "接单员不存在" };
    if (input.paymentMethod === "wechat") return { ok: false, message: "微信支付功能待接入" };
    if (input.paymentMethod === "alipay") return { ok: false, message: "支付宝支付功能待接入" };
    if (wallet.availableBalance < input.amount) return { ok: false, message: "洛克贝不足，请先充值" };

    const order: Order = {
      id: makeId("tip"),
      orderNo: makeNo("TIP"),
      orderType: "tip",
      userId: user.id,
      customerId: user.id,
      customerName: user.nickname,
      workerId: worker.id,
      workerName: worker.name,
      remark: input.remark?.trim(),
      paymentMethod: "locke_coin",
      amountRmb: money(input.amount),
      amountLockeCoin: money(input.amount),
      amount: money(input.amount),
      status: "settled",
      createdAt: now(),
      updatedAt: now(),
      paidAt: now(),
      settledAt: now(),
    };

    wallet.availableBalance = money(wallet.availableBalance - input.amount);
    wallet.totalSpent = money(wallet.totalSpent + input.amount);
    wallet.memberLevel = calculateMemberLevel(wallet.totalSpent);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);
    worker.availableBalance = money(worker.availableBalance + input.amount);
    worker.totalEarned = money(worker.totalEarned + input.amount);
    worker.tipIncome = money(worker.tipIncome + input.amount);
    const workerWallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (workerWallet) {
      workerWallet.availableBalance = worker.availableBalance;
      workerWallet.totalEarned = worker.totalEarned;
      workerWallet.updatedAt = now();
      syncWorkerWallet(worker, workerWallet);
    }
    store.orders.unshift(order);
    addLedger(store, {
      userId: user.id,
      relatedOrderId: order.id,
      type: "tip_out",
      direction: "out",
      amount: money(input.amount),
      description: `打赏接单员：${worker.name}`,
    });
    addLedger(store, {
      userId: worker.id,
      relatedOrderId: order.id,
      type: "tip_in",
      direction: "in",
      amount: money(input.amount),
      description: "收到顾客打赏",
    });

    return { ok: true, order };
  });
}

export function getCurrentCustomerOrders(): Order[] {
  const session = getCurrentSession();
  if (!session) return [];
  return readStore().orders.filter((order) => order.customerId === session.user.id || order.userId === session.user.id);
}

export function getCurrentCustomerOrder(orderId: string): Order | null {
  const session = getCurrentSession();
  if (!session) return null;
  return (
    readStore().orders.find(
      (order) => order.id === orderId && (order.customerId === session.user.id || order.userId === session.user.id),
    ) ?? null
  );
}

function canWorkerSeeOrder(order: Order, workerId: string) {
  if (order.orderType === "tip") return order.workerId === workerId;
  if (order.workerId === workerId) return true;
  if (order.status !== "pending") return false;
  if (order.assignmentType === "specified") return order.specifiedWorkerId === workerId;
  return !order.specifiedWorkerId;
}

export function getCurrentWorkerOrders(): Order[] {
  const session = getCurrentWorkerSession();
  if (!session) return [];
  return readStore()
    .orders.filter((order) => canWorkerSeeOrder(order, session.worker.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCurrentWorkerOrder(orderId: string): Order | null {
  const session = getCurrentWorkerSession();
  if (!session) return null;
  return readStore().orders.find((order) => order.id === orderId && canWorkerSeeOrder(order, session.worker.id)) ?? null;
}

export function acceptOrderAsCurrentWorker(orderId: string): Order {
  const session = getCurrentWorkerSession();
  if (!session) throw new Error("请先登录接单员账号");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    const worker = store.workers.find((item) => item.id === session.worker.id);
    if (!order) throw new Error("订单不存在");
    if (!worker) throw new Error("接单员不存在");
    if (worker.status === "frozen") throw new Error("账号已被冻结，暂不能接单");
    const minimumDeposit = money(Number(store.system_settings.worker.minimumDepositAmount) || 0);
    if (minimumDeposit > 0 && (worker.depositStatus !== "paid" || (worker.depositAmount ?? 0) < minimumDeposit)) {
      throw new Error(`保证金低于 ${formatRock(minimumDeposit)} 洛克贝，暂不能接单`);
    }
    if (order.orderType !== "service") throw new Error("打赏订单无需接单");
    if (order.status !== "pending") throw new Error("订单已被处理");
    if (order.assignmentType === "specified" && order.specifiedWorkerId !== session.worker.id) {
      throw new Error("该订单已指定其他接单员");
    }

    order.status = "accepted";
    order.workerId = session.worker.id;
    order.workerName = session.worker.name;
    order.updatedAt = now();
    order.assignedAt = now();
    order.startedAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("accepted", "接单员已接单，服务开始", "worker"),
    ];
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.workerId = session.worker.id;
    chatSession.workerName = session.worker.name;
    chatSession.status = "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: "system",
      senderRole: "system",
      senderName: "系统",
      messageType: "system",
      content: "接单员已接单，可以开始沟通。",
      isRead: true,
    });
    return order;
  });
}

export function completeOrderAsCurrentWorker(orderId: string): Order {
  const session = getCurrentWorkerSession();
  if (!session) throw new Error("请先登录接单员账号");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.workerId === session.worker.id);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("打赏订单无需完成");
    if (order.status !== "accepted") throw new Error("当前订单暂不能标记完成");
    order.status = "worker_completed";
    order.updatedAt = now();
    order.submittedAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("worker_completed", "接单员已提交完成，等待顾客确认", "worker"),
    ];
    const chatSession = ensureChatSessionForOrder(store, order);
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: "system",
      senderRole: "system",
      senderName: "系统",
      messageType: "system",
      content: "接单员已标记完成，等待顾客确认结单。",
      isRead: true,
    });
    return order;
  });
}

export function getWorkerOrderChat(orderId: string): {
  order: Order | null;
  chatSession: ChatSession | null;
  messages: ChatMessage[];
  unreadCount: number;
} {
  const session = getCurrentWorkerSession();
  if (!session) return { order: null, chatSession: null, messages: [], unreadCount: 0 };

  const store = readStore();
  const order = store.orders.find((item) => item.id === orderId && canWorkerSeeOrder(item, session.worker.id)) ?? null;
  if (!order || order.orderType !== "service") return { order, chatSession: null, messages: [], unreadCount: 0 };
  const chatSession = store.chat_sessions.find((item) => item.orderId === order.id) ?? null;
  if (!chatSession) {
    return updateStore((nextStore) => {
      const nextOrder = nextStore.orders.find((item) => item.id === orderId && canWorkerSeeOrder(item, session.worker.id)) ?? null;
      if (!nextOrder || nextOrder.orderType !== "service") return { order: nextOrder, chatSession: null, messages: [], unreadCount: 0 };
      const nextChatSession = ensureChatSessionForOrder(nextStore, nextOrder);
      return { order: nextOrder, chatSession: nextChatSession, messages: [], unreadCount: 0 };
    });
  }
  const messages = store.chat_messages
    .filter((message) => message.orderId === order.id && message.sessionId === chatSession.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const unreadCount = messages.filter((message) => message.senderRole === "customer" && !message.isRead).length;
  return { order, chatSession, messages, unreadCount };
}

export function sendWorkerChatTextMessage(orderId: string, content: string): ChatMessage {
  const session = getCurrentWorkerSession();
  if (!session) throw new Error("请先登录接单员账号");
  const clean = content.trim();
  if (!clean) throw new Error("请输入消息");
  if (clean.length > 500) throw new Error("单条消息最多 500 字");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.workerId === session.worker.id);
    if (!order) throw new Error("订单不存在或暂未接单");
    if (order.orderType !== "service") throw new Error("当前订单不支持聊天");
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = chatSession.status === "closed" ? "closed" : "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: session.worker.id,
      senderRole: "worker",
      senderName: session.worker.name,
      messageType: "text",
      content: clean,
      isRead: false,
    });
    return store.chat_messages[store.chat_messages.length - 1];
  });
}

export function sendWorkerChatImageMessage(orderId: string, imageUrl: string): ChatMessage {
  const session = getCurrentWorkerSession();
  if (!session) throw new Error("请先登录接单员账号");
  if (!imageUrl) throw new Error("图片读取失败");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.workerId === session.worker.id);
    if (!order) throw new Error("订单不存在或暂未接单");
    if (order.orderType !== "service") throw new Error("当前订单不支持聊天");
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = chatSession.status === "closed" ? "closed" : "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: session.worker.id,
      senderRole: "worker",
      senderName: session.worker.name,
      messageType: "image",
      content: "图片",
      imageUrl,
      isRead: false,
    });
    return store.chat_messages[store.chat_messages.length - 1];
  });
}

export function getOrderChat(orderId: string): {
  order: Order | null;
  chatSession: ChatSession | null;
  messages: ChatMessage[];
  unreadCount: number;
} {
  const session = getCurrentSession();
  if (!session) return { order: null, chatSession: null, messages: [], unreadCount: 0 };

  const store = readStore();
  const order =
    store.orders.find(
      (item) => item.id === orderId && (item.customerId === session.user.id || item.userId === session.user.id),
    ) ?? null;
  if (!order || order.orderType !== "service") return { order, chatSession: null, messages: [], unreadCount: 0 };

  const chatSession = store.chat_sessions.find((item) => item.orderId === order.id) ?? null;
  if (!chatSession) {
    return updateStore((nextStore) => {
      const nextOrder =
        nextStore.orders.find(
          (item) => item.id === orderId && (item.customerId === session.user.id || item.userId === session.user.id),
        ) ?? null;
      if (!nextOrder || nextOrder.orderType !== "service") return { order: nextOrder, chatSession: null, messages: [], unreadCount: 0 };
      const nextChatSession = ensureChatSessionForOrder(nextStore, nextOrder);
      return { order: nextOrder, chatSession: nextChatSession, messages: [], unreadCount: 0 };
    });
  }
  const messages = store.chat_messages
    .filter((message) => message.orderId === order.id && message.sessionId === chatSession.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const unreadCount = messages.filter((message) => message.senderRole === "worker" && !message.isRead).length;
  return { order, chatSession, messages, unreadCount };
}

export function sendChatTextMessage(orderId: string, content: string): ChatMessage {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");

  const clean = content.trim();
  if (!clean) throw new Error("请输入消息");
  if (clean.length > 500) throw new Error("单条消息最多 500 字");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.customerId === session.user.id);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("当前订单不支持聊天");
    if (!order.workerId || !order.workerName) throw new Error("当前订单暂无接单员，暂不能聊天。");
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = chatSession.status === "closed" ? "closed" : "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: session.user.id,
      senderRole: "customer",
      senderName: session.user.nickname,
      messageType: "text",
      content: clean,
      isRead: true,
    });
    return store.chat_messages[store.chat_messages.length - 1];
  });
}

export function sendChatImageMessage(orderId: string, imageUrl: string): ChatMessage {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");
  if (!imageUrl) throw new Error("图片读取失败");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.customerId === session.user.id);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("当前订单不支持聊天");
    if (!order.workerId || !order.workerName) throw new Error("当前订单暂无接单员，暂不能聊天。");
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = chatSession.status === "closed" ? "closed" : "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: session.user.id,
      senderRole: "customer",
      senderName: session.user.nickname,
      messageType: "image",
      content: "图片",
      imageUrl,
      isRead: true,
    });
    return store.chat_messages[store.chat_messages.length - 1];
  });
}

export function simulateWorkerChatMessage(
  orderId: string,
  messageType: Extract<ChatMessageType, "text" | "image"> = "text",
): ChatMessage {
  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("当前订单不支持聊天");
    if (!order.workerId || !order.workerName) throw new Error("当前订单暂无接单员，暂不能聊天。");
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.status = "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: order.workerId,
      senderRole: "worker",
      senderName: order.workerName,
      messageType,
      content: messageType === "image" ? "接单员发送了一张图片" : "好的老板，收到需求，我这边开始处理。",
      imageUrl: messageType === "image" ? "/images/products/default-product.jpg" : undefined,
      isRead: false,
    });
    return store.chat_messages[store.chat_messages.length - 1];
  });
}

function changeOrderStatus(orderId: string, nextStatus: OrderStatus, patch?: Partial<Order>): Order {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.customerId === session.user.id);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("打赏订单无需服务流程");
    order.status = nextStatus;
    order.updatedAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory(nextStatus, `订单状态更新为 ${nextStatus}`, "system"),
    ];
    Object.assign(order, patch);
    return order;
  });
}

export function simulateAcceptOrder(orderId: string): Order {
  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("订单不存在");
    const worker =
      (order.specifiedWorkerId ? store.workers.find((item) => item.id === order.specifiedWorkerId) : null) ??
      store.workers.find((item) => item.id === "worker-silver-fish") ??
      store.workers[0];
    order.status = "accepted";
    order.workerId = worker?.id ?? null;
    order.workerName = worker?.name ?? "双灯鱼";
    order.updatedAt = now();
    order.assignedAt = now();
    order.startedAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("accepted", "开发测试模拟接单", "system"),
    ];
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.workerId = order.workerId;
    chatSession.workerName = order.workerName;
    chatSession.status = "active";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: "system",
      senderRole: "system",
      senderName: "系统",
      messageType: "system",
      content: "接单员已接单，可以开始沟通。",
      isRead: true,
    });
    return order;
  });
}

export function simulateWorkerComplete(orderId: string): Order {
  return changeOrderStatus(orderId, "worker_completed");
}

export function disputeOrder(orderId: string): Order {
  return changeOrderStatus(orderId, "disputed");
}

export function settleOrder(orderId: string, customerRating = 5): Order {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");
  const normalizedRating = Math.max(1, Math.min(5, Math.round(customerRating)));

  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId && item.customerId === session.user.id);
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    if (!order) throw new Error("订单不存在");
    if (!user || !wallet) throw new Error("钱包不存在");
    if (order.orderType !== "service") throw new Error("打赏订单无需结单");
    if (order.status !== "worker_completed") throw new Error("订单暂不能结单");

    order.status = "settled";
    order.updatedAt = now();
    order.settledAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("settled", "管理员处理订单并结单", "admin"),
    ];
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("settled", "顾客确认结单", "customer"),
    ];
    order.customerRating = normalizedRating;
    order.ratedAt = now();
    wallet.frozenBalance = money(Math.max(0, wallet.frozenBalance - order.amountLockeCoin));
    wallet.totalSpent = money(wallet.totalSpent + order.amountLockeCoin);
    wallet.memberLevel = calculateMemberLevel(wallet.totalSpent);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);

    if (order.workerId) {
      const worker = store.workers.find((item) => item.id === order.workerId);
      if (worker) {
        const settlement = calculateOrderSettlementFromStore(store, order, worker);
        const beforeBalance = worker.availableBalance;
        worker.availableBalance = money(worker.availableBalance + settlement.workerIncome);
        worker.totalEarned = money(worker.totalEarned + settlement.workerIncome);
        worker.serviceIncome = money(worker.serviceIncome + settlement.workerIncome);
        const previousCompletedCount = worker.completedOrderCount;
        const previousGoodCount = Math.round((worker.rating / 100) * previousCompletedCount);
        const nextGoodCount = previousGoodCount + (normalizedRating >= 4 ? 1 : 0);
        worker.completedOrderCount += 1;
        worker.rating = worker.completedOrderCount ? Math.round((nextGoodCount / worker.completedOrderCount) * 100) : worker.rating;
        const workerWallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
        if (workerWallet) {
          workerWallet.availableBalance = worker.availableBalance;
          workerWallet.totalEarned = worker.totalEarned;
          workerWallet.updatedAt = now();
          syncWorkerWallet(worker, workerWallet);
        }
        addLedger(store, {
          userId: worker.id,
          relatedOrderId: order.id,
          relatedType: "orders",
          type: "order_income",
          direction: "in",
          amount: settlement.workerIncome,
          beforeBalance,
          afterBalance: worker.availableBalance,
          targetType: "worker",
          description: `服务订单入账：${order.productName}`,
        });
        if (settlement.platformIncome > 0) {
          addLedger(store, {
            userId: "platform",
            relatedOrderId: order.id,
            relatedType: "orders",
            type: "platform_commission",
            direction: "in",
            amount: settlement.platformIncome,
            targetType: "platform",
            description: `平台抽成：${order.productName}，比例 ${settlement.commissionRate}%`,
          });
        }
      }
    }

    addLedger(store, {
      userId: session.user.id,
      relatedOrderId: order.id,
      type: "order_settle",
      direction: "settle",
      amount: order.amountLockeCoin,
      description: `确认结单：${order.productName}`,
    });

    return order;
  });
}

export function getRanking(kind: "spending" | "orders") {
  const store = readStore();
  const users = new Map(store.users.map((user) => [user.id, user]));
  const rows = new Map<string, { user: User; spending: number; serviceOrders: number }>();

  store.orders
    .filter((order) => order.status === "settled")
    .forEach((order) => {
      const user = users.get(order.customerId);
      if (!user) return;
      const current = rows.get(user.id) ?? { user, spending: 0, serviceOrders: 0 };
      current.spending = money(current.spending + order.amountLockeCoin);
      if (order.orderType === "service") current.serviceOrders += 1;
      rows.set(user.id, current);
    });

  const mockRows = [
    { nickname: "洛克玩家A", avatarUrl: "", spending: 328, serviceOrders: 46 },
    { nickname: "异色收藏家", avatarUrl: "", spending: 216, serviceOrders: 31 },
    { nickname: "资源冲刺员", avatarUrl: "", spending: 98, serviceOrders: 18 },
  ];

  const realRows = Array.from(rows.values()).map((row) => ({
    nickname: row.user.nickname,
    avatarUrl: row.user.avatarUrl,
    spending: row.spending,
    serviceOrders: row.serviceOrders,
  }));

  return [...realRows, ...mockRows]
    .sort((a, b) => (kind === "spending" ? b.spending - a.spending : b.serviceOrders - a.serviceOrders))
    .slice(0, 20);
}

export function adminCreateProduct(input: {
  name: string;
  category: ProductCategory;
  categoryId?: string;
  shortDescription?: string;
  priceRmb: number;
  priceLockeCoin: number;
  costPrice?: number;
  imageUrl?: string;
  homeImageUrl?: string;
  detailImages?: string[];
  tags?: string[];
  description: string;
  serviceDescription: string;
  servicePort?: ServicePort;
  sortOrder?: number;
  virtualSales?: number;
  isRecommended?: boolean;
  purchaseLimitEnabled?: boolean;
  purchaseLimitPerUser?: number;
  status?: Product["status"];
  workerIncomeType?: Product["workerIncomeType"];
  workerIncomeAmount?: number;
  estimatedDuration?: string;
  requireGameId?: boolean;
  requireGameNickname?: boolean;
  requireRemark?: boolean;
  allowAssignedWorker?: boolean;
}): Product {
  return updateStore((store) => {
    const priceRmb = money(input.priceRmb || 1);
    const priceLockeCoin = money(input.priceLockeCoin || priceRmb);
    const product: Product = {
      id: makeId("product"),
      name: input.name.trim() || "新商品",
      shortDescription: input.shortDescription?.trim() || input.description.trim() || "商品简介待补充。",
      category: input.category,
      categoryId: input.categoryId || input.category,
      priceRmb,
      priceLockeCoin,
      costPrice: money(input.costPrice ?? 0),
      sales: 0,
      virtualSales: money(input.virtualSales ?? 0),
      realSales: 0,
      imageUrl: input.imageUrl?.trim() || "/images/products/default-product.jpg",
      homeImageUrl: input.homeImageUrl?.trim() || undefined,
      detailImages: input.detailImages ?? [],
      tags: input.tags?.filter(Boolean) ?? [],
      description: input.description.trim() || "商品说明待补充。",
      serviceDescription: input.serviceDescription.trim() || "服务说明待补充。",
      servicePort: input.servicePort ?? "mobile",
      sortOrder: Number(input.sortOrder ?? 0),
      isRecommended: input.isRecommended ?? false,
      purchaseLimitEnabled: input.purchaseLimitEnabled ?? false,
      purchaseLimitPerUser: Math.max(1, Number(input.purchaseLimitPerUser ?? 1)),
      deleted: false,
      workerIncomeType: input.workerIncomeType ?? "fixed",
      workerIncomeAmount: money(input.workerIncomeAmount ?? priceLockeCoin),
      estimatedDuration: input.estimatedDuration?.trim() || "预计 24 小时内完成",
      requireGameId: input.requireGameId ?? true,
      requireGameNickname: input.requireGameNickname ?? true,
      requireRemark: input.requireRemark ?? false,
      allowAssignedWorker: input.allowAssignedWorker ?? true,
      status: input.status ?? "inactive",
      createdAt: now(),
      updatedAt: now(),
    };
    store.products.unshift(product);
    addAdminLog(store, "product_create", "product", product.id, `新增商品：${product.name}`);
    return product;
  });
}

export function adminUpdateProduct(productId: string, patch: Partial<Product>): Product {
  return updateStore((store) => {
    const product = store.products.find((item) => item.id === productId);
    if (!product) throw new Error("商品不存在");
    Object.assign(product, {
      ...patch,
      priceRmb: patch.priceRmb === undefined ? product.priceRmb : money(patch.priceRmb),
      priceLockeCoin: patch.priceLockeCoin === undefined ? product.priceLockeCoin : money(patch.priceLockeCoin),
      costPrice: patch.costPrice === undefined ? product.costPrice : money(patch.costPrice),
      workerIncomeAmount: patch.workerIncomeAmount === undefined ? product.workerIncomeAmount : money(patch.workerIncomeAmount),
      updatedAt: now(),
    });
    addAdminLog(store, "product_update", "product", product.id, `编辑商品：${product.name}`);
    return product;
  });
}

export function adminSetProductStatus(productId: string, status: Product["status"]): Product {
  return updateStore((store) => {
    const product = store.products.find((item) => item.id === productId);
    if (!product) throw new Error("商品不存在");
    product.status = status;
    product.updatedAt = now();
    addAdminLog(store, isProductActive(product) ? "product_on" : "product_off", "product", product.id, `${isProductActive(product) ? "上架" : "下架"}商品：${product.name}`);
    return product;
  });
}

export function adminSoftDeleteProduct(productId: string): Product {
  return updateStore((store) => {
    const product = store.products.find((item) => item.id === productId);
    if (!product) throw new Error("商品不存在");
    product.deleted = true;
    product.status = "inactive";
    product.updatedAt = now();
    addAdminLog(store, "product_delete", "product", product.id, `软删除商品：${product.name}`);
    return product;
  });
}

export function adminUpsertProductCategory(input: Partial<ProductCategoryRecord> & { name: string }): ProductCategoryRecord {
  return updateStore((store) => {
    const name = input.name.trim();
    if (!name) throw new Error("分类名称不能为空");
    if (name.length > 50) throw new Error("分类名称最多 50 个字");
    const parent = input.parentId ? store.product_categories.find((item) => item.id === input.parentId) : null;
    if (input.parentId && !parent) throw new Error("父级分类不存在");
    if (parent?.parentId) throw new Error("最多支持二级分类");

    let category = input.id ? store.product_categories.find((item) => item.id === input.id) : undefined;
    if (category) {
      Object.assign(category, {
        parentId: input.parentId ?? null,
        name,
        iconUrl: input.iconUrl ?? "",
        sortOrder: Number(input.sortOrder ?? 0),
        status: input.status ?? "on",
        updatedAt: now(),
      });
      addAdminLog(store, "product_category_update", "product_category", category.id, `编辑商品分类：${category.name}`);
    } else {
      category = {
        id: makeId("cat"),
        parentId: input.parentId ?? null,
        name,
        iconUrl: input.iconUrl ?? "",
        sortOrder: Number(input.sortOrder ?? 0),
        status: input.status ?? "on",
        createdAt: now(),
        updatedAt: now(),
      };
      store.product_categories.push(category);
      addAdminLog(store, "product_category_create", "product_category", category.id, `新增商品分类：${category.name}`);
    }
    return category;
  });
}

export function adminSetProductCategoryStatus(categoryId: string, status: Product["status"]): ProductCategoryRecord {
  return updateStore((store) => {
    const category = store.product_categories.find((item) => item.id === categoryId);
    if (!category) throw new Error("分类不存在");
    category.status = status;
    category.updatedAt = now();
    addAdminLog(store, isProductActive(category) ? "product_category_on" : "product_category_off", "product_category", category.id, `${isProductActive(category) ? "上架" : "下架"}商品分类：${category.name}`);
    return category;
  });
}

export function adminDeleteProductCategory(categoryId: string): void {
  updateStore((store) => {
    const category = store.product_categories.find((item) => item.id === categoryId);
    if (!category) throw new Error("分类不存在");
    if (store.product_categories.some((item) => item.parentId === categoryId)) throw new Error("请先删除或移动二级分类");
    if (store.products.some((product) => !product.deleted && (product.categoryId === categoryId || product.category === category.name))) {
      throw new Error("当前分类下仍有关联商品，请先移动或下架商品");
    }
    store.product_categories = store.product_categories.filter((item) => item.id !== categoryId);
    addAdminLog(store, "product_category_delete", "product_category", category.id, `删除商品分类：${category.name}`);
  });
}

function ensureAdminChatMessage(store: StoreShape, order: Order, content: string) {
  if (order.orderType !== "service") return;
  const chatSession = ensureChatSessionForOrder(store, order);
  addChatMessage(store, {
    sessionId: chatSession.id,
    orderId: order.id,
    senderId: "admin",
    senderRole: "system",
    senderName: "管理员",
    messageType: "system",
    content,
    isRead: true,
  });
}

export function adminSettleOrder(orderId: string): Order {
  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("打赏订单无需结单");
    if (!["worker_completed", "disputed"].includes(order.status)) throw new Error("当前订单不能管理员结单");
    const user = store.users.find((item) => item.id === order.customerId);
    const userWallet = store.wallet_accounts.find((item) => item.userId === order.customerId);
    const worker = order.workerId ? store.workers.find((item) => item.id === order.workerId) : null;
    if (!user || !userWallet) throw new Error("顾客钱包不存在");
    if (!worker) throw new Error("订单暂无接单员");

    order.status = "settled";
    order.updatedAt = now();
    order.settledAt = now();

    userWallet.frozenBalance = money(Math.max(0, userWallet.frozenBalance - order.amountLockeCoin));
    userWallet.totalSpent = money(userWallet.totalSpent + order.amountLockeCoin);
    userWallet.memberLevel = calculateMemberLevel(userWallet.totalSpent);
    userWallet.updatedAt = now();
    syncUserWallet(user, userWallet);

    const settlement = calculateOrderSettlementFromStore(store, order, worker);
    const workerBeforeBalance = worker.availableBalance;
    worker.availableBalance = money(worker.availableBalance + settlement.workerIncome);
    worker.totalEarned = money(worker.totalEarned + settlement.workerIncome);
    worker.serviceIncome = money(worker.serviceIncome + settlement.workerIncome);
    worker.completedOrderCount += 1;
    const workerWallet = store.wallet_accounts.find((item) => item.userId === worker.id && item.ownerType === "worker");
    if (workerWallet) {
      workerWallet.availableBalance = worker.availableBalance;
      workerWallet.totalEarned = worker.totalEarned;
      workerWallet.updatedAt = now();
      syncWorkerWallet(worker, workerWallet);
    }

    addLedger(store, {
      userId: user.id,
      relatedOrderId: order.id,
      type: "order_settle",
      direction: "settle",
      amount: order.amountLockeCoin,
      description: `管理员结单：${order.productName}`,
    });
    addLedger(store, {
      userId: worker.id,
      relatedOrderId: order.id,
      relatedType: "orders",
      type: "order_income",
      direction: "in",
      amount: settlement.workerIncome,
      beforeBalance: workerBeforeBalance,
      afterBalance: worker.availableBalance,
      targetType: "worker",
      description: `服务订单入账：${order.productName}`,
    });
    if (settlement.platformIncome > 0) {
      addLedger(store, {
        userId: "platform",
        relatedOrderId: order.id,
        relatedType: "orders",
        type: "platform_commission",
        direction: "in",
        amount: settlement.platformIncome,
        targetType: "platform",
        description: `平台抽成：${order.productName}，比例 ${settlement.commissionRate}%`,
      });
    }
    ensureAdminChatMessage(store, order, "管理员已处理订单并结单。");
    addAdminLog(store, "order_admin_settle", "order", order.id, `管理员结单：${order.orderNo}`);
    return order;
  });
}

export function adminRefundOrder(orderId: string): Order {
  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("订单不存在");
    if (order.orderType !== "service") throw new Error("打赏订单当前不支持后台退款");
    if (!["pending", "accepted", "worker_completed", "disputed"].includes(order.status)) throw new Error("当前订单不能退款");
    const user = store.users.find((item) => item.id === order.customerId);
    const wallet = store.wallet_accounts.find((item) => item.userId === order.customerId);
    if (!user || !wallet) throw new Error("顾客钱包不存在");

    order.status = "refunded";
    order.updatedAt = now();
    order.paymentStatus = "refunded";
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory("refunded", "管理员处理订单并退款", "admin"),
    ];
    wallet.frozenBalance = money(Math.max(0, wallet.frozenBalance - order.amountLockeCoin));
    wallet.availableBalance = money(wallet.availableBalance + order.amountLockeCoin);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);
    addLedger(store, {
      userId: user.id,
      relatedOrderId: order.id,
      type: "refund",
      direction: "in",
      amount: order.amountLockeCoin,
      description: `管理员退款：${order.productName}`,
    });
    ensureAdminChatMessage(store, order, "管理员已处理订单并退款。");
    addAdminLog(store, "order_refund", "order", order.id, `管理员退款：${order.orderNo}`);
    return order;
  });
}

export function adminUpdateOrderStatus(orderId: string, status: OrderStatus): Order {
  return updateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("订单不存在");
    order.status = status;
    order.updatedAt = now();
    order.statusHistory = [
      ...(order.statusHistory ?? []),
      makeStatusHistory(status, `管理员将订单状态更新为 ${status}`, "admin"),
    ];
    ensureAdminChatMessage(store, order, `管理员已将订单状态更新为：${status}`);
    addAdminLog(store, "order_status_update", "order", order.id, `修改订单状态：${order.orderNo} -> ${status}`);
    return order;
  });
}

export function adminCreateOrder(input: {
  customerMode: "existing" | "manual";
  customerId?: string;
  customerName?: string;
  productMode: "existing" | "custom";
  productId?: string;
  customProductName?: string;
  customProductCategory?: ProductCategory;
  customProductDescription?: string;
  priceRmb: number;
  priceLockeCoin?: number;
  quantity: number;
  servicePort: ServicePort;
  workerId?: string | null;
  gameId: string;
  gameNickname: string;
  remark?: string;
}): Order {
  return updateStore((store) => {
    let user: User | undefined;
    let userWallet: WalletAccount | undefined;

    if (input.customerMode === "existing") {
      user = store.users.find((item) => item.id === input.customerId);
      if (!user) throw new Error("请选择已有用户");
      userWallet = store.wallet_accounts.find((item) => item.userId === user?.id);
    } else {
      const nickname = input.customerName?.trim() || "后台临时顾客";
      user = {
        id: makeId("user"),
        displayId: makeDisplayId(),
        nickname,
        nicknameEditable: true,
        avatarUrl: "",
        role: "customer",
        status: "active",
        memberLevel: "普通会员",
        totalSpent: 0,
        availableBalance: 0,
        frozenBalance: 0,
        createdAt: now(),
        updatedAt: now(),
      };
      userWallet = migrateWallet({}, user);
      store.users.push(user);
      store.wallet_accounts.push(userWallet);
    }

    if (!user || !userWallet) throw new Error("顾客钱包不存在");

    const product = input.productMode === "existing" ? store.products.find((item) => item.id === input.productId && isProductActive(item)) : undefined;
    if (input.productMode === "existing" && !product) throw new Error("请选择商品");

    const worker = input.workerId ? store.workers.find((item) => item.id === input.workerId) : null;
    if (input.workerId && !worker) throw new Error("接单员不存在");
    if (worker?.status === "frozen") throw new Error("该接单员已冻结，不能指派");

    const quantity = Math.max(1, Math.round(input.quantity || 1));
    const priceRmb = money(product?.priceRmb ?? input.priceRmb);
    const priceLockeCoin = money(product?.priceLockeCoin ?? input.priceLockeCoin ?? input.priceRmb);
    const amountRmb = money(priceRmb * quantity);
    const amountLockeCoin = money(priceLockeCoin * quantity);

    const order: Order = {
      id: makeId("order"),
      orderNo: makeNo("XLK"),
      orderType: "service",
      userId: user.id,
      customerId: user.id,
      customerName: user.nickname,
      productId: product?.id,
      productName: product?.name ?? input.customProductName?.trim() ?? "后台自定义商品",
      productDescription: product?.description ?? input.customProductDescription?.trim(),
      productImageUrl: product?.imageUrl ?? "/images/products/default-product.jpg",
      productCategory: product?.category ?? input.customProductCategory ?? "资源专区",
      productSnapshot: product
        ? {
            name: product.name,
            priceRmb: product.priceRmb,
            priceLockeCoin: product.priceLockeCoin,
            category: product.category,
            servicePort: product.servicePort,
            workerIncomeType: product.workerIncomeType,
            workerIncomeAmount: product.workerIncomeAmount,
          }
        : undefined,
      customProductInfo: product
        ? undefined
        : {
            name: input.customProductName?.trim() || "后台自定义商品",
            category: input.customProductCategory ?? "资源专区",
            description: input.customProductDescription?.trim(),
          },
      servicePort: input.servicePort,
      workerId: worker?.id ?? null,
      workerName: worker?.name ?? null,
      gameNickname: input.gameNickname.trim(),
      gameId: input.gameId.trim(),
      quantity,
      remark: input.remark?.trim(),
      assignmentType: worker ? "specified" : "random",
      specifiedWorkerId: worker?.id ?? null,
      specifiedWorkerName: worker?.name ?? null,
      paymentMethod: "admin_created",
      paymentStatus: "paid",
      amountRmb,
      amountLockeCoin,
      amount: amountLockeCoin,
      status: worker ? "accepted" : "pending",
      createdAt: now(),
      updatedAt: now(),
      paidAt: now(),
      assignedAt: worker ? now() : undefined,
      startedAt: worker ? now() : undefined,
      assignedByAdmin: Boolean(worker),
      statusHistory: [
        makeStatusHistory("paid", "管理员后台派单创建订单，默认已确认收款", "admin"),
        makeStatusHistory(worker ? "accepted" : "pending", worker ? "管理员指定接单员，订单进入服务中" : "订单进入待接单，等待接单员抢单", "admin"),
      ],
    };

    if (product) product.sales += quantity;
    store.orders.unshift(order);
    const chatSession = ensureChatSessionForOrder(store, order);
    chatSession.workerId = worker?.id ?? null;
    chatSession.workerName = worker?.name ?? null;
    chatSession.status = worker ? "active" : "waiting_worker";
    chatSession.updatedAt = now();
    addChatMessage(store, {
      sessionId: chatSession.id,
      orderId: order.id,
      senderId: "admin",
      senderRole: "system",
      senderName: "管理员",
      messageType: "system",
      content: "管理员已创建订单，请顾客和接单员按订单要求沟通。",
      isRead: true,
    });
    addAdminLog(store, "admin_create_order", "order", order.id, `后台派单创建订单：${order.orderNo}`);
    return order;
  });
}

export function adminUpdateWorkerLevel(workerId: string, level: WorkerLevel): Worker {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.level = level;
    worker.updatedAt = now();
    addAdminLog(store, "worker_level_update", "worker", worker.id, `修改接单员等级：${worker.name} -> ${level}`);
    return worker;
  });
}

export function adminUpdateWorkerProfile(workerId: string, input: {
  statusMode?: "active" | "frozen" | "offline" | "online";
  level?: WorkerLevel;
  userName?: string;
  name?: string;
  gender?: Worker["gender"];
  gameId?: string;
  gameNickname?: string;
  intro?: string;
  servicePort?: ServicePort;
}): Worker {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    const cleanName = input.name?.trim();
    if (cleanName !== undefined) {
      if (!cleanName) throw new Error("接单员昵称不能为空");
      if (cleanName.length > 50) throw new Error("接单员昵称最多 50 字");
      worker.name = cleanName;
    }
    const cleanIntro = input.intro?.trim();
    if (cleanIntro !== undefined) {
      if (cleanIntro.length > 500) throw new Error("简介最多 500 字");
      worker.intro = cleanIntro;
    }
    if (input.userName !== undefined) worker.userName = input.userName.trim();
    if (input.gender) worker.gender = input.gender;
    if (input.gameId !== undefined) worker.gameId = input.gameId.trim();
    if (input.gameNickname !== undefined) worker.gameNickname = input.gameNickname.trim();
    if (input.level) worker.level = input.level;
    if (input.servicePort) worker.servicePort = input.servicePort;
    if (input.statusMode) {
      if (input.statusMode === "frozen") {
        worker.status = "frozen";
        worker.onlineStatus = "offline";
      } else if (input.statusMode === "online") {
        worker.status = "normal";
        worker.onlineStatus = "online";
      } else if (input.statusMode === "offline") {
        worker.status = "normal";
        worker.onlineStatus = "offline";
      } else {
        worker.status = "normal";
      }
    }
    worker.updatedAt = now();
    addAdminLog(store, "update_worker_profile", "worker", worker.id, `编辑接单员资料：${worker.name}`);
    return worker;
  });
}

export function adminSetWorkerFrozen(workerId: string, frozen: boolean): Worker {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    worker.status = frozen ? "frozen" : "normal";
    if (frozen) worker.onlineStatus = "offline";
    worker.updatedAt = now();
    addAdminLog(store, frozen ? "worker_freeze" : "worker_unfreeze", "worker", worker.id, `${frozen ? "冻结" : "解冻"}接单员：${worker.name}`);
    return worker;
  });
}

export function adminUpdateUserRemark(userId: string, remark: string): User {
  return updateStore((store) => {
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw new Error("用户不存在");
    user.adminRemark = remark.trim();
    user.updatedAt = now();
    addAdminLog(store, "user_remark_update", "user", user.id, `更新用户备注：${user.nickname}`);
    return user;
  });
}

export function adminPayWorkerDeposit(workerId: string, amount = 100): Worker {
  return adminAdjustWorkerDeposit({ workerId, mode: "add", amount, remark: "管理员代缴保证金" });
}

export function adminAdjustWorkerDeposit(input: {
  workerId: string;
  mode: "add" | "deduct";
  amount: number;
  remark: string;
}): Worker {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === input.workerId);
    if (!worker) throw new Error("接单员不存在");
    const amount = money(input.amount);
    const remark = input.remark.trim();
    if (amount <= 0) throw new Error("保证金金额必须大于 0");
    if (!remark) throw new Error("请填写备注");
    if (remark.length > 200) throw new Error("备注最多 200 字");
    const before = money(worker.depositAmount ?? 0);
    if (input.mode === "deduct" && before < amount) throw new Error("当前保证金余额不足，无法代扣");
    const after = money(input.mode === "add" ? before + amount : before - amount);
    worker.depositAmount = after;
    worker.depositStatus = after > 0 ? "paid" : "unpaid";
    worker.updatedAt = now();
    addLedger(store, {
      userId: worker.id,
      type: input.mode === "add" ? "deposit_admin_add" : "deposit_admin_deduct",
      direction: input.mode === "add" ? "in" : "out",
      amount,
      beforeBalance: before,
      afterBalance: after,
      targetType: "worker",
      relatedType: "deposit",
      description: `${input.mode === "add" ? "管理员代缴保证金" : "管理员代扣保证金"}：${remark}`,
    });
    addAdminLog(store, input.mode === "add" ? "admin_deposit_add" : "admin_deposit_deduct", "worker", worker.id, `${input.mode === "add" ? "代缴" : "代扣"}保证金：${worker.name} ${amount} 洛克贝`);
    return worker;
  });
}

export function adminUpdateWorkerCommission(workerId: string, rate: number): Worker {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === workerId);
    if (!worker) throw new Error("接单员不存在");
    if (!Number.isFinite(rate)) throw new Error("请输入平台抽成比例");
    const normalizedRate = Math.max(0, Math.min(100, Math.round(rate * 100) / 100));
    worker.platformCommissionRate = normalizedRate;
    const legacyWorker = worker as Worker & Record<string, unknown>;
    delete legacyWorker["mobile" + "PlatformCommission"];
    delete legacyWorker["pc" + "PlatformCommission"];
    worker.updatedAt = now();
    addAdminLog(store, "worker_commission_update", "worker", worker.id, `设置平台抽成：${worker.name} ${normalizedRate}%`);
    return worker;
  });
}

export function adminAdjustWorkerBalance(input: {
  workerId: string;
  direction: "in" | "out";
  amount: number;
  remark: string;
}): WalletAccount {
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === input.workerId);
    if (!worker) throw new Error("接单员不存在");
    const amount = money(input.amount);
    const remark = input.remark.trim();
    if (amount <= 0) throw new Error("金额必须大于 0");
    if (!remark) throw new Error("请填写备注");
    if (remark.length > 200) throw new Error("备注最多 200 字");
    const wallet = ensureWorkerWallet(store, worker);
    const before = wallet.availableBalance;
    if (input.direction === "out" && before < amount) throw new Error("当前余额不足，无法扣款");
    wallet.availableBalance = money(input.direction === "in" ? before + amount : before - amount);
    wallet.totalEarned = input.direction === "in" ? money(wallet.totalEarned + amount) : wallet.totalEarned;
    wallet.updatedAt = now();
    syncWorkerWallet(worker, wallet);
    addLedger(store, {
      userId: worker.id,
      type: "admin_adjust",
      direction: input.direction,
      amount,
      beforeBalance: before,
      afterBalance: wallet.availableBalance,
      targetType: "worker",
      relatedType: "wallet",
      description: `管理员${input.direction === "in" ? "充值" : "扣款"}：${remark}`,
    });
    addAdminLog(store, input.direction === "in" ? "admin_worker_balance_add" : "admin_worker_balance_deduct", "worker", worker.id, `${input.direction === "in" ? "增加" : "扣除"}接单员余额：${worker.name} ${amount} 洛克贝`);
    return wallet;
  });
}

export function adminAdjustWallet(input: {
  userId: string;
  direction: "in" | "out";
  amount: number;
  reason: string;
}): WalletAccount {
  return updateStore((store) => {
    const amount = money(input.amount);
    if (amount <= 0) throw new Error("调整数量必须大于 0");
    if (!input.reason.trim()) throw new Error("必须填写调整原因");
    const wallet = store.wallet_accounts.find((item) => item.userId === input.userId);
    if (!wallet) throw new Error("钱包不存在");
    if (input.direction === "out" && wallet.availableBalance < amount) throw new Error("可用余额不足，不能扣除");
    const before = wallet.availableBalance;
    wallet.availableBalance = money(input.direction === "in" ? wallet.availableBalance + amount : wallet.availableBalance - amount);
    wallet.updatedAt = now();
    const user = store.users.find((item) => item.id === wallet.userId);
    const worker = store.workers.find((item) => item.id === wallet.userId);
    if (user) syncUserWallet(user, wallet);
    if (worker) syncWorkerWallet(worker, wallet);
    addLedger(store, {
      userId: wallet.userId,
      type: "admin_adjust",
      direction: input.direction,
      amount,
      beforeBalance: before,
      afterBalance: wallet.availableBalance,
      targetType: wallet.ownerType,
      relatedType: "wallet",
      description: `管理员调整：${input.reason.trim()}`,
    });
    addAdminLog(store, "wallet_adjust", "wallet", wallet.id, `${input.direction === "in" ? "增加" : "扣除"} ${amount} 洛克贝：${input.reason.trim()}`);
    return wallet;
  });
}

export function adminUpsertRechargePackage(input: {
  id?: string;
  sortOrder: number;
  amountRmb: number;
  bonusLockeCoin: number;
  status: RechargePackage["status"];
}): RechargePackage {
  const amountRmb = money(input.amountRmb);
  const bonusLockeCoin = money(input.bonusLockeCoin);
  if (amountRmb <= 0) throw new Error("充值金额必须大于 0");
  if (bonusLockeCoin < 0) throw new Error("赠送洛克贝不能小于 0");
  return updateStore((store) => {
    const existing = input.id ? store.recharge_packages.find((item) => item.id === input.id) : null;
    if (existing) {
      existing.sortOrder = Number(input.sortOrder) || 0;
      existing.amountRmb = amountRmb;
      existing.bonusLockeCoin = bonusLockeCoin;
      existing.amountLockeCoin = money(amountRmb + bonusLockeCoin);
      existing.status = input.status;
      existing.updatedAt = now();
      addAdminLog(store, "recharge_package_update", "recharge_package", existing.id, `编辑充值套餐：${formatCurrency(amountRmb)} 到账 ${formatRock(existing.amountLockeCoin)}`);
      return existing;
    }
    const created: RechargePackage = {
      id: makeId("recharge_package"),
      sortOrder: Number(input.sortOrder) || 0,
      amountRmb,
      bonusLockeCoin,
      amountLockeCoin: money(amountRmb + bonusLockeCoin),
      status: input.status,
      deleted: false,
      createdAt: now(),
      updatedAt: now(),
    };
    store.recharge_packages.unshift(created);
    addAdminLog(store, "recharge_package_create", "recharge_package", created.id, `新增充值套餐：${formatCurrency(amountRmb)} 到账 ${formatRock(created.amountLockeCoin)}`);
    return created;
  });
}

export function adminSetRechargePackageStatus(packageId: string, status: RechargePackage["status"]): RechargePackage {
  return updateStore((store) => {
    const item = store.recharge_packages.find((entry) => entry.id === packageId);
    if (!item) throw new Error("充值套餐不存在");
    item.status = status;
    item.updatedAt = now();
    addAdminLog(store, status === "active" ? "recharge_package_enable" : "recharge_package_disable", "recharge_package", item.id, `${status === "active" ? "启用" : "停用"}充值套餐：${formatCurrency(item.amountRmb)}`);
    return item;
  });
}

export function adminDeleteRechargePackage(packageId: string): RechargePackage {
  return updateStore((store) => {
    const item = store.recharge_packages.find((entry) => entry.id === packageId);
    if (!item) throw new Error("充值套餐不存在");
    item.deleted = true;
    item.status = "inactive";
    item.updatedAt = now();
    addAdminLog(store, "recharge_package_delete", "recharge_package", item.id, `停用并删除充值套餐：${formatCurrency(item.amountRmb)}`);
    return item;
  });
}

export function buildPaymentRecords(inputStore?: StoreShape): PaymentRecord[] {
  const store = inputStore ?? readStore();
  const records: PaymentRecord[] = [];

  store.orders.forEach((order) => {
    const refunded = order.status === "refunded" || order.status === "after_sale_refunded" || order.paymentStatus === "refunded";
    const pending = order.status === "unpaid" || order.paymentStatus === "unpaid";
    const failed = order.status === "failed";
    const closed = order.status === "cancelled";
    const status: PaymentRecordStatus = refunded ? "refunded" : failed ? "failed" : closed ? "closed" : pending ? "pending" : "success";
    const channel = normalizePaymentChannel(order.paymentMethod);
    records.push({
      id: `payment-order-${order.id}`,
      paymentNo: `PAY${order.orderNo}`,
      type: order.orderType === "tip" ? "tip_payment" : "order_payment",
      channel,
      amountRmb: money(order.amountRmb ?? order.amount ?? 0),
      amountLockeCoin: order.amountLockeCoin,
      status,
      businessId: order.id,
      businessNo: order.orderNo,
      businessLabel: `${order.orderType === "tip" ? "打赏支付" : "订单支付"} #${order.orderNo}`,
      userId: order.customerId,
      userName: order.customerName,
      workerId: order.workerId ?? undefined,
      workerName: order.workerName ?? undefined,
      channelTradeNo: status === "success" ? `${channel.toUpperCase()}_${order.orderNo}` : undefined,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      refundedAt: refunded ? order.updatedAt : undefined,
      remark: order.remark,
    });
  });

  store.recharge_orders.forEach((order) => {
    const user = store.users.find((item) => item.id === order.userId);
    records.push({
      id: `payment-recharge-${order.id}`,
      paymentNo: `PAY${order.rechargeNo}`,
      type: "recharge",
      channel: "mock",
      amountRmb: order.amountRmb,
      amountLockeCoin: order.amountLockeCoin,
      status: rechargeStatusToPayment(order.status),
      businessId: order.id,
      businessNo: order.rechargeNo,
      businessLabel: `充值订单 #${order.rechargeNo}`,
      userId: order.userId,
      userName: user?.nickname,
      channelTradeNo: order.status === "paid" ? `MOCK_${order.rechargeNo}` : undefined,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      remark: "洛克贝充值",
    });
  });

  store.wallet_ledger
    .filter((entry) => ["deposit_paid", "deposit_admin_add", "deposit_admin_deduct", "deposit_refund", "admin_adjust", "refund", "order_refund"].includes(entry.type))
    .forEach((entry) => {
      const worker = store.workers.find((item) => item.id === entry.userId);
      const user = store.users.find((item) => item.id === entry.userId);
      const type: PaymentRecord["type"] = entry.type.includes("deposit") ? "deposit" : entry.type === "admin_adjust" ? "admin_adjust" : "refund";
      records.push({
        id: `payment-ledger-${entry.id}`,
        paymentNo: `LEDGER${entry.id.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase()}`,
        type,
        channel: "admin_created",
        amountRmb: entry.amount,
        amountLockeCoin: entry.amount,
        status: type === "refund" ? "refunded" : "success",
        businessId: entry.relatedOrderId ?? entry.rechargeOrderId ?? entry.id,
        businessNo: entry.relatedOrderId ?? entry.rechargeOrderId ?? entry.id,
        businessLabel: type === "deposit" ? `接单员保证金 #${entry.userId}` : type === "admin_adjust" ? `管理员调整 #${entry.id}` : `退款记录 #${entry.relatedOrderId ?? entry.id}`,
        userId: user?.id,
        userName: user?.nickname,
        workerId: worker?.id,
        workerName: worker?.name,
        channelTradeNo: `ADMIN_${entry.id}`,
        createdAt: entry.createdAt,
        paidAt: entry.createdAt,
        refundedAt: type === "refund" ? entry.createdAt : undefined,
        remark: entry.description,
      });
    });

  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function normalizePaymentChannel(method: PaymentMethod): PaymentRecordChannel {
  if (method === "locke_coin") return "locke_coin";
  if (method === "wechat") return "wechat";
  if (method === "alipay") return "alipay";
  return "admin_created";
}

function rechargeStatusToPayment(status: RechargeOrder["status"]): PaymentRecordStatus {
  if (status === "paid") return "success";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "closed";
  return "pending";
}

export function adminCreateWithdrawRequest(input: {
  workerId: string;
  amountLockeCoin: number;
  feeLockeCoin?: number;
  receiveInfo?: string;
  remark?: string;
}): WithdrawRequest {
  const amount = money(input.amountLockeCoin);
  if (amount <= 0) throw new Error("提现金额必须大于 0");
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === input.workerId);
    const wallet = store.wallet_accounts.find((item) => item.userId === input.workerId && item.ownerType === "worker");
    if (!worker || !wallet) throw new Error("接单员钱包不存在");
    const finance = store.system_settings.finance;
    const reserve = money(finance.walletReserveAmount);
    const withdrawable = money(Math.max(0, wallet.availableBalance - reserve));
    const fee = money(input.feeLockeCoin ?? amount * finance.withdrawFeeRate);
    if (amount < finance.minimumWithdrawAmount) throw new Error(`最低提现金额为 ${formatRock(finance.minimumWithdrawAmount)} 洛克贝`);
    if (amount > withdrawable) throw new Error(`可提现金额不足，当前可提现 ${formatRock(withdrawable)} 洛克贝`);
    if (wallet.availableBalance < amount) throw new Error("接单员余额不足，不能提交提现");
    const before = wallet.availableBalance;
    wallet.availableBalance = money(wallet.availableBalance - amount);
    wallet.frozenBalance = money(wallet.frozenBalance + amount);
    wallet.updatedAt = now();
    syncWorkerWallet(worker, wallet);
    const request: WithdrawRequest = {
      id: makeId("withdraw"),
      requestNo: makeNo("WD"),
      workerId: worker.id,
      workerName: worker.name,
      amountLockeCoin: amount,
      feeLockeCoin: fee,
      actualAmountLockeCoin: money(amount - fee),
      receiveInfo: input.receiveInfo?.trim() || "未填写",
      remark: input.remark?.trim(),
      status: "pending",
      createdAt: now(),
    };
    store.withdraw_requests.unshift(request);
    addLedger(store, {
      userId: worker.id,
      type: "withdraw_freeze",
      direction: "out",
      amount,
      beforeBalance: before,
      afterBalance: wallet.availableBalance,
      targetType: "worker",
      relatedType: "withdraw_requests",
      description: `提现申请冻结：${request.requestNo}`,
    });
    addAdminLog(store, "withdraw_create_by_admin", "withdraw", request.id, `代提交提现：${worker.name} ${formatRock(amount)}`);
    return request;
  });
}

export function createWithdrawRequestAsCurrentWorker(input: {
  amountLockeCoin: number;
  receiveInfo?: string;
  remark?: string;
}): WithdrawRequest {
  const session = getCurrentWorkerSession();
  if (!session) throw new Error("请先登录接单员账号");
  const amount = money(input.amountLockeCoin);
  if (amount <= 0) throw new Error("提现金额必须大于 0");
  return updateStore((store) => {
    const worker = store.workers.find((item) => item.id === session.worker.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.worker.id && item.ownerType === "worker");
    if (!worker || !wallet) throw new Error("接单员钱包不存在");
    const finance = store.system_settings.finance;
    const reserve = money(finance.walletReserveAmount);
    const withdrawable = money(Math.max(0, wallet.availableBalance - reserve));
    const fee = money(amount * finance.withdrawFeeRate);
    if (amount < finance.minimumWithdrawAmount) throw new Error(`最低提现金额为 ${formatRock(finance.minimumWithdrawAmount)} 洛克贝`);
    if (amount > withdrawable) throw new Error(`可提现金额不足，当前可提现 ${formatRock(withdrawable)} 洛克贝`);
    const before = wallet.availableBalance;
    wallet.availableBalance = money(wallet.availableBalance - amount);
    wallet.frozenBalance = money(wallet.frozenBalance + amount);
    wallet.updatedAt = now();
    syncWorkerWallet(worker, wallet);
    const request: WithdrawRequest = {
      id: makeId("withdraw"),
      requestNo: makeNo("WD"),
      workerId: worker.id,
      workerName: worker.name,
      amountLockeCoin: amount,
      feeLockeCoin: fee,
      actualAmountLockeCoin: money(amount - fee),
      receiveInfo: input.receiveInfo?.trim() || "未填写",
      remark: input.remark?.trim(),
      status: "pending",
      createdAt: now(),
    };
    store.withdraw_requests.unshift(request);
    addLedger(store, {
      userId: worker.id,
      type: "withdraw_freeze",
      direction: "out",
      amount,
      beforeBalance: before,
      afterBalance: wallet.availableBalance,
      targetType: "worker",
      relatedType: "withdraw_requests",
      description: `提现申请冻结：${request.requestNo}`,
    });
    return request;
  });
}

export function adminUpdateWithdrawStatus(withdrawId: string, status: WithdrawStatus, remark?: string): WithdrawRequest {
  return updateStore((store) => {
    const request = store.withdraw_requests.find((item) => item.id === withdrawId);
    if (!request) throw new Error("提现申请不存在");
    const workerWallet = store.wallet_accounts.find((item) => item.userId === request.workerId && item.ownerType === "worker");
    const worker = store.workers.find((item) => item.id === request.workerId);
    if (!workerWallet) throw new Error("接单员钱包不存在");
    const normalizedStatus: WithdrawStatus = status === "completed" ? "paid" : status;
    const amount = money(request.amountLockeCoin);

    if (normalizedStatus === "approved") {
      request.approvedAt = now();
    }

    if (normalizedStatus === "rejected") {
      const before = workerWallet.availableBalance;
      if (workerWallet.frozenBalance >= amount) {
        workerWallet.frozenBalance = money(workerWallet.frozenBalance - amount);
        workerWallet.availableBalance = money(workerWallet.availableBalance + amount);
        workerWallet.updatedAt = now();
        if (worker) syncWorkerWallet(worker, workerWallet);
        addLedger(store, {
          userId: request.workerId,
          type: "withdraw_rejected",
          direction: "in",
          amount,
          beforeBalance: before,
          afterBalance: workerWallet.availableBalance,
          targetType: "worker",
          relatedType: "withdraw_requests",
          description: `提现拒绝返还：${remark?.trim() || "管理员驳回"}`,
        });
      }
      request.rejectedAt = now();
    }

    if (normalizedStatus === "paid") {
      const before = workerWallet.availableBalance;
      if (workerWallet.frozenBalance >= amount) {
        workerWallet.frozenBalance = money(workerWallet.frozenBalance - amount);
      } else {
        if (workerWallet.availableBalance < amount) throw new Error("接单员可用洛克贝不足");
        workerWallet.availableBalance = money(workerWallet.availableBalance - amount);
      }
      workerWallet.updatedAt = now();
      if (worker) syncWorkerWallet(worker, workerWallet);
      request.completedAt = now();
      request.paidAt = now();
      addLedger(store, {
        userId: request.workerId,
        type: "withdraw_done",
        direction: "out",
        amount,
        beforeBalance: before,
        afterBalance: workerWallet.availableBalance,
        targetType: "worker",
        relatedType: "withdraw_requests",
        description: `提现已处理：${remark?.trim() || "管理员线下处理"}`,
      });
    }
    request.status = normalizedStatus;
    request.adminRemark = remark?.trim() || request.adminRemark;
    addAdminLog(store, "withdraw_update", "withdraw", request.id, `处理提现：${request.requestNo} -> ${normalizedStatus}`);
    return request;
  });
}

export function resetLocalMockData() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
