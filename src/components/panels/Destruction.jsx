import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const Destruction = () => {
  const { currentUser, demandes, updateDemandeStatus, removeDemande, addNotif } = useContext(AppContext);
  const isAdmin = currentUser?.role === 'admin';

  const [selected, setSelected] = useState([]);
  const [showPV, setShowPV] = useState(false);
  const [pvNotes, setPvNotes] = useState('');
  const [pvRef, setPvRef] = useState('');
  const [showDestroyedList, setShowDestroyedList] = useState(false);

  const today = new Date();

  const eligible = demandes.filter(d =>
    d.statut === 'validated' &&
    d.destRaw &&
    d.delai !== 'Permanent' &&
    new Date(d.destRaw) <= today
  );

  const destroyedArchives = demandes.filter(d => d.statut === 'destroyed' || d.statut === 'détruite');

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
    selectedDemandes.forEach(d => updateDemandeStatus(d.id, 'destroyed', pvRef));
    addNotif('info', 'Destruction effectuée', `${selectedDemandes.length} archive(s) marquée(s) comme détruite(s) suite au PV (${pvRef}).`);
    setSelected([]);
    setShowPV(false);
    setPvRef('');
  };

  return (
    <div className="panel active">
      <div className="al al-r">⚠ Un PV de destruction signé par le DG, le DAF et l'Archiviste est obligatoire avant toute élimination physique.</div>

      {/* Tabs / Toggle buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }} className="no-print">
        <button 
          className={`btn bsm ${!showDestroyedList ? 'bdanger' : 'bg2'}`}
          onClick={() => setShowDestroyedList(false)}
        >
          📋 Éligibles à la destruction ({eligible.length})
        </button>
        <button 
          className={`btn bsm ${showDestroyedList ? 'bdanger' : 'bg2'}`}
          onClick={() => setShowDestroyedList(true)}
        >
          ⊘ Archives Détruites ({destroyedArchives.length})
        </button>
      </div>

      {showDestroyedList ? (
        <div className="tw">
          <div className="twh">
            <div>
              <div className="twt">Registre des Archives Détruites</div>
              <div className="tws">{destroyedArchives.length} archive(s) physiquement éliminée(s)</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type Document</th>
                <th>Service</th>
                <th>Période</th>
                <th>PV de Destruction</th>
                <th>Local d'Origine</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {!destroyedArchives.length ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '26px', color: 'var(--text3)' }}>Aucune archive détruite.</td></tr>
              ) : (
                destroyedArchives.map(d => (
                  <tr key={d.id}>
                    <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                    <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px', fontWeight: 600 }}>{d.motif || 'Non spécifié'}</span></td>
                    <td style={{ fontSize: '10px' }}>{d.local}</td>
                    <td><span className="badge br">⊘ Détruite</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tw">
          <div className="twh">
            <div>
              <div className="twt">Documents Éligibles à la Destruction</div>
              <div className="tws">{eligible.length} archive(s) dont la date de destruction est dépassée</div>
            </div>
            {isAdmin && eligible.length > 0 && (
              <button className="btn bdanger bsm" onClick={() => {
                setShowPV(true);
                setPvRef(`PV-DEST-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
                if (selected.length === 0) setSelected(eligible.map(d => d.id));
              }}>
                📄 Générer PV
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
      )}

      {showPV && (
        <div className="mo show" style={{ background: 'rgba(0, 0, 0, .82)' }}>
          <div className="modal modal-lg" style={{ background: 'white', color: '#1a1a1a' }}>
            <div className="mt" style={{ display: 'none' }}>📄 Procès-Verbal de Destruction</div>
            <div className="ms" style={{ display: 'none' }}>À imprimer, signer et archiver avant destruction physique.</div>

            <div style={{ background: 'white', color: '#1a1a1a', border: 'none', borderRadius: '0px', padding: '32px', fontFamily: "'Syne', sans-serif", marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Header with Logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '3px solid #1a1a1a' }}>
                <img src="/logo-stbg.jpg" alt="STBG Logo" style={{ height: '60px', marginRight: '16px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '1px', marginBottom: '4px' }}>SOCIÉTÉ TUNISIENNE DES BOISSONS GAZEUSES</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#666', marginBottom: '8px' }}>— STBG —</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginTop: '8px' }}>PROCÈS-VERBAL DE DESTRUCTION D'ARCHIVES</div>
                </div>
              </div>

              {/* Reference and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', fontSize: '10px', fontFamily: "'DM Mono', monospace" }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Date:</div>
                  <div>{new Date().toLocaleDateString('fr-TN')}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Référence PV:</div>
                  <div>{pvRef}</div>
                </div>
              </div>

              {/* Observations Field */}
              <div className="no-print" style={{ marginBottom: '24px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#fafafa' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>📝 Notes / Observations (modifiable):</label>
                <textarea
                  value={pvNotes}
                  onChange={e => setPvNotes(e.target.value)}
                  placeholder="Ajouter des observations ou notes spécifiques..."
                  style={{ width: '100%', height: '60px', padding: '8px', fontSize: '10px', fontFamily: "'DM Mono', monospace", border: '1px solid #ccc', borderRadius: '3px', resize: 'none' }}
                />
              </div>

              {/* Objet Section */}
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #eee' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>◆ Objet</div>
                <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify', color: '#333' }}>
                  Le présent procès-verbal atteste que les documents mentionnés ci-dessous, arrivés à expiration de leur durée légale de conservation conformément au calendrier de conservation des archives de l'entreprise, sont autorisés à être détruits.
                </div>
              </div>

              {/* Documents Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ background: '#2a3f5f', color: 'white', fontWeight: 700 }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Référence</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Type de Document</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Service</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Période</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Délai</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Local</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDemandes.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? '#f8f8f8' : 'white', borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 10px', fontFamily: "'DM Mono',monospace", fontWeight: 700, borderRight: '1px solid #eee' }}>{d.ref}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>{d.type}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>{d.svc}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>{d.delai}</td>
                      <td style={{ padding: '8px 10px' }}>{d.local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pvNotes && pvNotes.trim() && (
                <div style={{ background: '#fffbf0', padding: '12px', borderLeft: '4px solid #d4a574', marginBottom: '20px', fontSize: '10px', fontFamily: "'DM Mono', monospace", borderRadius: '2px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '11px' }}>📌 Observations:</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{pvNotes}</div>
                </div>
              )}

              <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>◆ Déclaration</div>
                <div style={{ fontSize: '10px', lineHeight: '1.8', textAlign: 'justify', color: '#333' }}>
                  Après vérification, les documents ci-dessus ne présentent plus d'intérêt administratif, juridique ou historique et sont déclarés éligibles à la destruction.
                  <br /><br />
                  La destruction sera effectuée selon les procédures en vigueur afin de garantir la confidentialité des informations.
                </div>
              </div>

              {/* Signatures Section */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '24px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>Approuvé par</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  {[['Directeur Général'], ['Directeur Administratif & Financier'], ['Archiviste']].map(([title]) => (
                    <div key={title} style={{ textAlign: 'center', paddingTop: '12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '60px' }}>{title}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}

            </div>

            <div className="mf">
              <button className="btn bg2" onClick={() => {
                setShowPV(false);
                setPvNotes('');
                setPvRef('');
              }}>Annuler</button>
              <button className="btn bg2" onClick={() => {
                setTimeout(() => window.print(), 100);
              }}>🖨 Imprimer PV</button>
              <button className="btn bdanger" onClick={() => {
                confirmerDestruction();
                setPvNotes('');
              }}>✓ Confirmer la Destruction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Destruction;
