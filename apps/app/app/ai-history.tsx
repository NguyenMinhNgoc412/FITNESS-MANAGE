import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AppButton, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';
import { getHistory } from '../src/features/ai-analysis/api';
import { AnalysisResultCard } from '../src/features/ai-analysis/result-card';
import { AiRun } from '../src/features/ai-analysis/types';
import { GuardFallback, useAuthGuard } from '../src/use-role-guard';

export default function AiHistory() {
  const router = useRouter();
  const session = useAuthGuard();
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      setRuns(await getHistory());
    } catch {
      setError('Không thể tải lịch sử phân tích.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!session) return <GuardFallback />;
  return (
    <Screen title="Lịch sử phân tích" subtitle="Mỗi lần phân tích được giữ thành một record riêng." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />}>
      {loading ? <ActivityIndicator accessibilityLabel="Đang tải lịch sử" color={colors.primary} size="large" /> : null}
      <Feedback tone="error" message={error} />
      {!loading && !error && runs.length === 0 ? <Feedback message="Chưa có lần phân tích nào." /> : null}
      {runs.map((run) => (
        <Card key={run.id} style={styles.run}>
          <Text style={styles.date}>{new Date(run.createdAt).toLocaleString('vi-VN')}</Text>
          <Text style={styles.status}>Trạng thái: {run.status}</Text>
          <AnalysisResultCard run={run} />
        </Card>
      ))}
      {!loading && error ? <AppButton label="Thử tải lại" variant="secondary" onPress={() => void load()} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  run: { gap: spacing.sm },
  date: { ...typography.bodyStrong, color: colors.text },
  status: { ...typography.caption, color: colors.textMuted },
});
