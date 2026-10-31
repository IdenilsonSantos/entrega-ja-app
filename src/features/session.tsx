import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, loadToken, setToken, setUnauthorizedHandler } from '../lib/api';
import { stopTracking } from '../lib/location';
import { teardownPush } from '../lib/push';
import { storage, TOKEN_KEY } from '../lib/storage';
import type { Me } from '../lib/types';

interface Session {
  me: Me | null;
  token: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
const Ctx = createContext<Session>(null!);
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    await teardownPush();
    await stopTracking();
    await storage.del(TOKEN_KEY);
    setToken(null);
    setTok(null);
    setMe(null);
  }, []);

  const refresh = useCallback(async () => setMe(await api.get<Me>('/me')), []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const t = await loadToken();
      if (t) {
        setTok(t);
        await refresh().catch(() => signOut());
      }
      setReady(true);
    })();
  }, [refresh, signOut]);

  const signIn = async (email: string, password: string) => {
    const s = await api.post<{ token: string; user: Me }>('/auth/login', { email: email.trim().toLowerCase(), password });
    if (s.user.role !== 'COURIER') throw new Error('Este app é para entregadores. Lojas e clientes usam o site.');
    await storage.set(TOKEN_KEY, s.token);
    setToken(s.token);
    setTok(s.token);
    await refresh();
  };

  return <Ctx.Provider value={{ me, token, ready, signIn, signOut, refresh }}>{children}</Ctx.Provider>;
}
