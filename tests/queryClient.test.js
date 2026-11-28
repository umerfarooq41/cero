import test from 'node:test';
import assert from 'node:assert/strict';
import { queryClientInstance } from '../src/lib/query-client.js';

test('financial queries remain fresh for one minute and reconnect refetch is enabled', () => {
  const options = queryClientInstance.getDefaultOptions().queries;
  assert.equal(options.staleTime, 60_000);
  assert.equal(options.gcTime, 600_000);
  assert.equal(options.refetchOnReconnect, true);
  assert.equal(options.refetchOnWindowFocus, false);
});
