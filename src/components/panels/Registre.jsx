import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';

const ITEMS_PER_PAGE = 15;

const Registre = () => {
  const { demandes, setPrintDemande } = useContext(AppContext);
  const [filter, setFilter] = useState('');
  const [showDestroyed, setShowDestroyed] = useState(false);
  const [page, setPage] = useState(1);

  const today = new Date();

  const isDestroyed = (d) => {
    if (d.statut === 'destroyed' || d.statut === 'détruite') return false;
    if (!d.destRaw || d.destRaw === '' || d.delai === 'Permanent') return false;
    return new Date(d.destRaw) <= today;
  };

  const baseList = demandes.filter(d =>
    !filter ||
    d.ref.toLowerCase().includes(filter.toLowerCase()) ||
    d.svc.toLowerCase().includes(filter.toLowerCase()) ||
    d.type.toLowerCase().includes(filter.toLowerCase())
  );

  const allList = (showDestroyed ? baseList.filter(isDestroyed) : baseList.filter(d => !isDestroyed(d))).slice().reverse();
  const totalPages = Math.ceil(allList.length / ITEMS_PER_PAGE);
  const list = allList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const destroyedCount = demandes.filter(isDestroyed).length;

  const fmtDate = (s) => {
    if (!s || s.length < 8) return s || '—';
    const datePart = s.includes('T') ? s.split('T')[0] : s;
    const p = datePart.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };

  const statutBadge = (s) => {
    if (s === 'pending') return <span className="badge bo">⏳ En attente</span>;
    if (s === 'validated') return <span className="badge bg">✓ Validée</span>;
    if (s === 'rejected') return <span className="badge br">✗ Rejetée</span>;
    if (s === 'destroyed' || s === 'détruite') return <span className="badge br">⊘ Détruite</span>;
    return null;
  };

  return (
    <div className="panel active">
      <div className="flex gap-8 mb-14 items-center">
        <div className="sb flex-1 m-0">
          <span className="text-muted">⌕</span>
          <input placeholder="Référence, service, type document..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <button
          className={`btn bsm ${showDestroyed ? 'bdanger' : 'bg2'}`}
          onClick={() => setShowDestroyed(v => !v)}
        >
          ⊘ À détruire{destroyedCount > 0 && <span className="nbadge nb-r ml-6">{destroyedCount}</span>}
        </button>
      </div>

      {showDestroyed && (
        <div className="al al-r">⊘ Affichage des archives à détruire — {destroyedCount} document(s) dont la date de destruction est dépassée.</div>
      )}

      <div className="tw">
        <div className="twh">
          <div className="twt">
            {showDestroyed ? 'Archives À Détruire' : 'Registre Général des Archives STBG'}
          </div>
          {showDestroyed && <button className="btn bg2 bsm" onClick={() => setShowDestroyed(false)}>← Tout afficher</button>}
        </div>
        <table>
          <thead>
            <tr><th>Référence</th><th>Type Document</th><th>Service</th><th>Période</th><th>Réf. Début–Fin</th><th>Délai</th><th>Destruction</th><th>Local</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {!list.length ? (
              <tr><td colSpan="10" className="empty-row">
                {showDestroyed ? 'Aucune archive détruite.' : 'Aucune boîte.'}
              </td></tr>
            ) : (
              list.map(d => {
                const boites = d.boites_details?.length > 0 ? d.boites_details : [{ ref_debut: d.refDebut || '', ref_fin: d.refFin || '' }];
                const hasRefs = boites.some(b => b.ref_debut || b.ref_fin);
                const destroyed = isDestroyed(d);
                return (
                  <tr key={d.id} style={destroyed ? { background: 'rgba(200,16,46,0.05)' } : {}}>
                    <td><span className="ref-mono">{d.ref}</span></td>
                    <td className="tdm">{d.type}</td>
                    <td>{d.svc}</td>
                    <td className="fs-10">{fmtDate(d.dd)}<br /><span className="text-muted">à {fmtDate(d.df)}</span></td>
                    <td className="fs-10 mono maxw-120">
                      {!hasRefs ? '—' : boites.map((b, i) => (b.ref_debut || b.ref_fin) ? (
                        <div key={i}>{boites.length > 1 && <span className="text-muted">B{i+1}: </span>}{b.ref_debut || '—'} → {b.ref_fin || '—'}</div>
                      ) : null)}
                    </td>
                    <td><span className={`badge ${d.delai === 'Permanent' ? 'bb' : 'bo'}`}>{d.delai}</span></td>
                    <td className={`fs-10 mono ${destroyed ? 'text-red fw-700' : 'text-muted'}`}>
                      {fmtDate(d.destRaw)}
                      {destroyed && <div><span className="badge br mt-3">⊘ Dépassée</span></div>}
                    </td>
                    <td className="fs-10">{d.local}</td>
                    <td>{statutBadge(d.statut)}</td>
                    <td>{d.statut === 'validated' ? <button className="btn bg2 bsm" onClick={() => setPrintDemande(d)}>🖨</button> : null}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Registre;
