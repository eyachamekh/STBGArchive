import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticatedBackend, setIsAuthenticatedBackend] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [localConsultations, setLocalConsultations] = useState([]);
  const [serverNotifs, setServerNotifs] = useState([]);
  const [localNotifs, setLocalNotifs] = useState([]);
  const [activePanel, setActivePanel] = useState('dashboard');
  const [printDemande, setPrintDemande] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const [demandeFilter, setDemandeFilter] = useState('all');
  const [openDemandeId, setOpenDemandeId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchWithAuth = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...getAuthHeaders(),
      },
    });
  };

  async function restoreSession(savedUser) {
    const hasToken = !!localStorage.getItem('token');
    setCurrentUser(savedUser);
    setIsAuthenticatedBackend(!!savedUser?.dbId && hasToken);
    if (savedUser?.dbId || hasToken) {
      await refreshDemandes(savedUser);
      await loadNotifications();
      await loadConsultations();
    }
  }

  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem('stbg_local_notifs');
      if (savedNotifs) setLocalNotifs(JSON.parse(savedNotifs));
    } catch (err) {
      console.error('Unable to restore local notifications:', err);
    }

    const savedUser = localStorage.getItem('stbg_current_user');
    const token = localStorage.getItem('token');
    const restoredUser = savedUser ? JSON.parse(savedUser) : null;

    if (token) {
      const restoreTokenSession = async () => {
        try {
          const res = await fetchWithAuth('http://localhost:3000/api/auth/me');
          if (res.ok) {
            const user = await res.json();
            const restored = {
              id: user.username,
              name: user.name,
              svc: user.svc,
              code: user.code,
              role: user.role,
              dbId: user.id,
            };
            await restoreSession(restored);
            return;
          }
        } catch (err) {
          console.error('Unable to restore token session:', err);
        }
        if (restoredUser) {
          await restoreSession(restoredUser);
        }
      };
      restoreTokenSession();
    } else if (restoredUser) {
      restoreSession(restoredUser);
    }
  }, []);

  useEffect(() => {
    try {
      const savedConsults = localStorage.getItem('stbg_local_consultations');
      if (savedConsults) setLocalConsultations(JSON.parse(savedConsults));
    } catch (err) {
      console.error('Unable to restore local consultations:', err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stbg_local_consultations', JSON.stringify(localConsultations));
  }, [localConsultations]);

  useEffect(() => {
    if (!isAuthenticatedBackend) {
      setConsultations(localConsultations);
    }
  }, [isAuthenticatedBackend, localConsultations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('stbg_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('stbg_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('stbg_local_notifs', JSON.stringify(localNotifs));
  }, [localNotifs]);

  async function loadNotifications() {
    try {
      const res = await fetchWithAuth('http://localhost:3000/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setServerNotifs(data.map(n => ({
        ...n,
        time: n.time,
        id: n.id,
        meta: n.meta || {},
      })));
    } catch (err) {
      console.error('Unable to load notifications:', err);
    }
  }

  async function loadConsultations() {
    // Don't check currentUser here - it might not be set yet during restore
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetchWithAuth('http://localhost:3000/api/consultations');
        if (res.ok) {
          const data = await res.json();
          setConsultations(data.map(c => mapConsultation(c)));
          return;
        }
      } catch (err) {
        console.error('Unable to load consultations:', err);
      }
    }
    setConsultations(localConsultations);
  }

  const addNotif = (type, title, msg, time = 'maintenant', meta = {}) => {
    setLocalNotifs(prev => [{ type, title, msg, time, id: Date.now(), meta }, ...prev].slice(0, 30));
  };

  const mapConsultation = (c) => ({
    id: c.id,
    ref: c.ref,
    uid: c.username || c.uid || c.user_id,
    nom: c.requester || c.nom,
    svc: c.svc || currentUser?.svc,
    motif: c.motif,
    retour: c.retour_prevu,
    obs: c.obs || '',
    boites: c.boites ? (typeof c.boites === 'string' ? JSON.parse(c.boites) : c.boites) : [],
    statut: c.statut || 'pending',
    created: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-TN') : c.created,
    remiseObs: c.remise_obs || '',
    retourEtat: c.retour_etat || '',
  });

  const clearNotifications = () => {
    setLocalNotifs([]);
    setServerNotifs([]);
  };

  const notifs = [...localNotifs, ...serverNotifs];

  const mapArchive = (a, allUsers) => {
    const owner = allUsers.find(u => u.id === a.username) || {};
    return {
      id: a.id,
      ref: a.ref,
      code: a.service_code,
      svc: owner.svc || a.service_code,
      resp: owner.name || a.responsable || String(a.user_id),
      uid: owner.id || a.username || String(a.user_id),
      type: a.document_type,
      delai: a.delai_legale,
      dd: a.date_debut,
      df: a.date_fin,
      date_besoin: a.date_fin,
      arch: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      destRaw: a.date_destruction_prevue || '',
      destFmt: a.date_destruction_prevue || '—',
      boites_details: a.boites_details || [],
      nb: a.boites || 1,
      local: a.local_destination || 'Local Archives 1',
      obs: a.observations || '',
      statut: a.statut || 'pending',
      created: new Date(a.created_at).toLocaleDateString('fr-TN'),
      annee: new Date(a.created_at).getFullYear(),
      motif: a.motif || '',
      refDebut: a.ref_debut || (a.boites_details && a.boites_details.length > 0 ? a.boites_details[0].ref_debut : ''),
      refFin: a.ref_fin || (a.boites_details && a.boites_details.length > 0 ? a.boites_details[0].ref_fin : '')
    };
  };

  const login = async (uid, pass, dbId = null, backendUser = null) => {
    let userData;
    const backendSuccess = !!backendUser;

    if (backendUser) {
      userData = {
        id: uid,
        name: backendUser.name,
        svc: backendUser.svc,
        code: backendUser.code,
        role: backendUser.role,
        dbId: dbId || backendUser.id,
      };
    } else {
      return false;
    }

    setCurrentUser(userData);
    setIsAuthenticatedBackend(backendSuccess);
    setActivePanel('dashboard');
    addNotif('info', 'Connexion', `Bienvenue ${userData.name} — ${userData.svc}`);

    try {
      const res = await fetchWithAuth('http://localhost:3000/api/archives');
      if (res.ok) {
        const archives = await res.json();
        setDemandes(archives.map(a => mapArchive(a, [])));
      }

      if (dbId) {
        await loadNotifications();
        await loadConsultations();
      }
    } catch (err) {
      console.error('Login load error:', err);
    }

    return true;
  };

  const refreshDemandes = async (u) => {
    try {
      const isPrivileged = u.role === 'admin' || u.role === 'archiviste';
      const url = isPrivileged
        ? 'http://localhost:3000/api/archives'
        : `http://localhost:3000/api/archives?userId=${u.dbId || u.id}&role=user`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const archives = await res.json();
        setDemandes(archives.map(a => mapArchive(a, [])));
      }
    } catch (err) {
      console.error('Refresh demandes failed:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticatedBackend(false);
    setDemandes([]);
    setConsultations([]);
    setLocalNotifs([]);
    setServerNotifs([]);
    setActivePanel('dashboard');
  };

  const checkDups = (dem) => {
    // Duplicate checking is now handled by the backend
  };

  const addDemande = (dem, isEdit = false) => {
    if (isEdit) {
      // Update existing demande
      setDemandes(prev => prev.map(d => d.id === dem.id ? dem : d));
      addNotif('success', 'Demande modifiée', `${dem.ref} — ${dem.type} a été modifiée.`);
    } else {
      // Add new demande
      setDemandes(prev => [...prev, dem]);
      checkDups(dem);
      addNotif('demande', 'Nouvelle demande', `${dem.ref} — ${dem.type} (${dem.svc})`);
    }
  };

  const updateDemandeStatus = async (id, status, motif = '') => {
    setDemandes(prev => {
      const copy = [...prev];
      const i = copy.findIndex(d => d.id === id);
      if (i >= 0) copy[i] = { ...copy[i], statut: status, motif };
      return copy;
    });
    const dem = demandes.find(d => d.id === id);
    if (status === 'validated') {
      addNotif('success', '✔ Demande validée', `${dem?.ref} — ${dem?.type} a été validée.${motif ? ` Note : ${motif}` : ''}`, 'maintenant', { demandeId: id, status });
    } else if (status === 'rejected') {
      addNotif('error', '✗ Demande rejetée', `${dem?.ref} — Motif : ${motif}`, 'maintenant', { demandeId: id, status });
    }
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/archives/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: status, motif })
      });
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMsg = 'Erreur lors de la mise à jour';
        try {
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            errorMsg = error.error || error.message || errorMsg;
          } else {
            errorMsg = `Erreur ${res.status}: ${res.statusText}`;
          }
        } catch (parseErr) {
          errorMsg = `Erreur ${res.status}: ${res.statusText}`;
        }
        addNotif('error', 'Erreur', errorMsg);
        console.error('Status update failed:', res.status, errorMsg);
        return;
      }

      const data = await res.json();
      await loadNotifications();
    } catch (err) {
      console.error('Could not update status:', err);
      addNotif('error', 'Erreur', err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const removeDemande = (id) => {
    setDemandes(prev => prev.filter(d => d.id !== id));
  };

  const addConsultation = async (cons) => {
    const consultation = {
      ...cons,
      id: cons.id || Date.now(),
      uid: currentUser?.id,
      nom: currentUser?.name,
      svc: currentUser?.svc,
      created: cons.created || new Date().toLocaleDateString('fr-TN'),
      statut: cons.statut || 'pending',
    };

    let savedToBackend = false;

    if (isAuthenticatedBackend) {
      try {
        const res = await fetchWithAuth('http://localhost:3000/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            motif: cons.motif,
            retour_prevu: cons.retour,
            obs: cons.obs,
            boites: cons.boites,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          const mapped = mapConsultation(saved);
          setConsultations(prev => [mapped, ...prev]);
          setLocalConsultations(prev => [mapped, ...prev]);
          addNotif('consultation', 'Demande consultation', `Votre demande ${mapped.ref} a été envoyée.`, 'maintenant', { consultationId: mapped.id });
          savedToBackend = true;
        } else {
          const errorData = await res.json();
          console.error('Backend consultation save failed:', errorData);
          addNotif('error', 'Erreur', `Impossible de sauvegarder la consultation: ${errorData.message || errorData.error}`);
        }
      } catch (err) {
        console.error('Unable to submit consultation:', err);
        addNotif('error', 'Erreur', 'Erreur réseau lors de la création de la consultation');
      }
    }

    // Always save local metadata and backup to localStorage
    if (!savedToBackend) {
      setLocalConsultations(prev => [consultation, ...prev]);
      setConsultations(prev => [consultation, ...prev]);
      addNotif('consultation', 'Demande consultation (local)', `Votre demande ${consultation.ref} a été créée localement.`, 'maintenant', { consultationId: consultation.id });
    }

    return consultation;
  };

  const updateConsultationStatus = async (id, status, extra = {}) => {
    let updatedConsultation = null;

    if (isAuthenticatedBackend) {
      try {
        const res = await fetchWithAuth(`http://localhost:3000/api/consultations/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: status, remiseObs: extra.remiseObs, retourEtat: extra.retourEtat }),
        });
        if (res.ok) {
          const saved = await res.json();
          const mapped = mapConsultation(saved);
          setConsultations(prev => prev.map(c => (c.id === mapped.id ? mapped : c)));
          updatedConsultation = mapped;
        }
      } catch (err) {
        console.error('Unable to update consultation status:', err);
      }
    }

    if (!updatedConsultation) {
      setConsultations(prev => {
        const copy = [...prev];
        const i = copy.findIndex(c => c.id === id);
        if (i >= 0) {
          copy[i] = { ...copy[i], statut: status, ...extra };
          updatedConsultation = copy[i];
        }
        return copy;
      });
    }

    if (!updatedConsultation) return;

    if (status === 'remis') {
      addNotif('consultation', '📦 Consultation remise', `La demande ${updatedConsultation.ref} a été remise au demandeur.`, 'maintenant', { consultationId: id, status });
    } else if (status === 'returned') {
      addNotif('info', '↩ Document retourné', `Le demandeur a retourné la consultation ${updatedConsultation.ref}. Vérifiez et clôturez-la.`, 'maintenant', { consultationId: id, status });
    } else if (status === 'cloture') {
      addNotif('success', '✓ Consultation clôturée', `La consultation ${updatedConsultation.ref} est maintenant clôturée.`, 'maintenant', { consultationId: id, status });
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      activePanel, setActivePanel,
      demandes, addDemande, updateDemandeStatus, removeDemande,
      refreshDemandes,
      consultations, addConsultation, updateConsultationStatus,
      notifs, addNotif, clearNotifications,
      fetchWithAuth,
      isAuthenticatedBackend,
      printDemande, setPrintDemande,
      editRequest, setEditRequest,
      demandeFilter, setDemandeFilter,
      openDemandeId, setOpenDemandeId
    }}>
      {children}
    </AppContext.Provider>
  );
};



