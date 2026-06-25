import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

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

  const isOwner = (d) => {
    if (isAdmin) return true;
    return d.uid === currentUser?.id ||
           d.uid === String(currentUser?.dbId) ||
           d.resp === currentUser?.name;
  };

  const myRejected = !isAdmin ? demandes.filter(d => isOwner(d) && d.statut === 'rejected') : [];

  const [tab, setTab] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [rejectDem, setRejectDem] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [missingRefs, setMissingRefs] = useState('');
  const [customMotif, setCustomMotif] = useState('');
  const [validateId, setValidateId] = useState(null);
  const [validateDem, setValidateDem] = useState(null);
  const [validateNote, setValidateNote] = useState('');

  useEffect(() => {
    if (currentUser) refreshDemandes(currentUser);
  }, []);

  useEffect(() => {
    if (!isAdmin && myRejected.length > 0 && tab === 'pending') {
      setTab('rejected');
    }
  }, [myRejected.length]);

  const list = demandes.filter(d => d.statut === tab && isOwner(d));

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
    updateDemandeStatus(validateId, 'validated', validateNote.trim());
    setValidateId(null);
    setValidateDem(null);
    setValidateNote('');
  };

  return (
    <div className="panel active">
      <div className="tabs">
        <div className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>En attente</div>
        <div className={`tab ${tab === 'validated' ? 'active' : ''}`} onClick={() => setTab('validated')}>Validées</div>
        <div className={`tab ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')}>
          Rejetées {!isAdmin && myRejected.length > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '99px', fontSize: '9px', padding: '1px 6px', marginLeft: '4px' }}>{myRejected.length}</span>}
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
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>Aucune demande.</td></tr>
            ) : (
              list.map(d => {
                const firstBoite = d.boites_details?.[0];
                const refDebut = firstBoite?.ref_debut || d.refDebut || '';
                const refFin = firstBoite?.ref_fin || d.refFin || '';
                const refInt = refDebut || refFin ? `${refDebut || '—'} → ${refFin || '—'}` : '—';
                return (
                  <tr key={d.id}>
                    <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td style={{ fontSize: '10px' }}>{d.resp}</td>
                    <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)}<br /><span style={{ color: 'var(--text3)' }}>→{fmtDate(d.df)}</span></td>
                    <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{refInt}</td>
                    <td style={{ textAlign: 'center' }}>{d.nb}</td>
                    <td style={{ fontSize: '10px' }}>{d.local}</td>
                    <td>
                      {tab === 'pending' && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {isAdmin && <button className="btn bgreen bsm" onClick={() => openValidation(d)}>✓</button>}
                          {isAdmin && <button className="btn bdanger bsm" onClick={() => openRejet(d)}>✗</button>}
                        </div>
                      )}
                      {tab === 'validated' && (
                        <div>
                          <button className="btn bgold bsm" onClick={() => setPrintDemande(d)}>🖨</button>
                          {d.motif && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', maxWidth: '140px' }}>{d.motif}</div>}
                        </div>
                      )}
                      {tab === 'rejected' && (
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--red)', maxWidth: '120px' }}>{d.motif}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {validateId && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Valider la Demande</div>
            <div className="ms">
              Demande <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)' }}>{validateDem?.ref}</span> — {validateDem?.type}
            </div>
            <div className="fgrp" style={{ marginBottom: '12px' }}>
              <div className="flbl">Remarque (optionnelle)</div>
              <textarea
                placeholder="Ajouter une remarque ou un commentaire..."
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
              Demande <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)' }}>{rejectDem?.ref}</span> — {rejectDem?.type}
            </div>
            <div className="fgrp" style={{ marginBottom: '12px' }}>
              <div className="flbl">Motif de rejet *</div>
              <select value={selectedReason} onChange={e => { setSelectedReason(e.target.value); setMissingRefs(''); setCustomMotif(''); }}>
                <option value="">-- Sélectionner --</option>
                {MOTIF_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {selectedReason === 'Référence manquante' && (
              <div className="fgrp" style={{ marginBottom: '12px' }}>
                <div className="flbl">Numéro(s) de référence manquant(s)</div>
                <input
                  className="finp"
                  placeholder="Ex: N°045, N°046, N°052"
                  value={missingRefs}
                  onChange={e => setMissingRefs(e.target.value)}
                />
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                  Précisez les numéros manquants (séparés par des virgules)
                </div>
              </div>
            )}

            {selectedReason === 'Autre' && (
              <div className="fgrp" style={{ marginBottom: '12px' }}>
                <div className="flbl">Préciser *</div>
                <textarea
                  placeholder="Décrivez le motif de rejet..."
                  value={customMotif}
                  onChange={e => setCustomMotif(e.target.value)}
                />
              </div>
            )}

            {selectedReason && selectedReason !== 'Référence manquante' && selectedReason !== 'Autre' && (
              <div className="al al-r" style={{ marginBottom: '12px' }}>
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
