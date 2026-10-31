import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Card, Screen, Stat, T, radius, space, usePalette } from '../ds';
import { api } from '../lib/api';
import { km, money } from '../lib/format';

interface Earnings {
  today: number;
  todayCount: number;
  week: number;
  weekCount: number;
  month: number;
  total: number;
  totalCount: number;
  km: number;
  daily: { day: string; cents: number; count: number }[];
}

export function EarningsScreen() {
  const c = usePalette();
  const [e, setE] = useState<Earnings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => setE(await api.get<Earnings>('/courier/earnings')), []);
  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);
  const max = Math.max(1, ...(e?.daily.map((d) => d.cents) ?? [1]));
  return (
    <Screen title="Ganhos" refreshing={refreshing} onRefresh={async () => (setRefreshing(true), await load().catch(() => undefined), setRefreshing(false))}>
      {e && (
        <>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Stat label="Hoje" value={money(e.today)} hint={`${e.todayCount} entregas`} />
            <Stat label="7 dias" value={money(e.week)} hint={`${e.weekCount} entregas`} />
          </View>
          <Stat label="Este mês" value={money(e.month)} hint={`Total ${money(e.total)} em ${e.totalCount} entregas, ${km(e.km)}`} />
          <Card>
            <T v="h3">Últimos 7 dias</T>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 }} accessibilityLabel="Ganhos por dia">
              {e.daily.map((d) => (
                <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: '100%', height: Math.max(3, (d.cents / max) * 110), backgroundColor: d.cents ? c.primary : c.line, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                  <T v="small">{new Date(d.day + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}</T>
                </View>
              ))}
            </View>
          </Card>
          <T v="small" style={{ borderRadius: radius.field }}>Os valores caem na chave Pix do seu perfil.</T>
        </>
      )}
    </Screen>
  );
}
