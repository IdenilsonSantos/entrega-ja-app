import { Platform } from 'react-native';

/**
 * EXPO_PUBLIC_API_URL: endereço da API. No celular físico, use o IP do computador na rede
 * (http://192.168.x.x:3000/api), não "localhost".
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')).replace(/\/$/, '');

/**
 * Ferramentas de teste (simulador de deslocamento): ligadas em desenvolvimento (__DEV__) ou com
 * EXPO_PUBLIC_DEMO_TOOLS=true. No build de produção ficam desligadas.
 */
export const DEMO_TOOLS = __DEV__ || process.env.EXPO_PUBLIC_DEMO_TOOLS === 'true';

/** Envio de posição: a cada 8 s ou 25 m, o que vier primeiro */
export const LOCATION_INTERVAL_MS = 8000;
export const LOCATION_DISTANCE_M = 25;
