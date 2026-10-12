import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      // Keep recently fetched financial data fresh without redundant requests\n      // when switching between Cero pages. Mutations still invalidate queries.\n      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
  },
});
