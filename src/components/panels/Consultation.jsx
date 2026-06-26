import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const Consultation = () => {
  const { currentUser, demandes, consultations, addConsultation, updateConsultationStatus } = useContext(AppContext);

  const [motif, setMotif] = useState('');
  const [retour, setRetour] = useState('');
  const [search, setSearch] = useState('');
  const [obs, setObs] = useState('');
  const [selectedBoites, setSelectedBoites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lastConsult, setLastConsult] = useState(null);

  const valid = demandes.filter(d => d.statut === 'validated');
  const userConsults = consultations.filter(c => c.uid === currentUser.id);
  
  let searchResults = [];
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    searchResults = valid.filter(d => 
      d.ref.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) ||
      d.svc.toLowerCase().includes(q) || d.dd.includes(q) || d.df.includes(q) ||
      (d.refDebut && d.refDebut.toLowerCase().includes(q)) || (d.refFin && d.refFin.toLowerCase().includes(q))
    );
  }

  const toggleBoite = (d) => {
    if (selectedBoites.find(s => s.id === d.id)) {
      setSelectedBoites(prev => prev.filter(s => s.id !== d.id));
    } else {
      setSelectedBoites(prev => [...prev, d]);
    }
  };

  const resetConsult = () => {
    setSelectedBoites([]);
    setSearch('');
    setMotif('');
    setRetour('');
    setObs('');
  };

  const soumettre = () => {
    if (!selectedBoites.length) {
      alert('Sélectionnez au moins une boîte.');
      return;
    }
    if (!motif || !retour) {
      alert('Motif et date de retour requis.');
      return;
    }
    
    const now = new Date();
    const cref = `CONS-${now.getFullYear()}-${String(Date.now()).slice(-3)}`;
    
    const c = {
      id: Date.now(), ref: cref, uid: currentUser.id, nom: currentUser.name, svc: currentUser.svc,
      motif, retour, obs,
      boites: selectedBoites.map(d => ({ id: d.id, ref: d.ref, type: d.type, local: d.local })),
      statut: 'pending', created: now.toLocaleDateString('fr-TN'), remiseObs: '', retourEtat: ''
    };

    addConsultation(c);
    setLastConsult(c);
    setShowModal(true);
    resetConsult();
  };

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const handleRetour = (consult) => {
    if (!consult || consult.statut !== 'remis') return;
    if (!window.confirm(`Confirmer le retour de la consultation ${consult.ref} ?`)) return;
    updateConsultationStatus(consult.id, 'returned');
  };

  return (
    <div className="panel active">

      <div className="tw">
        <div className="twh">
          <div><div className="twt">Demande de Consultation d'Archives</div><div className="tws">Recherchez les boîtes dont vous avez besoin et soumettez une demande.</div></div>
        </div>
        <div style={{ padding: '18px' }}>
          <div className="al al-b">ℹ Recherchez par type de document, service ou référence. Sélectionnez les boîtes souhaitées puis soumettez la demande.</div>
          <div className="fg" style={{ marginBottom: '14px' }}>
            <div className="fgrp">
              <div className="flbl">Motif de consultation *</div>
              <select value={motif} onChange={e => setMotif(e.target.value)}>
                <option value="">-- Sélectionner le motif --</option>
                <option>Vérification comptable</option>
                <option>Contrôle fiscal / DGI</option>
                <option>Audit interne</option>
                <option>Audit externe</option>
                <option>Litige / Contentieux</option>
                <option>Référence interne</option>
                <option>Réclamation client</option>
                <option>Besoin opérationnel</option>
                <option>Autre (préciser)</option>
              </select>
            </div>
            <div className="fgrp"><div className="flbl">Date de retour prévue *</div><input type="date" className="finp" value={retour} onChange={e => setRetour(e.target.value)} /></div>
            <div className="fgrp full">
              <div className="flbl">Rechercher une boîte</div>
              <div className="sb" style={{ margin: 0 }}>
                <span style={{ color: 'var(--text3)' }}>⌕</span>
                <input placeholder="Référence, type de document, service, période..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="fg">
            <div>
              <div className="flbl" style={{ marginBottom: '8px' }}>Résultats de recherche</div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {!search.trim() ? (
                  <div style={{ color: 'var(--text3)', fontSize: '12px', padding: '16px', textAlign: 'center' }}>Tapez pour rechercher des boîtes d'archives validées...</div>
                ) : !searchResults.length ? (
                  <div style={{ color: 'var(--text3)', fontSize: '12px', padding: '16px', textAlign: 'center' }}>Aucune boîte trouvée.</div>
                ) : (
                  searchResults.map(d => {
                    const isSel = selectedBoites.find(s => s.id === d.id);
                    return (
                      <div key={d.id} className={`consult-card ${isSel ? 'selected' : ''}`} onClick={() => toggleBoite(d)}>
                        <div className="cc-ref">{d.ref}</div>
                        <div className="cc-type">{d.type}</div>
                        <div className="cc-meta">{d.svc} · {fmtDate(d.dd)} → {fmtDate(d.df)}</div>
                        <div className="cc-meta" style={{ marginTop: '3px' }}>{d.local} {d.refDebut ? `· Réf: ${d.refDebut} → ${d.refFin}` : ''}</div>
                        <div style={{ marginTop: '5px' }}>
                          <span className="badge bg">✓ Validée</span>
                          {isSel && <span className="badge bg" style={{ marginLeft: '4px' }}>✓ Sélectionnée</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <div className="flbl" style={{ marginBottom: '8px' }}>Boîtes sélectionnées <span style={{ color: 'var(--gold)' }}>({selectedBoites.length})</span></div>
              <div className="selected-list">
                {!selectedBoites.length ? (
                  <div className="empty-sel">Aucune boîte sélectionnée</div>
                ) : (
                  selectedBoites.map(d => (
                    <div key={d.id} className="sel-item">
                      <div>
                        <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px' }}>{d.ref}</span><br />
                        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{d.type}</span>
                      </div>
                      <button onClick={() => toggleBoite(d)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                  ))
                )}
              </div>
              <div className="fgrp" style={{ marginTop: '10px' }}>
                <div className="flbl">Observations / Précisions</div>
                <textarea placeholder="Précisez les documents exacts dont vous avez besoin..." value={obs} onChange={e => setObs(e.target.value)}></textarea>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button className="btn bg2" onClick={resetConsult}>Réinitialiser</button>
            <button className="btn bp2" onClick={soumettre}>📤 Soumettre la Demande</button>
          </div>
        </div>
      </div>

      {userConsults.length > 0 && (
        <div className="tw" style={{ marginTop: '18px' }}>
          <div className="twh"><div className="twt">Mes Consultations</div><div className="tws">Suivez vos demandes et retournez les documents remis.</div></div>
          <table>
            <thead>
              <tr><th>N° Demande</th><th>Statut</th><th>Boîtes</th><th>Retour prévu</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {userConsults.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px' }}>{c.ref}</span></td>
                  <td><span className={`badge ${c.statut === 'pending' ? 'bo' : c.statut === 'remis' ? 'bb' : c.statut === 'returned' ? 'br' : 'bg'}`}>
                    {c.statut === 'pending' ? 'En attente'
                      : c.statut === 'remis' ? 'En attente de retour'
                      : c.statut === 'returned' ? 'Retour en attente'
                      : 'Clôturée'}
                  </span></td>
                  <td style={{ fontSize: '10px' }}>{c.boites.map(b => <span key={b.id} className="badge by" style={{ margin: '1px' }}>{b.ref}</span>)}</td>
                  <td style={{ fontSize: '10px', color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{fmtDate(c.retour)}</td>
                  <td>
                    {c.statut === 'remis' && <button className="btn bblue bsm" onClick={() => handleRetour(c)}>Retour</button>}
                    {c.statut === 'pending' && <span className="badge bo">En attente</span>}
                    {c.statut === 'returned' && <span className="badge bb">Retour en cours de validation</span>}
                    {c.statut === 'cloture' && <span className="badge bg">Clôturée</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && lastConsult && (
        <div className="mo show">
          <div className="modal">
            <div className="mt">✅ Demande de Consultation Soumise</div>
            <div className="ms">L'archiviste central a été notifié et va préparer les boîtes demandées.</div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '9px', padding: '14px', margin: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>N° Demande :</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '16px', color: 'var(--gold)', fontWeight: 700 }}>{lastConsult.ref}</span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={{ color: 'var(--text3)' }}>Demandeur</span><br /><strong>{currentUser.name} ({currentUser.svc})</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Motif</span><br /><strong>{lastConsult.motif}</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Retour prévu</span><br /><strong>{fmtDate(lastConsult.retour)}</strong></div>
                  <div><span style={{ color: 'var(--text3)' }}>Nb boîtes</span><br /><strong>{lastConsult.boites.length}</strong></div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '5px' }}>BOÎTES DEMANDÉES</div>
                  {lastConsult.boites.map(b => <span key={b.id} className="badge by" style={{ margin: '2px' }}>{b.ref}</span>)}
                </div>
              </div>
            </div>
            <div className="mf"><button className="btn bp2" onClick={() => setShowModal(false)}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;
