import { createClient } from '@supabase/supabase-js';

import type { DocumentRow, ProcessingJobRow } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const fetchDocuments = async () => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as DocumentRow[];
};

export const createDocument = async (payload: Partial<DocumentRow>) => {
  const { data, error } = await supabase.from('documents').insert(payload).select().single();
  if (error) throw error;
  return data as DocumentRow;
};

export const updateDocument = async (id: string, payload: Partial<DocumentRow>) => {
  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRow;
};

export const deleteDocument = async (id: string) => {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
};

export const createJob = async (payload: Partial<ProcessingJobRow>) => {
  const { data, error } = await supabase.from('processing_jobs').insert(payload).select().single();
  if (error) throw error;
  return data as ProcessingJobRow;
};

export const listJobs = async (documentId?: string) => {
  let query = supabase.from('processing_jobs').select('*').order('created_at', { ascending: false });
  if (documentId) query = query.eq('document_id', documentId);
  const { data, error } = await query;
  if (error) throw error;
  return data as ProcessingJobRow[];
};

