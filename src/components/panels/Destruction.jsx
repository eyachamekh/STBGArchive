import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 15;

const Destruction = () => {
  const { currentUser, demandes, updateDemandeStatus, removeDemande, addNotif } = useContext(AppContext);
  const isAdmin = currentUser?.role === 'admin';

  const [selected, setSelected] = useState([]);
  const [showPV, setShowPV] = useState(false);
  const [pvNotes, setPvNotes] = useState('');
  const [pvRef, setPvRef] = useState('');
  const [showDestroyedList, setShowDestroyedList] = useState(false);
  const [viewPvArchive, setViewPvArchive] = useState(null);
  const [pageEligible, setPageEligible] = useState(1);
  const [pageDestroyed, setPageDestroyed] = useState(1);

  const today = new Date();

  const allEligible = demandes.filter(d =>
    d.statut === 'validated' &&
    d.destRaw &&
    d.delai !== 'Permanent' &&
    new Date(d.destRaw) <= today
  );

  const allDestroyedArchives = demandes.filter(d => d.statut === 'destroyed' || d.statut === 'détruite');

  const totalPagesEligible = Math.ceil(allEligible.length / ITEMS_PER_PAGE);
  const eligible = allEligible.slice((pageEligible - 1) * ITEMS_PER_PAGE, pageEligible * ITEMS_PER_PAGE);

  const totalPagesDestroyed = Math.ceil(allDestroyedArchives.length / ITEMS_PER_PAGE);
  const destroyedArchives = allDestroyedArchives.slice((pageDestroyed - 1) * ITEMS_PER_PAGE, pageDestroyed * ITEMS_PER_PAGE);

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
      <div className="flex gap-8 mb-16 no-print">
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
            ⊘ Archives Détruites ({allDestroyedArchives.length})
          </button>
      </div>

      {showDestroyedList ? (
        <div className="tw">
          <div className="twh">
            <div>
              <div className="twt">Registre des Archives Détruites</div>
              <div className="tws">{allDestroyedArchives.length} archive(s) physiquement éliminée(s)</div>
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
                <tr><td colSpan="7" className="empty-row-lg">Aucune archive détruite.</td></tr>
              ) : (
                destroyedArchives.map(d => (
                  <tr key={d.id}>
                    <td><span className="ref-mono">{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td className="fs-10">{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                    <td><span className="ref-mono fw-600">{d.motif || 'Non spécifié'}</span></td>
                    <td className="fs-10">{d.local}</td>
                    <td>
                      <div className="flex gap-5 items-center">
                        <span className="badge br">⊘ Détruite</span>
                        <button className="btn bg2 bsm" onClick={() => setViewPvArchive(d)}>🖨 PV</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={pageDestroyed} totalPages={totalPagesDestroyed} onPageChange={setPageDestroyed} />
        </div>
      ) : (
        <div className="tw">
          <div className="twh">
            <div>
              <div className="twt">Documents Éligibles à la Destruction</div>
              <div className="tws">{allEligible.length} archive(s) dont la date de destruction est dépassée</div>
            </div>
            {isAdmin && allEligible.length > 0 && (
              <button className="btn bdanger bsm" onClick={() => {
                setShowPV(true);
                setPvRef(`PV-DEST-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
                if (selected.length === 0) setSelected(allEligible.map(d => d.id));
              }}>
                📄 Générer PV
              </button>
            )}
          </div>
          <table>
            <thead>
              <tr>
                {isAdmin && <th><input type="checkbox" checked={selected.length === allEligible.length && allEligible.length > 0} onChange={toggleAll} /></th>}
                <th>Référence</th><th>Type Document</th><th>Service</th><th>Période</th><th>Délai</th><th>Dépassement</th><th>Local</th>
              </tr>
            </thead>
            <tbody>
              {!eligible.length ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="empty-row-lg">Aucun document éligible à la destruction.</td></tr>
              ) : (
                eligible.map(d => (
                  <tr key={d.id} className={selected.includes(d.id) ? 'row-selected' : ''}>
                    {isAdmin && (
                      <td><input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} /></td>
                    )}
                    <td><span className="ref-mono">{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td className="fs-10">{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                    <td><span className="badge bo">{d.delai}</span></td>
                    <td><span className="badge br">{overshoot(d.destRaw)}</span></td>
                    <td className="fs-10">{d.local}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={pageEligible} totalPages={totalPagesEligible} onPageChange={setPageEligible} />
        </div>
      )}

      {viewPvArchive && (
        <div className="mo show">
          <div className="modal modal-lg modal-print">
            <div className="pv-doc">
              <div className="pv-header">
                <img src="/logo-stbg.jpg" alt="STBG Logo" />
                <div className="pv-header-text">
                  <div className="pv-company">SOCIÉTÉ TUNISIENNE DES BOISSONS GAZEUSES</div>
                  <div className="pv-company-sub">— STBG —</div>
                  <div className="pv-title">PROCÈS-VERBAL DE DESTRUCTION D'ARCHIVES</div>
                </div>
              </div>
              <div className="pv-meta">
                <div><div className="pv-meta-label">Date:</div><div>{new Date().toLocaleDateString('fr-TN')}</div></div>
                <div><div className="pv-meta-label">Référence PV:</div><div>{viewPvArchive.motif || 'Non spécifié'}</div></div>
              </div>
              <div className="pv-section">
                <div className="pv-section-title">◆ Objet</div>
                <div className="pv-section-text">Le présent procès-verbal atteste que les documents mentionnés ci-dessous, arrivés à expiration de leur durée légale de conservation conformément au calendrier de conservation des archives de l'entreprise, ont été détruits.</div>
              </div>
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Type de Document</th>
                    <th>Service</th>
                    <th>Période</th>
                    <th>Délai</th>
                    <th>Local</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pv-ref">{viewPvArchive.ref}</td>
                    <td>{viewPvArchive.type}</td>
                    <td>{viewPvArchive.svc}</td>
                    <td>{fmtDate(viewPvArchive.dd)} → {fmtDate(viewPvArchive.df)}</td>
                    <td>{viewPvArchive.delai}</td>
                    <td>{viewPvArchive.local}</td>
                  </tr>
                </tbody>
              </table>
              <div className="pv-section">
                <div className="pv-section-title">◆ Déclaration</div>
                <div className="pv-section-text">Après vérification, les documents ci-dessus ne présentent plus d'intérêt administratif, juridique ou historique et ont été détruits conformément aux procédures en vigueur.</div>
              </div>
              <div className="pv-sigs">
                <div className="pv-sigs-title">Approuvé par</div>
                <div className="pv-sigs-grid">
                  {[['Service Concerné'], ['Directeur Audit'], ['Directeur Comptable'], ['Directeur Général']].map(([title]) => (
                    <div key={title} className="pv-sig-item">
                      <div className="pv-sig-name">{title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setViewPvArchive(null)}>Fermer</button>
              <button className="btn bg2" onClick={() => setTimeout(() => window.print(), 100)}>🖨 Imprimer PV</button>
            </div>
          </div>
        </div>
      )}

      {showPV && (
        <div className="mo show">
          <div className="modal modal-lg modal-print">
            <div className="pv-doc">
              {/* Header with Logo */}
              <div className="pv-header">
                <img src="/logo-stbg.jpg" alt="STBG Logo" />
                <div className="pv-header-text">
                  <div className="pv-company">SOCIÉTÉ TUNISIENNE DES BOISSONS GAZEUSES</div>
                  <div className="pv-company-sub">— STBG —</div>
                  <div className="pv-title">PROCÈS-VERBAL DE DESTRUCTION D'ARCHIVES</div>
                </div>
              </div>

              {/* Reference and Date */}
              <div className="pv-meta">
                <div>
                  <div className="pv-meta-label">Date:</div>
                  <div>{new Date().toLocaleDateString('fr-TN')}</div>
                </div>
                <div>
                  <div className="pv-meta-label">Référence PV:</div>
                  <div>{pvRef}</div>
                </div>
              </div>

              {/* Observations Field */}
              <div className="pv-notes-field no-print">
                <label className="pv-notes-label">📝 Notes / Observations (modifiable):</label>
                <textarea
                  className="pv-notes-textarea"
                  value={pvNotes}
                  onChange={e => setPvNotes(e.target.value)}
                  placeholder="Ajouter des observations ou notes spécifiques..."
                />
              </div>

              {/* Objet Section */}
              <div className="pv-section">
                <div className="pv-section-title">◆ Objet</div>
                <div className="pv-section-text">
                  Le présent procès-verbal atteste que les documents mentionnés ci-dessous, arrivés à expiration de leur durée légale de conservation conformément au calendrier de conservation des archives de l'entreprise, sont autorisés à être détruits.
                </div>
              </div>

              {/* Documents Table */}
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Type de Document</th>
                    <th>Service</th>
                    <th>Période</th>
                    <th>Délai</th>
                    <th>Local</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDemandes.map(d => (
                    <tr key={d.id}>
                      <td className="pv-ref">{d.ref}</td>
                      <td>{d.type}</td>
                      <td>{d.svc}</td>
                      <td>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                      <td>{d.delai}</td>
                      <td>{d.local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pvNotes && pvNotes.trim() && (
                <div className="pv-obs-box">
                  <div className="pv-obs-title">📌 Observations:</div>
                  <div className="pv-obs-text">{pvNotes}</div>
                </div>
              )}

              <div className="pv-section">
                <div className="pv-section-title">◆ Déclaration</div>
                <div className="pv-section-text">
                  Après vérification, les documents ci-dessus ne présentent plus d'intérêt administratif, juridique ou historique et sont déclarés éligibles à la destruction.
                  <br /><br />
                  La destruction sera effectuée selon les procédures en vigueur afin de garantir la confidentialité des informations.
                </div>
              </div>

              {/* Signatures Section */}
              <div className="pv-sigs">
                <div className="pv-sigs-title">Approuvé par</div>
                <div className="pv-sigs-grid">
                  {[['Service Concerné'], ['Directeur Audit'], ['Directeur Comptable'], ['Directeur Général']].map(([title]) => (
                    <div key={title} className="pv-sig-item">
                      <div className="pv-sig-name">{title}</div>
                    </div>
                  ))}
                </div>
              </div>
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
