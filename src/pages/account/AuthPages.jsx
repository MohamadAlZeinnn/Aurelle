import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Checkbox, Field, Input, Notice } from '../../components/ui/index.js';
import { PhoneInput } from '../../components/account/AddressFields.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { toast } from '../../stores/uiStores.js';
import { authService } from '../../services/index.js';
import { forgotPasswordSchema, loginSchema, passwordSchema, registerSchema } from '../../lib/validation.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { IS_DEMO } from '../../config/env.js';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="container-page grid min-h-[70vh] items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
      <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
        <h1 className="font-display text-[2.4rem] leading-tight sm:text-[2.8rem]">{title}</h1>
        {subtitle && <p className="mt-3 text-[15px] text-espresso-soft">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-line pt-6 text-[14px] text-espresso-soft">{footer}</div>}
      </div>
      <div className="hidden lg:block">
        <img src="/images/editorial/story.svg" alt="" width="900" height="1200" className="aspect-[4/5] w-full max-w-lg bg-linen object-cover" />
      </div>
    </div>
  );
}

export const PasswordInput = ({ inputRef, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={inputRef} type={show ? 'text' : 'password'} className="pr-12" {...props} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-taupe hover:text-espresso" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
};

/** Wraps register() so the ref reaches the inner input of PasswordInput. */
export const passwordProps = (register, name) => {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
};

export function LoginPage() {
  usePageMeta({ title: 'Sign in', noindex: true });
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}`);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  const fillDemo = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle={location.state?.adminHint ? 'Sign in with an administrator account to open the dashboard.' : 'Track orders, save addresses and check out faster.'}
      footer={
        <>
          New to LUMA?{' '}
          <Link to="/register" state={location.state} className="link-underline text-espresso">
            Create an account
          </Link>
          <span className="mt-2 block">
            Ordering without an account?{' '}
            <Link to="/checkout" className="link-underline text-espresso">
              Continue as a guest
            </Link>
          </span>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...passwordProps(register, 'password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[13px] link-underline">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      {IS_DEMO && (
        <div className="mt-8 border border-dashed border-line-strong p-4 text-[13px]">
          <p className="font-medium">Demo accounts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => fillDemo('layla@example.com', 'Luma2026!')}>
              Customer
            </button>
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => fillDemo('admin@lumabeauty.demo', 'Admin2026!')}>
              Administrator
            </button>
          </div>
          <p className="mt-2 text-taupe">Fills the form with demo credentials. These accounts exist only in this browser.</p>
        </div>
      )}
    </AuthShell>
  );
}

export function RegisterPage() {
  usePageMeta({ title: 'Create an account', noindex: true });
  const registerUser = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { marketingOptIn: false } });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const user = await registerUser(values);
      toast.success(`Welcome to LUMA, ${user.fullName.split(' ')[0]}`);
      navigate(location.state?.from || '/account', { replace: true });
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setFieldError(k, { message }));
      setError(e.message);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      subtitle="Save your addresses, follow your orders and keep your wishlist in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="link-underline text-espresso">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Mobile number" error={errors.phone?.message}>
          <PhoneInput {...register('phone')} />
        </Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...passwordProps(register, 'password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...passwordProps(register, 'confirmPassword')} />
        </Field>
        <Checkbox label="Send me the monthly LUMA letter" description="New arrivals and rituals. Unsubscribe anytime." {...register('marketingOptIn')} />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  usePageMeta({ title: 'Reset your password', noindex: true });
  const [result, setResult] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit = async ({ email }) => setResult(await authService.forgotPassword(email).catch((e) => ({ error: e.message })));

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we will send you a link to choose a new one." footer={<Link to="/login" className="link-underline text-espresso">Back to sign in</Link>}>
      {result && !result.error ? (
        <div className="space-y-4">
          <Notice tone="success" title="Check your inbox">
            If an account exists for that email, you will receive a reset link shortly. The link expires in one hour.
          </Notice>
          {IS_DEMO && result.demoResetToken && (
            <Notice tone="info" title="Demo mode">
              No email is sent in the demo.{' '}
              <Link to={`/reset-password?token=${result.demoResetToken}`} className="link-underline">
                Open the reset link
              </Link>
            </Notice>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {result?.error && <Notice tone="error">{result.error}</Notice>}
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Button type="submit" size="lg" block loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

const resetSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

export function ResetPasswordPage() {
  usePageMeta({ title: 'Choose a new password', noindex: true });
  const [params] = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) });
  const onSubmit = async ({ password }) => {
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <AuthShell title="Choose a new password">
      {!token ? (
        <Notice tone="error">
          This reset link is incomplete.{' '}
          <Link to="/forgot-password" className="link-underline">
            Request a new link
          </Link>
          .
        </Notice>
      ) : done ? (
        <div className="space-y-5">
          <Notice tone="success">Your password has been updated. Please sign in with your new password.</Notice>
          <Button to="/login">Sign in</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="New password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message}>
            <PasswordInput autoComplete="new-password" {...passwordProps(register, 'password')} />
          </Field>
          <Field label="Confirm new password" error={errors.confirmPassword?.message}>
            <PasswordInput autoComplete="new-password" {...passwordProps(register, 'confirmPassword')} />
          </Field>
          <Button type="submit" size="lg" block loading={isSubmitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
