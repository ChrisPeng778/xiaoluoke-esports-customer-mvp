export type UserRole = "customer" | "worker" | "admin";

export type MemberLevel = "普通会员" | "中级会员" | "高级会员" | "顶级会员";

export type ProductCategory = "PVP专区" | "陪玩专区" | "资源专区" | "异色专区";

export type ProductStatus = "on" | "off";

export type WorkerLevel = "明星" | "金牌" | "银牌" | "铜牌" | "见习";

export type WorkerStatus = "online" | "offline";

export type PaymentMethod = "wechat" | "alipay" | "locke_coin";

export type AssignmentType = "random" | "specified";

export type OrderType = "service" | "tip";

export type OrderStatus =
  | "unpaid"
  | "pending"
  | "accepted"
  | "worker_completed"
  | "settled"
  | "disputed"
  | "refunded"
  | "after_sale"
  | "paid"
  | "failed";

export type LedgerType =
  | "wechat_recharge"
  | "alipay_recharge"
  | "mock_recharge"
  | "order_freeze"
  | "order_settle"
  | "refund"
  | "tip_in"
  | "tip_out"
  | "withdraw_request"
  | "withdraw_done"
  | "admin_adjust";

export type LedgerDirection = "in" | "out" | "freeze" | "settle";

export type RechargeStatus = "unpaid" | "paid" | "failed" | "cancelled";

export type ChatSessionStatus = "waiting_worker" | "active" | "closed";

export type ChatSenderRole = "customer" | "worker" | "system";

export type ChatMessageType = "text" | "image" | "system";

export interface User {
  id: string;
  openid?: string;
  username?: string;
  password?: string;
  displayId: string;
  nickname: string;
  nicknameEditable: boolean;
  avatarUrl: string;
  role: UserRole;
  memberLevel: MemberLevel;
  totalSpent: number;
  availableBalance: number;
  frozenBalance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceRmb: number;
  priceLockeCoin: number;
  sales: number;
  imageUrl: string;
  tags: string[];
  description: string;
  serviceDescription: string;
  status: ProductStatus;
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  avatarUrl: string;
  gender?: "male" | "female" | "unknown";
  level: WorkerLevel;
  onlineStatus: WorkerStatus;
  intro: string;
  completedOrderCount: number;
  rating: number;
  dynamicText: string;
  availableBalance: number;
  totalEarned: number;
  serviceIncome: number;
  tipIncome: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: "published" | "draft";
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  orderType: OrderType;
  userId?: string;
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;
  productDescription?: string;
  workerId?: string | null;
  workerName?: string | null;
  gameNickname?: string;
  gameId?: string;
  quantity?: number;
  remark?: string;
  assignmentType?: AssignmentType;
  specifiedWorkerId?: string | null;
  specifiedWorkerName?: string | null;
  paymentMethod: PaymentMethod;
  amountRmb: number;
  amountLockeCoin: number;
  amount?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  settledAt?: string;
}

export interface WalletAccount {
  id: string;
  userId: string;
  ownerType: UserRole;
  availableBalance: number;
  frozenBalance: number;
  totalSpent: number;
  totalEarned: number;
  memberLevel: MemberLevel;
  updatedAt: string;
}

export interface WalletLedger {
  id: string;
  userId: string;
  type: LedgerType;
  direction: LedgerDirection;
  amount: number;
  description: string;
  relatedOrderId?: string;
  rechargeOrderId?: string;
  createdAt: string;
}

export interface RechargeOrder {
  id: string;
  rechargeNo: string;
  userId: string;
  amountRmb: number;
  amountLockeCoin: number;
  paymentMethod: PaymentMethod;
  status: RechargeStatus;
  createdAt: string;
  paidAt?: string;
}

export interface ChatSession {
  id: string;
  orderId: string;
  customerId: string;
  workerId: string | null;
  workerName?: string | null;
  status: ChatSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  orderId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  senderName: string;
  messageType: ChatMessageType;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface StoreShape {
  users: User[];
  products: Product[];
  workers: Worker[];
  announcements: Announcement[];
  orders: Order[];
  wallet_accounts: WalletAccount[];
  wallet_ledger: WalletLedger[];
  recharge_orders: RechargeOrder[];
  chat_sessions: ChatSession[];
  chat_messages: ChatMessage[];
}

export interface CustomerSession {
  user: User;
  wallet: WalletAccount;
}
