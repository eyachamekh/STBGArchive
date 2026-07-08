import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const MesDemandes = () => {
  const { currentUser, demandes, setPrintDemande, setEditRequest, setActivePanel, demandeFilter, setDemandeFilter, openDemandeId, setOpenDemandeId } = useContext(AppContext);
  const [filter, setFilter] = useState('');

  if (!currentUser) return null;

  const mine = demandes.filter(d => 
    d.uid === currentUser.id && 
    (demandeFilter === 'all' || d.statut === demandeFilter) &&
    (!filter || d.ref.toLowerCase().includes(filter.toLowerCase()) || d.type.toLowerCase().includes(filter.toLowerCase()))
  ).slice().reverse();

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const statutBadge = (d) => {
    if (d.statut === 'pending') return <span className="badge bo">⏳ En attente</span>;
    if (d.statut === 'validated') return (
      <>
        <span className="badge bg">✓ Validée</span>
        {d.motif ? <div className="demande-motif-note">{d.motif}</div> : null}
      </>
    );
    if (d.statut === 'rejected') return (
      <>
        <span className="badge br">✗ Rejetée</span><br />
        <span className="demande-reject-motif">{d.motif}</span>
      </>
    );
    if (d.statut === 'destroyed' || d.statut === 'détruite') return (
      <>
        <span className="badge br">⊘ Détruite</span><br />
        {d.motif ? <span className="demande-pv-ref">PV: {d.motif}</span> : null}
      </>
    );
    return null;
  };

  return (
    <div className="panel active">
      <div className="sb flex gap-8 items-center">
        <span className="text-muted">⌕</span>
        <input placeholder="Rechercher..." value={filter} onChange={e => setFilter(e.target.value)} />
        <select value={demandeFilter} onChange={e => setDemandeFilter(e.target.value)} className="ml-8">
          <option value="all">Toutes</option>
          <option value="pending">En attente</option>
          <option value="validated">Validées</option>
          <option value="rejected">Rejetées</option>
        </select>
      </div>
      <div className="tw">
        <div className="twh"><div className="twt">Mes Demandes d'Archivage</div></div>
        <table>
          <thead>
            <tr><th>Référence</th><th>Type Document</th><th>Période</th><th>Réf. Boîtes</th><th>Boîtes</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {!mine.length ? (
              <tr><td colSpan="8" className="empty-row">Aucune demande.</td></tr>
            ) : (
              mine.map(d => {
                const boites = d.boites_details?.length > 0 ? d.boites_details : [{ ref_debut: d.refDebut || '', ref_fin: d.refFin || '' }];
                const hasRefs = boites.some(b => b.ref_debut || b.ref_fin);
                return (
                  <tr key={d.id} style={openDemandeId === d.id ? { background: 'rgba(200,16,46,0.06)' } : {}}>
                    <td><span className="ref-mono">{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td className="fs-10">{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                    <td className="fs-10 mono">
                      {!hasRefs ? '—' : boites.map((b, i) => (b.ref_debut || b.ref_fin) ? (
                        <div key={i}>{boites.length > 1 && <span className="text-muted">B{i+1}: </span>}{b.ref_debut || '—'} → {b.ref_fin || '—'}</div>
                      ) : null)}
                    </td>
                    <td className="text-center">{d.nb}</td>
                    <td>{statutBadge(d)}</td>
                    <td>
                      {d.statut === 'validated' ? (
                        <button className="btn bg2 bsm" onClick={() => setPrintDemande(d)}>🖨</button>
                      ) : d.statut === 'rejected' ? (
                        <button className="btn bgold bsm" onClick={() => { setEditRequest(d); setActivePanel('nouvelle'); }}>✎ Modifier</button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {openDemandeId && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">Détails de la Demande</div>
            <div className="ms">Détails complets de la demande sélectionnée.</div>
            <div className="detail-box-sm">
              {(() => {
                const d = demandes.find(x => x.id === openDemandeId);
                if (!d) return <div>Aucune demande trouvée.</div>;
                return (
                  <div>
                    <div><strong>Référence :</strong> <span className="ref-mono">{d.ref}</span></div>
                    <div><strong>Type :</strong> {d.type}</div>
                    <div><strong>Période :</strong> {fmtDate(d.dd)} → {fmtDate(d.df)}</div>
                    <div><strong>Service :</strong> {d.svc}</div>
                    <div><strong>Responsable :</strong> {d.resp}</div>
                    <div><strong>Local :</strong> {d.local}</div>
                    <div><strong>Boîtes :</strong> {d.nb}</div>
                    <div className="mt-8"><strong>Observations :</strong><div className="text-muted2">{d.obs || '—'}</div></div>
                    {d.motif && <div className="mt-8"><strong>Motif :</strong><div className={d.statut === 'rejected' ? 'text-red' : 'text-muted'}>{d.motif}</div></div>}
                  </div>
                );
              })()}
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={() => setOpenDemandeId(null)}>Fermer</button>
              {(() => {
                const d = demandes.find(x => x.id === openDemandeId);
                return d?.statut === 'validated' ? (
                  <button
                    className="btn bgold"
                    onClick={() => { setPrintDemande(d); setOpenDemandeId(null); }}
                  >🖨 Imprimer</button>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MesDemandes;
