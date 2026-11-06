'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getAuthClient } from './client';
import { Link } from '../router';
import { playerDestination } from './playerDestination';

type Mode = 'login' | 'signup' | 'reset';
export function SignInModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node?.showModal();
    heading.current?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  function switchMode(next: Mode) {
    setMode(next); setPassword(''); setShowPassword(false); setMessage(''); setError('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const auth = getAuthClient().auth;
      if (mode === 'signup') {
        const { data, error } = await auth.signUp({ email: email.trim(), password, options: {
          data: { name: name.trim() }, emailRedirectTo: location.origin + '/account',
        } });
        if (error) throw error;
        setPassword('');
        if (data.session) { const destination=await playerDestination(data.session.user.id); onClose(); router.push(destination); }
        else setMessage('Check your email to confirm your account, then sign in.');
      } else if (mode === 'login') {
        const { data, error } = await auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        const destination=await playerDestination(data.user.id);
        setPassword(''); onClose(); router.push(destination);
      } else {
        const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + '/account?mode=recovery' });
        if (error) throw error;
        setMessage('If an account exists for that email, you’ll receive a password reset link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue. Please try again.');
    } finally { setBusy(false); }
  }

  return createPortal(<dialog ref={dialog} className="sailor-dialog" aria-labelledby="sailor-title" aria-describedby="sailor-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="sailor-paper">
      <button className="sailor-close" type="button" aria-label="Close sign-in popup" onClick={onClose}>×</button>
      <p className="sailor-eyebrow">The gates to the Grand Line</p>
      <h2 id="sailor-title" ref={heading} tabIndex={-1}>{mode === 'reset' ? 'Find your way aboard' : 'Welcome aboard, sailor'}</h2>
      <p id="sailor-description" className="sailor-description">{mode === 'reset' ? 'We’ll send you a link to reset your password.' : 'Every legendary journey begins with a name.'}</p>
      {loading ? <p role="status" className="sailor-feedback">Loading your account…</p> : user ?
        <div className="sailor-form-shell sailor-signed-in">
          <p>You’re signed in and ready to set sail.</p>
          <Link className="sailor-primary" href="/dashboard" onClick={onClose}>Continue to Dashboard <span aria-hidden="true">→</span></Link>
          <Link className="sailor-secondary" href="/account" onClick={onClose}>Manage My Account</Link>
        </div> : <>
        {mode !== 'reset' && <div className="sailor-tabs" aria-label="Sign-in options">
          <button type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => switchMode('login')}>Sign In</button>
          <button type="button" aria-pressed={mode === 'signup'} disabled={busy} onClick={() => switchMode('signup')}>Create Account</button>
        </div>}
        <div className="sailor-form-shell">
          <form onSubmit={submit} aria-label={mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in'} aria-busy={busy}>
            {mode === 'signup' && <label className="sailor-field"><FieldIcon kind="name"/><span className="sailor-sr-only">Pirate name</span><input required autoComplete="nickname" placeholder="Pirate Name" maxLength={32} value={name} disabled={busy} onChange={e => setName(e.target.value)}/></label>}
            <label className="sailor-field"><FieldIcon kind="email"/><span className="sailor-sr-only">Email address</span><input required type="email" autoComplete="email" placeholder="Email Address" value={email} disabled={busy} onChange={e => setEmail(e.target.value)}/></label>
            {mode !== 'reset' && <div className="sailor-field sailor-password"><FieldIcon kind="lock"/>
              <label className="sailor-sr-only" htmlFor="sailor-password">Password</label><input id="sailor-password" required type={showPassword ? 'text' : 'password'} minLength={mode === 'signup' ? 8 : 1} maxLength={128} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="Password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)}/>
              <button type="button" className="sailor-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><FieldIcon kind="eye"/>{showPassword && <span className="sailor-eye-slash"/>}</button>
            </div>}
            {mode === 'signup' && <p className="sailor-password-hint">Use at least 8 characters.</p>}
            <button className="sailor-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create Account & Continue' : mode === 'reset' ? 'Send Reset Link' : 'Sign In & Continue'} <span aria-hidden="true">→</span></button>
          </form>
          {message && <p className="sailor-feedback" role="status">{message}</p>}
          {error && <p className="sailor-feedback sailor-feedback--error" role="alert">{error}</p>}
          {mode !== 'reset' && <><div className="sailor-divider"><span/>OR<span/></div><button className="sailor-secondary" type="button" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create a New Account' : 'I Already Have an Account'}</button></>}
          <button className="sailor-reset" type="button" disabled={busy} onClick={() => switchMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? 'Back to Sign In' : 'Forgot your password?'}</button>
        </div>
      </>}
    </section>
  </dialog>, document.body);
}

function FieldIcon({ kind }: { kind: 'email' | 'lock' | 'eye' | 'name' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'email' ? <><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 6 8 7 8-7"/></> : kind === 'lock' ? <><rect x="5" y="10" width="14" height="12" rx="2" fill="currentColor"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/><path d="M12 15v3" stroke="#f4dfb6"/></> : kind === 'eye' ? <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></> : <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>}
  </svg>;
}
