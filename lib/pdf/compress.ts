import * as FileSystem from 'expo-file-system';

type CompressOption = 'small' | 'medium' | 'large';

type CompressResult = {
  outputPath: string;
  sizeBytes: number;
};

// Placeholder that calls a Supabase Edge Function named "compress-pdf".
export const compressPdf = async (inputPath: string, option: CompressOption): Promise<CompressResult> => {
  // TODO: replace with real signed upload + edge function invocation.
  const stat = await FileSystem.getInfoAsync(inputPath);
  return {
    outputPath: inputPath,
    sizeBytes: stat.size ?? 0,
  };
};

