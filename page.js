'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import QrScanner from '../../components/QrScanner';
import Stepper from '../../components/Stepper';
import { useData } from '../../lib/DataProvider';
import { supabase } from '../../lib/supabaseClient';

export default function SortiePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="center-msg">Chargement…</div>}>
        <SortieContent />
      </Suspense>
    </AppShell>
  );
}

function SortieContent() {
  const params = useSearchParams();
  const preselected = params.get('product');
  const { categories, products, sites } = useData();

  const [step, setStep] = useState(preselected ? 2 : 1);
  const [productId, setProductId] = useState(preselected || null);
  const [qty, setQty] = useState(1);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (preselected) { setProductId(preselected); setStep(2); setQty(1); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected]);

  const catById = (id) => categories.find((c) => c.id === id);
  const product = products.find((p) => p.id === productId);

  function reset() {
    setStep(1); setProductId(null); setQty(1); setSearch(''); setResult(null); setError('');
  }

  function handleScanned(pid) {
    setShowScanner(false);
    const p = products.find((x) => x.id === pid);
    if (p) { setProductId(pid); setQty(1); setStep(2); }
  }

  async function validate(siteId, siteName) {
    setBusy(true);
    setError('');
    const before = product.stock;
    const { data, error: err } = await supabase.from('stock_movements').insert({
      product_id: product.id,
      type: 'sortie',
      qty: qty,
      site_id: siteId,
      note: ''
    }).select().single();
    setBusy(false);
    if (err) {
      setError(err.message || "Impossible d'enregistrer la sortie.");
      return;
    }
    setResult({ productName: product.name, unit: product.unit, qty, before, after: data.stock_after, siteName });
    setStep(4);
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Sortie de stock</h2>
      <FlowDots step={step} total={3} />

      {step === 1 && (
        showScanner ? (
          <QrScanner onDecoded={handleScanned} onCancel={() => setShowScanner(false)} />
        ) : (
          <>
            <button className="btn btn-steel btn-block btn-lg" style={{ marginBottom: 14 }} onClick={() => setShowScanner(true)}>📷 Scanner un QR code</button>
            <div className="search-wrap">
              <span className="ic">🔎</span>
              <input type="text" placeholder="Ou rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <ProductPickList products={products} categories={categories} search={search} onPick={(id) => { setProductId(id); setQty(1); setStep(2); }} />
          </>
        )
      )}

      {step === 2 && product && (
        <>
          <div className="big-product-card">
            <div className="name">{product.name}</div>
            <div className="avail">Stock disponible : <strong>{product.stock} {product.unit}</strong></div>
          </div>
          <Stepper value={qty} onChange={setQty} min={1} max={product.stock} />
          <div className="btn-row">
            <button className="btn btn-outline btn-block" onClick={() => setStep(1)}>← Retour</button>
            <button className="btn btn-accent btn-block" onClick={() => setStep(3)} disabled={product.stock === 0}>Suivant</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>Sélectionner le chantier</div>
          <div className="list">
            {sites.filter((s) => s.status !== 'termine').map((s) => (
              <div key={s.id} className="prow status-ok" onClick={() => validate(s.id, s.name)}>
                <div className="fam-icon">🏗️</div>
                <div className="info"><div className="name">{s.name}</div><div className="meta">{s.address}{s.ref ? ' · Réf ' + s.ref : ''}</div></div>
              </div>
            ))}
            <div className="prow status-ok" onClick={() => validate(null, 'Autre / Dépôt')}>
              <div className="fam-icon">📍</div>
              <div className="info"><div className="name">Autre / Dépôt</div></div>
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-outline btn-block" style={{ marginTop: 14 }} onClick={() => setStep(2)} disabled={busy}>← Retour</button>
        </>
      )}

      {step === 4 && result && (
        <>
          <div className="confirm-box">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>✅ Sortie enregistrée</div>
            <div className="big">-{result.qty} {result.unit}</div>
            <div className="muted" style={{ marginTop: 8 }}>{result.productName}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Stock avant : {result.before} → Nouveau stock : <strong>{result.after}</strong></div>
            {result.siteName && <div className="muted" style={{ fontSize: 13 }}>Chantier : {result.siteName}</div>}
          </div>
          <button className="btn btn-accent btn-block" style={{ marginTop: 16 }} onClick={reset}>Nouvelle sortie</button>
        </>
      )}
    </>
  );
}

function FlowDots({ step, total }) {
  const dots = [];
  for (let i = 1; i <= total; i++) dots.push(i);
  return (
    <div className="flow-header">
      {dots.map((i) => <div key={i} className={'flow-dot' + (i < step ? ' done' : i === step ? ' active' : '')}></div>)}
      <span className="muted" style={{ fontSize: 13 }}>Étape {Math.min(step, total)} / {total}</span>
    </div>
  );
}

function ProductPickList({ products, categories, search, onPick }) {
  const q = search.trim().toLowerCase();
  const catById = (id) => categories.find((c) => c.id === id);
  const list = products.filter((p) => {
    if (p.active === false) return false;
    if (!q) return true;
    const cat = catById(p.category_id);
    return (p.ref + ' ' + p.name + ' ' + (cat ? cat.name : '')).toLowerCase().indexOf(q) !== -1;
  }).slice(0, 25);
  if (list.length === 0) return <div className="empty">Aucun produit trouvé.</div>;
  return (
    <div className="list">
      {list.map((p) => (
        <div key={p.id} className="prow status-ok" onClick={() => onPick(p.id)}>
          <div className="fam-icon">{catById(p.category_id) ? catById(p.category_id).icon : '📦'}</div>
          <div className="info"><div className="name">{p.name}</div><div className="meta">{p.ref} · Disponible: {p.stock} {p.unit}</div></div>
        </div>
      ))}
    </div>
  );
}
