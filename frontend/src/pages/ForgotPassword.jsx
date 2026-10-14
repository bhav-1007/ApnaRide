import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../layouts/Shell';
import { Notice } from '../components/ui';
import { authService as auth, errorMessage } from '../services';

export default function ForgotPassword({ role }) {
  const slug = role === 'captain' ? 'captain' : 'rider';
  const navigate = useNavigate();
  const [ step, setStep ] = useState('email');
  const [ email, setEmail ] = useState('');
  const [ otp, setOtp ] = useState('');
  const [ newPassword, setNewPassword ] = useState('');
  const [ error, setError ] = useState('');
  const [ info, setInfo ] = useState('');
  const [ busy, setBusy ] = useState(false);

  const run = (fn) => async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const sendCode = run(async () => {
    const res = await auth.forgotPassword(role, email);
    setInfo(res.message);
    setStep('reset');
  });

  const reset = run(async () => {
    await auth.resetPassword(role, { email, otp, newPassword });
    navigate(`/${slug}/login`, { replace: true });
  });

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 py-4"><Brand /></header>
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-4 sm:pt-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold">Reset your password</h1>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="mt-5 sm:mt-6 space-y-4">
            <p className="text-muted">Enter the email you registered with. We will send a 6-digit code.</p>
            <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <Notice>{error}</Notice>
            <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
          </form>
        ) : (
          <form onSubmit={reset} className="mt-6 space-y-4">
            <Notice tone="info">{info}</Notice>
            <div><label className="label" htmlFor="otp">6-digit code</label><input id="otp" inputMode="numeric" maxLength={6} className="field tracking-[0.3em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required /></div>
            <div><label className="label" htmlFor="newPassword">New password</label><input id="newPassword" type="password" className="field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required autoComplete="new-password" /></div>
            <Notice>{error}</Notice>
            <button className="btn btn-primary w-full" disabled={busy || otp.length !== 6}>{busy ? 'Saving…' : 'Set new password'}</button>
            <button type="button" className="text-muted underline" onClick={() => { setStep('email'); setError(''); }}>Use a different email</button>
          </form>
        )}

        <p className="mt-6"><Link className="font-semibold text-cng underline" to={`/${slug}/login`}>Back to log in</Link></p>
      </main>
    </div>
  );
}
