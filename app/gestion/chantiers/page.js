'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';

export default function GestionChantiersPage() {
  return (
    <AppShell>
      <GestionChantiersContent />
    </AppShell>
  );
}

function GestionChantiersContent() {
  const { sites } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: "Pont-d'Ain", ref: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  function set(field, v) { setForm((f) => ({ ...f, [field]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('sites').insert({ name: form.name.trim(), address: form.address.trim(), ref: form.ref.trim(), status: 'actif' });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setForm({ name: '', address: "Pont-d'Ain", ref: '' });
    setShowForm(false);
  }

  async function toggleStatus(s) {
    await supabase.from('sites').update({ status: s.status === 'actif' ? 'termine' : 'actif' }).eq('id', s.id);
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>Chantiers</h2>

      {showForm ? (
        <form onSubmit={submit}>
          <div className="form-group"><label>Nom du chantier / client</label><input required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="form-group"><label>Adresse</label><input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="form-group"><label>Référence chantier</label><input placeholder="Ex: 2026-050" value={form.ref} onChange={(e) => set('ref', e.target.value)} /></div>
          {error && <div className="error-text">{error}</div>}
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-block" onClick={() => setShowForm(false)} disabled={busy}>Annuler</button>
            <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={busy}>{busy ? 'Création…' : 'Créer le chantier'}</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-accent btn-block" style={{ marginBottom: 14 }} onClick={() => setShowForm(true)}>+ Ajouter un chantier</button>
      )}

      <div className="list">
        {sites.map((s) => (
          <div key={s.id} className="prow status-ok">
            <div className="fam-icon">🏗️</div>
            <div className="info"><div className="name">{s.name}</div><div className="meta">{s.address}{s.ref ? ' · Réf ' + s.ref : ''}</div></div>
            <button className={'btn btn-sm ' + (s.status === 'actif' ? 'btn-outline' : 'btn-steel')} onClick={() => toggleStatus(s)}>{s.status === 'actif' ? 'Actif' : 'Terminé'}</button>
          </div>
        ))}
      </div>
    </>
  );
}
