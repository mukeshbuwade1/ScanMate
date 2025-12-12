import React, { createContext, useCallback, useContext, useMemo } from 'react';

import { useAuth } from './AuthProvider';
import { useDocumentStore } from './DocumentStoreProvider';
import { useSyncQueue } from '@/lib/sync/queue';

type CloudSyncContextValue = {
  enqueue: (documentId: string) => void;
  queue: ReturnType<typeof useSyncQueue>['queue'];
  state: ReturnType<typeof useSyncQueue>['state'];
  restoreFromCloud: () => Promise<void>;
  isEnabled: boolean;
};

const CloudSyncContext = createContext<CloudSyncContextValue | undefined>(undefined);

export const CloudSyncProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAnonymous, user } = useAuth();
  const { documents, setStatus } = useDocumentStore();
  const syncQueue = useSyncQueue();

  const enqueue = useCallback(
    (documentId: string) => {
      if (isAnonymous || !user) return;
      syncQueue.enqueue({
        id: `upload-${documentId}`,
        kind: 'upload_doc',
        documentId,
        payload: { userId: user.id },
      });
      setStatus(documentId, 'syncing');
    },
    [isAnonymous, setStatus, syncQueue, user],
  );

  const restoreFromCloud = useCallback(async () => {
    if (isAnonymous || !user) return;
    // TODO: fetch remote docs and merge; simple placeholder sets status to synced.
    documents.forEach((doc) => setStatus(doc.id, 'synced'));
  }, [documents, isAnonymous, setStatus, user]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      enqueue,
      queue: syncQueue.queue,
      state: syncQueue.state,
      restoreFromCloud,
      isEnabled: !isAnonymous,
    }),
    [enqueue, isAnonymous, restoreFromCloud, syncQueue.queue, syncQueue.state],
  );

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
};

export const useCloudSync = () => {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) throw new Error('useCloudSync must be used within CloudSyncProvider');
  return ctx;
};

