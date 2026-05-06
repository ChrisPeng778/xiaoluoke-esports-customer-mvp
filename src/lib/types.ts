export type UserRole = "customer" | "worker" | "admin";

export type MemberLevel = "普通会员" | "中级会员" | "高级会员" | "顶级会员";

export type ProductCategory = "PVP专区" | "陪玩专区" | "资源专区" | "异色专区";

export type ProductStatus = "on" | "off" | "active" | "inactive";

export type ProductWorkerIncomeType = "fixed" | "percent";

export type WorkerLevel = "明星" | "金牌" | "银牌" | "铜牌" | "见习";

export type WorkerStatus = "online" | "offline";

export type WorkerAccountStatus = "normal" | "frozen";

export type WorkerDepositStatus = "unpaid" | "paid" | "refund_pending" | "refunded";

export type ServicePort = "mobile" | "pc" | "both";

export type PaymentMethod = "wechat" | "alipay" | "locke_coin" | "admin_created";

export type AssignmentType = "random" | "specified";

export type OrderType = "service" | "tip";

export type OrderStatus =
  | "unpaid"
  | "pending"
  | "accepted"
  | "worker_completed"
  | "settled"
  | "disputed"
  | "cancelled"
  | "refunded"
  | "after_sale"
  | "after_sale_refunded"
  | "paid"
  | "failed";

export type LedgerType =
  | "recharge_in"
  | "wechat_recharge"
  | "alipay_recharge"
  | "mock_recharge"
  | "order_pay"
  | "order_freeze"
  | "order_settle"
  | "order_refund"
  | "ranking_reward"
  | "refund"
  | "tip_in"
  | "tip_out"
  | "withdraw_request"
  | "withdraw_freeze"
  | "withdraw_done"
  | "withdraw_rejected"
  | "admin_adjust"
  | "order_income"
  | "tip_income"
  | "deposit_paid"
  | "deposit_deduct"
  | "deposit_refund"
  | "deposit_admin_add"
  | "deposit_admin_deduct"
  | "platform_commission";

export type LedgerDirection = "in" | "out" | "freeze" | "settle";

export type RechargeStatus = "unpaid" | "paid" | "failed" | "cancelled";

export type WithdrawStatus = "pending" | "approved" | "rejected" | "paid" | "completed";

export type RechargePackageStatus = "active" | "inactive";

export type PaymentRecordStatus = "pending" | "success" | "failed" | "closed" | "refunded" | "partial_refunded";

export type PaymentRecordType = "order_payment" | "recharge" | "tip_payment" | "deposit" | "admin_adjust" | "refund";

export type PaymentRecordChannel = "locke_coin" | "wechat" | "alipay" | "wechat_miniapp" | "admin_created" | "mock";

export type AnnouncementType = "notice" | "system" | "activity" | "maintenance" | "order";

export type AnnouncementVisibleTo = "all" | "customer" | "worker" | "admin";

export type AnnouncementStatus = "draft" | "published" | "archived";

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
  status?: "active" | "frozen";
  adminRemark?: string;
  updatedAt?: string;
  memberLevel: MemberLevel;
  totalSpent: number;
  availableBalance: number;
  frozenBalance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  category: ProductCategory;
  categoryId?: string;
  priceRmb: number;
  priceLockeCoin: number;
  costPrice?: number;
  sales: number;
  virtualSales?: number;
  realSales?: number;
  imageUrl: string;
  homeImageUrl?: string;
  detailImages?: string[];
  tags: string[];
  description: string;
  serviceDescription: string;
  servicePort?: ServicePort;
  sortOrder?: number;
  isRecommended?: boolean;
  purchaseLimitEnabled?: boolean;
  purchaseLimitPerUser?: number;
  deleted?: boolean;
  workerIncomeType?: ProductWorkerIncomeType;
  workerIncomeAmount?: number;
  estimatedDuration?: string;
  requireGameId?: boolean;
  requireGameNickname?: boolean;
  requireRemark?: boolean;
  allowAssignedWorker?: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductCategoryRecord {
  id: string;
  parentId: string | null;
  name: string;
  iconUrl?: string;
  sortOrder: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  userName?: string;
  name: string;
  avatarUrl: string;
  gender?: "male" | "female" | "unknown";
  gameId?: string;
  gameNickname?: string;
  level: WorkerLevel;
  onlineStatus: WorkerStatus;
  status: WorkerAccountStatus;
  depositStatus: WorkerDepositStatus;
  servicePort?: ServicePort;
  depositAmount?: number;
  platformCommissionRate?: number;
  createdAt?: string;
  updatedAt?: string;
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
  type: AnnouncementType;
  visibleTo: AnnouncementVisibleTo;
  coverImage?: string;
  content: string;
  isPinned: boolean;
  sortOrder: number;
  status: AnnouncementStatus;
  viewCount: number;
  publishAt?: string;
  expireAt?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
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
  productImageUrl?: string;
  productCategory?: ProductCategory;
  productSnapshot?: {
    name: string;
    priceRmb: number;
    priceLockeCoin: number;
    category: ProductCategory;
    servicePort?: ServicePort;
    workerIncomeType?: ProductWorkerIncomeType;
    workerIncomeAmount?: number;
  };
  servicePort?: ServicePort;
  customProductInfo?: {
    name: string;
    category: ProductCategory;
    description?: string;
  };
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
  paymentStatus?: "unpaid" | "paid" | "refunded";
  assignedByAdmin?: boolean;
  amountRmb: number;
  amountLockeCoin: number;
  amount?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  assignedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  settledAt?: string;
  statusHistory?: OrderStatusHistory[];
  customerRating?: number;
  ratedAt?: string;
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  title: string;
  detail?: string;
  operator: "customer" | "worker" | "admin" | "system";
  createdAt: string;
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
  beforeBalance?: number;
  afterBalance?: number;
  targetType?: UserRole | "worker" | "customer" | "platform";
  relatedType?: string;
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

export interface RechargePackage {
  id: string;
  sortOrder: number;
  amountRmb: number;
  bonusLockeCoin: number;
  amountLockeCoin: number;
  status: RechargePackageStatus;
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  paymentNo: string;
  type: PaymentRecordType;
  channel: PaymentRecordChannel;
  amountRmb: number;
  amountLockeCoin?: number;
  status: PaymentRecordStatus;
  businessId?: string;
  businessNo?: string;
  businessLabel: string;
  userId?: string;
  userName?: string;
  workerId?: string;
  workerName?: string;
  channelTradeNo?: string;
  remark?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
}

export interface WithdrawRequest {
  id: string;
  requestNo: string;
  workerId: string;
  workerName: string;
  amountLockeCoin: number;
  feeLockeCoin?: number;
  actualAmountLockeCoin?: number;
  receiveInfo?: string;
  remark?: string;
  status: WithdrawStatus;
  adminRemark?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  completedAt?: string;
}

export type DepositRefundStatus = "pending" | "approved" | "rejected" | "completed";

export interface DepositRefundRequest {
  id: string;
  workerId: string;
  workerName: string;
  amountLockeCoin: number;
  status: DepositRefundStatus;
  reason?: string;
  adminRemark?: string;
  createdAt: string;
  reviewedAt?: string;
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

export interface AdminLog {
  id: string;
  adminId?: string;
  adminName: string;
  action?: string;
  actionType: string;
  targetType: string;
  targetId?: string;
  detail: string;
  operationAmount?: number;
  remark?: string;
  createdAt: string;
}

export type AdminRoleStatus = "enabled" | "disabled";
export type AdminUserStatus = "enabled" | "disabled";
export type AdminMenuType = "directory" | "menu" | "button";
export type AdminMenuStatus = "visible" | "hidden";

export interface AdminRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: AdminRoleStatus;
  permissions: string[];
  builtIn?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string;
  avatarUrl?: string;
  status: AdminUserStatus;
  roleIds: string[];
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt?: string;
  builtIn?: boolean;
}

export interface AdminMenu {
  id: string;
  parentId: string | null;
  type: AdminMenuType;
  name: string;
  routeName?: string;
  path?: string;
  componentPath?: string;
  icon?: string;
  externalUrl?: string;
  activePath?: string;
  sortOrder: number;
  visible: boolean;
  cache?: boolean;
  hidden?: boolean;
  embedded?: boolean;
  hiddenTag?: boolean;
  permissionKey?: string;
  status: AdminMenuStatus;
  createdAt: string;
  updatedAt?: string;
  builtIn?: boolean;
}

export type CustomerServiceMiniProgramType = "disabled" | "wechat_mini_customer_service" | "enterprise_wechat" | "normal";
export type CustomerServiceH5Type = "disabled" | "enterprise_wechat" | "normal" | "official_account";
export type SmsProvider = "disabled" | "aliyun" | "tencent" | "other";
export type PaymentChannelKey = "balance" | "wechat_jsapi" | "wechat_mini";
export type PaymentEnvironment = "production" | "sandbox";
export type WithdrawMethod = "manual_offline" | "wechat_transfer" | "alipay_transfer" | "bank_transfer";
export type ResourceType = "image" | "video" | "audio" | "file";

export interface EnterpriseWechatServiceConfig {
  corpId: string;
  serviceUrl: string;
  serviceId: string;
  qrCode: string;
  enabled: boolean;
}

export interface NormalCustomerServiceConfig {
  qrCode: string;
  phone: string;
  wechatId: string;
}

export interface OfficialAccountServiceConfig {
  appId: string;
  customerServiceUrl: string;
  oauthRedirectUrl: string;
  jsapiEnabled: boolean;
}

export interface CustomerServicePortSettings {
  type: CustomerServiceMiniProgramType | CustomerServiceH5Type;
  enterpriseWechat: EnterpriseWechatServiceConfig;
  normal: NormalCustomerServiceConfig;
  officialAccount?: OfficialAccountServiceConfig;
}

export interface PaymentChannelSettings {
  key: PaymentChannelKey;
  name: string;
  enabled: boolean;
  configured: boolean;
  sortOrder: number;
  environment: PaymentEnvironment;
  serviceProviderMode: boolean;
  loggingEnabled: boolean;
  officialAccountAppId: string;
  miniProgramAppId: string;
  mchId: string;
  apiV3Key: string;
  certificate: string;
  privateKey: string;
  callbackUrl: string;
}

export interface ResourceRecord {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  size: number;
  createdAt: string;
}

export interface SystemSettings {
  basic: {
    appName: string;
    appLogo: string;
    favicon: string;
    siteName: string;
    recordInfo: string;
    copyright: string;
    miniProgramReviewMode: boolean;
  };
  tip: {
    enabled: boolean;
    quickAmounts: number[];
  };
  customerService: {
    miniProgram: CustomerServicePortSettings & { type: CustomerServiceMiniProgramType };
    h5: CustomerServicePortSettings & { type: CustomerServiceH5Type; officialAccount: OfficialAccountServiceConfig };
  };
  sms: {
    enabled: boolean;
    provider: SmsProvider;
    accessKeyId: string;
    accessKeySecret: string;
    signName: string;
    loginTemplateId: string;
    notificationTemplateId: string;
  };
  notification: {
    unreadChatReminderMinutes: number;
    unacceptedOrderReminderMinutes: number;
  };
  agreements: {
    userAgreementTitle: string;
    userAgreementContent: string;
    privacyAgreementTitle: string;
    privacyAgreementContent: string;
    workerAgreementTitle: string;
    workerAgreementContent: string;
    depositRuleTitle: string;
    depositRuleContent: string;
  };
  worker: {
    minimumDepositAmount: number;
    depositRuleContent: string;
  };
  payment: {
    channels: PaymentChannelSettings[];
  };
  order: {
    paymentTimeoutMinutes: number;
    autoConfirmHours: number;
    primaryWorkerCanSelectAssistants: boolean;
    mustReadContent: string;
  };
  businessTarget: {
    month: string;
    gmvTarget: number | null;
    orderCountTarget: number | null;
  };
  finance: {
    minimumWithdrawAmount: number;
    withdrawFeeRate: number;
    walletReserveAmount: number;
    withdrawMethod: WithdrawMethod;
  };
  resources: {
    records: ResourceRecord[];
  };
}

export interface AdminSession {
  adminId: string;
  username: string;
  name: string;
  roles: string[];
  permissions: string[];
  loginAt: string;
}

export interface StoreShape {
  users: User[];
  products: Product[];
  product_categories: ProductCategoryRecord[];
  workers: Worker[];
  announcements: Announcement[];
  orders: Order[];
  wallet_accounts: WalletAccount[];
  wallet_ledger: WalletLedger[];
  recharge_orders: RechargeOrder[];
  recharge_packages: RechargePackage[];
  withdraw_requests: WithdrawRequest[];
  deposit_refunds: DepositRefundRequest[];
  chat_sessions: ChatSession[];
  chat_messages: ChatMessage[];
  admin_roles: AdminRole[];
  admin_users: AdminUser[];
  admin_menus: AdminMenu[];
  admin_logs: AdminLog[];
  system_settings: SystemSettings;
}

export interface CustomerSession {
  user: User;
  wallet: WalletAccount;
}

export interface WorkerSession {
  worker: Worker;
  wallet: WalletAccount;
}
