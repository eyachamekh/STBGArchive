import { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext';

const NotificationPanel = ({ close }) => {
  const { notifs, clearNotifications, setActivePanel, setDemandeFilter, setOpenDemandeId } = useContext(AppContext);
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.notif-btn')) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [close]);

  const cols = {
    demande: 'var(--gold)',
    consultation: 'var(--blue)',
    warning: 'var(--orange)',
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--text3)'
  };

  const handleClickNotif = (n) => {
    if (n.meta && n.meta.demandeId) {
      setActivePanel('mes');
      setDemandeFilter(n.meta.status || 'all');
      setOpenDemandeId(n.meta.demandeId);
    }
    close();
  };

  return (
    <div className="np show" ref={ref}>
      <div className="nph">
        <span>Notifications</span>
        <button onClick={() => { clearNotifications(); close(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '10px' }}>
          Effacer
        </button>
      </div>
      <div id="nlist">
        {!notifs.length && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '11px' }}>Aucune notification</div>}
        {notifs.map(n => (
          <div className="npi" key={n.id} onClick={() => handleClickNotif(n)} style={{ cursor: 'pointer' }}>
            <div className="npt" style={{ color: cols[n.type] }}>{n.type.toUpperCase()}</div>
            <div className="npm"><strong>{n.title}</strong><br />{n.msg}</div>
            <div className="nptm">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
