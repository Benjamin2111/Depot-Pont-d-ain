'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';

export default function GestionUtilisateursPage() {
  return (
    <AppShell>
      <GestionUtilisateursContent />
    </AppShell>
  );
}

function GestionUtilisateursContent() {
  const { users, refreshUsers } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'ouvrier' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  function set(field, v) { setForm((f) => ({ ...f, [field]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session ? sessionData.session.access_token : null;
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la création du compte.');
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'ouvrier' });
      setShowForm(false);
      await refreshUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u) {
    await supabase.from('profiles').update({ active: u.active === false }).eq('id', u.id);
    await refreshUsers();
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>Utilisateurs</h2>

      {showForm ? (
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label>Prénom</label><input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
            <div className="form-group"><label>Nom</label><input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>E-mail</label><input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="form-group"><label>Mot de passe provisoire</label><input type="text" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
          <div className="form-group">
            <label>Rôle</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="ouvrier">Ouvrier</option>
              <option value="responsable">Responsable</option>
            </select>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-block" onClick={() => setShowForm(false)} disabled={busy}>Annuler</button>
            <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={busy}>{busy ? 'Création…' : "Créer l'utilisateur"}</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-accent btn-block" style={{ marginBottom: 14 }} onClick={() => setShowForm(true)}>+ Ajouter un utilisateur</button>
      )}

      <div className="list">
        {users.map((u) => (
          <div key={u.id} className="prow status-ok" style={{ opacity: u.active === false ? 0.5 : 1 }}>
            <div className="fam-icon">👤</div>
            <div className="info">
              <div className="name">{u.first_name} {u.last_name}{u.active === false ? ' (désactivé)' : ''}</div>
              <div className="meta"><span className={'role-tag role-' + u.role}>{u.role === 'responsable' ? 'Responsable' : 'Ouvrier'}</span></div>
            </div>
            {u.id !== profile.id && (
              <button className="btn btn-sm btn-outline" onClick={() => toggleActive(u)}>{u.active === false ? 'Réactiver' : 'Désactiver'}</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
