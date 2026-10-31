import { useEffect, useState } from 'react';
import { Alert as RNAlert, View } from 'react-native';
import { Alert, Button, Card, Choice, Field, Plate, Screen, T, space } from '../ds';
import { useSession } from '../features/session';
import { useShift } from '../features/shift';
import { api } from '../lib/api';
import { MISSING, NEEDS_PLATE, VEHICLE } from '../lib/format';
import { setupPush } from '../lib/push';
import { storage, TOKEN_KEY } from '../lib/storage';
import { setToken } from '../lib/api';
import type { CourierProfile, VehicleType } from '../lib/types';

/** Conta, veículo, documentos, senha e notificações */
export function ProfileScreen() {
  const { me, refresh, signOut } = useSession();
  const { online, setOnline } = useShift();
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [v, setV] = useState({ vehicleType: 'MOTORCYCLE' as VehicleType, vehicleModel: '', vehicleColor: '', vehiclePlate: '', document: '', licenseNumber: '', pixKey: '' });
  const [missing, setMissing] = useState<string[]>([]);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.get<CourierProfile>('/courier/profile').then((p) => {
      setV({ vehicleType: p.vehicleType, vehicleModel: p.vehicleModel ?? '', vehicleColor: p.vehicleColor ?? '', vehiclePlate: p.vehiclePlate ?? '', document: p.document ?? '', licenseNumber: p.licenseNumber ?? '', pixKey: p.pixKey ?? '' });
      setMissing(p.missing ?? []);
    });
  }, []);
  const plate = NEEDS_PLATE.includes(v.vehicleType);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      RNAlert.alert(ok);
    } catch (e) {
      RNAlert.alert('Não foi possível salvar', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title="Perfil">
      <Card>
        <T v="h3">Seus dados</T>
        <T v="small">{me?.email}</T>
        <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" />
        <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="(11) 90000-0000" />
        <Button title="Salvar dados" variant="outline" loading={busy === 'me'} onPress={() => run('me', async () => (await api.patch('/me', { name, phone }), await refresh()), 'Dados salvos')} />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T v="h3">Veículo e documentos</T>
          {plate && v.vehiclePlate.length >= 7 && <Plate plate={v.vehiclePlate.toUpperCase()} />}
        </View>
        {missing.length > 0 && <Alert tone="warn">{`Para ficar online, preencha: ${missing.map((m) => MISSING[m] ?? m).join(', ')}.`}</Alert>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
          {(Object.keys(VEHICLE) as VehicleType[]).map((t) => (
            <Choice key={t} label={VEHICLE[t]} selected={v.vehicleType === t} onPress={() => setV({ ...v, vehicleType: t })} />
          ))}
        </View>
        {v.vehicleType !== 'WALKING' && <Field label="Modelo" value={v.vehicleModel} onChangeText={(t) => setV({ ...v, vehicleModel: t })} placeholder="Honda CG 160" />}
        {v.vehicleType !== 'WALKING' && <Field label="Cor" value={v.vehicleColor} onChangeText={(t) => setV({ ...v, vehicleColor: t })} placeholder="Vermelha" />}
        {plate && <Field label="Placa" value={v.vehiclePlate} onChangeText={(t) => setV({ ...v, vehiclePlate: t.toUpperCase() })} autoCapitalize="characters" maxLength={8} placeholder="ABC1D23" />}
        {plate && <Field label="CNH" value={v.licenseNumber} onChangeText={(t) => setV({ ...v, licenseNumber: t })} keyboardType="number-pad" />}
        <Field label="CPF" value={v.document} onChangeText={(t) => setV({ ...v, document: t })} keyboardType="number-pad" placeholder="000.000.000-00" />
        <Field label="Chave Pix" hint="Onde você recebe o valor das corridas" value={v.pixKey} onChangeText={(t) => setV({ ...v, pixKey: t })} autoCapitalize="none" />
        <T v="small">Trocar veículo ou documento avisa a plataforma, que pode conferir os dados.</T>
        <Button
          title="Salvar veículo e documentos"
          loading={busy === 'vehicle'}
          onPress={() =>
            run(
              'vehicle',
              async () => {
                const p = await api.patch<CourierProfile>('/courier/profile', { ...v, vehiclePlate: plate ? v.vehiclePlate : '' });
                setMissing(p.missing ?? []);
                await refresh();
              },
              'Veículo e documentos salvos',
            )
          }
        />
      </Card>

      <Card>
        <T v="h3">Notificações</T>
        <T v="small">Ofertas de corrida tocam e vibram mesmo com a tela bloqueada.</T>
        <Button
          title="Enviar notificação de teste"
          variant="outline"
          loading={busy === 'push'}
          onPress={() =>
            run(
              'push',
              async () => {
                const r = await setupPush();
                if (r === 'denied') throw new Error('Notificações bloqueadas. Libere nas configurações do celular.');
                await api.post('/push/test');
              },
              'Notificação enviada',
            )
          }
        />
      </Card>

      <Card>
        <T v="h3">Senha</T>
        <Field label="Senha atual" value={pw.current} onChangeText={(t) => setPw({ ...pw, current: t })} secureTextEntry />
        <Field label="Nova senha" hint="Pelo menos 6 caracteres" value={pw.next} onChangeText={(t) => setPw({ ...pw, next: t })} secureTextEntry />
        <Button
          title="Trocar senha"
          variant="outline"
          disabled={!pw.current || pw.next.length < 6}
          loading={busy === 'pw'}
          onPress={() =>
            run(
              'pw',
              async () => {
                const s = await api.post<{ token: string }>('/me/password', pw);
                await storage.set(TOKEN_KEY, s.token);
                setToken(s.token);
                setPw({ current: '', next: '' });
              },
              'Senha alterada. Você saiu dos outros aparelhos.',
            )
          }
        />
      </Card>

      <Button
        title="Sair da conta"
        variant="ghost"
        onPress={async () => {
          if (online) await setOnline(false);
          await signOut();
        }}
      />
    </Screen>
  );
}
