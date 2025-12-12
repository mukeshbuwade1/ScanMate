import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';

type CompressPayload = {
  inputPath: string;
  outputPath: string;
  option: 'small' | 'medium' | 'large';
  documentId: string;
  userId: string;
};

export async function serve(req: Request): Promise<Response> {
  try {
    const payload = (await req.json()) as CompressPayload;
    // TODO: download from storage (inputPath), run compression (e.g., ghostscript/qpdf), upload to outputPath.
    // Placeholder: mark job as completed and echo input as output.

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase
      .from('processing_jobs')
      .update({ status: 'completed', output_path: payload.outputPath, completed_at: new Date().toISOString() })
      .eq('document_id', payload.documentId)
      .eq('user_id', payload.userId)
      .eq('type', 'compress_pdf');

    return new Response(JSON.stringify({ outputPath: payload.outputPath }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

serve satisfies Deno.ServeHandler;

