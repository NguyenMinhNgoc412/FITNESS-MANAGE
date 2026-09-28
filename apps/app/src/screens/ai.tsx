import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { api } from '../api';
import { colors as c, radius, spacing } from '../design-system/theme';
import { Button, Card, Label, Page, dateTime, styles } from '../ui';
import { useAuthStore } from '../store/auth';
import { analyzeSquat, Analysis, localFeedback } from '../features/ai-analysis/algorithm';
import { extractPose } from '../features/ai-analysis/pose';
import { deleteVideo, importVideo, releaseVideo, videoUri } from '../features/ai-analysis/files';
import { addSession, listSessions, LocalSession, removeSession, updateSession } from '../features/ai-analysis/storage';
export default function Ai() {
  const memberId = useAuthStore(s => s.session!.user.id), [sessions, setSessions] = useState<LocalSession[]>([]), [error, setError] = useState(''), [stage, setStage] = useState(''), [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null), inFlight = useRef(false);
  const reload = async () => { try { setSessions(await listSessions(memberId)); } catch { setError('Không mở được bộ nhớ local. Kiểm tra dung lượng và quyền của trình duyệt / thiết bị.'); } };
  useEffect(() => { void reload(); return () => controller.current?.abort(); }, [memberId]);
  const pick = async (camera: boolean) => {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    let copied: string | undefined;
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Chưa có quyền camera.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['videos'], videoMaxDuration: 120, allowsEditing: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      if ((result.assets[0].duration ?? 0) > 120000) throw new Error('Chọn video dài tối đa 2 phút.');
      const id = Crypto.randomUUID(); copied = await importVideo(memberId, id, result.assets[0].uri);
      await addSession(memberId, id, copied); copied = undefined; await reload();
    } catch (e) { if (copied) await deleteVideo(memberId, copied).catch(() => undefined); setError(e instanceof Error ? e.message : 'Không nhập được video.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const analyze = async (session: LocalSession) => {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    controller.current = new AbortController(); let uri: string | undefined;
    try {
      await updateSession(memberId, session.id, 'PROCESSING');
      uri = await videoUri(session.video_uri);
      const samples = await extractPose(uri, controller.current.signal, setStage);
      if (controller.current.signal.aborted) throw new Error('Đã hủy phân tích.');
      await updateSession(memberId, session.id, 'COMPLETED', analyzeSquat(samples));
    } catch (e) { await updateSession(memberId, session.id, 'FAILED').catch(() => undefined); setError(e instanceof Error ? e.message : 'Không phân tích được video.'); }
    finally { if (uri) releaseVideo(uri); controller.current = null; inFlight.current = false; setBusy(false); setStage(''); await reload(); }
  };
  const currentStep = stage ? 3 : sessions.some(item => item.analysis_json) ? 4 : sessions.length ? 2 : 1;
  const remove = async (session: LocalSession) => {
    if (!await confirmDelete()) return;
    try { await deleteVideo(memberId, session.video_uri); await removeSession(memberId, session.id); await reload(); }
    catch { setError('Chưa xóa được phiên. Hãy thử lại.'); }
  };
  return <Page title="AI kiểm tra form" subtitle="Squat • Video chỉ lưu trên thiết bị • Không thay thế hướng dẫn của PT">
    <View style={styles.row}>{['1. Chọn bài', '2. Video', '3. Phân tích', '4. Kết quả'].map((label, index) => <Text key={label} style={{ padding: spacing.sm, borderRadius: radius.sm, color: index + 1 <= currentStep ? c.primaryPressed : c.textMuted, backgroundColor: index + 1 === currentStep ? c.surfaceMuted : c.surface, fontWeight: index + 1 === currentStep ? '600' : '400', marginBottom: spacing.xs }}>{label}</Text>)}</View>
    <Card title="1. Bài tập"><Label>Squat — kiểm tra độ sâu</Label><Label muted>Phiên bản hiện tại chỉ đánh giá lỗi độ sâu đã được kiểm thử.</Label></Card>
    <Card title="2. Chuẩn bị video"><Label>Quay toàn thân, đủ sáng, camera ngang bên hông. Giữ máy cố định, video tối đa 2 phút.</Label><Button label="Quay video" disabled={busy} onPress={() => void pick(true)} /><Button secondary label="Chọn video local" disabled={busy} onPress={() => void pick(false)} /></Card>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}{stage ? <Card title="3. Đang phân tích"><Label>{stage}</Label><Button secondary label="Hủy phân tích" onPress={() => controller.current?.abort()} /></Card> : null}
    {!sessions.length && <Label muted>Chưa có phiên phân tích. Chọn hoặc quay video để bắt đầu.</Label>}
    {sessions.map(session => <Card key={session.id} title={'Squat · ' + dateTime(session.created_at)}><Label muted>{session.status === 'COMPLETED' ? 'Đã phân tích' : session.status === 'FAILED' ? 'Phân tích chưa hoàn tất' : 'Sẵn sàng phân tích'}</Label>
      {session.analysis_json && <Result result={JSON.parse(session.analysis_json)} />}
      <Button label="Phân tích trên thiết bị" disabled={busy} onPress={() => void analyze(session)} />
      <Button danger label="Xóa phiên và video local" disabled={busy} onPress={() => void remove(session)} />
    </Card>)}
  </Page>;
}
function confirmDelete() {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm('Xóa phiên và video khỏi thiết bị? Hành động này không thể hoàn tác.'));
  return new Promise<boolean>(resolve => Alert.alert('Xóa video local?', 'Phiên phân tích và video trên thiết bị sẽ bị xóa.', [{ text: 'Giữ lại', style: 'cancel', onPress: () => resolve(false) }, { text: 'Xóa', style: 'destructive', onPress: () => resolve(true) }], { cancelable: true, onDismiss: () => resolve(false) }));
}
function Result({ result }: { result: Analysis }) {
  const [feedback, setFeedback] = useState(''), [loading, setLoading] = useState(false);
  return <Card title="Kết quả"><Label>Số lần được nhận diện: {result.reps}</Label><Label>{localFeedback(result)}</Label><Label muted>Chỉ kiểm tra độ sâu squat. Chưa đánh giá đầu gối lệch vào trong hoặc độ ổn định thân người.</Label>
    {feedback ? <Label>{feedback}</Label> : null}
    <Button secondary label="Lấy giải thích từ dịch vụ (chỉ gửi chỉ số)" pending={loading} onPress={() => { void (async () => { setLoading(true); try { const { data } = await api.post('/ai/form-analysis', result); setFeedback(data.feedback.join(' ')); } catch { setFeedback('Chưa kết nối được dịch vụ. Bạn vẫn xem được kết quả local.'); } finally { setLoading(false); } })(); }} />
  </Card>;
}
