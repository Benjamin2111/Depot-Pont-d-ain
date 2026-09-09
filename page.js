'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import ProductRow from '../../components/ProductRow';
import ProductModal from '../../components/ProductModal';
import { useData } from '../../lib/DataProvider';
import { useAuth } from '../../lib/AuthProvider';
import { statusOf } from '../../lib/helpers';
import { supabase } from '../../lib/supabaseClient';

export default function StockPage() {
  return (
    <AppShell>
      <StockContent />
    </AppShell>
  );
}

function StockContent() {
  const { categories, products, loadingData } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openProductId, setOpenProductId] = useState(null);

  if (loadingData) return <div className="center-msg">Chargement…</div>;

  const catById = (id) => categories.find((c) => c.id === id);
  const q = search.trim().toLowerCase();
  const list = products.filter((p) => {
    if (p.active === false) return false;
    if (catFilter !== 'all' && p.category_id !== catFilter) return false;
    if (statusFilter !== 'all' && statusOf(p).key !== statusFilter) return false;
    if (q) {
      const cat = catById(p.category_id);
      const hay = (p.ref + ' ' + p.name + ' ' + (cat ? cat.name : '') + ' ' + (p.location || '')).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
  const openProduct = products.find((p) => p.id === openProductId);

  async function toggleActive(p) {
    await supabase.from('products').update({ active: p.active === false }).eq('id', p.id);
    setOpenProductId(null);
  }

  return (
    <>
      <div className="search-wrap">
        <span className="ic">🔎</span>
        <input type="text" placeholder="Rechercher une référence, un produit, un emplacement…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="chips">
        <div className={'chip' + (catFilter === 'all' ? ' active' : '')} onClick={() => setCatFilter('all')}>Toutes familles</div>
        {categories.map((c) => (
          <div key={c.id} className={'chip' + (catFilter === c.id ? ' active' : '')} onClick={() => setCatFilter(c.id)}>{c.icon} {c.name}</div>
        ))}
      </div>
      <div className="chips">
        {[['all', 'Tous statuts'], ['ok', '🟢 OK'], ['faible', '🟠 Faible'], ['commander', '🔴 À commander']].map(([k, l]) => (
          <div key={k} className={'chip' + (statusFilter === k ? ' active' : '')} onClick={() => setStatusFilter(k)}>{l}</div>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty"><div className="ic">📦</div>Aucun produit ne correspond.</div>
      ) : (
        <div className="list">
          {list.map((p) => (
            <ProductRow key={p.id} product={p} category={catById(p.category_id)} onClick={() => setOpenProductId(p.id)} />
          ))}
        </div>
      )}
      {openProduct && (
        <ProductModal
          product={openProduct}
          category={catById(openProduct.category_id)}
          isResponsable={profile.role === 'responsable'}
          onClose={() => setOpenProductId(null)}
          onEdit={() => router.push('/gestion/produits?edit=' + openProduct.id)}
          onToggleActive={toggleActive}
        />
      )}
    </>
  );
}
