const DB_NAME = 'cero-read-cache';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runStore = async (mode, action) => {
  if (typeof indexedDB === 'undefined') return undefined;
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

const isCacheableQuery = (query, userId) => {
  if (query.state.status !== 'success' || query.state.data === undefined) return false;
  const key = Array.isArray(query.queryKey) ? query.queryKey : [];
  return key.includes(userId);
};

export async function restoreReadCache(queryClient, userId) {
  if (!userId) return false;

  try {
    const record = await runStore('readonly', (store) => store.get(userId));
    if (!record?.queries?.length) return false;

    if (Date.now() - Number(record.savedAt || 0) > CACHE_MAX_AGE_MS) {
      await clearReadCache(userId);
      return false;
    }

    for (const cached of record.queries) {
      if (!Array.isArray(cached.queryKey) || cached.data === undefined) continue;
      queryClient.setQueryData(cached.queryKey, cached.data, {
        updatedAt: Number(cached.dataUpdatedAt || record.savedAt || Date.now()),
      });
    }

    return true;
  } catch (error) {
    console.error('Could not restore Cero read cache:', error);
    return false;
  }
}

export async function persistReadCache(queryClient, userId) {
  if (!userId || typeof indexedDB === 'undefined') return;

  const queries = queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => isCacheableQuery(query, userId))
    .map((query) => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));

  if (!queries.length) return;

  try {
    await runStore('readwrite', (store) =>
      store.put({
        userId,
        savedAt: Date.now(),
        queries,
      })
    );
  } catch (error) {
    console.error('Could not persist Cero read cache:', error);
  }
}

export async function clearReadCache(userId) {
  if (!userId || typeof indexedDB === 'undefined') return;

  try {
    await runStore('readwrite', (store) => store.delete(userId));
  } catch (error) {
    console.error('Could not clear Cero read cache:', error);
  }
}

export function subscribeReadCache(queryClient, userId) {
  if (!userId) return () => {};

  let timer = null;
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    const query = event?.query;
    if (!query || !isCacheableQuery(query, userId)) return;

    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      persistReadCache(queryClient, userId);
    }, 400);
  });

  return () => {
    window.clearTimeout(timer);
    unsubscribe();
  };
}
