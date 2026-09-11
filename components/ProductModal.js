'use client';
import { useRouter } from 'next/navigation';
import { statusOf, qtyToOrder, qrImageUrl, stockValue, formatEuro } from '../lib/helpers';

export default function ProductModal({ product, category, isResponsable, onClose, onEdit, onToggleActive }) {
  const router = useRouter();
  if (!product) return null;
  const st = statusOf(product);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{product.name}</h2>
        <div className="muted" style={{ marginBottom: 14 }}>{product.ref} · {category ? category.icon + ' ' + category.name : ''}</div>
        <div className={'badge badge-' + st.cls} style={{ marginBottom: 14 }}>{st.emoji} {st.label}</div>
        <div className="form-grid" style={{ marginBottom: 14 }}>
          <StatBlock label="Stock actuel" val={product.stock + ' ' + product.unit} />
          <StatBlock label="Emplacement" val={product.location || '—'} />
          <StatBlock label="Seuil minimum" val={product.stock_min} />
          <StatBlock label="Seuil sécurité" val={product.stock_secu} />
          <StatBlock label="Stock maximum" val={product.stock_max} />
          <StatBlock label="À commander" val={qtyToOrder(product) + ' ' + product.unit} />
          {product.supplier ? <StatBlock label="Fournisseur" val={product.supplier} /> : null}
          {(product.price !== null && product.price !== undefined) ? <StatBlock label="Prix d'achat" val={Number(product.price).toFixed(2) + ' €'} /> : null}
          {stockValue(product) !== null ? <StatBlock label="Valeur du stock" val={formatEuro(stockValue(product))} /> : null}
        </div>
        <div className="qr-big-wrap"><img src={qrImageUrl(product.id)} alt="QR code" /></div>
        <div className="btn-row" style={{ marginBottom: 10 }}>
          <button className="btn btn-accent btn-block" onClick={() => router.push('/sortie?product=' + product.id)}>➖ Sortie de stock</button>
        </div>
        {isResponsable && (
          <>
            <div className="btn-row" style={{ marginBottom: 10 }}>
              <button className="btn btn-steel btn-block" onClick={() => router.push('/entree?product=' + product.id)}>➕ Entrée de stock</button>
            </div>
            <div className="btn-row" style={{ marginBottom: 10 }}>
              <button className="btn btn-outline btn-block" onClick={() => onEdit(product)}>✏️ Modifier la fiche</button>
            </div>
            <div className="btn-row">
              <button className="btn btn-danger-outline btn-block" onClick={() => onToggleActive(product)}>
                {product.active === false ? 'Réactiver le produit' : 'Désactiver ce produit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, val }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{val}</div>
    </div>
  );
}
