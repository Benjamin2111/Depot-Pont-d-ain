'use client';
import { statusOf } from '../lib/helpers';

export default function ProductRow({ product, category, onClick, rightSlot }) {
  const st = statusOf(product);
  return (
    <div className={'prow status-' + st.key} onClick={onClick} style={{ opacity: product.active === false ? 0.5 : 1 }}>
      <div className="fam-icon">{category ? category.icon : '📦'}</div>
      <div className="info">
        <div className="name">{product.name}{product.active === false ? ' (inactif)' : ''}</div>
        <div className="meta">{product.ref}{product.location ? ' · ' + product.location : ''}</div>
      </div>
      {rightSlot ? rightSlot : (
        <div className="stockval">
          <div className="n">{product.stock}</div>
          <div className="u">{product.unit}</div>
        </div>
      )}
    </div>
  );
}
