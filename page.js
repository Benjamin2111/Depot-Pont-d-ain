'use client';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import HistoryRow from '../../components/HistoryRow';
import { useAuth } from '../../lib/AuthProvider';
import { useData } from '../../lib/DataProvider';

export default function ProfilPage() {
  return (
    <AppShell>
      <ProfilContent />
    </AppShell>
  );
}

function ProfilContent() {
  const { profile, logout } = useAuth();
  const { movements, loadingData } = useData();
  const router = useRouter();

  if (loadingData) return <div className="center-msg">Chargement…</div>;

  const mine = movements.filter((m) => m.user_id === profile.id).slice(0, 15);
  const initials = ((profile.first_name[0] || '') + (profile.last_name[0] || '')).toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Mon profil</h2>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--steel)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, fontFamily: "'Barlow Condensed',sans-serif" }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{profile.first_name} {profile.last_name}</div>
          <span className={'role-tag role-' + profile.role}>{profile.role === 'responsable' ? 'Responsable' : 'Ouvrier'}</span>
        </div>
      </div>
      {profile.role === 'responsable' && (
        <button className="btn btn-steel btn-block" style={{ marginBottom: 16 }} onClick={() => router.push('/gestion')}>⚙️ Gestion</button>
      )}
      <div className="section-title" style={{ marginTop: 0 }}>Mes derniers mouvements</div>
      {mine.length === 0 ? (
        <div className="empty">Aucun mouvement enregistré.</div>
      ) : (
        <div className="list">{mine.map((m) => <HistoryRow key={m.id} m={m} />)}</div>
      )}
      <button className="btn btn-danger-outline btn-block" style={{ marginTop: 22 }} onClick={handleLogout}>Se déconnecter</button>
    </>
  );
}
