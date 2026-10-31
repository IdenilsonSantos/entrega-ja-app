import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Divider, Empty, T, space, usePalette } from '../ds';
import { api } from '../lib/api';
import { dateTime, km, money } from '../lib/format';
import type { Order } from '../lib/types';

/** Entregas concluídas, carregadas aos poucos (paginação por cursor da API) */
export function HistoryScreen() {
  const c = usePalette();
  const [items, setItems] = useState<Order[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (reset = false) => {
    if (loading || (!reset && done)) return;
    setLoading(true);
    try {
      const r = await api.get<{ items: Order[]; nextCursor: string | null }>(`/courier/deliveries?limit=20${!reset && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      setItems((x) => (reset ? r.items : [...x, ...r.items]));
      setCursor(r.nextCursor);
      setDone(!r.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, done, loading]);

  useEffect(() => {
    load(true).catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.canvas }} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: space.lg }}
        ListHeaderComponent={<T v="h1" style={{ marginBottom: space.md }}>Histórico</T>}
        ItemSeparatorComponent={Divider}
        onEndReached={() => load().catch(() => undefined)}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          setDone(false);
          await load(true).catch(() => undefined);
          setRefreshing(false);
        }}
        ListEmptyComponent={loading ? null : <Empty title="Nenhuma entrega ainda" description="As corridas concluídas aparecem aqui com o valor de cada uma." />}
        ListFooterComponent={loading ? <ActivityIndicator color={c.primary} style={{ margin: space.lg }} /> : done && items.length ? <T v="small" style={{ textAlign: 'center', margin: space.lg }}>Fim da lista</T> : null}
        renderItem={({ item: o }) => (
          <View style={{ paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <T v="label" numberOfLines={1}>
                #{o.number} {o.store.name}
              </T>
              <T v="small" numberOfLines={1}>
                {dateTime(o.deliveredAt ?? o.createdAt)}, {km(o.distanceKm)}
              </T>
            </View>
            {o.status === 'DELIVERED' ? <T v="label">{money(o.courierFeeCents ?? 0)}</T> : <Badge label="Cancelado" />}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
