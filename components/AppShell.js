'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/AuthProvider';

const LOGO_SVG = (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="3" height="20" rx="1" fill="currentColor" />
    <rect x="12.5" y="2" width="3" height="22" rx="1" fill="currentColor" />
    <rect x="22" y="4" width="3" height="20" rx="1" fill="currentColor" />
    <rect x="1" y="9" width="26" height="2.4" rx="1" fill="currentColor" />
    <rect x="1" y="16" width="26" height="2.4" rx="1" fill="currentColor" />
  </svg>
);

export default function AppShell({ children }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading) return <div className="center-msg">Chargement du dépôt…</div>;
  if (!session) return <div className="center-msg">Redirection…</div>;
  if (!profile) return <div className="center-msg">Chargement du profil…</div>;
  if (profile.active === false) {
    return <div className="center-msg">Ce compte a été désactivé. Contactez votre responsable.</div>;
  }

  const isResponsable = profile.role === 'responsable';
  const navItems = isResponsable
    ? [
        { href: '/dashboard', ic: '🏠', l: 'Accueil' },
        { href: '/stock', ic: '📦', l: 'Stock' },
        { href: '/sortie', ic: '➖', l: 'Sortie' },
        { href: '/historique', ic: '📜', l: 'Historique' },
        { href: '/gestion', ic: '⚙️', l: 'Gestion' }
      ]
    : [
        { href: '/dashboard', ic: '🏠', l: 'Accueil' },
        { href: '/stock', ic: '📦', l: 'Stock' },
        { href: '/sortie', ic: '➖', l: 'Sortie' },
        { href: '/historique', ic: '📜', l: 'Historique' },
        { href: '/profil', ic: '👤', l: 'Profil' }
      ];

  return (
    <>
      <div className="topbar">
        <div className="logo">{LOGO_SVG}</div>
        <div className="titles">
          <h1>Dépôt Pont-d&apos;Ain</h1>
          <p><span className="sync-dot"></span> Stock synchronisé en temps réel</p>
        </div>
        <Link href="/profil" className="user-chip">👤 {profile.first_name}</Link>
      </div>
      <div id="shell-content">{children}</div>
      <div className="nav-bottom">
        {navItems.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={'nitem' + (pathname === it.href || (it.href === '/gestion' && pathname.startsWith('/gestion')) ? ' active' : '')}
          >
            <span className="ic">{it.ic}</span>{it.l}
          </Link>
        ))}
      </div>
    </>
  );
}
