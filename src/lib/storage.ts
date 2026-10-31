import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Token guardado com segurança no celular (Keychain/Keystore); no navegador, localStorage */
export const TOKEN_KEY = 'ej.token';
export const storage = {
  get: (k: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(k)) : SecureStore.deleteItemAsync(k)),
};
