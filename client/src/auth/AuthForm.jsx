import { useState } from 'react';
import { Braces } from 'lucide-react';

import Field from '../components/ui/Field.jsx';
import { useAuth } from './AuthProvider.jsx';

export default function AuthForm() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('login'); // login | register
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const update = (key) => (event) => setFields({ ...fields, [key]: event.target.value });

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (isRegister) await signUp(fields);
      else await signIn({ email: fields.email, password: fields.password });
      // On success the whole page swaps to the workspace, so there's nothing to do here.
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
        <Braces size={19} strokeWidth={2.5} className="text-accent-fg" />
      </div>

      <h1 className="mt-6 text-xl font-semibold tracking-tight">
        {isRegister ? 'Create your account' : 'Sign in'}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {isRegister
          ? 'You need an account to open a private room and invite people into it.'
          : 'Welcome back. Your rooms are where you left them.'}
      </p>

      <div className="mt-7 flex flex-col gap-4">
        {isRegister && (
          <Field
            label="Username"
            name="username"
            autoComplete="username"
            placeholder="harshit"
            value={fields.username}
            onChange={update('username')}
            required
          />
        )}

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={fields.email}
          onChange={update('email')}
          required
        />

        <Field
          label="Password"
          hint={isRegister ? '8 characters or more' : undefined}
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          value={fields.password}
          onChange={update('password')}
          required
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'One moment…' : isRegister ? 'Create account' : 'Sign in'}
      </button>

      <p className="mt-5 text-center text-xs text-muted">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="rounded font-medium text-accent-text underline-offset-2 hover:underline"
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </form>
  );
}
