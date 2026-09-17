import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';
import { analyzeRun, confirmUpload, createUploadIntent, getRun } from '../src/features/ai-analysis/api';
import { AnalysisResultCard } from '../src/features/ai-analysis/result-card';
import { AiRun } from '../src/features/ai-analysis/types';
import { uploadPrivateVideo } from '../src/features/ai-analysis/upload';
import { createUploadKey, inferVideoMimeType } from '../src/features/ai-analysis/video';
import { useAuthStore } from '../src/store/auth';
import { GuardFallback, useRoleGuard } from '../src/use-role-guard';

type Stage = 'idle' | 'authorizing' | 'uploading' | 'analyzing';
function stageMessage(stage: Stage): string {
  if (stage === 'authorizing') return 'Đang kiểm tra và cấp quyền upload riêng tư…';
  if (stage === 'uploading') return 'Đang tải video lên vùng lưu trữ riêng tư…';
  if (stage === 'analyzing') return 'Đang phân tích tư thế và tạo lộ trình…';
  return '';
}

export default function AiAnalysis() {
  const router = useRouter();
  const allowed = useRoleGuard('MEMBER');
  const userId = useAuthStore((state) => state.session?.user.id);
  const requestKey = useRef<string | null>(null);
  const runId = useRef<string | null>(null);
  const [asset, setAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiRun | null>(null);
  const busy = stage !== 'idle';
  const processing = result?.status === 'VALIDATING' || result?.status === 'ANALYZING';

  const chooseVideo = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true, multiple: false });
    if (picked.canceled) return;
    setAsset(picked.assets[0]);
    setResult(null);
    setError('');
    requestKey.current = null;
    runId.current = null;
  };

  const submit = async () => {
    if (!asset || !userId) return;
    const mimeType = inferVideoMimeType(asset);
    if (!mimeType) return setError('Chỉ hỗ trợ video MP4, WebM hoặc MOV.');
    if (!asset.size || asset.size <= 0) return setError('Không đọc được kích thước video. Vui lòng chọn lại file.');
    setError('');
    try {
      setStage('authorizing');
      requestKey.current ??= createUploadKey(userId);
      const intent = await createUploadIntent({ mimeType, sizeBytes: asset.size, idempotencyKey: requestKey.current });
      runId.current = intent.runId;
      if (intent.status === 'COMPLETED' || intent.status === 'NEEDS_RETAKE' || intent.status === 'VALIDATING' || intent.status === 'ANALYZING') {
        const current = await getRun(intent.runId);
        setResult(current);
        if (current.status === 'COMPLETED' || current.status === 'NEEDS_RETAKE') requestKey.current = null;
        return;
      }
      if (intent.status === 'UPLOAD_PENDING') {
        setStage('uploading');
        await uploadPrivateVideo(intent, asset.uri, mimeType);
        await confirmUpload(intent.runId);
      }
      setStage('analyzing');
      const completed = await analyzeRun(intent.runId);
      setResult(completed);
      if (completed.status === 'COMPLETED' || completed.status === 'NEEDS_RETAKE') requestKey.current = null;
    } catch {
      if (runId.current) {
        try {
          const current = await getRun(runId.current);
          setResult(current);
          if (current.status === 'COMPLETED' || current.status === 'NEEDS_RETAKE') requestKey.current = null;
          if (current.status === 'FAILED') requestKey.current = null;
        } catch {
          // Giữ idempotency key để retry đúng run sau lỗi mạng.
        }
      }
      setError('Không thể hoàn tất phân tích. Vui lòng kiểm tra kết nối và thử lại với cùng video.');
    } finally {
      setStage('idle');
    }
  };

  if (!allowed) return <GuardFallback />;
  return (
    <Screen title="Phân tích cơ thể" subtitle="Video chỉ được dùng cho phân tích fitness, không dùng để chẩn đoán bệnh hoặc chấn thương." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />}>
      <Card style={styles.aiHero}>
        <Text style={styles.eyebrow}>AI BODY ANALYSIS</Text><Text style={styles.heroTitle}>Hiểu rõ dáng tập của bạn</Text><Text style={styles.heroText}>Kết quả dựa trên chất lượng video và dữ liệu pose có cấu trúc.</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Chuẩn bị video</Text>
        <Text style={styles.body}>• Quay đủ toàn thân và giữ cơ thể trong khung hình.</Text>
        <Text style={styles.body}>• Chọn nơi đủ sáng, giữ máy ổn định và tránh che khuất tư thế.</Text>
        <Text style={styles.body}>• Kiểm tra đúng video trước khi xác nhận gửi phân tích.</Text>
      </Card>
      <Card style={styles.uploadCard}>
        <View style={styles.uploadIcon}><Text style={styles.uploadIconText}>⌁</Text></View>
        <AppButton label={asset ? 'Chọn video khác' : 'Chọn video'} variant="secondary" disabled={busy} onPress={() => void chooseVideo()} />
        {asset ? (
          <>
            <Text style={styles.fileName}>{asset.name}</Text>
            <Text style={styles.caption}>{asset.size ? `${(asset.size / 1024 / 1024).toFixed(1)} MB` : 'Không xác định kích thước'}</Text>
            <Feedback tone="warning" message="Xác nhận video đúng trước khi gửi. Sau khi gửi, hệ thống sẽ xử lý CV/Pose trước khi tạo lộ trình." />
            <AppButton label="Xác nhận và gửi phân tích" loading={busy} disabled={processing} onPress={() => void submit()} />
          </>
        ) : <Feedback message="Chưa chọn video." />}
      </Card>
      <Feedback message={stageMessage(stage)} />
      {processing ? <Feedback tone="warning" message="Analysis run vẫn đang xử lý. Bạn có thể xem lại trạng thái trong lịch sử." /> : null}
      <Feedback tone="error" message={error} />
      {result ? <AnalysisResultCard run={result} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.textMuted },
  fileName: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xs },
  caption: { ...typography.caption, color: colors.textMuted },
  aiHero: { backgroundColor: '#EAFDFA', borderColor: '#B8F2E8', gap: spacing.sm },
  eyebrow: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  heroTitle: { ...typography.title, color: colors.text },
  heroText: { ...typography.body, color: colors.textMuted },
  uploadCard: { alignItems: 'stretch' },
  uploadIcon: { alignSelf: 'center', height: 54, width: 54, borderRadius: 27, backgroundColor: colors.violetSurface, alignItems: 'center', justifyContent: 'center' },
  uploadIconText: { color: colors.violet, fontSize: 28 },
});
