import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Button, Field, Link, T, space, usePalette } from '../ds';
import { useSession } from '../features/session';
import { api } from '../lib/api';

export function LoginScreen() {
  const c = usePalette();
  const { signIn } = useSession();
  const [email, setEmail] = useState(__DEV__ ? 'entregador1@demo.com' : '');
  const [password, setPassword] = useState(__DEV__ ? '123456' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  /** O link chega por e-mail e abre a página de nova senha no site (vale para o app também) */
  const forgot = async () => {
    if (!email.includes('@')) return setError('Digite seu e-mail acima para receber o link.');
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim() });
      setNotice(r.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.navy }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.xl, gap: 6 }}>
          <T v="label" style={{ color: '#FF7622' }}>
            Entrega Já
          </T>
          <T v="title" style={{ color: '#fff' }}>
            Entregador
          </T>
          <T style={{ color: '#C8CAD6' }}>Entre para ficar online e receber corridas perto de você.</T>
        </View>
        <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: space.xl, gap: space.lg }}>
          {error && <Alert tone="danger">{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} />
          <View style={{ alignItems: 'flex-end', marginTop: -space.sm }}>
            <Link title="Esqueci minha senha" onPress={forgot} />
          </View>
          <Button size="lg" title="Entrar" onPress={submit} loading={busy} disabled={!email || !password} />
          <T v="small" style={{ textAlign: 'center' }}>
            Ainda não tem cadastro? Crie pelo site, em "Quero entregar".
          </T>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
