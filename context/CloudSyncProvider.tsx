import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { useDocumentStore } from './DocumentStoreProvider';

type SyncStatus = 'idle' | 'syncing' | 'error';

type SyncJob = {
  id: string;
  state: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
};

type CloudSyncContextValue = {
  status: SyncStatus;
  lastSyncedAt?: number;
  queue: SyncJob[];
  enqueue: (documentId: string) => void;
  syncNow: () => Promise<void>;
  flushQueue: () => void;
};

const CloudSyncContext = createContext<CloudSyncContextValue | undefined>(undefined);

export const CloudSyncProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { setStatus, getDocument } = useDocumentStore();
  const [queue, setQueue] = useState<SyncJob[]>([]);
  const [status, setStatusState] = useState<SyncStatus>('idle');
  const lastSyncedAt = useRef<number>();

  const enqueue = useCallback(
    (documentId: string) => {
      const doc = getDocument(documentId);
      if (!doc) return;
      setQueue((prev) => {
        if (prev.some((job) => job.id === documentId && job.state !== 'completed')) {
          return prev;
        }
        return [...prev, { id: documentId, state: 'pending' }];
      });
      setStatus(documentId, 'syncing');
    },
    [getDocument, setStatus],
  );

  const flushQueue = useCallback(() => {
    setQueue([]);
    setStatusState('idle');
  }, []);

  const syncNow = useCallback(async () => {
    if (!queue.length) return;
    setStatusState('syncing');
    setQueue((prev) => prev.map((job) => ({ ...job, state: 'syncing' })));

    try {
      // TODO: replace with Supabase storage upload + metadata sync.
      await new Promise((resolve) => setTimeout(resolve, 300));

      setQueue((prev) => prev.map((job) => ({ ...job, state: 'completed' })));
      queue.forEach((job) => setStatus(job.id, 'synced'));
      lastSyncedAt.current = Date.now();
      setStatusState('idle');
    } catch (error) {
      setStatusState('error');
      setQueue((prev) => prev.map((job) => ({ ...job, state: 'failed', error: String(error) })));
    }
  }, [queue, setStatus]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      status,
      lastSyncedAt: lastSyncedAt.current,
      queue,
      enqueue,
      syncNow,
      flushQueue,
    }),
    [enqueue, flushQueue, queue, status, syncNow],
  );

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
};

export const useCloudSync = () => {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) throw new Error('useCloudSync must be used within CloudSyncProvider');
  return ctx;
};

