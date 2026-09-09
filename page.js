'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import Stepper from '../../components/Stepper';
import { useData } from '../../lib/DataProvider';
import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabaseClient';

export default function EntreePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="center-msg">Chargement…</div>}>
        <EntreeContent />
      </Suspense>
    </AppShell>
  );
}

function EntreeContent() {
  const params = useSearchParams();
  const preselected = params.get('product');
  const { categories, products } = useData();
  const { profile } = useAuth();

  const [productId, setProductId] = useState(preselected || null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { if (preselected) setProductId(preselected); }, [preselected]);

  if (profile.role !== 'responsable') {
    return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;
  }

  const catById = (id) => categories.find((c) => c.id === id);
  const product = products.find((p) => p.id === productId);

  async function validate(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const before = product.stock;
    const { data, error: err } = await supabase.from('stock_movements').insert({
      product_id: product.id, type: 'entree', qty: qty, note: note
    }).select().single();
    setBusy(false);
    if (err) { setError(err.message || "Impossible d'enregistrer l'entrée."); return; }
    setResult({ productName: product.name, unit: product.unit, qty, before, after: data.stock_after });
  }

  if (!productId) {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (p.active === false) return false;
      if (!q) return true;
      const cat = catById(p.category_id);
      return (p.ref + ' ' + p.name + ' ' + (cat ? cat.name : '')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 25);
    return (
      <>
        <h2 style={{ marginTop: 0 }}>Entrée de stock</h2>
        <div className="search-wrap">
          <span className="ic">🔎</span>
          <input type="text" placeholder="Rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {list.length === 0 ? <div className="empty">Aucun produit trouvé.</div> : (
          <div className="list">
            {list.map((p) => (
              <div key={p.id} className="prow status-ok" onClick={() => setProductId(p.id)}>
                <div className="fam-icon">{catById(p.category_id) ? catById(p.category_id).icon : '📦'}</div>
                <div className="info"><div className="name">{p.name}</div><div className="meta">{p.ref} · Stock: {p.stock} {p.unit}</div></div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (result) {
    return (
      <>
        <h2 style={{ marginTop: 0 }}>Entrée de stock</h2>
        <div className="confirm-box">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>✅ Entrée enregistrée</div>
          <div className="big">+{result.qty} {result.unit}</div>
          <div className="muted" style={{ marginTop: 8 }}>{result.productName}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Ancien stock : {result.before} → Nouveau stock : <strong>{result.after}</strong></div>
        </div>
        <button className="btn btn-accent btn-block" style={{ marginTop: 16 }} onClick={() => { setProductId(null); setResult(null); setQty(1); setNote(''); }}>Nouvelle entrée</button>
      </>
    );
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Entrée de stock</h2>
      <div className="big-product-card">
        <div className="name">{product.name}</div>
        <div className="avail">Stock actuel : <strong>{product.stock} {product.unit}</strong></div>
      </div>
      <form onSubmit={validate}>
        <Stepper value={qty} onChange={setQty} min={1} />
        <div className="form-group">
          <label>Note (facultatif)</label>
          <input type="text" placeholder="Ex: livraison fournisseur" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="btn-row">
          <button type="button" className="btn btn-outline btn-block" onClick={() => setProductId(null)} disabled={busy}>← Changer de produit</button>
          <button type="submit" className="btn btn-steel btn-block" disabled={busy}>{busy ? 'Enregistrement…' : "Valider l'entrée"}</button>
        </div>
      </form>
    </>
  );
}
