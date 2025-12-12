import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import { ensurePdfDir } from './naming';

export const generateThumbnail = async (uri: string, docId: string) => {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 320 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
  );
  const dir = await ensurePdfDir();
  const target = `${dir}/${docId}-thumb.jpg`;
  await FileSystem.copyAsync({ from: resized.uri, to: target });
  return target;
};

