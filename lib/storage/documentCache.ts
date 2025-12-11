import { DocumentItem } from '@/context/DocumentStoreProvider';
import { getString, removeKey, setString } from './mmkv';

const DOCUMENTS_KEY = 'documents';

export type DocumentCacheRecord = DocumentItem & {
  createdAt: number;
};

const parseCache = (): DocumentCacheRecord[] => {
  const raw = getString(DOCUMENTS_KEY, '[]');
  try {
    const parsed = JSON.parse(raw ?? '[]');
    if (Array.isArray(parsed)) {
      return parsed as DocumentCacheRecord[];
    }
    return [];
  } catch {
    return [];
  }
};

const writeCache = (items: DocumentCacheRecord[]) => {
  setString(DOCUMENTS_KEY, JSON.stringify(items));
};

export const listDocuments = (): DocumentCacheRecord[] => {
  const items = parseCache();
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const saveDocument = (doc: DocumentItem): DocumentCacheRecord => {
  const items = parseCache();
  const existingIndex = items.findIndex((item) => item.id === doc.id);
  const record: DocumentCacheRecord = {
    ...doc,
    createdAt: existingIndex >= 0 ? items[existingIndex].createdAt : Date.now(),
  };

  if (existingIndex >= 0) {
    items[existingIndex] = record;
  } else {
    items.unshift(record);
  }

  writeCache(items);
  return record;
};

export const updateDocument = (
  id: string,
  patch: Partial<Omit<DocumentItem, 'id'>>,
): DocumentCacheRecord | undefined => {
  const items = parseCache();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return undefined;

  const updated: DocumentCacheRecord = {
    ...items[idx],
    ...patch,
    updatedAt: Date.now(),
  };
  items[idx] = updated;
  writeCache(items);
  return updated;
};

export const deleteDocument = (id: string): boolean => {
  const items = parseCache();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  if (!next.length) {
    removeKey(DOCUMENTS_KEY);
  } else {
    writeCache(next);
  }
  return true;
};

