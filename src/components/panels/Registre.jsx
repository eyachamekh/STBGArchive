import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const Registre = () => {
  const { demandes, setPrintDemande } = useContext(AppContext);
  const [filter, setFilter] = useState('');
  const [showDestroyed, setShowDestroyed] = useState(false);

  const today = new Date();

  const isDestroyed = (d) => {
    if (d.statut === 'destroyed' || d.statut === 'détruite') return false;
    if (!d.destRaw || d.destRaw === '' || d.delai === 'Permanent') return false;
    return new Date(d.destRaw) <= today;
  };

  const baseList = demandes.filter(d =>
    !filter ||
    d.ref.toLowerCase().includes(filter.toLowerCase()) ||
    d.svc.toLowerCase().includes(filter.toLowerCase()) ||
    d.type.toLowerCase().includes(filter.toLowerCase())
  );

  const list = (showDestroyed ? baseList.filter(isDestroyed) : baseList.filter(d => !isDestroyed(d))).slice().reverse();
  const destroyedCount = demandes.filter(isDestroyed).length;

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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <div className="sb" style={{ flex: 1, margin: 0 }}>
          <span style={{ color: 'var(--text3)' }}>⌕</span>
          <input placeholder="Référence, service, type document..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <button
          className={`btn bsm ${showDestroyed ? 'bdanger' : 'bg2'}`}
          onClick={() => setShowDestroyed(v => !v)}
        >
          ⊘ À détruire{destroyedCount > 0 && <span className="nbadge nb-r" style={{ marginLeft: '6px' }}>{destroyedCount}</span>}
        </button>
      </div>

      {showDestroyed && (
        <div className="al al-r">⊘ Affichage des archives à détruire — {destroyedCount} document(s) dont la date de destruction est dépassée.</div>
      )}

      <div className="tw">
        <div className="twh">
          <div className="twt">
            {showDestroyed ? 'Archives À Détruire' : 'Registre Général des Archives STBG'}
          </div>
          {showDestroyed && <button className="btn bg2 bsm" onClick={() => setShowDestroyed(false)}>← Tout afficher</button>}
        </div>
        <table>
          <thead>
            <tr><th>Référence</th><th>Type Document</th><th>Service</th><th>Période</th><th>Réf. Début–Fin</th><th>Délai</th><th>Destruction</th><th>Local</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {!list.length ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>
                {showDestroyed ? 'Aucune archive détruite.' : 'Aucune boîte.'}
              </td></tr>
            ) : (
              list.map(d => {
                const ri = d.refDebut && d.refFin ? `${d.refDebut} → ${d.refFin}` : (d.refDebut || d.refFin || '—');
                const destroyed = isDestroyed(d);
                return (
                  <tr key={d.id} style={destroyed ? { background: 'rgba(200,16,46,0.05)' } : {}}>
                    <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px' }}>{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)}<br /><span style={{ color: 'var(--text3)' }}>à {fmtDate(d.df)}</span></td>
                    <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace", maxWidth: '120px' }}>{ri}</td>
                    <td><span className={`badge ${d.delai === 'Permanent' ? 'bb' : 'bo'}`}>{d.delai}</span></td>
                    <td style={{ fontSize: '10px', color: destroyed ? 'var(--red)' : 'var(--text3)', fontFamily: "'DM Mono',monospace", fontWeight: destroyed ? 700 : 400 }}>
                      {fmtDate(d.destRaw)}
                      {destroyed && <div><span className="badge br" style={{ marginTop: '3px' }}>⊘ Dépassée</span></div>}
                    </td>
                    <td style={{ fontSize: '10px' }}>{d.local}</td>
                    <td>{statutBadge(d.statut)}</td>
                    <td>{d.statut === 'validated' ? <button className="btn bg2 bsm" onClick={() => setPrintDemande(d)}>🖨</button> : null}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Registre;
