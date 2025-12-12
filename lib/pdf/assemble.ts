import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';

import { pdfPath } from './naming';
import { generateThumbnail } from './thumbnail';

type PageInput = {
  uri: string;
  width?: number;
  height?: number;
};

export const createPdfFromImages = async (docId: string, pages: PageInput[]) => {
  const pdf = await PDFDocument.create();

  for (const page of pages) {
    const bytes = await FileSystem.readAsStringAsync(page.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imageBytes = Uint8Array.from(Buffer.from(bytes, 'base64'));
    const embedded = page.uri.toLowerCase().endsWith('.png')
      ? await pdf.embedPng(imageBytes)
      : await pdf.embedJpg(imageBytes);
    const { width, height } = embedded.scale(1);
    const pdfPage = pdf.addPage([width, height]);
    pdfPage.drawImage(embedded, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await pdf.save();
  const targetPath = await pdfPath(docId);
  await FileSystem.writeAsStringAsync(targetPath, Buffer.from(pdfBytes).toString('base64'), {
    encoding: FileSystem.EncodingType.Base64,
  });

  // generate first-page thumbnail
  const thumb = pages[0] ? await generateThumbnail(pages[0].uri, docId) : undefined;

  return {
    path: targetPath,
    thumbnail: thumb,
  };
};

