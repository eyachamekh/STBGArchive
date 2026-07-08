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
    if (s === 'destroyed' || s === 'détruite') return <span className="badge br">⊘ Détruite</span>;
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
            <div key={i} className="doublon-box">
              <div className="doublon-title">⚠ Doublon #{i + 1} — {dp.kw}</div>
              <div className="doublon-msg">{dp.msg}</div>
              <div className="tw m-0">
                <table>
                  <thead>
                    <tr><th>Référence</th><th>Type</th><th>Service</th><th>Responsable</th><th>Période</th><th>Statut</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {dp.found.map(d => (
                      <tr key={d.id}>
                        <td><span className="ref-mono">{d.ref}</span></td>
                        <td className="tdm">{d.type}</td>
                        <td>{d.svc}</td>
                        <td className="fs-10">{d.resp}</td>
                        <td className="fs-10">{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
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
