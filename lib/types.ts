export type Variety = {
  id: string;
  name: string;
  pricePerKg: number;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
  /** Sum of AKTIF transaction subtotals */
  totalSpent?: number;
};

export type TransactionStatus = "AKTIF" | "BATAL";

export type Transaction = {
  id: string;
  customerId: string;
  varietyId: string;
  varietyName: string;
  weightKg: string | number;
  quantity: number;
  pricePerKg: number;
  subtotal: number;
  status: TransactionStatus;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string };
  variety?: { id: string; name: string; pricePerKg: number };
};

export type SummaryRow = {
  customerId: string;
  customerName: string;
  transactionCount: number;
  total: number;
};

export type SummaryResponse = {
  customers: SummaryRow[];
  grandTotal: number;
  grandCount: number;
};

export type AnalyticsFilters = {
  from: string;
  to: string;
};

export type AnalyticsResponse = {
  from: string;
  to: string;
  kpis: {
    revenue: number;
    weightKg: number;
    txCount: number;
    effectivePricePerKg: number;
    /** null when prior period has no revenue */
    revenueChangePct: number | null;
  };
  byVariety: Array<{
    varietyName: string;
    revenue: number;
    weightKg: number;
    share: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    name: string;
    revenue: number;
    txCount: number;
    share: number;
  }>;
  last7Days: Array<{ dateKey: string; revenue: number }>;
  ops: {
    cancelledCount: number;
    cancelRate: number;
    avgTicket: number;
  };
};

export type TransactionFilters = {
  customerId?: string;
  from?: string;
  to?: string;
  status?: TransactionStatus | "";
  minSubtotal?: string;
  maxSubtotal?: string;
  sort?: "tanggal-asc" | "tanggal-desc" | "subtotal-asc" | "subtotal-desc";
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  varieties: Array<{ name: string; pricePerKg: number }>;
  customers: Array<{ id: string; name: string }>;
  transactions: Array<{
    id: string;
    customerId: string;
    varietyName: string;
    weightKg: number;
    quantity: number;
    pricePerKg: number;
    subtotal: number;
    status: TransactionStatus;
    soldAt: string;
  }>;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  image?: string | null;
  createdAt: string | Date;
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt: string | Date;
};
