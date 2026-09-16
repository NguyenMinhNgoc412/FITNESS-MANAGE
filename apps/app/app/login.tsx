import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { z } from 'zod';
import { api } from '../src/api';
import { AppButton, AppInput, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';
import { roleRoute, sessionSchema } from '../src/features/auth/types';
import { useAuthStore } from '../src/store/auth';
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

type LoginForm = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });
  const submit = async (values: LoginForm) => {
    const input = schema.safeParse(values);
    if (!input.success) {
      for (const issue of input.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') setError(field, { message: field === 'email' ? 'Email không hợp lệ.' : 'Mật khẩu phải có ít nhất 8 ký tự.' });
      }
      return;
    }
    try {
      const { data } = await api.post('/auth/login', input.data);
      const session = sessionSchema.parse(data);
      await setSession(session);
      router.replace(roleRoute(session.user.role));
    } catch {
      setError('root', { message: 'Không thể đăng nhập. Vui lòng kiểm tra thông tin tài khoản.' });
    }
  };
  return (
    <Screen keyboardAware>
      <Text style={styles.brand}>FITNESS-MANAGE</Text>
      <Text style={styles.intro}>Đăng nhập để truy cập đúng khu vực Owner/Admin, PT hoặc Member.</Text>
      <Card>
        <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
          <AppInput label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} returnKeyType="next" />
        )} />
        <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
          <AppInput label="Mật khẩu" autoCapitalize="none" autoComplete="current-password" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} error={errors.password?.message} returnKeyType="done" onSubmitEditing={() => void handleSubmit(submit)()} />
        )} />
        <Feedback tone="error" message={errors.root?.message ?? ''} />
        <AppButton label="Đăng nhập" loading={isSubmitting} onPress={() => void handleSubmit(submit)()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.display, color: colors.primary, marginTop: spacing.xxl },
  intro: { ...typography.body, color: colors.textMuted },
});
