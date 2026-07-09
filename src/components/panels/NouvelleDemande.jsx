import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

const NouvelleDemande = () => {
  const { currentUser, demandes, addDemande, setPrintDemande, editRequest, setEditRequest, setActivePanel, fetchWithAuth } = useContext(AppContext);

  const [typeVal, setTypeVal] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [customType, setCustomType] = useState('');
  const [dd, setDd] = useState('');
  const [df, setDf] = useState('');
  const [nb, setNb] = useState('1');
  const [boitesRefs, setBoitesRefs] = useState([{ ref_debut: '', ref_fin: '' }]);
  const [local, setLocal] = useState('Local Archives 1');
  const [obs, setObs] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastDemande, setLastDemande] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocumentTypes();
  }, [currentUser]);

  useEffect(() => {
    if (!editRequest || !currentUser) return;
    if (editRequest.uid !== currentUser.id) return;

    const foundType = docs.find(d => d.document_name === editRequest.type && d.retention_duration === editRequest.delai);
    if (foundType) {
      setTypeVal(`${foundType.document_name}|${foundType.retention_duration}`);
      setCustomType('');
    } else {
      setTypeVal(`Autre|${editRequest.delai}`);
      setCustomType(editRequest.type);
    }

    setDd(editRequest.dd || '');
    setDf(editRequest.df || '');
    setNb(editRequest.nb ? String(editRequest.nb) : '1');
    setLocal(editRequest.local || 'Local Archives 1');
    setObs(editRequest.obs || '');
    setBoitesRefs(editRequest.boites_details && editRequest.boites_details.length > 0
      ? editRequest.boites_details.map(b => ({ ref_debut: b.ref_debut || '', ref_fin: b.ref_fin || '' }))
      : [{ ref_debut: '', ref_fin: '' }]
    );
    setEditMode(true);
  }, [editRequest, docs, currentUser]);

  const fetchDocumentTypes = async () => {
    try {
      if (!currentUser) return;
      const res = await fetchWithAuth('http://localhost:3000/api/document-types');
      const data = await res.json();
      const filtered = data.filter(d => d.service_code === currentUser.code);
      const unique = [];
      const seen = new Set();
      for (const d of filtered) {
        if (!seen.has(d.document_name)) {
          seen.add(d.document_name);
          unique.push(d);
        }
      }
      setDocs(unique);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching document types:', err);
      setLoading(false);
    }
  };

  const getDelai = () => {
    if (!typeVal) return '';
    return typeVal.split('|')[1] || '';
  };

  const getDestDate = () => {
    const delai = getDelai();
    if (!df || !delai) return '';
    if (delai === 'Permanent') return 'PERMANENT — ne pas détruire';
    const ans = parseInt(delai);
    if (isNaN(ans)) return '';
    const d = new Date(df);
    d.setFullYear(d.getFullYear() + ans);
    return d.toISOString().split('T')[0];
  };

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const updateBoiteRef = (index, field, value) => {
    const newRefs = [...boitesRefs];
    newRefs[index][field] = value;
    setBoitesRefs(newRefs);
  };

  const handleNbChange = (e) => {
    const raw = e.target.value;
    setNb(raw);
    const val = parseInt(raw);
    if (!isNaN(val) && val >= 1) {
      setBoitesRefs(prev => {
        const next = [...prev];
        while (next.length < val) next.push({ ref_debut: '', ref_fin: '' });
        return next.slice(0, val);
      });
    }
  };

  const validateRefs = () => {
    for (let i = 0; i < boitesRefs.length; i++) {
      const { ref_debut, ref_fin } = boitesRefs[i];
      if (ref_debut && ref_fin && ref_debut > ref_fin) {
        return `Boîte ${i + 1}: La référence début ne peut pas être plus grande que la référence fin`;
      }
    }
    return null;
  };

  const resetForm = () => {
    setTypeVal(''); setCustomType(''); setDd(''); setDf('');
    setNb('1'); setBoitesRefs([{ ref_debut: '', ref_fin: '' }]);
    setLocal('Local Archives 1'); setObs('');
  };

  const soumettre = async () => {
    if (!typeVal || !dd || !df) { alert('Champs obligatoires manquants (*)'); return; }
    if (new Date(df) < new Date(dd)) { alert('Date besoin doit être après date début'); return; }
    const refError = validateRefs();
    if (refError) { alert(refError); return; }

    const nbInt = parseInt(nb) || 1;
    const parts = typeVal.split('|');
    const tn = parts[0] === 'Autre' ? (customType.trim() || 'Autre document') : parts[0];
    const delai = parts[1];
    const dateObj = new Date(df);
    const y = dateObj.getFullYear();

    let ref;
    if (editMode && editRequest) {
      ref = editRequest.ref;
    } else {
      const n = demandes.filter(d => d.code === currentUser.code && d.annee === y).length + 1;
      ref = `${currentUser.code}-${y}-${String(n).padStart(3, '0')}`;
    }

    const now = new Date();
    let destRaw = '';
    let destFmt = '—';
    if (delai !== 'Permanent') {
      const a = parseInt(delai);
      const dd2 = new Date(df);
      dd2.setFullYear(dd2.getFullYear() + a);
      destRaw = dd2.toISOString().split('T')[0];
      destFmt = fmtDate(destRaw);
    }

    const dem = {
      id: editMode ? editRequest.id : Date.now(),
      ref, code: currentUser.code, svc: currentUser.svc,
      resp: currentUser.name, uid: currentUser.id,
      type: tn, delai, dd, df, date_besoin: df,
      arch: editMode ? editRequest.arch : now.toISOString().split('T')[0],
      destRaw, destFmt,
      boites_details: nbInt > 1 ? boitesRefs.slice(0, nbInt) : [{ ref_debut: boitesRefs[0].ref_debut, ref_fin: boitesRefs[0].ref_fin }],
      nb: nbInt, local, obs,
      statut: 'pending',
      created: editMode ? editRequest.created : now.toLocaleDateString('fr-TN'),
      annee: y, motif: ''
    };

    try {
      setIsSubmitting(true);
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode
        ? `http://localhost:3000/api/archives/${editRequest.id}`
        : 'http://localhost:3000/api/archives';

      if (editMode && !editRequest?.id) throw new Error('Edit mode enabled but no archive ID found.');

      const requestBody = {
        document_type: dem.type, date_debut: dem.dd, date_fin: dem.df,
        delai_legale: dem.delai, date_destruction_prevue: dem.destRaw || null,
        boites: dem.nb, local_destination: dem.local,
        observations: dem.obs, boites_details: dem.boites_details
      };
      if (!editMode) {
        requestBody.ref = dem.ref;
        requestBody.service_code = currentUser.code;
        requestBody.user_id = currentUser.dbId || currentUser.id;
      }

      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });

      if (!res.ok) {
        const ct = res.headers.get('content-type');
        let errorMsg = `Server error ${res.status}: ${res.statusText}`;
        try { if (ct?.includes('application/json')) { const e = await res.json(); errorMsg = e.error || e.message || errorMsg; } } catch {}
        throw new Error(errorMsg);
      }

      addDemande(dem, editMode);
      setLastDemande(dem);
      setShowModal(true);
      resetForm();
      if (editMode) { setEditRequest(null); setEditMode(false); }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nbInt = parseInt(nb) || 0;

  if (loading && !docs.length) {
    return <div className="panel active"><div className="loading-box">Chargement...</div></div>;
  }

  return (
    <div className="panel active">
      <div className="tw">
        <div className="twh">
          <div>
            <div className="twt">{editMode ? 'Modifier la demande rejetée' : "Nouvelle Demande d'Archivage"}</div>
            <div className="tws">Référence et date de destruction calculées automatiquement</div>
          </div>
        </div>
        <div className="tw-body-20">
          <div className="fg mb-12">
            <div className="fgrp"><div className="flbl">Service</div><input className="finp ro-norm" readOnly value={currentUser.svc} /></div>
            <div className="fgrp"><div className="flbl">Responsable</div><input className="finp ro-norm" readOnly value={currentUser.name} /></div>
          </div>
          <div className="fg">
            <div className="fgrp full">
              <div className="flbl">Type de document *</div>
              <select value={typeVal} onChange={e => setTypeVal(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {docs.map(d => <option key={d.id} value={`${d.document_name}|${d.retention_duration}`}>{d.document_name}</option>)}
                <option value="Autre|5 ans">Autre (à préciser)</option>
              </select>
            </div>
            {typeVal.startsWith('Autre') && (
              <div className="fgrp full">
                <div className="flbl">Préciser le type *</div>
                <input className="finp" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Décrivez le type de document..." />
              </div>
            )}
            <div className="fgrp"><div className="flbl">Date début documents *</div><input type="date" className="finp" value={dd} onChange={e => setDd(e.target.value)} /></div>
            <div className="fgrp"><div className="flbl">Date de besoin *</div><input type="date" className="finp" value={df} onChange={e => setDf(e.target.value)} /></div>
            <div className="fgrp"><div className="flbl">Délai légal de conservation</div><input className="finp" readOnly placeholder="Auto" value={getDelai()} /></div>
            <div className="fgrp"><div className="flbl">Date de destruction prévue</div><input className="finp ro-red" readOnly placeholder="Calculée automatiquement" value={getDestDate() ? fmtDate(getDestDate()) : ''} /></div>

            <div className="fgrp">
              <div className="flbl">Nombre de boîtes</div>
              <input type="number" className="finp" min="1" max="99" value={nb} onChange={handleNbChange} />
            </div>

            {nbInt > 1 && (
              <div className="boites-refs-box">
                <div className="box-title">Références par boîte</div>
                {Array.from({ length: nbInt }).map((_, i) => (
                  <div key={i} className="boite-row">
                    <div>
                      <div className="fs-10 text-muted mb-4">Boîte {i + 1} - Référence début</div>
                      <input type="text" className="finp" placeholder="Ex: Facture N°001" value={boitesRefs[i]?.ref_debut || ''} onChange={e => updateBoiteRef(i, 'ref_debut', e.target.value)} />
                    </div>
                    <div>
                      <div className="fs-10 text-muted mb-4">Boîte {i + 1} - Référence fin</div>
                      <input type="text" className="finp" placeholder="Ex: Facture N°250" value={boitesRefs[i]?.ref_fin || ''} onChange={e => updateBoiteRef(i, 'ref_fin', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {nbInt === 1 && (
              <>
                <div className="fgrp"><div className="flbl">Référence début (1ère pièce dans la boîte)</div><input className="finp" placeholder="Ex: Facture N°001 / Bon N°2501" value={boitesRefs[0]?.ref_debut || ''} onChange={e => updateBoiteRef(0, 'ref_debut', e.target.value)} /></div>
                <div className="fgrp"><div className="flbl">Référence fin (dernière pièce dans la boîte)</div><input className="finp" placeholder="Ex: Facture N°250 / Bon N°2599" value={boitesRefs[0]?.ref_fin || ''} onChange={e => updateBoiteRef(0, 'ref_fin', e.target.value)} /></div>
              </>
            )}

            <div className="fgrp">
              <div className="flbl">Local de destination</div>
              <select value={local} onChange={e => setLocal(e.target.value)}>
                <option value="Bureau / Service">Bureau / Service (accès quotidien)</option>
                <option value="Local Archives 1">Local Archives 1 (semi-actif)</option>
                <option value="Local Archives 2">Local Archives 2 (définitif)</option>
              </select>
            </div>
            <div className="fgrp full">
              <div className="flbl">Observations complémentaires</div>
              <textarea placeholder="Informations complémentaires..." value={obs} onChange={e => setObs(e.target.value)}></textarea>
            </div>
          </div>
          <div className="flex gap-8 justify-end mt-14">
            {editMode && (
              <button className="btn bg2" onClick={() => { setEditRequest(null); setEditMode(false); resetForm(); }} disabled={isSubmitting}>Annuler la modification</button>
            )}
            <button className="btn bg2" onClick={() => { setTypeVal(''); setCustomType(''); setDd(''); setDf(''); }} disabled={isSubmitting}>Réinitialiser</button>
            <button className="btn bp2" onClick={soumettre} disabled={isSubmitting}>{isSubmitting ? '⏳ Enregistrement...' : editMode ? 'Soumettre la modification' : 'Soumettre la Demande'}</button>
          </div>
        </div>
      </div>

      {showModal && lastDemande && (
        <div className="mo show">
          <div className="modal">
            <div className="mt"> Demande Soumise avec Succès</div>
            <div className="ms">Transmise à l'archiviste central pour validation.</div>
            <div className="detail-box">
              <div className="detail-row">
                <span className="detail-label">Référence :</span>
                <span className="detail-ref">{lastDemande.ref}</span>
              </div>
              <div className="grid-2 fs-11">
                <div><span className="text-muted">Service</span><br /><strong>{lastDemande.svc}</strong></div>
                <div><span className="text-muted">Type</span><br /><strong>{lastDemande.type}</strong></div>
                <div><span className="text-muted">Période</span><br /><strong>{fmtDate(lastDemande.dd)} → {fmtDate(lastDemande.df)}</strong></div>
                <div><span className="text-muted">Local</span><br /><strong>{lastDemande.local}</strong></div>
              </div>
            </div>
            <div className="al al-b">ℹ Imprimez l'étiquette et collez-la sur le dos de la boîte avant dépôt.</div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setShowModal(false)}>Fermer</button>
              <button className="btn bp2" onClick={() => { setShowModal(false); setPrintDemande(lastDemande); }}>🖨 Imprimer Étiquettes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NouvelleDemande;
