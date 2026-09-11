'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';
import { statusOf, stockValue, formatEuro } from '../../../lib/helpers';

export default function GestionFamillesPage() {
  return (
    <AppShell>
      <GestionFamillesContent />
    </AppShell>
  );
}

function GestionFamillesContent() {
  const { categories, products } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('categories').insert({ name: name.trim(), icon: icon.trim() || '📦' });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setName(''); setIcon('📦'); setShowForm(false);
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>Familles</h2>

      {showForm ? (
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label>Icône (emoji)</label><input maxLength={4} value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
            <div className="form-group"><label>Nom de la famille</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-block" onClick={() => setShowForm(false)} disabled={busy}>Annuler</button>
            <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={busy}>{busy ? 'Création…' : 'Créer la famille'}</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-accent btn-block" style={{ marginBottom: 14 }} onClick={() => setShowForm(true)}>+ Ajouter une famille</button>
      )}

      <div className="list">
        {categories.map((c) => {
          const prods = products.filter((p) => p.category_id === c.id && p.active !== false);
          const toOrder = prods.filter((p) => statusOf(p).key === 'commander').length;
          const low = prods.filter((p) => statusOf(p).key === 'faible').length;
          const value = prods.reduce((sum, p) => { const v = stockValue(p); return v !== null ? sum + v : sum; }, 0);
          const hasValue = prods.some((p) => stockValue(p) !== null);
          return (
            <div key={c.id} className="prow status-ok" onClick={() => router.push('/stock')}>
              <div className="fam-icon">{c.icon}</div>
              <div className="info">
                <div className="name">{c.name}</div>
                <div className="meta">{prods.length} produits{toOrder ? ' · 🔴 ' + toOrder + ' à commander' : ''}{low ? ' · 🟠 ' + low + ' faible' : ''}</div>
              </div>
              {hasValue && <div className="stockval"><div className="n" style={{ fontSize: 15 }}>{formatEuro(value)}</div></div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
