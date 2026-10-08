import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Building2, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { authClient } from '../shared-logic/auth-client';
import './department-auth.css';

type Props = { onClose: () => void; notify: (message: string) => void; passwordReady: boolean };

export default function DepartmentAuth({ onClose, notify, passwordReady }: Props) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const working = useRef(busy); working.current = busy;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !working.current) close.current();
      if (event.key !== 'Tab') return;
      const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]') || [])];
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { alive.current = false; window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || !passwordReady) return;
    const loginId = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._]{2,39}$/.test(loginId)) { setError('Use 3–40 lowercase letters, numbers, dots, or underscores. Start with a letter or number.'); return; }
    if (mode === 'register' && (password.length < 12 || password.length > 128)) { setError('Choose a password with 12–128 characters.'); return; }
    if (mode === 'register' && !name.trim()) { setError('Add a display name.'); return; }
    setBusy(true); setError(''); setInfo('');
    try {
      const result = mode === 'register'
        ? await authClient.signUp.email({ email: email.trim(), name: name.trim(), username: loginId, password })
        : await authClient.signIn.username({ username: loginId, password });
      if (!alive.current) return;
      if (result.error) { setError(mode === 'register' ? 'Could not create the account. Check your details, or use a different login ID.' : 'Could not sign in. Check your login ID and password, then try again.'); return; }
      setPassword('');
      if (mode === 'register' && !result.data?.token) { setMode('signin'); setInfo('Account created. Sign in with your login ID and password.'); return; }
      notify('Signed in. Loading your shared workspace.'); onClose();
    } catch { if (alive.current) setError('The sign-in service is unavailable. Please try again.'); }
    finally { if (alive.current) setBusy(false); }
  }
  return createPortal(<div className="dauth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section className="dauth-dialog" role="dialog" aria-modal="true" aria-labelledby="department-auth-title" tabIndex={-1} ref={dialog}>
    <button className="dauth-close" aria-label="Close sign-in" disabled={busy} onClick={onClose}><X size={19}/></button>
    <div className="dauth-mark"><Building2 size={26}/></div><span className="dauth-eyebrow">ONE APP. YOUR TEAM.</span>
    <h2 id="department-auth-title">{mode === 'signin' ? 'Your work, together.' : 'Make room for your expertise.'}</h2>
    <p className="dauth-intro">{mode === 'signin' ? 'Sign in with your own login ID. Your workspace owner assigns your department and app access.' : 'Create your own account, then share your login ID with your workspace owner to join a department.'}</p>
    <div className="dauth-tabs" role="tablist" aria-label="Department authentication"><button role="tab" aria-selected={mode === 'signin'} disabled={busy} onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>Sign in</button><button role="tab" aria-selected={mode === 'register'} disabled={busy} onClick={() => { setMode('register'); setError(''); setInfo(''); }}>Create account</button></div>
    {!passwordReady && <div className="dauth-status"><LockKeyhole size={16}/><span>Password sign-in is not enabled on this backend yet. No account will be created until setup is complete.</span></div>}
    <form onSubmit={(event) => void submit(event)}>
      {mode === 'register' && <><label>Display name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required disabled={busy} placeholder="Your name"/></label><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required disabled={busy} placeholder="you@company.com"/></label></>}
      <label>Login ID<input autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={40} required disabled={busy} placeholder="alex.support" aria-describedby="department-login-help"/></label>
      <p className="dauth-hint" id="department-login-help">3–40 letters, numbers, dots, or underscores. Your department is assigned separately.</p>
      <label>Password<span className="dauth-password"><input type={visible ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === 'register' ? 12 : undefined} maxLength={128} required disabled={busy}/><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} disabled={busy} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
      {mode === 'register' && <p className="dauth-hint">Use 12–128 characters. Email ownership is not verified in this prototype.</p>}
      {error && <p className="dauth-error" role="alert">{error}</p>}{info && <p className="dauth-info" role="status">{info}</p>}
      <button className="dauth-submit" disabled={busy || !passwordReady || !username.trim() || !password} type="submit">{busy ? <LoaderCircle size={16} className="dauth-spin"/> : <ArrowRight size={16}/>} {busy ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in to workspace'}</button>
    </form>
    <p className="dauth-footer"><ShieldCheck size={14}/>Accounts and app permissions are checked by the backend. Agent builds and execution remain simulated.</p>
  </section></div>, document.body);
}
