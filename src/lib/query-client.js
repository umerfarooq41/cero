import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      // Keep recently fetched financial data fresh without redundant requests
      // when switching between Cero pages. Mutations still invalidate queries.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
  },
});
