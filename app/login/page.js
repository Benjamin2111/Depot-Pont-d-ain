'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthProvider';

const LOGO_SVG = (
  <svg width="30" height="30" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="3" height="20" rx="1" fill="currentColor" />
    <rect x="12.5" y="2" width="3" height="22" rx="1" fill="currentColor" />
    <rect x="22" y="4" width="3" height="20" rx="1" fill="currentColor" />
    <rect x="1" y="9" width="26" height="2.4" rx="1" fill="currentColor" />
    <rect x="1" y="16" width="26" height="2.4" rx="1" fill="currentColor" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace('/dashboard');
  }, [loading, session, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError('Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.');
    } else {
      router.replace('/dashboard');
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">{LOGO_SVG}</div>
        <h1>Dépôt Pont-d&apos;Ain</h1>
        <div className="sub">Connexion</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="muted" style={{ fontSize: 12, marginTop: 16, textAlign: 'center' }}>
          Pas de compte ? Demandez à votre responsable de vous en créer un depuis Gestion → Utilisateurs.
        </p>
      </div>
    </div>
  );
}
