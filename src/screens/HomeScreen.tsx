import { useEffect, useMemo, useState } from 'react';
import { Alert as RNAlert, Linking, Pressable, TextInput, View } from 'react-native';
import { Alert, Badge, Button, ButtonRow, Card, Divider, Link, Screen, T, font, radius, space, usePalette } from '../ds';
import { DEMO_TOOLS } from '../config';
import { useSession } from '../features/session';
import { useShift } from '../features/shift';
import { api } from '../lib/api';
import { km, MISSING, money, PAYMENT, profileFor } from '../lib/format';
import { simulating, startSimulation, stopSimulation } from '../lib/location';
import type { Offer, Order, Route } from '../lib/types';

/** Abrir a rota no app de mapas do celular (Google Maps ou Waze, o que estiver instalado) */
const openRoute = (lat: number, lng: number) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);

/** Tempo e distância pelo melhor caminho (mesma API de rotas do site) */
function useEta(from: { lat: number; lng: number } | null, to: { lat: number; lng: number } | null, profile: string) {
  const [r, setR] = useState<Route | null>(null);
  const key = from && to ? `${from.lat.toFixed(3)},${from.lng.toFixed(3)}>${to.lat.toFixed(4)},${to.lng.toFixed(4)}` : null;
  useEffect(() => {
    if (!from || !to) return;
    api.get<Route>(`/routes?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}&profile=${profile}`).then(setR).catch(() => undefined);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return r;
}

function OnlineCard() {
  const c = usePalette();
  const { online, busy, setOnline, connection } = useShift();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: online, busy }}
      onPress={() => setOnline(!online)}
      disabled={busy}
      style={{ backgroundColor: online ? c.success : c.navy, borderRadius: radius.card, padding: space.xl, gap: 4 }}
    >
      <T v="h2" style={{ color: '#fff' }}>
        {busy ? 'Aguarde…' : online ? 'Você está online' : 'Você está offline'}
      </T>
      <T style={{ color: 'rgba(255,255,255,0.85)' }}>{online ? 'Recebendo corridas perto de você. Toque para sair.' : 'Toque para começar a receber corridas.'}</T>
      {online && connection !== 'live' && <T v="small" style={{ color: '#fff' }}>Reconectando…</T>}
    </Pressable>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const c = usePalette();
  const { reload } = useShift();
  const { me } = useSession();
  const total = useMemo(() => Math.max(1, (new Date(offer.expiresAt).getTime() - Date.now()) / 1000), [offer.orderId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [left, setLeft] = useState(total);
  const [busy, setBusy] = useState<string | null>(null);
  const trip = useEta({ lat: offer.storeLat, lng: offer.storeLng }, { lat: offer.deliveryLat, lng: offer.deliveryLng }, profileFor(me?.courier?.vehicleType));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, (new Date(offer.expiresAt).getTime() - Date.now()) / 1000)), 250);
    return () => clearInterval(t);
  }, [offer.expiresAt]);
  const act = async (kind: 'accept' | 'decline') => {
    setBusy(kind);
    try {
      await api.post(`/courier/offers/${offer.orderId}/${kind}`);
    } catch (e) {
      RNAlert.alert('Não foi possível', (e as Error).message);
    } finally {
      setBusy(null);
      reload();
    }
  };
  return (
    <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' }} accessibilityLiveRegion="assertive">
      <View style={{ height: 6, backgroundColor: c.field }}>
        <View style={{ height: 6, width: `${(left / total) * 100}%`, backgroundColor: c.primary }} />
      </View>
      <View style={{ padding: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <T v="label" color="primaryText">
              Nova corrida
            </T>
            <T v="number">{money(offer.feeCents)}</T>
          </View>
          <T v="h2" color="muted" style={{ fontVariant: ['tabular-nums'] }}>
            {Math.ceil(left)}s
          </T>
        </View>
        <View style={{ gap: 2 }}>
          <T v="small">Retirar, a {km(offer.pickupKm)} de você</T>
          <T v="h3">{offer.storeName}</T>
          <T>{offer.storeAddress}</T>
        </View>
        <View style={{ gap: 2 }}>
          <T v="small">Entregar{trip ? `, ${trip.durationMin} min e ${km(trip.distanceKm)} pelo caminho` : `, a ${km(offer.tripKm)} da loja`}</T>
          <T v="h3">{offer.deliveryAddress}</T>
        </View>
        <ButtonRow>
          <Button title="Recusar" variant="outline" onPress={() => act('decline')} loading={busy === 'decline'} disabled={!!busy} />
          <Button title="Aceitar" onPress={() => act('accept')} loading={busy === 'accept'} disabled={!!busy || left <= 0} />
        </ButtonRow>
      </View>
    </View>
  );
}

function DeliveryCard({ o }: { o: Order }) {
  const c = usePalette();
  const { reload, position } = useShift();
  const { me } = useSession();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sim, setSim] = useState(simulating());
  const toStore = o.status !== 'PICKED_UP';
  const target = toStore ? { lat: o.store.lat, lng: o.store.lng } : { lat: o.deliveryLat, lng: o.deliveryLng };
  const eta = useEta(position, target, profileFor(me?.courier?.vehicleType));

  const run = async (path: string, body?: unknown) => {
    setBusy(true);
    setError(null);
    try {
      await api.post(path, body ?? {});
      setCode('');
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <T v="h1" style={{ fontFamily: font.heavy }}>
          #{o.number}
        </T>
        <T v="label">{money(o.courierFeeCents ?? 0)}</T>
      </View>
      {toStore ? (
        <View style={{ gap: 2 }}>
          <Badge label={o.status === 'PREPARING' ? 'Em preparo, pode ir indo' : 'Pronto para retirar'} tone={o.status === 'PREPARING' ? 'info' : 'primary'} />
          <T v="h2">{o.store.name}</T>
          <T>{o.store.address}</T>
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          <T v="small">Entregar para</T>
          <T v="h2">{o.customer?.name}</T>
          <T>{[o.deliveryAddress, o.deliveryComplement].filter(Boolean).join(', ')}</T>
          {o.deliveryReference && <T v="small">{o.deliveryReference}</T>}
        </View>
      )}
      {eta && (
        <T>
          <T v="label">{eta.durationMin} min</T> até {toStore ? 'a loja' : 'a cliente'}, {km(eta.distanceKm)} pelo caminho
        </T>
      )}
      <ButtonRow>
        <Button size="sm" variant="outline" title="Abrir rota" onPress={() => openRoute(target.lat, target.lng)} />
        {(toStore ? o.store.phone : o.customer?.phone) && <Button size="sm" variant="outline" title={toStore ? 'Ligar p/ loja' : 'Ligar p/ cliente'} onPress={() => Linking.openURL(`tel:${(toStore ? o.store.phone : o.customer?.phone)!.replace(/[^\d+]/g, '')}`)} />}
      </ButtonRow>

      {DEMO_TOOLS && (
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.warn, borderRadius: radius.field, padding: space.md, gap: space.sm }}>
          <T v="small" color="warn">
            Teste: simular o deslocamento até {toStore ? 'a loja' : 'a cliente'} (não existe no app de produção).
          </T>
          <Button
            size="sm"
            variant="outline"
            title={sim ? 'Parar simulação' : 'Simular'}
            onPress={() => {
              if (sim) stopSimulation();
              else startSimulation(target, () => setSim(false));
              setSim(!sim);
            }}
          />
        </View>
      )}

      {error && <Alert tone="danger">{error}</Alert>}
      {o.status === 'READY' && <Button title="Retirei o pedido" onPress={() => run(`/courier/orders/${o.id}/pickup`)} loading={busy} />}
      {o.status === 'PICKED_UP' && (
        <View style={{ gap: space.md }}>
          <Divider />
          <Alert tone={o.paymentMethod === 'CASH' ? 'warn' : 'info'}>
            {`Receber ${money(o.totalCents)}: ${PAYMENT[o.paymentMethod].toLowerCase()}${o.changeForCents ? `, levar troco para ${money(o.changeForCents)}` : ''}.`}
          </Alert>
          <T v="label">Código que a cliente informar</T>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor={c.subtle}
            accessibilityLabel="Código de entrega"
            style={{ height: 64, borderRadius: radius.field, backgroundColor: c.field, textAlign: 'center', fontSize: 30, letterSpacing: 16, fontFamily: font.heavy, color: c.ink }}
          />
          <Button title="Confirmar entrega" variant="success" disabled={code.length !== 4} loading={busy} onPress={() => run(`/courier/orders/${o.id}/deliver`, { code })} />
        </View>
      )}
      {o.status !== 'PICKED_UP' && <Link title="Não vou conseguir fazer esta entrega" color="muted" onPress={() => run(`/courier/orders/${o.id}/drop`, { reason: 'Desistiu pelo app' })} />}
    </Card>
  );
}

export function HomeScreen() {
  const { me } = useSession();
  const { status, online, reload } = useShift();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await reload().catch(() => undefined);
    setRefreshing(false);
  };
  if (!status || !me) return <Screen title="Corridas">{null}</Screen>;

  if (!status.approved) {
    const missing = me.courier?.missing ?? [];
    return (
      <Screen title="Cadastro em análise" refreshing={refreshing} onRefresh={refresh}>
        <T>A plataforma confere seus dados e o veículo antes de liberar as corridas. Você recebe uma notificação quando for aprovado.</T>
        {me.statusReason && <Alert tone="warn" title="Ajuste pedido pela plataforma">{me.statusReason}</Alert>}
        {missing.length > 0 && <Alert tone="info" title="Falta preencher">{`Complete no Perfil: ${missing.map((m) => MISSING[m] ?? m).join(', ')}.`}</Alert>}
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <OnlineCard />
      {status.offer && <OfferCard offer={status.offer} />}
      {status.active.map((o) => (
        <DeliveryCard key={o.id} o={o} />
      ))}
      {!status.offer && !status.active.length && (
        <Card>
          <T v="h3">{online ? 'Esperando corridas' : 'Sem corridas agora'}</T>
          <T v="small">{online ? 'Quando um pedido ficar pronto perto de você, a oferta aparece aqui com vibração e notificação.' : 'Fique online para receber ofertas. Da próxima vez que abrir o app, você volta online sozinho.'}</T>
        </Card>
      )}
    </Screen>
  );
}
