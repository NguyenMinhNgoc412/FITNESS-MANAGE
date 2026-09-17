import { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from './theme';

type Props = PropsWithChildren<{ title?: string; subtitle?: string; headerAction?: ReactNode; keyboardAware?: boolean; bottomBar?: ReactNode }>;

export function Screen({ title, subtitle, headerAction, keyboardAware, bottomBar, children }: Props) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
      <KeyboardAvoidingView style={styles.flex} behavior={keyboardAware && Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.container, width < 768 && styles.mobileContainer]}>
            {title ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <View style={styles.eyebrowRow}><View style={styles.eyebrowDot} /><Text style={styles.eyebrow}>FITNESS-MANAGE</Text></View>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                {headerAction}
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
        {bottomBar}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 1440, flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  mobileContainer: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eyebrowDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.primary },
  eyebrow: { ...typography.label, color: colors.primary, letterSpacing: 1.1 },
});
