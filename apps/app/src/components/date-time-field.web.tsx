import { colors as c, controlSize, radius, spacing, typography } from '../design-system/theme';

export default function DateTimeField({ label, value, onChange, onBlur, disabled, mode = 'datetime' }: { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; disabled: boolean; mode?: 'date' | 'datetime' }) {
  const open = (input: HTMLInputElement) => { if (!disabled) { try { input.showPicker?.(); } catch { /* Browser retains its built-in picker control. */ } } };
  return <input aria-label={label} type={mode === 'date' ? 'date' : 'datetime-local'} value={value.replace(' ', 'T')} disabled={disabled} onChange={event => onChange(event.target.value.replace('T', ' '))} onBlur={onBlur}
    onClick={event => open(event.currentTarget)} onPaste={event => event.preventDefault()}
    onKeyDown={event => { if (event.key === 'Tab') return; event.preventDefault(); if (event.key === 'Enter' || event.key === ' ') open(event.currentTarget); }}
    style={{ minHeight: controlSize.touch, width: '100%', boxSizing: 'border-box', padding: spacing.md, border: `1px solid ${c.border}`, borderRadius: radius.md, color: c.text, backgroundColor: c.surface, fontSize: typography.body.fontSize, fontFamily: 'inherit', opacity: disabled ? 0.55 : 1 }} />;
}
