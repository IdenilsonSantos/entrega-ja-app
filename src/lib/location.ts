import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { API_URL, DEMO_TOOLS, LOCATION_DISTANCE_M, LOCATION_INTERVAL_MS } from '../config';
import { storage, TOKEN_KEY } from './storage';

/**
 * Localização do entregador enquanto online.
 * No celular, uma tarefa do sistema continua enviando com a tela bloqueada ou com o entregador
 * no Waze (no Android aparece a notificação fixa "Você está online", exigência do sistema).
 * A API recoloca o entregador online se a presença tiver caído por falta de sinal.
 */
export const LOCATION_TASK = 'entregaja-location';
export interface Pos {
  lat: number;
  lng: number;
  heading?: number;
}

const listeners = new Set<(p: Pos) => void>();
export const onPosition = (fn: (p: Pos) => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
let last: Pos | null = null;
export const lastPosition = () => last;

async function send(p: Pos) {
  last = p;
  listeners.forEach((fn) => fn(p));
  const token = await storage.get(TOKEN_KEY);
  if (!token) return;
  await fetch(`${API_URL}/courier/location`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ lat: p.lat, lng: p.lng, ...(p.heading != null && p.heading >= 0 && { heading: Math.round(p.heading) % 360 }) }),
  }).catch(() => undefined); // sem internet: a próxima posição tenta de novo
}

if (Platform.OS !== 'web') {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const l = data.locations[data.locations.length - 1];
    await send({ lat: l.coords.latitude, lng: l.coords.longitude, heading: l.coords.heading ?? undefined });
  });
}

export type Permission = 'ok' | 'denied' | 'foreground-only';

/** Pede "durante o uso" e depois "o tempo todo" (telas separadas no Android 11+ e no iOS) */
export async function requestPermissions(): Promise<Permission> {
  if (Platform.OS === 'web') return 'ok';
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'ok' : 'foreground-only';
}

let watch: Location.LocationSubscription | null = null;
let webWatch: number | null = null;

/** Primeira posição (para ficar online) e início do envio contínuo */
export async function startTracking(perm: Permission): Promise<Pos> {
  if (Platform.OS === 'web') {
    // pré-visualização no navegador: GPS do navegador, enquanto a aba estiver aberta
    const p = await new Promise<Pos>((res, rej) => navigator.geolocation.getCurrentPosition((g) => res({ lat: g.coords.latitude, lng: g.coords.longitude }), rej, { enableHighAccuracy: true, timeout: 10000 }));
    if (webWatch === null) webWatch = navigator.geolocation.watchPosition((g) => send({ lat: g.coords.latitude, lng: g.coords.longitude }), () => undefined, { enableHighAccuracy: true, maximumAge: 5000 });
    last = p;
    listeners.forEach((fn) => fn(p));
    return p;
  }
  const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const first = { lat: now.coords.latitude, lng: now.coords.longitude };
  last = first;
  listeners.forEach((fn) => fn(first));
  if (perm === 'ok') {
    if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_INTERVAL_MS,
        distanceInterval: LOCATION_DISTANCE_M,
        activityType: Location.LocationActivityType.OtherNavigation,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: { notificationTitle: 'Você está online', notificationBody: 'Enviando sua localização para receber corridas por perto.', notificationColor: '#FF7622', killServiceOnDestroy: false },
      });
    }
  } else {
    watch?.remove();
    watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: LOCATION_INTERVAL_MS, distanceInterval: LOCATION_DISTANCE_M }, (l) =>
      send({ lat: l.coords.latitude, lng: l.coords.longitude, heading: l.coords.heading ?? undefined }),
    );
  }
  return first;
}

export async function stopTracking() {
  stopSimulation();
  if (Platform.OS === 'web') {
    if (webWatch !== null) navigator.geolocation.clearWatch(webWatch);
    webWatch = null;
    return;
  }
  watch?.remove();
  watch = null;
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

/** Avisa que continua vivo mesmo parado (o GPS só manda quando anda) */
export const heartbeat = () => last && send(last);

// ───────── ferramenta de TESTE: só com DEMO_TOOLS (desenvolvimento) ─────────
let simTimer: ReturnType<typeof setInterval> | null = null;
const STEP = 0.0006; // ~60 m a cada 2 s

export function startSimulation(target: Pos, onArrive: () => void) {
  if (!DEMO_TOOLS) return;
  stopSimulation();
  simTimer = setInterval(() => {
    const p = last ?? { lat: target.lat + 0.008, lng: target.lng + 0.008 };
    const dLat = target.lat - p.lat;
    const dLng = target.lng - p.lng;
    const d = Math.hypot(dLat, dLng);
    if (d <= STEP) {
      send(target);
      stopSimulation();
      onArrive();
    } else send({ lat: p.lat + (dLat / d) * STEP, lng: p.lng + (dLng / d) * STEP });
  }, 2000);
}

export function stopSimulation() {
  if (simTimer) clearInterval(simTimer);
  simTimer = null;
}
export const simulating = () => !!simTimer;
