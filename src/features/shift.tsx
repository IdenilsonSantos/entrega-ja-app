import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Vibration } from 'react-native';
import { api } from '../lib/api';
import { useEvents, type Connection } from '../lib/events';
import { heartbeat, lastPosition, onPosition, requestPermissions, startTracking, stopTracking, type Pos } from '../lib/location';
import { onNotificationTap, setupPush } from '../lib/push';
import type { CourierStatus } from '../lib/types';
import { useSession } from './session';

interface Shift {
  status: CourierStatus | null;
  online: boolean;
  busy: boolean;
  connection: Connection;
  position: Pos | null;
  setOnline: (on: boolean) => Promise<void>;
  reload: () => Promise<void>;
}
const Ctx = createContext<Shift>(null!);
export const useShift = () => useContext(Ctx);

/**
 * Turno do entregador:
 * - "online" fica salvo na conta (API): ao abrir o app, se estava online, liga sozinho;
 * - enquanto online, a posição vai para a API em segundo plano;
 * - ofertas chegam pelo tempo real (com vibração) ou pelo push com o app fechado.
 */
export function ShiftProvider({ children }: { children: ReactNode }) {
  const { token, refresh } = useSession();
  const [status, setStatus] = useState<CourierStatus | null>(null);
  const [online, setOnlineState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<Pos | null>(lastPosition());
  const auto = useRef(false);

  const reload = useCallback(async () => {
    const s = await api.get<CourierStatus>('/courier/status');
    setStatus(s);
    setOnlineState(s.online);
    return s;
  }, []) as () => Promise<any>;

  const setOnline = useCallback(async (on: boolean) => {
    setBusy(true);
    try {
      if (on) {
        const perm = await requestPermissions();
        if (perm === 'denied') throw new Error('Permita o acesso à localização nas configurações do celular para ficar online.');
        const p = await startTracking(perm);
        await api.post('/courier/presence', { online: true, ...p });
        if (perm === 'foreground-only') Alert.alert('Localização só com o app aberto', 'Para receber corridas com a tela bloqueada, permita a localização "o tempo todo" nas configurações.');
      } else {
        await api.post('/courier/presence', { online: false });
        await stopTracking();
      }
      setOnlineState(on);
      await reload();
    } catch (e) {
      Alert.alert(on ? 'Não foi possível ficar online' : 'Não foi possível ficar offline', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [reload]);

  // ao abrir: carrega o estado, liga o push e, se estava online, volta online sozinho
  useEffect(() => {
    if (!token) return;
    reload()
      .then((s: CourierStatus) => {
        // estava online: liga de novo (mesmo que o servidor ainda o considere online, o GPS
        // deste aparelho precisa voltar a mandar a posição)
        if (!auto.current && s.approved && s.wantsOnline) {
          auto.current = true;
          setOnline(true);
        }
      })
      .catch(() => undefined);
    setupPush().catch(() => undefined);
    const off = onNotificationTap(() => void reload());
    const offPos = onPosition(setPosition);
    return () => {
      off();
      offPos();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // parado no lugar o GPS não manda nada: um sinal a cada 30 s mantém o online
  useEffect(() => {
    if (!online) return;
    const t = setInterval(heartbeat, 30_000);
    return () => clearInterval(t);
  }, [online]);

  const connection = useEvents(
    token,
    {
      'offer.new': (offer) => {
        Vibration.vibrate([0, 400, 200, 400]);
        setStatus((s) => s && { ...s, offer });
      },
      'offer.expired': (d) => setStatus((s) => (s && s.offer?.orderId === d.orderId ? { ...s, offer: null } : s)),
      'offer.cancelled': (d) => setStatus((s) => (s && s.offer?.orderId === d.orderId ? { ...s, offer: null } : s)),
      'order.updated': () => void reload(),
      notification: (n) => n?.type?.startsWith('account') && void refresh().then(reload),
    },
    () => void reload(),
  );

  return <Ctx.Provider value={{ status, online, busy, connection, position, setOnline, reload }}>{children}</Ctx.Provider>;
}
