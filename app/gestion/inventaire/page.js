'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';

export default function GestionInventairePage() {
  return (
    <AppShell>
      <GestionInventaireContent />
    </AppShell>
  );
}

function GestionInventaireContent() {
  const { categories, products, refreshAll } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [catFilter, setCatFilter] = useState('all');
  const [counts, setCounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  const list = products.filter((p) => p.active !== false && (catFilter === 'all' || p.category_id === catFilter));

  function setCount(id, val) { setCounts((c) => ({ ...c, [id]: val })); }
  function ecartFor(p) {
    const raw = counts[p.id];
    if (raw === undefined || raw === '') return 0;
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n - p.stock;
  }

  async function validate(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const { data: inv, error: invErr } = await supabase.from('inventories').insert({ category_id: catFilter === 'all' ? null : catFilter }).select().single();
    if (invErr) { setError(invErr.message); setBusy(false); return; }

    for (const p of list) {
      const raw = counts[p.id];
      const counted = raw === undefined || raw === '' ? p.stock : (parseInt(raw, 10) || p.stock);
      if (counted !== p.stock) {
        const before = p.stock;
        const { error: mvErr } = await supabase.from('stock_movements').insert({
          product_id: p.id, type: 'inventaire', qty: counted, inventory_id: inv.id,
          note: 'Inventaire — écart ' + (counted - before)
        });
        if (mvErr) { setError(mvErr.message); setBusy(false); return; }
        await supabase.from('inventory_lines').insert({ inventory_id: inv.id, product_id: p.id, theoretical: before, counted, gap: counted - before });
      }
    }
    setBusy(false);
    setDone(true);
    setCounts({});
    await refreshAll();
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>Inventaire</h2>

      {done && <div className="confirm-box" style={{ marginBottom: 16 }}>✅ Inventaire validé, les écarts ont été enregistrés dans l&apos;historique.</div>}

      <div className="chips">
        <div className={'chip' + (catFilter === 'all' ? ' active' : '')} onClick={() => setCatFilter('all')}>Toutes familles</div>
        {categories.map((c) => (
          <div key={c.id} className={'chip' + (catFilter === c.id ? ' active' : '')} onClick={() => setCatFilter(c.id)}>{c.icon} {c.name}</div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">Aucun produit dans cette famille.</div>
      ) : (
        <form onSubmit={validate}>
          <div className="list">
            {list.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              const ecart = ecartFor(p);
              return (
                <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="fam-icon">{cat ? cat.icon : '📦'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>Théorique : {p.stock} {p.unit}</div>
                  </div>
                  <input
                    type="number"
                    style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid var(--line)', textAlign: 'center', fontSize: 15 }}
                    value={counts[p.id] !== undefined ? counts[p.id] : p.stock}
                    onChange={(e) => setCount(p.id, e.target.value)}
                  />
                  <span className="muted" style={{ width: 46, textAlign: 'right', fontSize: 13, color: ecart === 0 ? 'var(--ink-soft)' : (ecart < 0 ? 'var(--danger)' : 'var(--ok)') }}>
                    {ecart > 0 ? '+' : ''}{ecart}
                  </span>
                </div>
              );
            })}
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn btn-accent btn-block btn-lg" style={{ marginTop: 16 }} disabled={busy}>{busy ? 'Enregistrement…' : "Valider l'inventaire"}</button>
        </form>
      )}
    </>
  );
}
