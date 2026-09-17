import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../src/api';
import { AppButton, AppInput, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';
import { GuardFallback, useRoleGuard } from '../src/use-role-guard';

type Source = { label: string; route: '/people' | '/schedules' | '/operations' };
type AssistantReply = { answer: string; scope: { label: string }; sources: Source[]; generatedAt: string };
type Message = { id: string; type: 'question' | 'answer'; text: string; reply?: AssistantReply };

const suggestions = ['Tổng quan vận hành hiện tại?', 'Có check-in nào cần đối soát?', 'Có bao nhiêu Guest chưa chuyển đổi?', 'Tình hình Member và PT thế nào?'];

export default function OwnerAssistant() {
  const allowed = useRoleGuard('OWNER_ADMIN');
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (nextQuestion = question) => {
    const text = nextQuestion.trim();
    if (!text || loading) return;
    setQuestion(''); setError(''); setLoading(true);
    setMessages((current) => [...current, { id: `question-${Date.now()}`, type: 'question', text }]);
    try {
      const { data } = await api.post<AssistantReply>('/owner-assistant/questions', { question: text });
      setMessages((current) => [...current, { id: `answer-${Date.now()}`, type: 'answer', text: data.answer, reply: data }]);
    } catch {
      setError('Không thể lấy tóm tắt vận hành. Hãy thử lại khi kết nối API sẵn sàng.');
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) return <GuardFallback />;
  return <Screen title="Trợ lý AI vận hành" subtitle="Hỏi nhanh dữ liệu hiện tại. Trợ lý chỉ đọc và không tự thay đổi nghiệp vụ." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />} keyboardAware>
    <Card style={styles.notice}><Text style={styles.noticeTitle}>Phạm vi an toàn</Text><Text style={styles.noticeText}>Câu trả lời dựa trên dữ liệu vận hành hiện tại và có đường dẫn về màn hình nguồn. Không dùng để chẩn đoán y khoa hoặc thay đổi assignment, lịch và check-in.</Text></Card>
    {messages.length === 0 ? <View style={styles.suggestions}><Text style={styles.label}>Gợi ý câu hỏi</Text>{suggestions.map((item) => <AppButton key={item} label={item} variant="secondary" disabled={loading} onPress={() => void ask(item)} />)}</View> : null}
    <View style={styles.messages}>{messages.map((message) => <View key={message.id} style={[styles.message, message.type === 'question' ? styles.question : styles.answer]}><Text style={message.type === 'question' ? styles.questionText : styles.answerText}>{message.text}</Text>{message.reply ? <><Text style={styles.scope}>{message.reply.scope.label}</Text><View style={styles.sourceRow}>{message.reply.sources.map((source) => <AppButton key={source.route} label={source.label} variant="secondary" onPress={() => router.push(source.route)} style={styles.sourceButton} />)}</View></> : null}</View>)}</View>
    {loading ? <Feedback message="Đang tổng hợp dữ liệu vận hành..." /> : null}
    {error ? <Feedback tone="error" message={error} /> : null}
    <Card><AppInput label="Câu hỏi vận hành" value={question} onChangeText={setQuestion} placeholder="Ví dụ: Có check-in nào cần đối soát?" multiline numberOfLines={3} maxLength={500} style={styles.input} /><AppButton label="Gửi câu hỏi" loading={loading} disabled={question.trim().length < 2} onPress={() => void ask()} /></Card>
  </Screen>;
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.violetSurface, borderColor: '#D9D2FF' }, noticeTitle: { ...typography.heading, color: colors.text }, noticeText: { ...typography.caption, color: colors.textMuted }, suggestions: { gap: spacing.sm }, label: { ...typography.label, color: colors.textMuted }, messages: { gap: spacing.sm }, message: { borderRadius: 16, padding: spacing.md, gap: spacing.sm, maxWidth: '100%' }, question: { alignSelf: 'flex-end', backgroundColor: colors.primary, maxWidth: '85%' }, answer: { alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, questionText: { ...typography.body, color: colors.onPrimary }, answerText: { ...typography.body, color: colors.text }, scope: { ...typography.caption, color: colors.textMuted }, sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, sourceButton: { flexGrow: 1, paddingHorizontal: spacing.sm }, input: { minHeight: 94, textAlignVertical: 'top' },
});
