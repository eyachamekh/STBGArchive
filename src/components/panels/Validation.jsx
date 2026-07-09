import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 15;

const MOTIF_REASONS = [
  'Référence manquante',
  'Documents incomplets',
  'Mauvais local de destination',
  'Période incorrecte',
  'Type de document non conforme',
  'Boîte non étiquetée',
  'Autre',
];

const Validation = () => {
  const { currentUser, demandes, updateDemandeStatus, setPrintDemande, refreshDemandes } = useContext(AppContext);
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = isAdmin || currentUser?.role === 'archiviste';

  const isOwner = (d) => {
    if (isPrivileged) return true;
    return d.uid === currentUser?.id ||
           d.uid === String(currentUser?.dbId) ||
           d.resp === currentUser?.name;
  };

  const myRejected = !isPrivileged ? demandes.filter(d => isOwner(d) && d.statut === 'rejected') : [];

  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState(null);
  const [rejectDem, setRejectDem] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [missingRefs, setMissingRefs] = useState('');
  const [customMotif, setCustomMotif] = useState('');
  const [validateId, setValidateId] = useState(null);
  const [validateDem, setValidateDem] = useState(null);
  const [validateNote, setValidateNote] = useState('');
  const [validateMissingRefs, setValidateMissingRefs] = useState('');

  useEffect(() => {
    if (currentUser) refreshDemandes(currentUser);
  }, []);

  useEffect(() => {
    if (!isPrivileged && myRejected.length > 0 && tab === 'pending') {
      setTab('rejected');
    }
  }, [myRejected.length]);

  const allList = demandes.filter(d => d.statut === tab && isOwner(d));
  const totalPages = Math.ceil(allList.length / ITEMS_PER_PAGE);
  const list = allList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    // Extract date part if ISO format with time component
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const openRejet = (d) => {
    setRejectId(d.id);
    setRejectDem(d);
    setSelectedReason('');
    setMissingRefs('');
    setCustomMotif('');
  };

  const openValidation = (d) => {
    setValidateId(d.id);
    setValidateDem(d);
    setValidateNote('');
    setValidateMissingRefs('');
  };

  const buildMotif = () => {
    if (!selectedReason) return '';
    if (selectedReason === 'Référence manquante') {
      return `Référence manquante${missingRefs.trim() ? ` : ${missingRefs.trim()}` : ''}`;
    }
    if (selectedReason === 'Autre') return customMotif.trim();
    return selectedReason;
  };

  const confirmerRejet = () => {
    const motif = buildMotif();
    if (!motif) { alert('Veuillez sélectionner un motif.'); return; }
    if (selectedReason === 'Autre' && !customMotif.trim()) { alert('Précisez le motif.'); return; }
    updateDemandeStatus(rejectId, 'rejected', motif);
    setRejectId(null);
    setRejectDem(null);
  };

  const confirmerValidation = () => {
    const note = validateNote.trim();
    const fullMotif = validateMissingRefs.trim()
      ? `Référence manquante : ${validateMissingRefs.trim()}${note ? ' — ' + note : ''}`
      : note;
    updateDemandeStatus(validateId, 'validated', fullMotif);
    setValidateId(null);
    setValidateDem(null);
    setValidateNote('');
    setValidateMissingRefs('');
  };

  return (
    <div className="panel active">
      <div className="tabs">
        <div className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>En attente</div>
        <div className={`tab ${tab === 'validated' ? 'active' : ''}`} onClick={() => setTab('validated')}>Validées</div>
        <div className={`tab ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')}>
          Rejetées {!isPrivileged && myRejected.length > 0 && <span className="count-badge">{myRejected.length}</span>}
        </div>
      </div>
      <div className="tw">
        <div className="twh">
          <div className="twt">
            {tab === 'pending' ? 'En Attente de Validation' : tab === 'validated' ? 'Demandes Validées' : 'Demandes Rejetées'}
          </div>
          <button className="btn bg2 bsm" onClick={() => refreshDemandes(currentUser)}>↻ Actualiser</button>
        </div>
        <table>
          <thead>
            <tr><th>Référence</th><th>Type Document</th><th>Service</th><th>Resp.</th><th>Période</th><th>Réf. Début–Fin</th><th>Boîtes</th><th>Local</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!list.length ? (
              <tr><td colSpan="9" className="empty-row">Aucune demande.</td></tr>
            ) : (
              list.map(d => {
                const boites = d.boites_details?.length > 0 ? d.boites_details : [{ ref_debut: d.refDebut || '', ref_fin: d.refFin || '' }];
                const hasRefs = boites.some(b => b.ref_debut || b.ref_fin);
                return (
                  <tr key={d.id}>
                    <td><span className="ref-mono">{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td className="fs-10">{d.resp}</td>
                    <td className="fs-10">{fmtDate(d.dd)}<br /><span className="text-muted">→{fmtDate(d.df)}</span></td>
                    <td className="fs-10 mono">
                      {!hasRefs ? '—' : boites.map((b, i) => (b.ref_debut || b.ref_fin) ? (
                        <div key={i}>{boites.length > 1 && <span className="text-muted">B{i+1}: </span>}{b.ref_debut || '—'} → {b.ref_fin || '—'}</div>
                      ) : null)}
                    </td>
                    <td className="text-center">{d.nb}</td>
                    <td className="fs-10">{d.local}</td>
                    <td>
                      {tab === 'pending' && (
                        <div className="flex gap-4 flex-wrap">
                          {isPrivileged && <button className="btn bgreen bsm" onClick={() => openValidation(d)}>✓</button>}
                          {isPrivileged && <button className="btn bdanger bsm" onClick={() => openRejet(d)}>✗</button>}
                        </div>
                      )}
                      {tab === 'validated' && (
                        <div>
                          <button className="btn bgold bsm" onClick={() => setPrintDemande(d)}>🖨</button>
                          {d.motif && (
                            <div className="mt-4">
                              <span className="badge bg inline-block">✓ Réf. confirmées</span>
                              <div className="validated-motif">{d.motif}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {tab === 'rejected' && (
                        <div>
                          <div className="rejected-motif">{d.motif}</div>
                          {d.motif?.toLowerCase().includes('référence manquante') && (
                            <span className="badge br mt-4 inline-block">⚠ Réf. manquante</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {validateId && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Valider la Demande</div>
            <div className="ms">
              Demande <span className="ref-mono">{validateDem?.ref}</span> — {validateDem?.type}
            </div>
            <div className="fgrp mb-12">
              <div className="flbl">Références manquantes (optionnel)</div>
              <input
                className="finp"
                placeholder="Ex: N°045, N°046, N°052"
                value={validateMissingRefs}
                onChange={e => setValidateMissingRefs(e.target.value)}
              />
              <div className="fs-10 text-muted mt-4">Précisez les références manquantes dans la boîte (séparées par des virgules)</div>
            </div>
            <div className="fgrp mb-12">
              <div className="flbl">Remarque (optionnel)</div>
              <input
                className="finp"
                placeholder="Commentaire ou observation..."
                value={validateNote}
                onChange={e => setValidateNote(e.target.value)}
              />
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setValidateId(null)}>Annuler</button>
              <button className="btn bgreen" onClick={confirmerValidation}>Confirmer la Validation</button>
            </div>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Rejeter la Demande</div>
            <div className="ms">
              Demande <span className="ref-mono">{rejectDem?.ref}</span> — {rejectDem?.type}
            </div>
            <div className="fgrp mb-12">
              <div className="flbl">Motif de rejet *</div>
              <select value={selectedReason} onChange={e => { setSelectedReason(e.target.value); setMissingRefs(''); setCustomMotif(''); }}>
                <option value="">-- Sélectionner --</option>
                {MOTIF_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {selectedReason === 'Référence manquante' && (
              <div className="fgrp mb-12">
                <div className="flbl">Numéro(s) de référence manquant(s)</div>
                <input
                  className="finp"
                  placeholder="Ex: N°045, N°046, N°052"
                  value={missingRefs}
                  onChange={e => setMissingRefs(e.target.value)}
                />
                <div className="fs-10 text-muted mt-4">
                  Précisez les numéros manquants (séparés par des virgules)
                </div>
              </div>
            )}

            {selectedReason === 'Autre' && (
              <div className="fgrp mb-12">
                <div className="flbl">Préciser *</div>
                <textarea
                  placeholder="Décrivez le motif de rejet..."
                  value={customMotif}
                  onChange={e => setCustomMotif(e.target.value)}
                />
              </div>
            )}

            {selectedReason && selectedReason !== 'Référence manquante' && selectedReason !== 'Autre' && (
              <div className="al al-r mb-12">
                ✗ Motif sélectionné : <strong>{selectedReason}</strong>
              </div>
            )}

            <div className="mf">
              <button className="btn bg2" onClick={() => setRejectId(null)}>Annuler</button>
              <button className="btn bdanger" onClick={confirmerRejet}>Confirmer le Rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Validation;
