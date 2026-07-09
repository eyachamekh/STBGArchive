import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 15;

const GestionConsultations = () => {
  const { currentUser, consultations, updateConsultationStatus } = useContext(AppContext);
  const [tab, setTab] = useState(() => localStorage.getItem('gestionConsultationsTab') || 'pending');
  const [page, setPage] = useState(1);

  useEffect(() => {
    localStorage.setItem('gestionConsultationsTab', tab);
  }, [tab]);

  const [remiseId, setRemiseId] = useState(null);
  const [remiseObs, setRemiseObs] = useState('');
  
  const [retourId, setRetourId] = useState(null);
  const [retourEtat, setRetourEtat] = useState('Bon état');

  const allList = consultations.filter(c => c.statut === tab && (currentUser?.role === 'admin' || currentUser?.role === 'archiviste' || c.uid === currentUser?.id));
  const totalPages = Math.ceil(allList.length / ITEMS_PER_PAGE);
  const list = allList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  
  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
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

  const marquerRemis = (consultationId) => {
    updateConsultationStatus(consultationId, 'returned', {});
   setTab('returned');
  };

  const marquerResolu = (consultationId) => {
   updateConsultationStatus(consultationId, 'cloture', { retourEtat: 'Bon état' });
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
              <tr><td colSpan="8" className="empty-row">Aucune demande.</td></tr>
            ) : (
              list.map(c => (
                <tr key={c.id}>
                  <td><span className="ref-mono">{c.ref}</span></td>
                  <td className="tdm">{c.nom}</td>
                  <td>{c.svc}</td>
                  <td><span className="badge bo">{c.motif}</span></td>
                  <td className="fs-10">{c.boites.map(b => <span key={b.id} className="badge by m-1">{b.ref}</span>)}</td>
                  <td className="date-warn-mono">{fmtDate(c.retour)}</td>
                  <td className="fs-10 mono">{c.created}</td>
                  <td>
                    {tab === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'archiviste') && (
                      <button className="btn bgreen bsm" onClick={() => setRemiseId(c.id)}>Remettre</button>
                    )}
                    {tab === 'pending' && currentUser?.role !== 'admin' && currentUser?.role !== 'archiviste' && (
                      <span className="badge bo">En attente</span>
                    )}
                    {tab === 'returned' && (currentUser?.role === 'admin' || currentUser?.role === 'archiviste') && (
                      <button className="btn bblue bsm" onClick={() => setRetourId(c.id)}>✓ Retour</button>
                    )}
                    {tab === 'returned' && currentUser?.role !== 'admin' && currentUser?.role !== 'archiviste' && (
                      <span className="badge bo">En retour</span>
                    )}
                    {tab === 'remis' && currentUser?.role !== 'admin' && currentUser?.role !== 'archiviste' && (
                      <button className="btn bb bsm" onClick={() => marquerRemis(c.id)}>Remis</button>
                    )}
                    {tab === 'remis' && (currentUser?.role === 'admin' || currentUser?.role === 'archiviste') && (
                      <span className="badge bb">En attente de retour</span>
                    )}
                    {tab === 'cloture' && (
                      <div className="flex gap-6 items-center">
                        <span className={`badge ${(c.retourEtat && (c.retourEtat.includes('dégradé') || c.retourEtat.includes('manquants'))) ? 'by' : 'bg'}`}>Clôturée</span>
                        {c.retourEtat && (c.retourEtat.includes('dégradé') || c.retourEtat.includes('manquants')) && (
                          <button className="btn by bsm" onClick={() => marquerResolu(c.id)}>✓ OK</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {remiseId && activeConsult && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Confirmer la Remise</div>
            <div className="ms">Les boîtes suivantes seront marquées comme remises au demandeur.</div>
            <div className="mb-14">
              {activeConsult.boites.map(b => (
                <div key={b.id} className="consult-boite-line">
                  <span className="ref-mono">{b.ref}</span> — {b.type} ({b.local})
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
              <button className="btn bgreen" onClick={confirmerRetour}>✓ Valider le Retour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionConsultations;
