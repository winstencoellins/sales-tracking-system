import type { AnalyticsFilters, TransactionFilters } from "@/lib/types";

export const queryKeys = {
  varieties: ["varieties"] as const,
  customers: (q?: string) => ["customers", q ?? ""] as const,
  customer: (id: string) => ["customers", id] as const,
  transactions: (filters: TransactionFilters = {}) =>
    ["transactions", filters] as const,
  summary: ["summary"] as const,
  analytics: (filters: AnalyticsFilters) => ["analytics", filters] as const,
  profile: ["profile"] as const,
  users: ["users"] as const,
};
