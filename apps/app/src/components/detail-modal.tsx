import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, ScrollViewInstance, Text, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing } from '../design-system/theme';
import { Button, styles } from '../ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DetailState } from './detail-state';
import { FormScroll } from './form-scroll-context';

export function DetailModal({ title, children, footer, busy = false, onClose }: { title: string; children: ReactNode; footer?: ReactNode; busy?: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const scroll = useRef<ScrollViewInstance>(null);
  const insets = useSafeAreaInsets(), pending = useRef(new Set<string>()), [internalBusy, setInternalBusy] = useState(false);
  const setPending = useCallback((id: string, value: boolean) => { if (value) pending.current.add(id); else pending.current.delete(id); setInternalBusy(pending.current.size > 0); }, []);
  const locked = busy || internalBusy, state = useMemo(() => ({ busy: locked, setPending }), [locked, setPending]);
  const close = () => { if (!busy && !pending.current.size) onClose(); };
  const top = Math.max(spacing.lg, insets.top), bottom = Math.max(spacing.lg, insets.bottom);
  return <Modal accessibilityLabel={title} transparent visible animationType="none" onRequestClose={close}><DetailState.Provider value={state}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.scrim, padding: spacing.lg, paddingTop: top, paddingBottom: bottom, justifyContent: 'center', alignItems: 'center' }}>
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 800, maxHeight: height - top - bottom, flexShrink: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', flexShrink: 0, alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border }}>
          <Text accessibilityRole="header" numberOfLines={2} style={[styles.heading, { flex: 1 }]}>{title}</Text>
          <Button secondary label="Đóng chi tiết" disabled={locked} onPress={close} />
        </View>
        <FormScroll.Provider value={scroll}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>{children}</ScrollView></FormScroll.Provider>
        {footer && <View testID="detail-modal-footer" style={{ flexShrink: 0, padding: spacing.lg, borderTopWidth: 1, borderColor: colors.border }}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  </DetailState.Provider></Modal>;
}
