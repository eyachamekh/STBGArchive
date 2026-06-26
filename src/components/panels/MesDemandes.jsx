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
        {d.motif ? <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '4px', maxWidth: '140px' }}>{d.motif}</div> : null}
      </>
    );
    if (d.statut === 'rejected') return (
      <>
        <span className="badge br">✗ Rejetée</span><br />
        <span style={{ fontSize: '9px', color: 'var(--red)' }}>{d.motif}</span>
      </>
    );
    if (d.statut === 'destroyed' || d.statut === 'détruite') return (
      <>
        <span className="badge br">⊘ Détruite</span><br />
        {d.motif ? <span style={{ fontSize: '9px', color: 'var(--text3)' }}>PV: {d.motif}</span> : null}
      </>
    );
    return null;
  };

  const getRefDetails = (d) => {
    if (d.boites_details && d.boites_details.length > 0) {
      const first = d.boites_details[0];
      return {
        refDebut: first.ref_debut || '—',
        refFin: first.ref_fin || '—'
      };
    }
    return {
      refDebut: d.refDebut || '—',
      refFin: d.refFin || '—'
    };
  };

  return (
    <div className="panel active">
      <div className="sb" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: 'var(--text3)' }}>⌕</span>
        <input placeholder="Rechercher..." value={filter} onChange={e => setFilter(e.target.value)} />
        <select value={demandeFilter} onChange={e => setDemandeFilter(e.target.value)} style={{ marginLeft: '8px' }}>
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
            <tr><th>Référence</th><th>Type Document</th><th>Période</th><th>Réf. Début</th><th>Réf. Fin</th><th>Boîtes</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {!mine.length ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)' }}>Aucune demande.</td></tr>
            ) : (
              mine.map(d => {
                const refs = getRefDetails(d);
                return (
                  <tr key={d.id} style={openDemandeId === d.id ? { background: 'rgba(200,16,46,0.06)' } : {}}>
                    <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px' }}>{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                    <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{refs.refDebut}</td>
                    <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{refs.refFin}</td>
                    <td style={{ textAlign: 'center' }}>{d.nb}</td>
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
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '9px', padding: '12px', margin: '12px 0' }}>
              {(() => {
                const d = demandes.find(x => x.id === openDemandeId);
                if (!d) return <div>Aucune demande trouvée.</div>;
                return (
                  <div>
                    <div><strong>Référence :</strong> <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)' }}>{d.ref}</span></div>
                    <div><strong>Type :</strong> {d.type}</div>
                    <div><strong>Période :</strong> {fmtDate(d.dd)} → {fmtDate(d.df)}</div>
                    <div><strong>Service :</strong> {d.svc}</div>
                    <div><strong>Responsable :</strong> {d.resp}</div>
                    <div><strong>Local :</strong> {d.local}</div>
                    <div><strong>Boîtes :</strong> {d.nb}</div>
                    <div style={{ marginTop: '8px' }}><strong>Observations :</strong><div style={{ color: 'var(--text2)' }}>{d.obs || '—'}</div></div>
                    {d.motif && <div style={{ marginTop: '8px' }}><strong>Motif :</strong><div style={{ color: d.statut === 'rejected' ? 'var(--red)' : 'var(--text3)' }}>{d.motif}</div></div>}
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
