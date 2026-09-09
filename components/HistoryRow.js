'use client';
import { MOV_LABELS, formatDT } from '../lib/helpers';

export default function HistoryRow({ m }) {
  const t = MOV_LABELS[m.type] || { label: m.type, icon: '•' };
  const sign = m.type === 'entree' ? '+' : (m.type === 'sortie' ? '-' : (m.qty >= 0 ? '+' : ''));
  return (
    <div className="hist-row">
      <div className="htype">{t.icon}</div>
      <div className="hmain">
        <div className="l1">{m.products ? m.products.name : m.product_id}</div>
        <div className="l2">
          {t.label}{m.sites ? ' · ' + m.sites.name : ''} · {formatDT(m.created_at)} · {m.profiles ? (m.profiles.first_name + ' ' + m.profiles.last_name) : ''}
        </div>
      </div>
      <div className="hqty">{sign}{Math.abs(m.qty)}</div>
    </div>
  );
}
