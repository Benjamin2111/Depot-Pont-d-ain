'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { qrImageUrl } from '../../../lib/helpers';

export default function GestionQrPage() {
  return (
    <AppShell>
      <GestionQrContent />
    </AppShell>
  );
}

function GestionQrContent() {
  const { categories, products } = useData();
  const { profile } = useAuth();
  const router = useRouter();
  const [catFilter, setCatFilter] = useState('all');

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  const list = products.filter((p) => p.active !== false && (catFilter === 'all' || p.category_id === catFilter));

  function printSelection() {
    const area = document.getElementById('print-area');
    if (!area) return;
    let html = '<div class="print-grid">';
    list.forEach((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      html += `<div class="label-tile"><div style="font-weight:700;font-size:13px;">${escapeHtml(p.name)}</div><div class="ref">Réf : ${escapeHtml(p.ref)}</div><img src="${qrImageUrl(p.id, '200x200')}"><div class="fam">${cat ? escapeHtml(cat.name) : ''}</div></div>`;
    });
    html += '</div>';
    area.innerHTML = html;
    setTimeout(() => window.print(), 300);
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>QR codes &amp; étiquettes</h2>
      <div className="chips">
        <div className={'chip' + (catFilter === 'all' ? ' active' : '')} onClick={() => setCatFilter('all')}>Toutes familles</div>
        {categories.map((c) => (
          <div key={c.id} className={'chip' + (catFilter === c.id ? ' active' : '')} onClick={() => setCatFilter(c.id)}>{c.icon} {c.name}</div>
        ))}
      </div>
      <button className="btn btn-steel btn-block" style={{ marginBottom: 14 }} onClick={printSelection}>🖨️ Imprimer les étiquettes de cette sélection ({list.length})</button>
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="prow status-ok">
            <img className="qr-thumb" src={qrImageUrl(p.id, '80x80')} alt="" />
            <div className="info"><div className="name">{p.name}</div><div className="meta">{p.ref}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
