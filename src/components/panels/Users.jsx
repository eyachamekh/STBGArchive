import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../utils/constants';

const SERVICES = [
  { code: 'AUD', name: 'Audit' }, { code: 'ADM', name: 'Administration' },
  { code: 'CPT', name: 'Comptabilité' }, { code: 'COM', name: 'Commercial' },
  { code: 'REC', name: 'Recouvrement' }, { code: 'FOR', name: 'Formation' },
  { code: 'ASS', name: 'Assurance' }, { code: 'QHS', name: 'QHSE' },
  { code: 'FIN', name: 'Finance' }, { code: 'ACH', name: 'Achat' },
  { code: 'SCH', name: 'Supply Chain' }, { code: 'RH', name: 'RH' },
  { code: 'SEC', name: 'Sécurité' }, { code: 'STP', name: 'Stock Plein' },
  { code: 'MAG', name: 'Magasin Central' }, { code: 'STV', name: 'Stock Vide' },
  { code: 'CQL', name: 'QHSE - Contrôle Qualité' }, { code: 'HSE', name: 'QHSE - HSE' },
  { code: 'BME', name: 'Bureau Méthodes' }, { code: 'PRD', name: 'Production' },
  { code: 'SIR', name: 'Siroperie' }, { code: 'STE', name: 'STEP' },
  { code: 'PNC', name: 'PNC' }, { code: 'PAR', name: 'Parc Roulant' },
  { code: 'LOG', name: 'Logistique' },
  { code: 'ARC', name: 'Archive' },
];

const EMPTY_FORM = { username: '', full_name: '', service_code: 'AUD', role: 'service', password: '' };

const Users = () => {
  const { currentUser, addNotif, fetchWithAuth, isAuthenticatedBackend } = useContext(AppContext);
  const [userList, setUserList] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const roleNames = { archiviste: 'Archiviste Central', admin: 'Administrateur', service: 'Responsable Service' };
  const roleClasses = { archiviste: 'br', admin: 'bg', service: 'bb' };

  const loadUsers = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:3000/api/users');
      if (res.ok) {
        const users = await res.json();
        setUserList(users);
        setLoadError(null);
        return;
      }
      setUserList([]);
      setLoadError('Impossible de charger la liste des utilisateurs.');
    } catch (err) {
      setUserList([]);
      setLoadError('Erreur réseau lors du chargement des utilisateurs.');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadUsers();
  }, [currentUser, fetchWithAuth]);

  const canManage = currentUser?.role === 'admin' && isAuthenticatedBackend;

  const handleAdd = async () => {
    if (!form.username.trim() || !form.full_name.trim() || !form.password.trim()) {
      alert('Tous les champs sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');
      addNotif('success', 'Utilisateur créé', `${form.full_name} a été ajouté avec succès.`);
      setShowAdd(false);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer le compte de ${user.name} (${user.username}) ? Cette action est irréversible.`)) return;
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      addNotif('info', 'Utilisateur supprimé', `Le compte de ${user.name} a été supprimé.`);
      await loadUsers();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleReset = async (user) => {
    if (!canManage) {
      addNotif('error', 'Réinitialisation impossible', 'Connectez-vous en tant qu\'administrateur backend.');
      return;
    }
    const newPassword = window.prompt(`Réinitialiser le mot de passe de ${user.name} (Requis: min 8 caractères, majuscule, minuscule, chiffre, caractère spécial) :`, '');
    if (!newPassword) return;
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/users/${user.id}/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      addNotif('success', 'Mot de passe réinitialisé', `Le mot de passe de ${user.name} a été réinitialisé.`);
    } catch (err) {
      addNotif('error', 'Réinitialisation échouée', err.message);
    }
  };

  return (
    <div className="panel active">
      <div className="al al-b">Gestion des comptes. Seul l'administrateur peut modifier les accès.</div>
      <div className="tw">
        <div className="twh">
          <div className="twt">Comptes Utilisateurs STBG</div>
          {canManage && (
            <button className="btn bp2 bsm" onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); }}>+ Ajouter</button>
          )}
        </div>
        {loadError && <div className="login-err login-err-inline">{loadError}</div>}
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Service</th>
              <th>Code</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => {
              const col = COLORS[u.code] || '#666';
              const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <tr key={u.id || u.username}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-circle" style={{ background: col }}>
                        {initials}
                      </div>
                      <div>
                        <span className="tdm">{u.name}</span>
                        <div className="user-cell-sub">{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="fs-11">{u.svc}</td>
                  <td><span className="ref-mono fs-11">{u.code}</span></td>
                  <td><span className={`badge ${roleClasses[u.role]}`}>{roleNames[u.role]}</span></td>
                  <td>
                    <div className="flex gap-4">
                      {canManage && (
                        <button
                          className="btn bg2 bsm"
                          onClick={() => handleReset(u)}
                        >
                          🔑 Réinitialiser
                        </button>
                      )}
                      {canManage && u.username !== currentUser?.id && (
                        <button className="btn bdanger bsm" onClick={() => handleDelete(u)}>✕ Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Ajouter un Utilisateur</div>
            <div className="ms">Le compte sera immédiatement disponible à la connexion.</div>
            <div className="fg">
              <div className="fgrp">
                <div className="flbl">Nom d'utilisateur (login) *</div>
                <input className="finp" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}/>
              </div>
              <div className="fgrp">
                <div className="flbl">Mot de passe *</div>
                <input className="finp" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mot de passe fort (ex: User@123Stbg!)" />
              </div>
              <div className="fgrp full">
                <div className="flbl">Nom complet *</div>
                <input className="finp" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}/>
              </div>
              <div className="fgrp">
                <div className="flbl">Service *</div>
                <select value={form.service_code} onChange={e => setForm(f => ({ ...f, service_code: e.target.value }))}>
                  {SERVICES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="fgrp">
                <div className="flbl">Rôle *</div>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="service">Responsable Service</option>
                  <option value="archiviste">Archiviste Central</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setShowAdd(false)} disabled={saving}>Annuler</button>
              <button className="btn bp2" onClick={handleAdd} disabled={saving}>{saving ? '⏳ Enregistrement...' : '✓ Créer le compte'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
