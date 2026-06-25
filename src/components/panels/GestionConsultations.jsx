import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const GestionConsultations = () => {
  const { consultations, updateConsultationStatus } = useContext(AppContext);
  const [tab, setTab] = useState('pending');

  const [remiseId, setRemiseId] = useState(null);
  const [remiseObs, setRemiseObs] = useState('');
  
  const [retourId, setRetourId] = useState(null);
  const [retourEtat, setRetourEtat] = useState('Bon état');

  const list = consultations.filter(c => c.statut === tab);
  
  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const p = s.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const confirmerRemise = () => {
    updateConsultationStatus(remiseId, 'remis', { remiseObs });
    setRemiseId(null);
  };

  const confirmerRetour = () => {
    updateConsultationStatus(retourId, 'cloture', { retourEtat });
    setRetourId(null);
  };

  const activeConsult = remiseId ? consultations.find(c => c.id === remiseId) : null;

  return (
    <div className="panel active">
      <div className="al al-b">🔒 Section réservée à l'archiviste central. Traitez les demandes de consultation, remettez les boîtes et validez leur retour.</div>
      <div className="tabs">
        <div className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>En attente</div>
        <div className={`tab ${tab === 'remis' ? 'active' : ''}`} onClick={() => setTab('remis')}>Documents remis</div>
        <div className={`tab ${tab === 'returned' ? 'active' : ''}`} onClick={() => setTab('returned')}>En retour</div>
        <div className={`tab ${tab === 'cloture' ? 'active' : ''}`} onClick={() => setTab('cloture')}>Clôturées</div>
      </div>
      <div className="tw">
        <div className="twh"><div className="twt">
          {tab === 'pending' ? 'Demandes de Consultation en Attente'
            : tab === 'remis' ? 'Documents Remis'
            : tab === 'returned' ? 'Documents en Retour'
            : 'Consultations Clôturées'}
        </div></div>
        <table>
          <thead>
            <tr><th>N° Demande</th><th>Demandeur</th><th>Service</th><th>Motif</th><th>Boîtes demandées</th><th>Retour prévu</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!list.length ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>Aucune demande.</td></tr>
            ) : (
              list.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{c.ref}</span></td>
                  <td className="tdm">{c.nom}</td>
                  <td>{c.svc}</td>
                  <td><span className="badge bo">{c.motif}</span></td>
                  <td style={{ fontSize: '10px' }}>{c.boites.map(b => <span key={b.id} className="badge by" style={{ margin: '1px' }}>{b.ref}</span>)}</td>
                  <td style={{ fontSize: '10px', color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>{fmtDate(c.retour)}</td>
                  <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{c.created}</td>
                  <td>
                    {tab === 'pending' && <button className="btn bgreen bsm" onClick={() => setRemiseId(c.id)}>Remettre</button>}
                    {tab === 'returned' && <button className="btn bblue bsm" onClick={() => setRetourId(c.id)}>✓ Clôturer</button>}
                    {(tab === 'remis' || tab === 'cloture') && <span className={`badge ${tab === 'cloture' ? 'bg' : 'bb'}`}>{tab === 'cloture' ? 'Clôturée' : 'En attente de retour'}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {remiseId && activeConsult && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Confirmer la Remise</div>
            <div className="ms">Les boîtes suivantes seront marquées comme remises au demandeur.</div>
            <div style={{ marginBottom: '14px' }}>
              {activeConsult.boites.map(b => (
                <div key={b.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)' }}>{b.ref}</span> — {b.type} ({b.local})
                </div>
              ))}
            </div>
            <div className="fgrp">
              <div className="flbl">Observations (optionnel)</div>
              <textarea placeholder="Notes sur la remise..." value={remiseObs} onChange={e => setRemiseObs(e.target.value)}></textarea>
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setRemiseId(null)}>Annuler</button>
              <button className="btn bgreen" onClick={confirmerRemise}>✓ Confirmer Remise</button>
            </div>
          </div>
        </div>
      )}

      {retourId && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Confirmer le Retour</div>
            <div className="ms">Les boîtes ont été retournées et remises en place dans le local d'archives.</div>
            <div className="fgrp">
              <div className="flbl">État au retour</div>
              <select value={retourEtat} onChange={e => setRetourEtat(e.target.value)}>
                <option>Bon état</option>
                <option>État dégradé — signaler</option>
                <option>Documents manquants — signaler</option>
              </select>
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setRetourId(null)}>Annuler</button>
              <button className="btn bgreen" onClick={confirmerRetour}>✓ Clôturer la Consultation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionConsultations;
