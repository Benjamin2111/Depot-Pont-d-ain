'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import HistoryRow from '../../components/HistoryRow';
import { useData } from '../../lib/DataProvider';
import { useAuth } from '../../lib/AuthProvider';

export default function HistoriquePage() {
  return (
    <AppShell>
      <HistoriqueContent />
    </AppShell>
  );
}

function HistoriqueContent() {
  const { movements, users, loadingData } = useData();
  const { profile } = useAuth();
  const [type, setType] = useState('all');
  const [period, setPeriod] = useState('all');
  const [userId, setUserId] = useState('all');
  const [search, setSearch] = useState('');

  if (loadingData) return <div className="center-msg">Chargement…</div>;

  let cutoff = null;
  if (period === 'today') { cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); }
  if (period === '7d') { cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7); }
  if (period === '30d') { cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); }
  const q = search.trim().toLowerCase();

  const list = movements.filter((m) => {
    if (type !== 'all' && m.type !== type) return false;
    if (userId !== 'all' && m.user_id !== userId) return false;
    if (cutoff && new Date(m.created_at) < cutoff) return false;
    if (q) {
      const name = (m.products ? m.products.name + ' ' + m.products.ref : '').toLowerCase();
      if (name.indexOf(q) === -1) return false;
    }
    return true;
  });

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Historique</h2>
      <div className="search-wrap">
        <span className="ic">🔎</span>
        <input type="text" placeholder="Rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="chips">
        {[['all', 'Tous types'], ['entree', '🟢 Entrées'], ['sortie', '🔴 Sorties'], ['correction', '🟠 Corrections'], ['inventaire', '📋 Inventaires']].map(([k, l]) => (
          <div key={k} className={'chip' + (type === k ? ' active' : '')} onClick={() => setType(k)}>{l}</div>
        ))}
      </div>
      <div className="chips">
        {[['all', 'Toute période'], ['today', "Aujourd'hui"], ['7d', '7 jours'], ['30d', '30 jours']].map(([k, l]) => (
          <div key={k} className={'chip' + (period === k ? ' active' : '')} onClick={() => setPeriod(k)}>{l}</div>
        ))}
      </div>
      {profile.role === 'responsable' && (
        <div className="chips">
          <div className={'chip' + (userId === 'all' ? ' active' : '')} onClick={() => setUserId('all')}>Tous les utilisateurs</div>
          {users.map((u) => (
            <div key={u.id} className={'chip' + (userId === u.id ? ' active' : '')} onClick={() => setUserId(u.id)}>{u.first_name}</div>
          ))}
        </div>
      )}
      {list.length === 0 ? (
        <div className="empty"><div className="ic">📭</div>Aucun mouvement trouvé.</div>
      ) : (
        <div className="list">{list.map((m) => <HistoryRow key={m.id} m={m} />)}</div>
      )}
    </>
  );
}
