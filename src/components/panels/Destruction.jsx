import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const Destruction = () => {
  const { currentUser, demandes, removeDemande, addNotif } = useContext(AppContext);
  const isAdmin = currentUser?.role === 'admin';

  const [selected, setSelected] = useState([]);
  const [showPV, setShowPV] = useState(false);

  const today = new Date();

  const eligible = demandes.filter(d =>
    d.statut === 'validated' &&
    d.destRaw &&
    d.delai !== 'Permanent' &&
    new Date(d.destRaw) <= today
  );

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const overshoot = (destRaw) => {
    const diff = Math.floor((today - new Date(destRaw)) / (1000 * 60 * 60 * 24 * 365));
    return diff <= 0 ? '< 1 an' : `+${diff} an${diff > 1 ? 's' : ''}`;
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === eligible.length) setSelected([]);
    else setSelected(eligible.map(d => d.id));
  };

  const selectedDemandes = eligible.filter(d => selected.includes(d.id));

  const confirmerDestruction = () => {
    selectedDemandes.forEach(d => removeDemande(d.id));
    addNotif('info', 'Destruction effectuée', `${selectedDemandes.length} archive(s) supprimée(s) suite au PV.`);
    setSelected([]);
    setShowPV(false);
  };

  return (
    <div className="panel active">
      <div className="al al-r">⚠ Un PV de destruction signé par le DG, le DAF et l'Archiviste est obligatoire avant toute élimination physique.</div>

      <div className="tw">
        <div className="twh">
          <div>
            <div className="twt">Documents Éligibles à la Destruction</div>
            <div className="tws">{eligible.length} archive(s) dont la date de destruction est dépassée</div>
          </div>
          {isAdmin && selected.length > 0 && (
            <button className="btn bdanger bsm" onClick={() => setShowPV(true)}>
              📄 Générer PV ({selected.length})
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              {isAdmin && <th><input type="checkbox" checked={selected.length === eligible.length && eligible.length > 0} onChange={toggleAll} /></th>}
              <th>Référence</th><th>Type Document</th><th>Service</th><th>Période</th><th>Délai</th><th>Dépassement</th><th>Local</th>
            </tr>
          </thead>
          <tbody>
            {!eligible.length ? (
              <tr><td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '26px', color: 'var(--text3)' }}>Aucun document éligible à la destruction.</td></tr>
            ) : (
              eligible.map(d => (
                <tr key={d.id} style={selected.includes(d.id) ? { background: 'rgba(200,16,46,0.07)' } : {}}>
                  {isAdmin && (
                    <td><input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} /></td>
                  )}
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{d.ref}</span></td>
                  <td className="tdm">{d.type}</td>
                  <td>{d.svc}</td>
                  <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                  <td><span className="badge bo">{d.delai}</span></td>
                  <td><span className="badge br">{overshoot(d.destRaw)}</span></td>
                  <td style={{ fontSize: '10px' }}>{d.local}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPV && (
        <div className="mo show">
          <div className="modal modal-lg">
            <div className="mt">📄 Procès-Verbal de Destruction</div>
            <div className="ms">À imprimer, signer et archiver avant destruction physique.</div>

            <div style={{ background: 'white', color: '#111', border: '2px solid #111', borderRadius: '8px', padding: '24px', fontFamily: "'Syne', sans-serif", marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '2px' }}>SOCIÉTÉ TUNISIENNE DES BOISSONS GAZEUSES — STBG</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '6px', borderBottom: '2px solid #111', paddingBottom: '8px' }}>PROCÈS-VERBAL DE DESTRUCTION D'ARCHIVES</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', fontFamily: "'DM Mono', monospace" }}>
                  Date : {new Date().toLocaleDateString('fr-TN')} &nbsp;|&nbsp; Réf. PV : PV-DEST-{new Date().getFullYear()}-{String(Date.now()).slice(-4)}
                </div>
              </div>

              <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: '1.7' }}>
                Nous soussignés, représentants de la Société Tunisienne des Boissons Gazeuses (STBG), certifions avoir procédé à la destruction des archives suivantes dont les délais légaux de conservation sont dépassés, conformément à la réglementation en vigueur.
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#111', color: 'white' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Référence</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Type de Document</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Service</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Période</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Délai</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Local</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDemandes.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '5px 10px', fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{d.ref}</td>
                      <td style={{ padding: '5px 10px' }}>{d.type}</td>
                      <td style={{ padding: '5px 10px' }}>{d.svc}</td>
                      <td style={{ padding: '5px 10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                      <td style={{ padding: '5px 10px' }}>{d.delai}</td>
                      <td style={{ padding: '5px 10px' }}>{d.local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '24px' }}>
                {[['Directeur Général', 'DG'], ['Directeur Administratif & Financier', 'DAF'], ['Archiviste Central', 'Karim Sghaouria']].map(([title, name]) => (
                  <div key={title} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{title}</div>
                    <div style={{ fontSize: '10px', color: '#666', fontFamily: "'DM Mono',monospace", marginBottom: '20px' }}>{name}</div>
                    <div style={{ borderTop: '1px solid #bbb', paddingTop: '4px', fontSize: '9px', color: '#999' }}>Signature & Cachet</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mf">
              <button className="btn bg2" onClick={() => setShowPV(false)}>Annuler</button>
              <button className="btn bg2" onClick={() => window.print()}>🖨 Imprimer PV</button>
              <button className="btn bdanger" onClick={confirmerDestruction}>✓ Confirmer la Destruction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Destruction;
