import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import EventSource from 'react-native-sse';
import { API_URL } from '../config';

const EVENTS = ['notification', 'order.updated', 'offer.new', 'offer.expired', 'offer.cancelled', 'session.revoked'] as const;
type Name = (typeof EVENTS)[number];
export type Connection = 'connecting' | 'live' | 'offline';

/**
 * Tempo real (SSE), o mesmo canal do site.
 * Reconecta sozinho mandando o Last-Event-ID (o servidor reenvia o que se perdeu) e, ao voltar do
 * segundo plano, reabre a conexão e chama onResume para o app recarregar o estado.
 */
export function useEvents(token: string | null, handlers: Partial<Record<Name, (data: any) => void>>, onResume?: () => void): Connection {
  const ref = useRef(handlers);
  ref.current = handlers;
  const resume = useRef(onResume);
  resume.current = onResume;
  const [state, setState] = useState<Connection>('connecting');

  useEffect(() => {
    if (!token) return;
    let es: EventSource<Name> | null = null;
    let lastId: string | null = null;
    const open = () => {
      es?.close();
      setState('connecting');
      es = new EventSource<Name>(`${API_URL}/events/stream${lastId ? `?lastEventId=${encodeURIComponent(lastId)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
        pollingInterval: 3000,
      });
      es.addEventListener('open', () => setState('live'));
      es.addEventListener('error', () => setState('offline'));
      EVENTS.forEach((name) =>
        es!.addEventListener(name, (e) => {
          if (e.lastEventId) lastId = e.lastEventId;
          try {
            ref.current[name]?.(e.data ? JSON.parse(e.data) : null);
          } catch {
            /* evento malformado */
          }
        }),
      );
    };
    open();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        open();
        resume.current?.();
      }
    });
    return () => {
      sub.remove();
      es?.close();
    };
  }, [token]);

  return state;
}
