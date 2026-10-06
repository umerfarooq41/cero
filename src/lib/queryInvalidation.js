export function invalidateScheduledQueries(queryClient) {
  if (!queryClient) return;

  [
    ['transactions'],
    ['all-transactions'],
    ['transactions-for-months'],
    ['accounts'],
    ['recurring-transactions'],
    ['savings-goals'],
    ['goal-contributions'],
    ['allocations'],
    ['all-allocations'],
    ['budget-summary'],
    ['plan-data'],
  ].forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
