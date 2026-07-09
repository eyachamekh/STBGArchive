import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { DUP_RULES } from '../../utils/constants';

const Sidebar = () => {
  const { currentUser, logout, activePanel, setActivePanel, demandes, consultations } = useContext(AppContext);

  if (!currentUser) return null;

  const r = currentUser.role;

  const pend = demandes.filter(d => d.statut === 'pending').length;
  const total = demandes.filter(d => d.statut === 'validated').length;
  const mine = demandes.filter(d => d.uid === currentUser.id).length;
  const myRejected = demandes.filter(d => d.uid === currentUser.id && d.statut === 'rejected').length;
  const cpend = consultations.filter(c => c.statut === 'pending').length;

  let dupsCount = 0;
  DUP_RULES.forEach(rule => {
    const f = demandes.filter(d => rule.svcs.includes(d.code) && (d.type.toLowerCase().includes(rule.kw.toLowerCase()) || rule.types.some(t => d.type.toLowerCase().includes(t.toLowerCase()))));
    if (f.length >= 2) dupsCount++;
  });

  const NavItem = ({ id, icon, lbl, badgeCount, badgeClass }) => {
    const isActive = activePanel === id;
    return (
      <div className={`ni ${isActive ? 'active' : ''}`} onClick={() => setActivePanel(id)}>
        <span className="ni-icon">{icon}</span>{lbl}
        {badgeCount > 0 && <span className={`nbadge ${badgeClass}`}>{badgeCount}</span>}
      </div>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-stbg.jpg" alt="STBG Logo" className="stbg-logo-sidebar" />
      </div>
      <div className="snav">
        <div className="slbl">Général</div>
        <NavItem id="dashboard" icon="◈" lbl="Tableau de Bord" />

        <div className="slbl">Archives</div>
        {(r === 'service' || r === 'archiviste') && <NavItem id="nouvelle" icon="＋" lbl="Nouvelle Demande" />}
        {(r === 'service' || r === 'archiviste') && <NavItem id="mes" icon="◧" lbl="Mes Demandes" badgeCount={mine} badgeClass="nb-g" />}
        {/* {(r === 'service' || r === 'archiviste') && <NavItem id="validation" icon="✓" lbl="Mes Validations" badgeCount={myRejected} badgeClass="nb-r" />} */}
        {(r === 'service' || r === 'archiviste') && <NavItem id="consultation" icon="📤" lbl="Demande de Consultation" />}
        {r === 'service' && <NavItem id="gestion-consult" icon="📋" lbl="Gestion Consultations" badgeCount={cpend} badgeClass="nb-b" />}


        {(r === 'archiviste' || r === 'admin') && (
          <>
            <div className="slbl">Archiviste</div>
            <NavItem id="validation" icon="✓" lbl="Validation Archivage" badgeCount={pend} badgeClass="nb-o" />
            <NavItem id="gestion-consult" icon="📋" lbl="Gestion Consultations" badgeCount={cpend} badgeClass="nb-b" />
            <NavItem id="registre" icon="▣" lbl="Registre Général" badgeCount={total} badgeClass="nb-g" />
            <NavItem id="destruction" icon="⊘" lbl="À Détruire" />
          </>
        )}

        {r === 'archiviste' && (
          <>
            <div className="slbl">Administration</div>
            <NavItem id="users" icon="🔐" lbl="Utilisateurs" />
          </>
        )}

        <div className="slbl">Référentiels</div>
        <NavItem id="delais" icon="⏱" lbl="Délais Légaux" />
        <NavItem id="procedure" icon="📖" lbl="Procédure" />

        {r === 'admin' && (
          <>
            <div className="slbl">Administration</div>
            <NavItem id="users" icon="🔐" lbl="Utilisateurs" />
          </>
        )}
      </div>
      <div className="sf">
        <div style={{ color: 'var(--text2)', fontWeight: '600' }}>STBG Archives</div>
        <div>Société Tunisienne des<br />Boissons Gazeuses</div>
        <button className="logout-btn" onClick={logout}>⎋ Déconnexion</button>
      </div>
    </aside>
  );
};

export default Sidebar;
