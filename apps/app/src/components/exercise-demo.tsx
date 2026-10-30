import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Image, Linking, Text, View } from 'react-native';
import { colors, radius, spacing } from '../design-system/theme';
import { exerciseDemos } from '../features/exercise-demos';
import { CatalogDetail } from '../features/workouts';
import { Button, Feedback, Label, styles } from '../ui';

export function ExerciseDemo({ item }: { item: CatalogDetail }) {
  const candidate = item.code ? exerciseDemos[item.code] : undefined;
  const demo = candidate?.nameEn === item.nameEn && candidate.catalogVersion === item.contentVersion ? candidate : undefined;
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false), [active, setActive] = useState(AppState.currentState === 'active');
  const [loaded, setLoaded] = useState<number[]>([]), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const [sources, setSources] = useState(false), [linkError, setLinkError] = useState('');
  const count = demo?.frames.length ?? 0, ready = count > 0 && loaded.length === count && !failed;
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (mounted) setPlaying(!reduced); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => { if (reduced) setPlaying(false); });
    const app = AppState.addEventListener('change', state => { setActive(state === 'active'); if (state !== 'active') setPlaying(false); });
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (!playing || !ready || !active) return;
    const timer = setInterval(() => setFrame(previous => (previous + 1) % count), demo!.intervalMs);
    return () => clearInterval(timer);
  }, [playing, ready, active, count, demo]);
  const step = (direction: number) => { setPlaying(false); setFrame(previous => (previous + direction + count) % count); };
  const open = (url: string) => { setLinkError(''); void Linking.openURL(url).catch(() => setLinkError('Không mở được nguồn tham khảo.')); };
  return <View style={{ gap: spacing.sm }}>
    <Text accessibilityRole="header" style={styles.heading}>Minh họa động tác</Text>
    {demo ? <>
      {!failed && <><View accessibilityRole="image" accessibilityLabel={item.nameVi + ' · khung ' + (frame + 1) + '/' + count} testID="exercise-demo-image" style={{ width: '100%', aspectRatio: 4 / 3, maxHeight: 320, borderRadius: radius.md, overflow: 'hidden', backgroundColor: demo.darkBackground ? colors.text : colors.surfaceMuted }}>
        {demo.frames.map((source, index) => <Image key={retry + ':' + index} accessible={false} source={source} resizeMode="contain" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: index === frame ? 1 : 0 }} onLoad={() => setLoaded(previous => previous.includes(index) ? previous : [...previous, index])} onError={() => { setFailed(true); setPlaying(false); }} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 1 }}><Button secondary label="Trước" disabled={!ready} onPress={() => step(-1)} /></View><View style={{ flex: 1.5 }}><Button label={playing && active && ready ? 'Tạm dừng' : 'Phát'} disabled={!ready} onPress={() => setPlaying(value => !value)} /></View><View style={{ flex: 1 }}><Button secondary label="Sau" disabled={!ready} onPress={() => step(1)} /></View></View>
      </>}
      {failed ? <><Feedback message="Chưa tải được ảnh minh họa. Bạn vẫn có thể đọc hướng dẫn bên dưới." /><Button secondary label="Tải lại minh họa" onPress={() => { setLoaded([]); setFailed(false); setFrame(0); setRetry(value => value + 1); }} /></> : <Label muted>{ready ? 'Khung ' + (frame + 1) + '/' + count + ' · Các vị trí chính của động tác' : 'Đang tải minh họa…'}</Label>}
      {demo.note && <Label muted>{demo.note}</Label>}
    </> : <Label muted>Chưa có minh họa phù hợp cho phiên bản bài này. Xem hướng dẫn bên dưới.</Label>}
    <Button secondary label="Nguồn và giấy phép" expanded={sources} onPress={() => setSources(value => !value)} />
    {sources && <View style={{ gap: spacing.sm }}>
      {demo && <><Label muted>Ảnh: {demo.credit} · {demo.license}. Tác giả không bảo trợ ứng dụng.</Label><Button secondary label="Nguồn ảnh minh họa" onPress={() => open(demo.sourceUrl)} /><Button secondary label={'Giấy phép: ' + demo.license} onPress={() => open(demo.licenseUrl)} /></>}
      {item.sourceUrls.map(url => <Button key={url} secondary label={'Nguồn hướng dẫn: ' + new URL(url).hostname} onPress={() => open(url)} />)}
      <Feedback message={linkError} />
    </View>}
  </View>;
}
