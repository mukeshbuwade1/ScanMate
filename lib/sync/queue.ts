import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/context/AuthProvider';
import { useDocumentStore } from '@/context/DocumentStoreProvider';
import { createDocument, updateDocument } from '@/lib/supabase/client';

type SyncTask = {
  id: string;
  kind: 'upload_doc' | 'download_doc' | 'resolve_conflict';
  documentId: string;
  payload?: Record<string, unknown>;
};

type SyncState = 'idle' | 'running' | 'error';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const useSyncQueue = () => {
  const { isAnonymous } = useAuth();
  const { documents } = useDocumentStore();
  const [queue, setQueue] = useState<SyncTask[]>([]);
  const [state, setState] = useState<SyncState>('idle');
  const isRunning = useRef(false);

  const enqueue = (task: SyncTask) => {
    setQueue((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]));
  };

  // Simple conflict resolution: prefer newest updatedAt; mark status accordingly.
  const resolveConflict = async (task: SyncTask) => {
    const local = documents.find((d) => d.id === task.documentId);
    if (!local) return;
    // placeholder: could fetch remote doc and compare updatedAt
    await updateDocument(task.documentId, { status: 'synced', updated_at: new Date().toISOString() } as any);
  };

  const processTask = async (task: SyncTask) => {
    if (task.kind === 'upload_doc') {
      const local = documents.find((d) => d.id === task.documentId);
      if (!local) return;
      await createDocument({
        id: local.id,
        title: local.title,
        user_id: task.payload?.userId as string,
        page_count: local.pages,
        status: 'completed',
      } as any);
    } else if (task.kind === 'resolve_conflict') {
      await resolveConflict(task);
    } else if (task.kind === 'download_doc') {
      // TODO: download doc metadata/pdf from cloud to local storage
    }
  };

  useEffect(() => {
    const run = async () => {
      if (isRunning.current || isAnonymous) return;
      if (!queue.length) return;
      isRunning.current = true;
      setState('running');
      try {
        const [task, ...rest] = queue;
        await processTask(task);
        setQueue(rest);
      } catch (err) {
        console.warn('Sync error', err);
        setState('error');
        await delay(2000);
      } finally {
        isRunning.current = false;
        setState('idle');
      }
    };
    run();
  }, [isAnonymous, queue]);

  const api = useMemo(
    () => ({
      enqueue,
      queue,
      state,
    }),
    [queue, state],
  );

  return api;
};

