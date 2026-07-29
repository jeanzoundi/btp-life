import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

// Persistance du cache TanStack Query dans IndexedDB (bien plus de place que localStorage —
// nécessaire pour stocker le contenu des cours). C'est la source de données quand on est hors ligne.
export const queryPersister = createAsyncStoragePersister({
  key: 'btp-life-query-cache',
  throttleTime: 1000,
  storage: {
    getItem: (key) => get<string>(key).then((v) => v ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
});
