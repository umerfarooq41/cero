function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

export function getTransactionDeltas(transaction, accounts = []) {
  const deltas = {};
  const amount = Number(transaction?.amount) || 0;

  const source = accounts.find((account) => account.id === transaction?.account_id);
  const destination = accounts.find((account) => account.id === transaction?.to_account_id);

  if (source) {
    const sourceDelta =
      transaction?.type === 'income'
        ? source.category === 'liability'
          ? -amount
          : amount
        : source.category === 'liability'
          ? amount
          : -amount;

    addDelta(deltas, source.id, sourceDelta);
  }

  if (transaction?.type === 'transfer' && destination) {
    const destinationDelta = destination.category === 'liability' ? -amount : amount;
    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}
