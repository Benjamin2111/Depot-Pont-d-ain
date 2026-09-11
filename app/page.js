'use client';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../lib/AuthProvider';

const TILES = [
  ['/gestion/produits', '📦', 'Produits', 'Ajouter, modifier'],
  ['/entree', '➕', 'Entrée de stock', 'Réceptions'],
  ['/gestion/familles', '🗂️', 'Familles', 'Catégories produits'],
  ['/gestion/chantiers', '🏗️', 'Chantiers', 'Clients & sites'],
  ['/gestion/inventaire', '📋', 'Inventaire', 'Compter le stock'],
  ['/gestion/etat-stock', '📊', 'État des stocks', 'Export & impression'],
  ['/gestion/qr', '🔳', 'QR codes', 'Générer, imprimer'],
  ['/gestion/utilisateurs', '👥', 'Utilisateurs', 'Ouvriers & responsables']
];

export default function GestionPage() {
  return (
    <AppShell>
      <GestionContent />
    </AppShell>
  );
}

function GestionContent() {
  const { profile } = useAuth();
  const router = useRouter();
  if (profile.role !== 'responsable') {
    return <div className="empty"><div className="ic">🔒</div>Réservé aux responsables.</div>;
  }
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Gestion</h2>
      <div className="gestion-grid">
        {TILES.map(([href, ic, t, d]) => (
          <div key={href} className="gestion-tile" onClick={() => router.push(href)}>
            <div className="ic">{ic}</div>
            <div className="t">{t}</div>
            <div className="d">{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}
