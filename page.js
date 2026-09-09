'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import ProductRow from '../../components/ProductRow';
import HistoryRow from '../../components/HistoryRow';
import ProductModal from '../../components/ProductModal';
import { useData } from '../../lib/DataProvider';
import { useAuth } from '../../lib/AuthProvider';
import { statusOf } from '../../lib/helpers';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { categories, products, movements, loadingData, refreshAll } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [openProductId, setOpenProductId] = useState(null);

  if (loadingData) return <div className="center-msg">Chargement des données…</div>;

  const active = products.filter((p) => p.active !== false);
  const toOrder = active.filter((p) => statusOf(p).key === 'commander');
  const low = active.filter((p) => statusOf(p).key === 'faible');
  const today = new Date().toISOString().slice(0, 10);
  const todaysMv = movements.filter((m) => m.created_at.slice(0, 10) === today);
  const catById = (id) => categories.find((c) => c.id === id);
  const openProduct = products.find((p) => p.id === openProductId);

  async function toggleActive(p) {
    await supabase.from('products').update({ active: p.active === false }).eq('id', p.id);
    setOpenProductId(null);
  }

  return (
    <>
      <div className="stats-row">
        <div className="stat-card"><div className="num">{active.length}</div><div className="lbl">📦 Produits</div></div>
        <div className="stat-card danger"><div className="num">{toOrder.length}</div><div className="lbl">🔴 À commander</div></div>
        <div className="stat-card warn"><div className="num">{low.length}</div><div className="lbl">🟠 Stocks faibles</div></div>
        <div className="stat-card accent"><div className="num">{todaysMv.length}</div><div className="lbl">📊 Mouvements du jour</div></div>
      </div>

      <button className="btn btn-accent btn-lg btn-block" style={{ marginTop: 18 }} onClick={() => router.push('/sortie')}>➖ Sortie de stock</button>

      {toOrder.length > 0 && (
        <>
          <div className="section-title">⚠️ À commander</div>
          <div className="list">
            {toOrder.slice(0, 6).map((p) => (
              <ProductRow key={p.id} product={p} category={catById(p.category_id)} onClick={() => setOpenProductId(p.id)} />
            ))}
          </div>
        </>
      )}

      <div className="section-title">📋 Derniers mouvements</div>
      {movements.length === 0 ? (
        <div className="empty"><div className="ic">📭</div>Aucun mouvement pour l&apos;instant.</div>
      ) : (
        <div className="list">
          {movements.slice(0, 6).map((m) => <HistoryRow key={m.id} m={m} />)}
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
