import { MMKV } from 'react-native-mmkv';

// Singleton MMKV instance for app storage.
export const storage = new MMKV({
  id: 'scanmate-storage',
  encryptionKey: undefined, // set once key management is in place
});

export const getBoolean = (key: string, fallback = false) => {
  try {
    const value = storage.getBoolean(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const getString = (key: string, fallback?: string) => {
  try {
    const value = storage.getString(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const setString = (key: string, value: string) => {
  storage.set(key, value);
};

export const removeKey = (key: string) => {
  storage.delete(key);
};

