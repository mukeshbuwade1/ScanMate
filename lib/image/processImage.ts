import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import type { CropState, FilterPreset } from '@/features/editor/types';

type ProcessOptions = {
  uri: string;
  originalWidth: number;
  originalHeight: number;
  crop: CropState;
  outputDir?: string;
};

const ensureDir = async (dir: string) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const filterBuffer = (data: Uint8Array, width: number, height: number, preset: FilterPreset) => {
  const out = Buffer.from(data); // copy
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (preset === 'bw') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      out[i] = out[i + 1] = out[i + 2] = gray;
    } else if (preset === 'enhance') {
      // simple contrast + slight saturation bump
      const nr = Math.min(255, r * 1.1 + 8);
      const ng = Math.min(255, g * 1.1 + 8);
      const nb = Math.min(255, b * 1.1 + 8);
      out[i] = nr;
      out[i + 1] = ng;
      out[i + 2] = nb;
    }
  }
  return out;
};

const applyFilter = async (uri: string, preset: FilterPreset): Promise<string> => {
  if (preset === 'original') return uri;
  const img = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const raw = Buffer.from(img, 'base64');
  const decoded = jpeg.decode(raw, { useTArray: true });
  const filtered = filterBuffer(decoded.data as Uint8Array, decoded.width, decoded.height, preset);
  const encoded = jpeg.encode(
    { data: filtered, width: decoded.width, height: decoded.height },
    90,
  );
  const newPath = uri.replace(/(\.\w+)?$/, `-${preset}.jpg`);
  await FileSystem.writeAsStringAsync(newPath, encoded.data.toString('base64'), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return newPath;
};

export const processImage = async ({
  uri,
  originalWidth,
  originalHeight,
  crop,
  outputDir = `${FileSystem.cacheDirectory}processed`,
}: ProcessOptions) => {
  await ensureDir(outputDir);
  const [tl, tr, br, bl] = crop.corners;
  const minX = Math.min(tl.x, bl.x);
  const maxX = Math.max(tr.x, br.x);
  const minY = Math.min(tl.y, tr.y);
  const maxY = Math.max(bl.y, br.y);

  const cropRect = {
    originX: Math.max(0, minX * originalWidth),
    originY: Math.max(0, minY * originalHeight),
    width: Math.max(1, (maxX - minX) * originalWidth),
    height: Math.max(1, (maxY - minY) * originalHeight),
  };

  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [
      { crop: cropRect },
      { rotate: Math.round(crop.rotation) },
      crop.scale !== 1 ? { resize: { width: originalWidth * crop.scale, height: originalHeight * crop.scale } } : undefined,
    ].filter(Boolean) as ImageManipulator.Action[],
    {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  const filteredUri = await applyFilter(manipResult.uri, crop.filter);
  const filename = `${outputDir}/scan-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: filteredUri, to: filename });

  return {
    uri: filename,
    width: manipResult.width,
    height: manipResult.height,
    filter: crop.filter,
  };
};

