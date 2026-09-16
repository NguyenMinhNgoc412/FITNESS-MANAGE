import { StyleSheet, Text, View } from 'react-native';
import { Card, Feedback, colors, spacing, typography } from '../../design-system';
import { AiRun } from './types';

function BulletList({ items }: { items: string[] }) {
  return <View style={styles.list}>{items.map((item, index) => <Text key={`${index}-${item}`} style={styles.body}>• {item}</Text>)}</View>;
}

export function AnalysisResultCard({ run }: { run: AiRun }) {
  if (run.status === 'NEEDS_RETAKE') {
    const reasons = run.result?.inputQuality.reasons ?? [];
    return <Feedback tone="warning" message={reasons.length ? `Cần quay lại: ${reasons.join(', ')}` : 'Video chưa đủ chất lượng. Vui lòng quay lại theo hướng dẫn.'} />;
  }
  if (run.status === 'FAILED') return <Feedback tone="error" message="Không thể hoàn tất phân tích. Bạn có thể thử gửi lại video." />;
  if (!run.plan) return <Feedback message={`Trạng thái: ${run.status}`} />;
  return (
    <Card>
      <Text style={styles.heading}>Kết quả phân tích</Text>
      <Text style={styles.body}>{run.plan.summary}</Text>
      <Text style={styles.subheading}>Trọng tâm</Text>
      <BulletList items={run.plan.focusAreas} />
      <Text style={styles.subheading}>Khuyến nghị</Text>
      <BulletList items={run.plan.recommendations} />
      {run.plan.trainingPlan.phases.map((phase) => (
        <View key={phase.name} style={styles.phase}>
          <Text style={styles.subheading}>{phase.name} · {phase.durationWeeks} tuần</Text>
          <BulletList items={[...phase.goals, ...phase.exercises]} />
        </View>
      ))}
      {run.plan.limitations.length ? <Feedback tone="warning" message={`Giới hạn: ${run.plan.limitations.join(' ')}`} /> : null}
      {run.plan.safetyFlags.length ? <Feedback tone="warning" message={run.plan.safetyFlags.join(' ')} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.heading, color: colors.text },
  subheading: { ...typography.bodyStrong, color: colors.text },
  body: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.xs },
  phase: { gap: spacing.sm },
});
