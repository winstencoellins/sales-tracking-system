"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsFilters, TransactionFilters } from "@/lib/types";

export function useVarieties() {
  return useQuery({
    queryKey: queryKeys.varieties,
    queryFn: api.getVarieties,
  });
}

export function useCustomers(q?: string) {
  return useQuery({
    queryKey: queryKeys.customers(q),
    queryFn: () => api.getCustomers(q),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => api.getCustomer(id),
    enabled: Boolean(id),
  });
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => api.getTransactions(filters),
  });
}

export function useSummary() {
  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: api.getSummary,
  });
}

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.analytics(filters),
    queryFn: () => api.getAnalytics(filters),
    enabled: Boolean(filters.from && filters.to && filters.from <= filters.to),
  });
}

function invalidateSales(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.summary });
  void queryClient.invalidateQueries({ queryKey: ["customers"] });
  void queryClient.invalidateQueries({ queryKey: ["analytics"] });
}

export function useCreateVariety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createVariety,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.varieties });
    },
  });
}

export function useUpdateVariety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      pricePerKg?: number;
    }) => api.updateVariety(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.varieties });
    },
  });
}

export function useDeleteVariety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteVariety,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.varieties });
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.summary });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      phoneNumber,
    }: {
      id: string;
      name: string;
      phoneNumber?: string | null;
    }) => api.updateCustomer(id, { name, phoneNumber }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customer(vars.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.summary });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCustomer,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.removeQueries({ queryKey: queryKeys.customer(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.summary });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => invalidateSales(queryClient),
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "AKTIF" | "BATAL";
    }) => api.updateTransaction(id, { status }),
    onSuccess: () => invalidateSales(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      customerId: string;
      varietyId: string;
      weightKg: number;
      quantity: number;
    }) => api.updateTransaction(id, body),
    onSuccess: () => invalidateSales(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => invalidateSales(queryClient),
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreBackup,
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: api.changePassword,
  });
}

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: api.getUsers,
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}
