import * as FileSystem from 'expo-file-system';

const baseDir = `${FileSystem.documentDirectory}pdfs`;

export const ensurePdfDir = async () => {
  const info = await FileSystem.getInfoAsync(baseDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  }
  return baseDir;
};

export const pdfFileName = (docId: string, suffix?: string) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = suffix ? `scan-${docId}-${suffix}-${stamp}.pdf` : `scan-${docId}-${stamp}.pdf`;
  return name;
};

export const pdfPath = async (docId: string, suffix?: string) => {
  const dir = await ensurePdfDir();
  return `${dir}/${pdfFileName(docId, suffix)}`;
};

