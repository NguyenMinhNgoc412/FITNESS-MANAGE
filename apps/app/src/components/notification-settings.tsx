import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Switch, View } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import { api } from '../api';
import { colors, controlSize, spacing } from '../design-system/theme';
import { errorMessage } from '../lib/http';
import { useAuthStore } from '../store/auth';
import { Card, Feedback, Label } from '../ui';

export function NotificationSettings() {
  const userId = useAuthStore(s => s.session?.user.id);
  const storageKey = `fitness.notifications.${userId}`;
  const [enabled, setEnabled] = useState(false), [loading, setLoading] = useState(Platform.OS !== 'web');
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    const refresh = async () => {
      if (busy.current) return;
      setLoading(true);
      try {
        const Notifications = await import('expo-notifications');
        const [permission, preference] = await Promise.all([Notifications.getPermissionsAsync(), SecureStore.getItemAsync(storageKey)]);
        if (active) setEnabled(permission.granted && preference !== 'off');
      } catch { if (active) setError('Không thể đọc trạng thái thông báo. Vui lòng mở lại màn hình.'); }
      finally { if (active) setLoading(false); }
    };
    void refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; subscription.remove(); };
  }, [storageKey]);

  const toggle = async (next: boolean) => {
    if (busy.current || loading || Platform.OS === 'web') return;
    busy.current = true; setPending(true); setError('');
    try {
      const Notifications = await import('expo-notifications');
      if (next) {
        const permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) { setError('Chưa được cấp quyền thông báo. Bật quyền trong cài đặt thiết bị.'); return; }
        if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Lịch và xác nhận', importance: Notifications.AndroidImportance.DEFAULT });
      }
      // Keep the token locally so disabling also works after OS permission is revoked.
      const savedToken = await SecureStore.getItemAsync(`${storageKey}.token`);
      let token = next ? null : savedToken;
      if (!token) {
        const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
        if (!projectId) { setError('Ứng dụng chưa được cấu hình thông báo push.'); return; }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      if (next) {
        await SecureStore.setItemAsync(`${storageKey}.token`, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
        await api.post('/notifications/device-token', { token });
      } else {
        await api.delete('/notifications/device-token', { data: { token: savedToken ?? token } });
      }
      setEnabled(next);
      await SecureStore.setItemAsync(storageKey, next ? 'on' : 'off');
    } catch (e) { setError(errorMessage(e)); }
    finally { busy.current = false; setPending(false); }
  };

  return <Card title="Thông báo">
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: controlSize.touch }}>
      <View style={{ flex: 1, gap: spacing.xs }}><Label>Cho phép thông báo</Label><Label muted>{loading ? 'Đang tải…' : pending ? 'Đang cập nhật…' : enabled ? 'Bật' : 'Tắt'}</Label></View>
      {(loading || pending) && <ActivityIndicator color={colors.primary} accessibilityLabel="Đang cập nhật thông báo" />}
      <View style={{ minHeight: controlSize.touch, minWidth: controlSize.touch, justifyContent: 'center', alignItems: 'center' }}>
        <Switch accessibilityLabel="Cho phép thông báo" accessibilityState={{ busy: loading || pending }} value={enabled} disabled={loading || pending || Platform.OS === 'web'} onValueChange={next => void toggle(next)} trackColor={{ false: colors.textMuted, true: colors.primaryStrong }} thumbColor={colors.onPrimary} />
      </View>
    </View>
    {Platform.OS === 'web' && <Label muted>Thông báo push khả dụng trên ứng dụng điện thoại. Bạn có thể xem yêu cầu trực tiếp trong app.</Label>}
    <Feedback message={error} />
  </Card>;
}
