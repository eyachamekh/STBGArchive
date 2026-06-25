import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../data';
import NotificationPanel from './NotificationPanel';

const Topbar = () => {
  const { currentUser, notifs, activePanel } = useContext(AppContext);
  const [showNotifs, setShowNotifs] = useState(false);

  if (!currentUser) return null;

  const getPanelName = (id) => {
    const titles = {
      dashboard: 'Tableau de Bord', nouvelle: 'Nouvelle Demande', mes: 'Mes Demandes',
      consultation: 'Demande de Consultation', 'gestion-consult': 'Gestion des Consultations',
      validation: 'Validation Archivage', registre: 'Registre Général', doublons: 'Alertes Doublons',
      destruction: 'À Détruire', delais: 'Délais Légaux', locaux: 'État des Locaux',
      procedure: 'Procédure', users: 'Utilisateurs'
    };
    return titles[id] || id;
  };

  const avText = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const avBg = COLORS[currentUser.code] || '#666';
  const roleNames = { archiviste: 'Archiviste Central', admin: 'Administrateur', service: 'Responsable Service' };

  return (
    <div className="topbar">
      <div className="tb-left">
        <img src="/logo-stbg.jpg" alt="STBG Logo" className="stbg-logo-img" />
        <div className="tb-brand">Archive<span>Pro</span></div>
        <div className="tb-sep"></div>
        <div className="tb-page">{getPanelName(activePanel)}</div>
      </div>
      <div className="tb-right">
        <div className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
          🔔
          {notifs.length > 0 && <div className="notif-dot" style={{ display: 'block' }}></div>}
        </div>
        <div className="user-chip">
          <div className="ua" style={{ background: avBg }}>{avText}</div>
          <div>
            <div className="un">{currentUser.name}</div>
            <div className="ur">{roleNames[currentUser.role] || currentUser.role}</div>
          </div>
        </div>
      </div>
      {showNotifs && <NotificationPanel close={() => setShowNotifs(false)} />}
    </div>
  );
};

export default Topbar;
