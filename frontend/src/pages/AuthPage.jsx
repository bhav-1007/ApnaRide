import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../layouts/Shell';
import { Notice } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services';
import { VEHICLES } from '../utils/format';

const COPY = {
  user: { slug: 'rider', who: 'rider', other: [ 'captain', 'Driving instead? Use the captain page' ] },
  captain: { slug: 'captain', who: 'captain', other: [ 'rider', 'Looking for a ride? Use the rider page' ] },
};

export default function AuthPage({ role, mode }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const copy = COPY[ role ];
  const isRegister = mode === 'register';

  const [ form, setForm ] = useState({ firstname: '', lastname: '', email: '', password: '', color: '', plate: '', capacity: 4, vehicleType: 'auto' });
  const [ error, setError ] = useState('');
  const [ busy, setBusy ] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [ key ]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = isRegister
        ? {
          fullname: { firstname: form.firstname.trim(), lastname: form.lastname.trim() || undefined },
          email: form.email,
          password: form.password,
          ...(role === 'captain' && { vehicle: { color: form.color, plate: form.plate, capacity: Number(form.capacity), vehicleType: form.vehicleType } }),
        }
        : { email: form.email, password: form.password };
      await signIn(role, mode, body);
      navigate(role === 'captain' ? '/captain' : '/ride', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 py-4"><Brand /></header>
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-4 sm:pt-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold">{isRegister ? `Create your ${copy.who} account` : `Log in as a ${copy.who}`}</h1>

        <form onSubmit={submit} className="mt-5 sm:mt-6 space-y-4" noValidate>
          {isRegister && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label" htmlFor="firstname">First name</label><input id="firstname" className="field" value={form.firstname} onChange={set('firstname')} autoComplete="given-name" required minLength={3} /></div>
              <div><label className="label" htmlFor="lastname">Last name</label><input id="lastname" className="field" value={form.lastname} onChange={set('lastname')} autoComplete="family-name" /></div>
            </div>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="field" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" className="field" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={6} /></div>

          {isRegister && role === 'captain' && (
            <fieldset className="space-y-4 border-t border-line pt-4">
              <legend className="mb-2 font-display text-lg font-bold">Your vehicle</legend>
              <div>
                <label className="label" htmlFor="vehicleType">Vehicle type</label>
                <select id="vehicleType" className="field" value={form.vehicleType} onChange={set('vehicleType')}>
                  {Object.entries(VEHICLES).map(([ key, v ]) => <option key={key} value={key}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label" htmlFor="color">Colour</label><input id="color" className="field" value={form.color} onChange={set('color')} required minLength={3} /></div>
                <div><label className="label" htmlFor="capacity">Passenger seats</label><input id="capacity" type="number" min={1} max={8} className="field" value={form.capacity} onChange={set('capacity')} required /></div>
              </div>
              <div><label className="label" htmlFor="plate">Number plate</label><input id="plate" className="field uppercase" value={form.plate} onChange={set('plate')} placeholder="KA 01 AB 1234" required minLength={3} /></div>
            </fieldset>
          )}

          <Notice>{error}</Notice>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
        </form>

        <div className="mt-6 space-y-2 text-muted">
          {isRegister
            ? <p>Already registered? <Link className="font-semibold text-cng underline" to={`/${copy.slug}/login`}>Log in</Link></p>
            : (
              <>
                <p>New here? <Link className="font-semibold text-cng underline" to={`/${copy.slug}/signup`}>Create an account</Link></p>
                <p><Link className="font-semibold text-cng underline" to={`/${copy.slug}/forgot-password`}>Forgot your password?</Link></p>
              </>
            )}
          <p><Link className="underline" to={`/${copy.other[ 0 ]}/login`}>{copy.other[ 1 ]}</Link></p>
        </div>
      </main>
    </div>
  );
}
