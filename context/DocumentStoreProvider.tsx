import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deleteDocument as deleteDocumentCache, listDocuments, saveDocument, updateDocument as updateDocumentCache } from '@/lib/storage/documentCache';

export type DocumentStatus = 'idle' | 'processing' | 'synced' | 'syncing' | 'error';

export type DocumentItem = {
  id: string;
  title: string;
  localPath: string;
  pages: number;
  updatedAt: number;
  status: DocumentStatus;
  cloudId?: string;
};

type CreateDocumentInput = {
  title: string;
  localPath: string;
  pages: number;
};

type DocumentStoreContextValue = {
  documents: DocumentItem[];
  getDocument: (id: string) => DocumentItem | undefined;
  addDocument: (payload: CreateDocumentInput) => DocumentItem;
  updateDocument: (id: string, patch: Partial<Omit<DocumentItem, 'id'>>) => void;
  removeDocument: (id: string) => void;
  setStatus: (id: string, status: DocumentStatus) => void;
};

const DocumentStoreContext = createContext<DocumentStoreContextValue | undefined>(undefined);

export const DocumentStoreProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = listDocuments();
    setDocuments(cached);
    setHydrated(true);
  }, []);

  const getDocument = useCallback(
    (id: string) => documents.find((doc) => doc.id === id),
    [documents],
  );

  const addDocument = useCallback((payload: CreateDocumentInput): DocumentItem => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
    const newDoc: DocumentItem = {
      id,
      status: 'idle',
      updatedAt: Date.now(),
      ...payload,
    };
    setDocuments((prev) => {
      const next = [newDoc, ...prev];
      saveDocument(newDoc);
      return next;
    });
    return newDoc;
  }, []);

  const updateDocument = useCallback((id: string, patch: Partial<Omit<DocumentItem, 'id'>>) => {
    setDocuments((prev) => {
      const next = prev.map((doc) => (doc.id === id ? { ...doc, ...patch, updatedAt: Date.now() } : doc));
      updateDocumentCache(id, patch);
      return next;
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => {
      const next = prev.filter((doc) => doc.id !== id);
      deleteDocumentCache(id);
      return next;
    });
  }, []);

  const setStatus = useCallback((id: string, status: DocumentStatus) => {
    setDocuments((prev) => {
      const next = prev.map((doc) => (doc.id === id ? { ...doc, status, updatedAt: Date.now() } : doc));
      updateDocumentCache(id, { status });
      return next;
    });
  }, []);

  const value = useMemo<DocumentStoreContextValue>(
    () => ({
      documents,
      hydrated,
      getDocument,
      addDocument,
      updateDocument,
      removeDocument,
      setStatus,
    }),
    [addDocument, documents, getDocument, hydrated, removeDocument, setStatus, updateDocument],
  );

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>;
};

export const useDocumentStore = () => {
  const ctx = useContext(DocumentStoreContext);
  if (!ctx) throw new Error('useDocumentStore must be used within DocumentStoreProvider');
  return ctx;
};

