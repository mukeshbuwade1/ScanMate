import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';

type ThumbPayload = {
  inputPath: string;
  thumbPath: string;
  documentId: string;
  userId: string;
};

export async function serve(req: Request): Promise<Response> {
  try {
    const payload = (await req.json()) as ThumbPayload;
    // TODO: download inputPath, generate thumbnail (ImageMagick/sharp), upload to thumbPath.

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase
      .from('documents')
      .update({ thumbnail_path: payload.thumbPath, updated_at: new Date().toISOString() })
      .eq('id', payload.documentId)
      .eq('user_id', payload.userId);

    return new Response(JSON.stringify({ thumbPath: payload.thumbPath }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}

serve satisfies Deno.ServeHandler;

