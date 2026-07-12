import type {
  AnalyticsFilters,
  AnalyticsResponse,
  AppUser,
  BackupPayload,
  Customer,
  ProfileUser,
  SummaryResponse,
  Transaction,
  TransactionFilters,
  Variety,
} from "@/lib/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Terjadi kesalahan. Silakan coba lagi.",
    );
  }

  return data as T;
}

function toQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status) params.set("status", filters.status);
  if (filters.minSubtotal) params.set("minSubtotal", filters.minSubtotal);
  if (filters.maxSubtotal) params.set("maxSubtotal", filters.maxSubtotal);
  if (filters.sort) params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getVarieties: () => request<Variety[]>("/api/varieties"),
  createVariety: (body: { name: string; pricePerKg: number }) =>
    request<Variety>("/api/varieties", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateVariety: (
    id: string,
    body: { name?: string; pricePerKg?: number },
  ) =>
    request<Variety>(`/api/varieties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteVariety: (id: string) =>
    request<{ ok: true }>(`/api/varieties/${id}`, { method: "DELETE" }),

  getCustomers: (q?: string) =>
    request<Customer[]>(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getCustomer: (id: string) => request<Customer>(`/api/customers/${id}`),
  createCustomer: (body: { name: string }) =>
    request<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCustomer: (id: string, body: { name: string }) =>
    request<Customer>(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCustomer: (id: string) =>
    request<{ ok: true }>(`/api/customers/${id}`, { method: "DELETE" }),

  getTransactions: (filters: TransactionFilters = {}) =>
    request<Transaction[]>(`/api/transactions${toQuery(filters)}`),
  createTransaction: (body: {
    customerId: string;
    varietyId: string;
    weightKg: number;
    quantity: number;
  }) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTransaction: (
    id: string,
    body:
      | { status: "AKTIF" | "BATAL" }
      | {
          customerId: string;
          varietyId: string;
          weightKg: number;
          quantity: number;
        },
  ) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id: string) =>
    request<{ ok: true }>(`/api/transactions/${id}`, { method: "DELETE" }),

  getSummary: () => request<SummaryResponse>("/api/reports/summary"),

  getAnalytics: (filters: AnalyticsFilters) => {
    const params = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });
    return request<AnalyticsResponse>(`/api/analytics?${params}`);
  },

  exportBackup: () => request<BackupPayload>("/api/backup"),
  restoreBackup: (payload: BackupPayload) =>
    request<{ ok: true }>("/api/backup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: () => request<ProfileUser>("/api/profile"),
  updateProfile: (body: { name?: string; email?: string }) =>
    request<ProfileUser>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
  }) =>
    request<{ ok: true }>("/api/profile/password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getUsers: () => request<AppUser[]>("/api/users"),
  createUser: (body: { name: string; email: string; password: string }) =>
    request<AppUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
