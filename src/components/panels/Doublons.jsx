import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const Doublons = () => {
  const { demandes, removeDemande, addNotif } = useContext(AppContext);

  const dups = [];
  // Duplicate checking is now handled by the backend

  const annulerDup = (id) => {
    if (window.confirm('Confirmer l\'annulation de cette archive (doublon) ?')) {
      removeDemande(id);
      addNotif('info', 'Archive annulée', 'Doublon supprimé.');
    }
  };

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const statutBadge = (s) => {
    if (s === 'pending') return <span className="badge bo">⏳ En attente</span>;
    if (s === 'validated') return <span className="badge bg">✓ Validée</span>;
    if (s === 'rejected') return <span className="badge br">✗ Rejetée</span>;
    return null;
  };

  return (
    <div className="panel active">
      {/* <div className="al al-o">⚠ Détection automatique de doublons — deux services archivent des documents similaires. Vérifiez et annulez l'archive redondante pour optimiser l'espace.</div> */}
      <div>
        {!dups.length ? (
          <div className="al al-g">✓ Aucun doublon potentiel détecté.</div>
        ) : (
          dups.map((dp, i) => (
            <div key={i} style={{ background: 'rgba(230,126,34,.06)', border: '2px solid var(--orange)', borderRadius: '9px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f39c12', marginBottom: '8px' }}>⚠ Doublon #{i + 1} — {dp.kw}</div>
              <div style={{ fontSize: '11px', color: '#f39c12', marginBottom: '10px' }}>{dp.msg}</div>
              <div className="tw" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr><th>Référence</th><th>Type</th><th>Service</th><th>Responsable</th><th>Période</th><th>Statut</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {dp.found.map(d => (
                      <tr key={d.id}>
                        <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{d.ref}</span></td>
                        <td className="tdm">{d.type}</td>
                        <td>{d.svc}</td>
                        <td style={{ fontSize: '10px' }}>{d.resp}</td>
                        <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                        <td>{statutBadge(d.statut)}</td>
                        <td><button className="btn bdanger bsm" onClick={() => annulerDup(d.id)}>✕ Annuler</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Doublons;
