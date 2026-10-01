import { useState } from 'react';
import { api } from './api.js';

export default function Auth({ onAuth }) {
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const data = await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body: f });
      onAuth(data);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <main className="auth">
      <h1>Health Journal</h1>
      <p className="muted">A private place to log how you feel and spot your own patterns.</p>
      <form onSubmit={submit}>
        {signup && (<label>Name<input value={f.name} onChange={set('name')} required autoComplete="name" /></label>)}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
        <label>Password
          <input type="password" value={f.password} onChange={set('password')} required minLength={signup ? 8 : 1}
            autoComplete={signup ? 'new-password' : 'current-password'} />
        </label>
        {signup && <small className="muted">At least 8 characters.</small>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Please wait' : signup ? 'Create account' : 'Log in'}</button>
      </form>
      <button className="link" onClick={() => { setSignup(!signup); setError(''); }}>
        {signup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </main>
  );
}
