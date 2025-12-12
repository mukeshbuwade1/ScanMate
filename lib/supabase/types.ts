export type DocumentRow = {
  id: string;
  user_id: string;
  title: string;
  raw_path: string | null;
  processed_path: string | null;
  thumbnail_path: string | null;
  page_count: number;
  size_bytes: number | null;
  status: 'idle' | 'processing' | 'error' | 'completed';
  created_at: string;
  updated_at: string;
};

export type ProcessingJobRow = {
  id: string;
  document_id: string;
  user_id: string;
  type: 'compress_pdf' | 'generate_thumbnail' | 'cleanup_temp';
  input_path: string | null;
  output_path: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

