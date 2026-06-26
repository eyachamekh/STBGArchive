import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../data';

const Users = () => {
  const { currentUser, addNotif, fetchWithAuth, isAuthenticatedBackend } = useContext(AppContext);
  const [userList, setUserList] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const roleNames = { archiviste: 'Archiviste Central', admin: 'Administrateur', service: 'Responsable Service' };
  const roleClasses = { archiviste: 'br', admin: 'bg', service: 'bb' };

  useEffect(() => {
    if (!currentUser) return;

    const loadUsers = async () => {
      try {
        const res = await fetchWithAuth('http://localhost:3000/api/users');
        if (res.ok) {
          const users = await res.json();
          setUserList(users);
          setLoadError(null);
          return;
        }

        if (res.status === 401 || res.status === 403) {
          const fallback = await fetch('http://localhost:3000/api/users/public');
          if (fallback.ok) {
            const users = await fallback.json();
            setUserList(users);
            setLoadError('Affichage en lecture seule. Connectez-vous via le backend pour voir tous les comptes et réinitialiser les mots de passe.');
            return;
          }
        }

        setUserList([]);
        setLoadError('Impossible de charger la liste des utilisateurs.');
      } catch (err) {
        console.error('Error loading users:', err);
        setUserList([]);
        setLoadError('Erreur réseau lors du chargement des utilisateurs.');
      }
    };

    loadUsers();
  }, [currentUser, fetchWithAuth]);

  const canResetPassword = currentUser?.role === 'admin' && isAuthenticatedBackend;

  const handleReset = async (user) => {
    if (!canResetPassword) {
      addNotif('error', 'Réinitialisation impossible', 'Connectez-vous en tant qu’administrateur backend pour réinitialiser un mot de passe.');
      return;
    }

    const newPassword = window.prompt(`Réinitialiser le mot de passe de ${user.name} (${user.username}) :`, 'stbg2025');
    if (!newPassword) return;

    console.log('Password reset attempt - User ID:', user.id, 'Username:', user.username);
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Échec de la réinitialisation');
      }
      addNotif('success', 'Mot de passe réinitialisé', `Le mot de passe de ${user.name} a bien été réinitialisé.`);
    } catch (err) {
      console.error('Reset failed:', err);
      addNotif('error', 'Réinitialisation échouée', `Impossible de réinitialiser le mot de passe de ${user.name}.`);
    }
  };

  return (
    <div className="panel active">
      <div className="al al-b"> Gestion des comptes. Seul l'administrateur peut modifier les accès.</div>
      <div className="tw">
        <div className="twh"><div className="twt">Comptes Utilisateurs STBG</div></div>
        {loadError && <div className="login-err" style={{ display: 'block', marginBottom: '12px' }}>{loadError}</div>}
        {currentUser?.role === 'admin' && (
          <div style={{ marginBottom: '12px', color: isAuthenticatedBackend ? '#0f0' : '#f44', fontWeight: 600 }}>
            {/* {isAuthenticatedBackend ? 'Connexion backend active — réinitialisation possible.' : 'Connexion backend inactive — la réinitialisation est désactivée.'} */}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Service</th>
              <th>Code</th>
              <th>Rôle</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => {
              const col = COLORS[u.code] || '#666';
              const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <tr key={u.id || u.username}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <span className="tdm">{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '11px' }}>{u.svc}</td>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--gold)' }}>{u.code}</span></td>
                  <td><span className={`badge ${roleClasses[u.role]}`}>{roleNames[u.role]}</span></td>
                  <td>
                    <button
                      className="btn bg2"
                      onClick={() => handleReset(u)}
                      disabled={!canResetPassword}
                      style={{ opacity: canResetPassword ? 1 : 0.5, cursor: canResetPassword ? 'pointer' : 'not-allowed' }}
                    >
                      Réinitialiser
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
