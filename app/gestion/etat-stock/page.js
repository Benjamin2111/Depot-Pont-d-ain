'use client';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { useData } from '../../../lib/DataProvider';
import { useAuth } from '../../../lib/AuthProvider';
import { stockValue, formatEuro, formatDT } from '../../../lib/helpers';

export default function EtatStockPage() {
  return (
    <AppShell>
      <EtatStockContent />
    </AppShell>
  );
}

function escapeCsv(v) {
  const s = String(v === undefined || v === null ? '' : v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function EtatStockContent() {
  const { categories, products } = useData();
  const { profile } = useAuth();
  const router = useRouter();

  if (profile.role !== 'responsable') return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;

  const active = products.filter((p) => p.active !== false);
  const grandTotal = active.reduce((sum, p) => { const v = stockValue(p); return v !== null ? sum + v : sum; }, 0);
  const hasAnyValue = active.some((p) => stockValue(p) !== null);
  const now = new Date();

  function groupsData() {
    return categories
      .map((c) => {
        const prods = active.filter((p) => p.category_id === c.id);
        const total = prods.reduce((sum, p) => { const v = stockValue(p); return v !== null ? sum + v : sum; }, 0);
        return { category: c, products: prods, total };
      })
      .filter((g) => g.products.length > 0);
  }

  function exportCsv() {
    const rows = [['Référence', 'Désignation', 'Famille', 'Stock', 'Unité', 'Fournisseur', 'Prix unitaire (€)', 'Valeur du stock (€)']];
    groupsData().forEach((g) => {
      g.products.forEach((p) => {
        rows.push([
          p.ref, p.name, g.category.name, p.stock, p.unit, p.supplier || '',
          p.price !== null && p.price !== undefined ? Number(p.price).toFixed(2) : '',
          stockValue(p) !== null ? stockValue(p).toFixed(2) : ''
        ]);
      });
    });
    rows.push([]);
    rows.push(['', '', '', '', '', '', 'TOTAL GÉNÉRAL', grandTotal.toFixed(2)]);
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etat-des-stocks-' + now.toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printReport() {
    const area = document.getElementById('print-area');
    if (!area) return;
    let html = '<h1 style="font-family:Barlow Condensed, sans-serif;">État des stocks — Dépôt Pont-d\'Ain</h1>';
    html += '<p>Édité le ' + formatDT(now.toISOString()) + '</p>';
    groupsData().forEach((g) => {
      html += '<h3 style="margin-top:18px;">' + g.category.icon + ' ' + escapeHtml(g.category.name) + '</h3>';
      html += '<table class="print-table"><thead><tr><th>Réf</th><th>Désignation</th><th>Stock</th><th>Unité</th><th>Prix unit.</th><th>Valeur</th></tr></thead><tbody>';
      g.products.forEach((p) => {
        html += '<tr><td>' + escapeHtml(p.ref) + '</td><td>' + escapeHtml(p.name) + '</td><td>' + p.stock + '</td><td>' + escapeHtml(p.unit) + '</td><td>' +
          (p.price !== null && p.price !== undefined ? formatEuro(p.price) : '—') + '</td><td>' +
          (stockValue(p) !== null ? formatEuro(stockValue(p)) : '—') + '</td></tr>';
      });
      html += '</tbody></table>';
      if (g.total > 0) html += '<p style="text-align:right;font-weight:700;">Sous-total ' + escapeHtml(g.category.name) + ' : ' + formatEuro(g.total) + '</p>';
    });
    html += '<h2 style="text-align:right;margin-top:24px;">TOTAL GÉNÉRAL : ' + formatEuro(grandTotal) + '</h2>';
    area.innerHTML = html;
    setTimeout(() => window.print(), 200);
  }

  const groups = groupsData();

  return (
    <>
      <button className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => router.push('/gestion')}>← Gestion</button>
      <h2 style={{ marginTop: 0 }}>État des stocks</h2>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn btn-steel btn-block" onClick={printReport}>🖨️ Imprimer</button>
        <button className="btn btn-outline btn-block" onClick={exportCsv}>⬇️ Exporter en CSV</button>
      </div>

      {hasAnyValue && (
        <div className="confirm-box" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Valeur totale du stock</div>
          <div className="big">{formatEuro(grandTotal)}</div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty">Aucun produit actif.</div>
      ) : (
        groups.map((g) => (
          <div key={g.category.id} style={{ marginBottom: 18 }}>
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{g.category.icon} {g.category.name}</span>
              {g.total > 0 && <span style={{ color: 'var(--accent)' }}>{formatEuro(g.total)}</span>}
            </div>
            <div className="list">
              {g.products.map((p) => (
                <div key={p.id} className="prow status-ok" onClick={() => router.push('/gestion/produits?edit=' + p.id)}>
                  <div className="info">
                    <div className="name">{p.name}</div>
                    <div className="meta">{p.ref} · {p.stock} {p.unit}{p.price !== null && p.price !== undefined ? (' · ' + formatEuro(p.price) + '/u') : ''}</div>
                  </div>
                  {stockValue(p) !== null && (
                    <div className="stockval"><div className="n" style={{ fontSize: 15 }}>{formatEuro(stockValue(p))}</div></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
