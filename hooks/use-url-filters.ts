"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateKey(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value || !DATE_KEY_RE.test(value)) return fallback;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return fallback;
  }
  return value;
}

function replaceQuery(
  pathname: string,
  router: ReturnType<typeof useRouter>,
  current: URLSearchParams,
  next: URLSearchParams,
) {
  const keys = new Set([...current.keys(), ...next.keys()]);
  let same = true;
  for (const key of keys) {
    if (current.get(key) !== next.get(key)) {
      same = false;
      break;
    }
  }
  if (same) return;
  const nextQs = next.toString();
  router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, {
    scroll: false,
  });
}

type DateRangeState = {
  from: string;
  to: string;
  setDateRange: (from: string, to: string) => void;
};

/** Date-range filters backed by `?from=&to=` (omitted when both equal today). */
export function useDateRangeUrlState(today: string): DateRangeState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { from, to } = useMemo(() => {
    let nextFrom = parseDateKey(searchParams.get("from"), today);
    let nextTo = parseDateKey(searchParams.get("to"), today);
    if (nextFrom > nextTo) {
      nextFrom = today;
      nextTo = today;
    }
    return { from: nextFrom, to: nextTo };
  }, [searchParams, today]);

  const setDateRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (nextFrom === today && nextTo === today) {
        next.delete("from");
        next.delete("to");
      } else {
        next.set("from", nextFrom);
        next.set("to", nextTo);
      }
      replaceQuery(pathname, router, searchParams, next);
    },
    [pathname, router, searchParams, today],
  );

  return { from, to, setDateRange };
}

type HistoryFilterState = DateRangeState & {
  customerId: string;
  setFilters: (next: {
    from: string;
    to: string;
    customerId: string;
  }) => void;
};

/** History filters: `?from=&to=&customerId=`. */
export function useHistoryFilterUrlState(today: string): HistoryFilterState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { from, to, customerId } = useMemo(() => {
    let nextFrom = parseDateKey(searchParams.get("from"), today);
    let nextTo = parseDateKey(searchParams.get("to"), today);
    if (nextFrom > nextTo) {
      nextFrom = today;
      nextTo = today;
    }
    return {
      from: nextFrom,
      to: nextTo,
      customerId: searchParams.get("customerId")?.trim() || "",
    };
  }, [searchParams, today]);

  const setFilters = useCallback(
    (nextFilters: { from: string; to: string; customerId: string }) => {
      const next = new URLSearchParams();
      if (
        nextFilters.from !== today ||
        nextFilters.to !== today
      ) {
        next.set("from", nextFilters.from);
        next.set("to", nextFilters.to);
      }
      if (nextFilters.customerId) {
        next.set("customerId", nextFilters.customerId);
      }
      replaceQuery(pathname, router, searchParams, next);
    },
    [pathname, router, searchParams, today],
  );

  const setDateRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      setFilters({ from: nextFrom, to: nextTo, customerId });
    },
    [customerId, setFilters],
  );

  return { from, to, customerId, setDateRange, setFilters };
}

/** Search query backed by `?q=` (local state for snappy typing).
 *  Pass `{ paginated: true }` to also sync `?page=` (resets to 1 on search). */
export function useSearchQueryUrlState(options?: { paginated?: boolean }): {
  query: string;
  setQuery: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paginated = options?.paginated ?? false;

  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQueryState] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQueryState(urlQuery);
  }

  const page = useMemo(() => {
    if (!paginated) return 1;
    const raw = Number(searchParams.get("page"));
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  }, [paginated, searchParams]);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) next.set("q", value);
      else next.delete("q");
      if (paginated) next.delete("page");
      replaceQuery(pathname, router, searchParams, next);
    },
    [paginated, pathname, router, searchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      if (!paginated) return;
      const next = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) next.delete("page");
      else next.set("page", String(nextPage));
      replaceQuery(pathname, router, searchParams, next);
    },
    [paginated, pathname, router, searchParams],
  );

  return { query, setQuery, page, setPage };
}
