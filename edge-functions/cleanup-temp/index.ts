import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';

type CleanupPayload = {
  paths: string[];
  userId: string;
  documentId?: string;
};

export async function serve(req: Request): Promise<Response> {
  try {
    const payload = (await req.json()) as CleanupPayload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // TODO: delete files from storage bucket.
    // Placeholder: just acknowledge.

    if (payload.documentId) {
      await supabase
        .from('processing_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('document_id', payload.documentId)
        .eq('user_id', payload.userId)
        .eq('type', 'cleanup_temp');
    }

    return new Response(JSON.stringify({ deleted: payload.paths.length }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

serve satisfies Deno.ServeHandler;

