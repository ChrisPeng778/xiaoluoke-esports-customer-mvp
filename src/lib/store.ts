"use client";

import { initialStore } from "./mockData";
import type {
  AssignmentType,
  ChatMessage,
  ChatMessageType,
  ChatSession,
  CustomerSession,
  LedgerDirection,
  LedgerType,
  MemberLevel,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  RechargeOrder,
  StoreShape,
  User,
  WalletAccount,
  WalletLedger,
  Worker,
} from "./types";

const STORE_KEY = "xiaoluoke_customer_mvp_store";
const SESSION_KEY = "xiaoluoke_customer_mvp_current_user_id";

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
  return {
    id: raw.id ?? seed.id,
    name: raw.name ?? seed.name,
    category,
    priceRmb: money(raw.priceRmb ?? raw.price ?? seed.priceRmb),
    priceLockeCoin: money(raw.priceLockeCoin ?? raw.price ?? seed.priceLockeCoin),
    sales: raw.sales ?? seed.sales,
    imageUrl: raw.imageUrl || seed.imageUrl,
    tags: raw.tags ?? seed.tags,
    description: raw.description ?? seed.description,
    serviceDescription: raw.serviceDescription ?? seed.serviceDescription,
    status: raw.status ?? (raw.enabled === false ? "off" : "on"),
    createdAt: raw.createdAt ?? seed.createdAt,
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
    amountRmb: money(raw.amountRmb ?? amountLockeCoin),
    amountLockeCoin,
    amount: amountLockeCoin,
    status: raw.status ?? "pending",
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now(),
    paidAt: raw.paidAt,
    settledAt: raw.settledAt,
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
  const workers = parsed.workers?.length ? parsed.workers : fresh.workers;
  fresh.workers.forEach((worker) => {
    if (!workers.some((item) => item.id === worker.id)) workers.push(worker);
  });
  const announcements = parsed.announcements?.length ? parsed.announcements : fresh.announcements;
  fresh.announcements.forEach((announcement) => {
    if (!announcements.some((item) => item.id === announcement.id)) announcements.push(announcement);
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

  return {
    users,
    products,
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
    chat_sessions: (parsed.chat_sessions ?? []).map(migrateChatSession),
    chat_messages: (parsed.chat_messages ?? []).map(migrateChatMessage),
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

function syncUserWallet(user: User, wallet: WalletAccount) {
  user.availableBalance = wallet.availableBalance;
  user.frozenBalance = wallet.frozenBalance;
  user.totalSpent = wallet.totalSpent;
  user.memberLevel = wallet.memberLevel;
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

export function getProducts(category?: ProductCategory | "全部" | "全部分类"): Product[] {
  return readStore()
    .products.filter((product) => product.status === "on")
    .filter((product) => !category || category === "全部" || category === "全部分类" || product.category === category);
}

export function getProduct(productId: string): Product | null {
  return readStore().products.find((product) => product.id === productId && product.status === "on") ?? null;
}

export function getAnnouncements() {
  return readStore().announcements.filter((announcement) => announcement.status === "published");
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

export function rechargeCurrentCustomer(amount: number): RechargeOrder {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");

  return updateStore((store) => {
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    if (!user || !wallet) throw new Error("钱包不存在");

    const rechargeOrder: RechargeOrder = {
      id: makeId("recharge"),
      rechargeNo: makeNo("RC"),
      userId: session.user.id,
      amountRmb: money(amount),
      amountLockeCoin: money(amount),
      paymentMethod: "locke_coin",
      status: "paid",
      createdAt: now(),
      paidAt: now(),
    };

    wallet.availableBalance = money(wallet.availableBalance + amount);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);
    store.recharge_orders.unshift(rechargeOrder);
    addLedger(store, {
      userId: session.user.id,
      rechargeOrderId: rechargeOrder.id,
      type: "mock_recharge",
      direction: "in",
      amount: money(amount),
      description: "模拟充值到账",
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
    const product = store.products.find((item) => item.id === input.productId && item.status === "on");
    const user = store.users.find((item) => item.id === session.user.id);
    const wallet = store.wallet_accounts.find((item) => item.userId === session.user.id);
    const worker = input.specifiedWorkerId
      ? store.workers.find((item) => item.id === input.specifiedWorkerId)
      : null;
    if (!product) return { ok: false, message: "商品不存在" };
    if (!user || !wallet) return { ok: false, message: "钱包不存在" };
    if (!input.gameNickname.trim()) return { ok: false, message: "请填写游戏昵称" };
    if (!input.gameId.trim()) return { ok: false, message: "请填写 ID 编号" };
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
      createdAt: now(),
      updatedAt: now(),
      paidAt: now(),
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

export function getOrderChat(orderId: string): {
  order: Order | null;
  chatSession: ChatSession | null;
  messages: ChatMessage[];
  unreadCount: number;
} {
  const session = getCurrentSession();
  if (!session) return { order: null, chatSession: null, messages: [], unreadCount: 0 };

  return updateStore((store) => {
    const order =
      store.orders.find(
        (item) => item.id === orderId && (item.customerId === session.user.id || item.userId === session.user.id),
      ) ?? null;
    if (!order || order.orderType !== "service") return { order, chatSession: null, messages: [], unreadCount: 0 };

    const chatSession = ensureChatSessionForOrder(store, order);
    const messages = store.chat_messages
      .filter((message) => message.orderId === order.id && message.sessionId === chatSession.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const unreadCount = messages.filter((message) => message.senderRole === "worker" && !message.isRead).length;
    return { order, chatSession, messages, unreadCount };
  });
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

export function settleOrder(orderId: string): Order {
  const session = getCurrentSession();
  if (!session) throw new Error("请先登录");

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
    wallet.frozenBalance = money(Math.max(0, wallet.frozenBalance - order.amountLockeCoin));
    wallet.totalSpent = money(wallet.totalSpent + order.amountLockeCoin);
    wallet.memberLevel = calculateMemberLevel(wallet.totalSpent);
    wallet.updatedAt = now();
    syncUserWallet(user, wallet);

    if (order.workerId) {
      const worker = store.workers.find((item) => item.id === order.workerId);
      if (worker) {
        worker.availableBalance = money(worker.availableBalance + order.amountLockeCoin);
        worker.totalEarned = money(worker.totalEarned + order.amountLockeCoin);
        worker.serviceIncome = money(worker.serviceIncome + order.amountLockeCoin);
        worker.completedOrderCount += 1;
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

export function resetLocalMockData() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
