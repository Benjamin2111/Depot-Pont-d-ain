'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { supabase } from '../../../lib/supabaseClient';
import { statusOf } from '../../../lib/helpers';

export default function GestionProduitsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="center-msg">Chargement…</div>}>
        <GestionProduitsContent />
      </Suspense>
    </AppShell>
  );
}

function emptyForm(categories) {
  return { ref: '', name: '', category_id: categories[0] ? categories[0].id : '', unit: 'pièce', stock: 0, stock_min: 0, stock_secu: 0, stock_max: 0, location: '', supplier: '', price: '' };
}

function GestionProduitsContent() {
  const { categories, products } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');

  const [showForm, setShowForm] = useState(!!editId);
  const [form, setForm] = useState(emptyForm(categories));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editId) {
      const p = products.find((x) => x.id === editId);
      if (p) {
        setForm({ ref: p.ref, name: p.name, category_id: p.category_id, unit: p.unit, stock: p.stock, stock_min: p.stock_min, stock_secu: p.stock_secu, stock_max: p.stock_max, location: p.location || '', supplier: p.supplier || '', price: (p.price === null || p.price === undefined) ? '' : p.price });
        setShowForm(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, products.length]);

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ref: form.ref.trim(), name: form.name.trim(), category_id: form.category_id, unit: form.unit.trim(),
      stock: Number(form.stock) || 0, stock_min: Number(form.stock_min) || 0, stock_secu: Number(form.stock_secu) || 0,
      stock_max: Number(form.stock_max) || 0, location: form.location.trim(),
      supplier: form.supplier.trim(), price: form.price === '' ? null : Number(form.price)
    };
    const query = editId
      ? supabase.from('products').update(payload).eq('id', editId)
      : supabase.from('products').insert(payload);
    const { error: err } = await query;
    setBusy(false);
    if (err) { setError(err.message || 'Erreur lors de l\'enregistrement.'); return; }
    setShowForm(false);
    router.replace('/gestion/produits');
  }

  function openNew() {
    setForm(emptyForm(categories));
    setShowForm(true);
    router.replace('/gestion/produits');
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>Produits</h2>

      {showForm ? (
        <form onSubmit={submit}>
          <h3>{editId ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
          <div className="form-grid">
            <div className="form-group"><label>Référence</label><input required value={form.ref} onChange={(e) => set('ref', e.target.value)} /></div>
            <div className="form-group"><label>Unité</label><input required value={form.unit} onChange={(e) => set('unit', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Désignation</label><input required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="form-group">
            <label>Famille</label>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group"><label>{editId ? 'Stock actuel' : 'Stock initial'}</label><input type="number" min="0" required value={form.stock} onChange={(e) => set('stock', e.target.value)} /></div>
            <div className="form-group"><label>Emplacement</label><input value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
          </div>
          <div className="form-grid">
            <div className="form-group"><label>Stock minimum</label><input type="number" min="0" required value={form.stock_min} onChange={(e) => set('stock_min', e.target.value)} /></div>
            <div className="form-group"><label>Stock de sécurité</label><input type="number" min="0" required value={form.stock_secu} onChange={(e) => set('stock_secu', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Stock maximum</label><input type="number" min="0" required value={form.stock_max} onChange={(e) => set('stock_max', e.target.value)} /></div>
          <div className="form-grid">
            <div className="form-group"><label>Fournisseur (facultatif)</label><input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} /></div>
            <div className="form-group"><label>Prix d&apos;achat € (facultatif)</label><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="btn-row">
            <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => { setShowForm(false); router.replace('/gestion/produits'); }}>Annuler</button>
            <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={busy}>{busy ? 'Enregistrement…' : (editId ? 'Enregistrer' : 'Créer le produit + générer le QR code')}</button>
          </div>
        </form>
      ) : (
        <>
          <button className="btn btn-accent btn-block" style={{ marginBottom: 14 }} onClick={openNew}>+ Ajouter un produit</button>
          <div className="list">
            {products.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              const st = statusOf(p);
              return (
                <div key={p.id} className={'prow status-' + st.key} style={{ opacity: p.active === false ? 0.5 : 1 }} onClick={() => router.push('/gestion/produits?edit=' + p.id)}>
                  <div className="fam-icon">{cat ? cat.icon : '📦'}</div>
                  <div className="info"><div className="name">{p.name}{p.active === false ? ' (inactif)' : ''}</div><div className="meta">{p.ref} · {p.location}</div></div>
                  <div className="stockval"><div className="n">{p.stock}</div><div className="u">{p.unit}</div></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
