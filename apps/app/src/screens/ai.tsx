import { PopupRow, RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { api } from '../api';
import { colors as c, radius, spacing } from '../design-system/theme';
import { Button, Card, Label, Page, styles } from '../ui';
import { dateTime } from '../lib/date-time';
import { useAuthStore } from '../store/auth';
import { Analysis, explanationPayload, localFeedback } from '../features/ai-analysis/algorithm';
import { analyzeAutomatically, automaticPayload, autoComparisons, autoFeedback, AutoAnalysis, exerciseLabel, StoredAnalysis } from '../features/ai-analysis/automatic';
import { compareAngles } from '../features/ai-analysis/measurements';
import { extractPose } from '../features/ai-analysis/pose';
import { deleteVideo, importVideo, releaseVideo, videoUri } from '../features/ai-analysis/files';
import { addSession, listSessions, LocalSession, removeSession, updateSession } from '../features/ai-analysis/storage';
import { analysisStep, runExclusive } from '../features/ai-analysis/workflow';
import { assertLocalStorageReady } from '../features/ai-analysis/storage-runtime';
export default function Ai() {
  const memberId = useAuthStore(s => s.session!.user.id), [sessions, setSessions] = useState<LocalSession[]>([]), [error, setError] = useState(''), [stage, setStage] = useState(''), [busy, setBusy] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const opened = sessions.find(session => session.id === openedId);
  const controller = useRef<AbortController | null>(null), inFlight = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null), [deletingId, setDeletingId] = useState<string | null>(null);
  const [picking, setPicking] = useState<'camera' | 'library' | null>(null), [importStage, setImportStage] = useState(''), [success, setSuccess] = useState('');
  const [trunkTarget, setTrunkTarget] = useState('');
  const reload = async () => { try { assertLocalStorageReady(); const rows = await listSessions(memberId); setSessions(rows); setActiveId(current => rows.some(item => item.id === current) ? current : rows[0]?.id ?? null); return true; } catch (e) { setError(e instanceof Error ? e.message : 'Không mở được bộ nhớ local. Kiểm tra dung lượng và quyền của trình duyệt / thiết bị.'); return false; } };
  useEffect(() => { void reload(); return () => controller.current?.abort(); }, [memberId]);
  const pick = async (camera: boolean) => {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    setSuccess(''); setPicking(camera ? 'camera' : 'library'); setImportStage('Đang chọn video…');
    let copied: string | undefined;
    try {
      assertLocalStorageReady();
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Chưa có quyền camera.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['videos'], videoMaxDuration: 120, allowsEditing: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      if ((result.assets[0].duration ?? 0) > (Platform.OS === 'web' ? 120 : 120000)) throw new Error('Chọn video dài tối đa 2 phút.');
      setImportStage('Đang lưu video trên thiết bị…');
      const id = Crypto.randomUUID(); copied = await importVideo(memberId, id, result.assets[0].uri);
      setImportStage('Đang ghi phiên phân tích vào bộ nhớ local…');
      await addSession(memberId, id, copied); copied = undefined; setActiveId(id); setOpenedId(id);
      if (await reload()) setSuccess('Video đã lưu trên thiết bị. Bấm “Phân tích trên thiết bị” bên dưới để nhận kết quả.');
    } catch (e) { if (copied) await deleteVideo(memberId, copied).catch(() => undefined); setError(e instanceof Error ? e.message : 'Không nhập được video.'); }
    finally { inFlight.current = false; setBusy(false); setPicking(null); setImportStage(''); }
  };
  const analyze = async (session: LocalSession) => {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    setActiveId(session.id); setStage('Đang chuẩn bị phân tích trên thiết bị…');
    setSuccess('');
    controller.current = new AbortController(); let uri: string | undefined;
    try {
      const trunkMax = trunkTarget.trim() ? Number(trunkTarget) : null;
      if (trunkMax !== null && (!Number.isFinite(trunkMax) || trunkMax < 0 || trunkMax > 90)) throw new Error('Mục tiêu độ nghiêng thân phải từ 0 đến 90° hoặc để trống.');
      await updateSession(memberId, session.id, 'PROCESSING');
      uri = await videoUri(session.video_uri);
      const samples = await extractPose(uri, controller.current.signal, setStage);
      if (controller.current.signal.aborted) throw new Error('Đã hủy phân tích.');
      setStage('Đang nhận diện bài tập và so sánh các góc…');
      const result = analyzeAutomatically(samples, { trunkMax });
      result.explanation = { provider: 'LOCAL', feedback: autoFeedback(result) };
      if (result.status === 'COMPLETED') {
        setStage('Đang viết nhận xét AI từ các chỉ số…');
        try {
          const { data } = await api.post('/ai/form-analysis', automaticPayload(result), { signal: controller.current.signal, timeout: 30000 });
          if (data.schemaVersion !== '2.0' || data.exercise !== result.exercise || data.status !== result.status || !['OPENAI', 'LOCAL'].includes(data.provider) || !Array.isArray(data.feedback) || !data.feedback.length || data.feedback.length > 8 || data.feedback.some((line: unknown) => typeof line !== 'string' || line.length > 600)) throw new Error('Phản hồi không hợp lệ.');
          result.explanation = { provider: data.provider, feedback: data.feedback };
        } catch {
          if (controller.current.signal.aborted) throw new Error('Đã hủy phân tích.');
          result.explanation.feedback.push('Chưa kết nối được dịch vụ nhận xét AI. Kết quả đo local vẫn có sẵn; phân tích lại để thử kết nối.');
        }
      }
      if (controller.current.signal.aborted) throw new Error('Đã hủy phân tích.');
      await updateSession(memberId, session.id, 'COMPLETED', result);
    } catch (e) { await updateSession(memberId, session.id, 'FAILED').catch(() => undefined); setError(e instanceof Error ? e.message : 'Không phân tích được video.'); }
    finally { if (uri) releaseVideo(uri); controller.current = null; await reload(); inFlight.current = false; setBusy(false); setStage(''); }
  };
  const currentStep = analysisStep(sessions.find(item => item.id === activeId), !!stage);
  const remove = (session: LocalSession) => runExclusive(inFlight, async () => {
    setBusy(true); setDeletingId(session.id); setError(''); setSuccess('');
    try {
      if (!await confirmDelete()) return;
      await deleteVideo(memberId, session.video_uri); await removeSession(memberId, session.id); await reload();
    } catch { setError('Chưa xóa được phiên. Hãy thử lại.'); }
    finally { setDeletingId(null); setBusy(false); }
  });
  return <Page title="AI kiểm tra form" subtitle="Tự nhận diện bài từ video • Video chỉ lưu trên thiết bị • Hỗ trợ kiểm tra form">
    <View style={styles.row}>{['1. Video', '2. Nhận diện và phân tích', '3. Nhận xét'].map((label, index) => <Text key={label} style={{ padding: spacing.sm, borderRadius: radius.sm, color: index + 1 <= currentStep ? c.primaryPressed : c.textMuted, backgroundColor: index + 1 === currentStep ? c.surfaceMuted : c.surface, fontWeight: index + 1 === currentStep ? '600' : '400', marginBottom: spacing.xs }}>{label}</Text>)}</View>
    <Card title="Nhận diện tự động"><Label>Không cần chọn bài. Hệ thống nhận diện Squat, chống đẩy hoặc lunge từ chuyển động trong video.</Label><Label muted>Mỗi video quay một bài, thấy rõ toàn thân từ bên hông. Bài khác, video trộn nhiều bài hoặc dữ liệu chưa đủ sẽ báo chưa xác định. Nhận diện hiện dùng heuristic, chưa được kiểm chứng trên video người thật.</Label>{Platform.OS !== 'web' ? <Label muted>AI mobile cần Development Build có module phân tích góc; Expo Go không hỗ trợ.</Label> : null}</Card>
    <Card title="1. Chuẩn bị video"><Label>Quay toàn thân, đủ sáng, camera ngang bên hông. Giữ máy cố định, video tối đa 2 phút.</Label><Label muted>Sau khi chọn video, bấm “Phân tích trên thiết bị” ở phiên bên dưới. Chọn video chưa tự chạy phân tích.</Label><Button label="Quay video" pending={picking === 'camera'} disabled={busy} onPress={() => void pick(true)} /><Button secondary label="Chọn video local" pending={picking === 'library'} disabled={busy} onPress={() => void pick(false)} />{importStage ? <Text accessibilityLiveRegion="polite" style={styles.text}>{importStage}</Text> : null}{success && !opened ? <Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text> : null}</Card>
    {error && !opened ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}{stage && !opened ? <Card title="2. Đang phân tích"><Label>{stage}</Label><Button secondary label="Hủy phân tích" onPress={() => controller.current?.abort()} /></Card> : null}
    {!sessions.length && <Label muted>Chưa có phiên phân tích. Chọn hoặc quay video để bắt đầu.</Label>}
    <View>{sessions.map(session => <RecordRow key={session.id} title={exerciseLabel(session.exercise_type) + ' · ' + dateTime(session.created_at)} description={session.status === 'COMPLETED' ? 'Đã phân tích' : session.status === 'FAILED' ? 'Phân tích chưa hoàn tất' : 'Sẵn sàng phân tích'} onPress={() => { if (!busy) setOpenedId(session.id); }} />)}</View>
    {opened && <DetailModal title={exerciseLabel(opened.exercise_type) + ' · ' + dateTime(opened.created_at)} busy={busy} onClose={() => setOpenedId(null)}>
      {success && <Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text>}{error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
      {stage && <><Label>{stage}</Label><Button secondary label="Hủy phân tích" onPress={() => controller.current?.abort()} /></>}
      <Label>Mục tiêu độ nghiêng thân tối đa (°; tùy chọn theo hướng dẫn PT)</Label><TextInput accessibilityLabel="Mục tiêu độ nghiêng thân tối đa" keyboardType="numeric" value={trunkTarget} onChangeText={setTrunkTarget} editable={!busy} placeholder="Để trống nếu chưa có mục tiêu" style={styles.input} /><Label muted>Đo đoạn vai–hông so với phương thẳng đứng, không đo độ cong cột sống. Không có mục tiêu thì chỉ báo số đo.</Label>
      {!!opened.analysis_json && <>{opened.status !== 'COMPLETED' ? <Label muted>Kết quả lần phân tích trước; lần mới chưa hoàn tất.</Label> : null}<Result result={JSON.parse(opened.analysis_json)} /></>}
      <Button label="Phân tích trên thiết bị" disabled={busy} onPress={() => void analyze(opened)} />
      <Button danger label="Xóa phiên và video local" pending={deletingId === opened.id} disabled={busy} onPress={() => void remove(opened)} />
    </DetailModal>}

  </Page>;
}
function confirmDelete() {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm('Xóa phiên và video khỏi thiết bị? Hành động này không thể hoàn tác.'));
  return new Promise<boolean>(resolve => Alert.alert('Xóa video local?', 'Phiên phân tích và video trên thiết bị sẽ bị xóa.', [{ text: 'Giữ lại', style: 'cancel', onPress: () => resolve(false) }, { text: 'Xóa', style: 'destructive', onPress: () => resolve(true) }], { cancelable: true, onDismiss: () => resolve(false) }));
}
function Result({ result }: { result: StoredAnalysis }) {
  return result.schemaVersion === '2.0' ? <AutoResult result={result} /> : <LegacyResult result={result} />;
}
function AutoResult({ result }: { result: AutoAnalysis }) {
  const [showDetails, setShowDetails] = useState(false);
  return <Card title="Nhận xét"><Label>Bài được nhận diện: {exerciseLabel(result.exercise)}</Label><Label>Số lần hoàn chỉnh: {result.reps}</Label>
    <Label muted>{result.explanation?.provider === 'OPENAI' ? 'Nhận xét AI từ chỉ số đo trên thiết bị' : 'Nhận xét từ thuật toán local; chưa sử dụng OpenAI'}</Label>
    {(result.explanation?.feedback ?? autoFeedback(result)).map((line, i) => <Label key={i}>{line}</Label>)}
    <Label muted>Tỷ lệ mẫu đủ rõ: {Math.round(result.metrics.detectedRatio * 100)}%. Độ phủ không phản ánh độ chính xác của góc đo.</Label>
    {result.perRep.length ? <Button secondary label={showDetails ? 'Ẩn so sánh từng lần' : 'Xem góc và so sánh từng lần'} onPress={() => setShowDetails(value => !value)} /> : null}
    <View>{showDetails && result.perRep.map(rep => <PopupRow key={rep.index} title={'Lần ' + rep.index + ' · điểm thấp nhất ' + rep.timeSeconds + ' giây'}>
      {autoComparisons(result, rep).map(row => <View key={row.label} style={styles.listRow}><Label>{row.label}: {row.value === null ? 'Không đo được' : Math.round(row.value) + '°'}</Label><Label>{row.verdict}</Label><Label muted>Tham chiếu: {row.reference}</Label>{row.advice ? <Label>{row.advice}</Label> : null}</View>)}
    </PopupRow>)}</View>
  </Card>;
}
function LegacyResult({ result }: { result: Analysis }) {
  const [feedback, setFeedback] = useState(''), [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  return <Card title="Kết quả"><Label>Số lần được nhận diện: {result.reps}</Label><Label>{localFeedback(result)}</Label><Label muted>Tỷ lệ mẫu nhận diện đủ rõ: {Math.round(result.metrics.detectedRatio * 100)}%. Đây là độ phủ nhận diện, không phải độ chính xác của góc đo.</Label>
    {result.detail ? <>
      <Label muted>So sánh theo Squat không tạ, hai tay đưa trước. Góc 2D phụ thuộc góc quay. Chưa đánh giá đầu gối lệch vào trong, độ cong lưng hoặc hướng tay ra trước/sau.</Label>
      {result.detail.repetitions.length ? <Button secondary label={showDetails ? 'Ẩn so sánh từng lần' : 'Xem góc và so sánh từng lần'} onPress={() => setShowDetails(value => !value)} /> : <Label muted>Chưa có lần hoàn chỉnh để so sánh góc.</Label>}
      <View>{showDetails && result.detail.repetitions.map(rep => <PopupRow key={rep.index} title={'Lần ' + rep.index + ' · điểm thấp nhất ' + (rep.bottomTimeMs / 1000).toFixed(1) + ' giây'}>
        <Label>Góc gối dùng đếm lần: {Math.round(rep.kneeAngle)}°</Label>
        {rep.angles ? compareAngles(rep.angles, result.detail!.reference).map(row => <View key={row.label} style={styles.listRow}><Label>{row.label}: {row.value === null ? 'Không đo được' : Math.round(row.value) + '°'}</Label><Label>{row.verdict}</Label><Label muted>Tham chiếu: {row.reference}</Label>{row.advice ? <Label>{row.advice}</Label> : null}</View>) : <Label muted>Không có số đo chi tiết tại thời điểm này.</Label>}
      </PopupRow>)}</View>
    </> : <Label muted>Phiên này chỉ có kết quả độ sâu. Phân tích lại video để lấy các góc chi tiết. Trên mobile cần bản cài Development Build mới.</Label>}
    {feedback ? <Label>{feedback}</Label> : null}
    <Button secondary label="Giải thích độ sâu từ dịch vụ (chỉ gửi chỉ số)" pending={loading} onPress={() => { void (async () => { setLoading(true); try { const { data } = await api.post('/ai/form-analysis', explanationPayload(result)); setFeedback(data.feedback.join(' ')); } catch { setFeedback('Chưa kết nối được dịch vụ. Bạn vẫn xem được kết quả local.'); } finally { setLoading(false); } })(); }} />
  </Card>;
}
