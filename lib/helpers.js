export const MOV_LABELS = {
  entree: { label: 'Entrée', icon: '🟢' },
  sortie: { label: 'Sortie', icon: '🔴' },
  correction: { label: 'Correction', icon: '🟠' },
  inventaire: { label: 'Inventaire', icon: '📋' }
};

export function statusOf(p) {
  if (p.stock <= p.stock_min) return { key: 'commander', label: 'À commander', cls: 'danger', emoji: '🔴' };
  if (p.stock <= p.stock_secu) return { key: 'faible', label: 'Stock faible', cls: 'warn', emoji: '🟠' };
  return { key: 'ok', label: 'Stock OK', cls: 'ok', emoji: '🟢' };
}

export function qtyToOrder(p) {
  return Math.max(0, p.stock_max - p.stock);
}

export function stockValue(p) {
  if (p.price === null || p.price === undefined || p.price === '') return null;
  return Number(p.price) * Number(p.stock);
}

export function formatEuro(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function formatDT(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function qrDataFor(productId) {
  return `STOCK:PRODUCT:${productId}`;
}

export function qrImageUrl(productId, size) {
  const data = encodeURIComponent(qrDataFor(productId));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size || '220x220'}&data=${data}`;
}
