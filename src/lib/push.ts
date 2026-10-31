import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Push no celular (Expo → FCM/APNs). O canal "offers" toca alto e vibra: é por ele que a oferta
 * chega com o app fechado ou a tela bloqueada. Com o app aberto, a oferta já aparece pelo tempo
 * real, então a notificação não é mostrada de novo.
 */
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const type = (n.request.content.data as { type?: string } | undefined)?.type;
    const show = type !== 'offer.new';
    return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
  },
});

let registered: string | null = null;

export async function setupPush(): Promise<'ok' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('offers', {
      name: 'Ofertas de corrida',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync('default', { name: 'Avisos', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api.post('/push/devices', { token: data, platform: Platform.OS });
  registered = data;
  return 'ok';
}

/** Ao sair da conta: o próximo usuário deste celular não recebe os avisos do anterior */
export async function teardownPush() {
  if (!registered) return;
  await api.delete(`/push/devices/${encodeURIComponent(registered)}`).catch(() => undefined);
  registered = null;
}

export function onNotificationTap(fn: (data: Record<string, unknown>) => void) {
  if (Platform.OS === 'web') return () => undefined;
  const sub = Notifications.addNotificationResponseReceivedListener((r) => fn((r.notification.request.content.data ?? {}) as Record<string, unknown>));
  return () => sub.remove();
}
