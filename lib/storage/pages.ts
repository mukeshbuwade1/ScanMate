import * as FileSystem from 'expo-file-system';

const baseDir = `${FileSystem.documentDirectory}docs`;

const ensureDir = async (path: string) => {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
};

const pagePath = (docId: string, pageNumber: number, kind: 'raw' | 'processed') =>
  `${baseDir}/${docId}/${kind}/page-${pageNumber}.jpg`;

export const saveRawImage = async (docId: string, pageNumber: number, sourceUri: string) => {
  const target = pagePath(docId, pageNumber, 'raw');
  await ensureDir(`${baseDir}/${docId}/raw`);
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
};

export const saveProcessedImage = async (docId: string, pageNumber: number, sourceUri: string) => {
  const target = pagePath(docId, pageNumber, 'processed');
  await ensureDir(`${baseDir}/${docId}/processed`);
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
};

export const getDocumentPages = async (docId: string) => {
  const rawDir = `${baseDir}/${docId}/raw`;
  const processedDir = `${baseDir}/${docId}/processed`;
  const raw = (await listImages(rawDir)).sort();
  const processed = (await listImages(processedDir)).sort();
  return { raw, processed };
};

const listImages = async (dir: string) => {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return [];
    const entries = await FileSystem.readDirectoryAsync(dir);
    return entries.map((f) => `${dir}/${f}`);
  } catch {
    return [];
  }
};

