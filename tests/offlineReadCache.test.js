import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreReadCache } from '../src/lib/offline-read-cache.js';

function mockDatabase(t, record) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
    open() {
      const open = {};
      queueMicrotask(() => {
        open.result = {
          close() {},
          transaction() {
            const tx = { objectStore: () => ({
              get() { const request = { result: record }; queueMicrotask(() => tx.oncomplete()); return request; },
              delete() { const request = {}; queueMicrotask(() => tx.oncomplete()); return request; },
            }) };
            return tx;
          },
        };
        open.onsuccess();
      });
      return open;
    },
  } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'indexedDB', original); else delete globalThis.indexedDB; });
}

function client(existing) {
  const restored = [];
  return { restored, getQueryState: () => existing, setQueryData: (...args) => restored.push(args) };
}

test('offline cache restores only supported queries owned by the current user', async (t) => {
  const now = Date.now();
  mockDatabase(t, { savedAt: now, queries: [
    { queryKey: ['accounts', 'u1'], data: [], dataUpdatedAt: now },
    { queryKey: ['accounts', 'u2'], data: [1], dataUpdatedAt: now },
    { queryKey: ['unknown', 'u1'], data: [2], dataUpdatedAt: now },
    { queryKey: ['transactions', 'u1'], data: [], dataUpdatedAt: 'invalid' },
  ] });
  const c = client();
  assert.equal(await restoreReadCache(c, 'u1'), true);
  assert.deepEqual(c.restored, [[['accounts', 'u1'], [], { updatedAt: now }]]);
});

test('offline cache does not replace newer or equally recent query data', async (t) => {
  const now = Date.now();
  mockDatabase(t, { savedAt: now, queries: [{ queryKey: ['accounts', 'u1'], data: [], dataUpdatedAt: now }] });
  for (const updatedAt of [now, now + 1]) {
    const c = client({ data: [1], dataUpdatedAt: updatedAt });
    await restoreReadCache(c, 'u1');
    assert.equal(c.restored.length, 0);
  }
});

test('expired offline cache is not restored', async (t) => {
  mockDatabase(t, { savedAt: Date.now() - 8 * 86400000, queries: [{ queryKey: ['accounts', 'u1'], data: [] }] });
  const c = client();
  assert.equal(await restoreReadCache(c, 'u1'), false);
  assert.equal(c.restored.length, 0);
});

test('offline cache is not restored without a user', async () => {
  assert.equal(await restoreReadCache(client(), null), false);
});
