import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

const NouvelleDemande = () => {
  const { currentUser, demandes, addDemande, setPrintDemande, editRequest, setEditRequest, setActivePanel } = useContext(AppContext);

  const [typeVal, setTypeVal] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [customType, setCustomType] = useState('');
  const [dd, setDd] = useState('');
  const [df, setDf] = useState('');
  const [nb, setNb] = useState(1);
  const [boitesRefs, setBoitesRefs] = useState([{ ref_debut: '', ref_fin: '' }]);
  const [local, setLocal] = useState('Local Archives 1');
  const [obs, setObs] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastDemande, setLastDemande] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch document types on mount
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
    setNb(editRequest.nb || 1);
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
      
      const res = await fetch('http://localhost:3000/api/document-types');
      const data = await res.json();
      
      // Filter by service
      const serviceDoc = data.filter(d => d.service_code === currentUser.code);
      setDocs(serviceDoc);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching document types:', err);
      setLoading(false);
    }
  };

  const getDelai = () => {
    if (!typeVal) return '';
    const parts = typeVal.split('|');
    return parts[1] || '';
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
    // Extract date part if ISO format with time component
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const updateBoiteRef = (index, field, value) => {
    const newRefs = [...boitesRefs];
    newRefs[index][field] = value;
    setBoitesRefs(newRefs);
  };

  const validateRefs = () => {
    for (let i = 0; i < boitesRefs.length; i++) {
      const { ref_debut, ref_fin } = boitesRefs[i];
      
      if (ref_debut && ref_fin) {
        // Basic string comparison
        if (ref_debut > ref_fin) {
          return `Boîte ${i + 1}: La référence début ne peut pas être plus grande que la référence fin`;
        }
      }
    }
    return null;
  };

  const soumettre = async () => {
    if (!typeVal || !dd || !df) {
      alert('Champs obligatoires manquants (*)');
      return;
    }

    if (new Date(df) < new Date(dd)) {
      alert('Date besoin doit être après date début');
      return;
    }

    // Validate references
    const refError = validateRefs();
    if (refError) {
      alert(refError);
      return;
    }

    const parts = typeVal.split('|');
    const tn = parts[0] === 'Autre' ? (customType.trim() || 'Autre document') : parts[0];
    const delai = parts[1];

    // Use year from df (date fin/date besoin)
    const dateObj = new Date(df);
    const y = dateObj.getFullYear();
    
    // If editing, use existing ref; otherwise generate new one
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
      ref,
      code: currentUser.code,
      svc: currentUser.svc,
      resp: currentUser.name,
      uid: currentUser.id,
      type: tn,
      delai,
      dd,
      df,
      date_besoin: df,
      arch: editMode ? editRequest.arch : now.toISOString().split('T')[0],
      destRaw,
      destFmt,
      boites_details: nb > 1 ? boitesRefs.slice(0, nb) : [{ref_debut: boitesRefs[0].ref_debut, ref_fin: boitesRefs[0].ref_fin}],
      nb: parseInt(nb) || 1,
      local,
      obs,
      statut: 'pending',
      created: editMode ? editRequest.created : now.toLocaleDateString('fr-TN'),
      annee: y,
      motif: ''
    };

    // Save to database
    try {
      setIsSubmitting(true);

      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `http://localhost:3000/api/archives/${editRequest.id}`
        : 'http://localhost:3000/api/archives';

      console.log('🔍 Edit/Create Debug:', {
        editMode,
        editRequestId: editRequest?.id,
        editRequestIdType: typeof editRequest?.id,
        url,
        method,
        demId: dem.id,
        demIdType: typeof dem.id
      });
      
      if (editMode && !editRequest?.id) {
        throw new Error('Edit mode enabled but no archive ID found. The demande may not have been properly saved to the database.');
      }

      // Build request body - only include fields that each endpoint expects
      const requestBody = {
        document_type: dem.type,
        date_debut: dem.dd,
        date_fin: dem.df,
        delai_legale: dem.delai,
        date_destruction_prevue: dem.destRaw || null,
        boites: dem.nb,
        local_destination: dem.local,
        observations: dem.obs,
        boites_details: dem.boites_details
      };

      // For POST, also include ref and service_code
      if (!editMode) {
        requestBody.ref = dem.ref;
        requestBody.service_code = currentUser.code;
        requestBody.user_id = currentUser.dbId || currentUser.id;
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMsg = 'Failed to save archive';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } else {
            // Server returned HTML or plain text (likely 404)
            errorMsg = `Server error ${res.status}: ${res.statusText}. Make sure the server has been restarted.`;
          }
        } catch (parseErr) {
          errorMsg = `Server error ${res.status}: ${res.statusText}`;
        }
        
        console.error('Server error response:', errorMsg);
        throw new Error(errorMsg);
      }

      addDemande(dem, editMode);
      setLastDemande(dem);
      setShowModal(true);

      // reset
      setTypeVal('');
      setCustomType('');
      setDd('');
      setDf('');
      setNb(1);
      setBoitesRefs([{ ref_debut: '', ref_fin: '' }]);
      setLocal('Local Archives 1');
      setObs('');
      if (editMode) {
        setEditRequest(null);
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const docsList = docs;

  if (loading && !docs.length) {
    return <div className="panel active"><div style={{ padding: '20px', color: 'var(--text2)' }}>Chargement...</div></div>;
  }

  return (
    <div className="panel active">

      <div className="tw">
        <div className="twh">
          <div>
            <div className="twt">{editMode ? 'Modifier la demande rejetée' : 'Nouvelle Demande d\'Archivage'}</div>
            <div className="tws">Référence et date de destruction calculées automatiquement</div>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="fg" style={{ marginBottom: '12px' }}>
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

            <div className="fgrp"><div className="flbl">Nombre de boîtes</div><input type="number" className="finp" min="1" max="99" value={nb} onChange={e => { const val = parseInt(e.target.value) || 1; setNb(val); setBoitesRefs(prev => { const next = [...prev]; while (next.length < val) next.push({ ref_debut: '', ref_fin: '' }); return next.slice(0, val); }); }} /></div>

            {nb > 1 && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '10px', color: 'var(--text2)' }}>Références par boîte</div>
                {Array.from({ length: nb }).map((_, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Boîte {i + 1} - Référence début</div>
                      <input type="text" className="finp" placeholder={`Ex: Facture N°001`} value={boitesRefs[i]?.ref_debut || ''} onChange={e => updateBoiteRef(i, 'ref_debut', e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Boîte {i + 1} - Référence fin</div>
                      <input type="text" className="finp" placeholder={`Ex: Facture N°250`} value={boitesRefs[i]?.ref_fin || ''} onChange={e => updateBoiteRef(i, 'ref_fin', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {nb === 1 && (
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
            {editMode && (
              <button className="btn bg2" onClick={() => { setEditRequest(null); setEditMode(false); setTypeVal(''); setCustomType(''); setDd(''); setDf(''); setNb(1); setBoitesRefs([{ ref_debut: '', ref_fin: '' }]); setLocal('Local Archives 1'); setObs(''); }} disabled={isSubmitting}>Annuler la modification</button>
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
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '9px', padding: '16px', margin: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '11px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Référence :</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '19px', color: 'var(--gold)', fontWeight: 700 }}>{lastDemande.ref}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div><span style={{ color: 'var(--text3)' }}>Service</span><br /><strong>{lastDemande.svc}</strong></div>
                <div><span style={{ color: 'var(--text3)' }}>Type</span><br /><strong>{lastDemande.type}</strong></div>
                <div><span style={{ color: 'var(--text3)' }}>Période</span><br /><strong>{fmtDate(lastDemande.dd)} → {fmtDate(lastDemande.df)}</strong></div>
                <div><span style={{ color: 'var(--text3)' }}>Local</span><br /><strong>{lastDemande.local}</strong></div>
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
