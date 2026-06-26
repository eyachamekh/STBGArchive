import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { DUP_RULES } from '../../data';

const Dashboard = () => {
  const { currentUser, setActivePanel, demandes, consultations, setPrintDemande } = useContext(AppContext);

  const r = currentUser.role;
  const total = demandes.length;
  const pend = demandes.filter(d => d.statut === 'pending').length;
  const valid = demandes.filter(d => d.statut === 'validated').length;
  const cpend = consultations.filter(c => c.statut === 'pending').length;

  const mine = demandes.filter(d => d.uid === currentUser.id);
  const mconsult = consultations.filter(c => c.uid === currentUser.id);

  let dups = [];
  if (r === 'archiviste' || r === 'admin') {
    DUP_RULES.forEach(rule => {
      const f = demandes.filter(d => rule.svcs.includes(d.code) && (d.type.toLowerCase().includes(rule.kw.toLowerCase()) || rule.types.some(t => d.type.toLowerCase().includes(t.toLowerCase()))));
      if (f.length >= 2) dups.push({ kw: rule.kw, msg: rule.msg, found: f });
    });
  }

  const src = r === 'service' ? mine : demandes;
  const last = [...src].reverse().slice(0, 10);

  const csrc = (r === 'archiviste' || r === 'admin') ? consultations : mconsult;
  const activeConsults = csrc.filter(c => c.statut !== 'cloture');

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

  const cStatutBadge = (s) => {
    if (s === 'pending') return <span className="badge bo">⏳ En attente</span>;
    if (s === 'remis') return <span className="badge bb">📦 En attente de retour</span>;
    if (s === 'returned') return <span className="badge br">↩ Retour en attente</span>;
    if (s === 'cloture') return <span className="badge bg">✓ Clôturée</span>;
    return null;
  };

  return (
    <div className="panel active">
      <div className="sg">
        {(r === 'archiviste' || r === 'admin') ? (
          <>
            <div className="sc"><div className="sv">{total}</div><div className="sl">Boîtes Enregistrées</div><div className="ss">Toutes sources</div></div>
            <div className="sc co"><div className="sv">{pend}</div><div className="sl">En Attente Validation</div><div className="ss">À vérifier</div></div>
            <div className="sc cg"><div className="sv">{valid}</div><div className="sl">Archivage Validé</div><div className="ss">Confirmées</div></div>
            <div className="sc cb"><div className="sv">{cpend}</div><div className="sl">Consultations en attente</div><div className="ss">Documents à sortir</div></div>
          </>
        ) : (
          <>
            <div className="sc"><div className="sv">{mine.length}</div><div className="sl">Mes Archives</div></div>
            <div className="sc co"><div className="sv">{mine.filter(d => d.statut === 'pending').length}</div><div className="sl">En Attente</div></div>
            <div className="sc cg"><div className="sv">{mine.filter(d => d.statut === 'validated').length}</div><div className="sl">Validées</div></div>
            <div className="sc cb"><div className="sv">{mconsult.length}</div><div className="sl">Mes Consultations</div></div>
          </>
        )}
      </div>

      {dups.length > 0 && (
        <div style={{ background: 'rgba(230,126,34,.07)', border: '2px solid var(--orange)', borderRadius: '9px', padding: '14px 16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f39c12', marginBottom: '8px' }}>⚠ {dups.length} alerte(s) de doublons</div>
          {dups.slice(0, 2).map((dp, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '9px 12px', marginBottom: '7px', fontSize: '11px' }}>
              <strong>{dp.kw.toUpperCase()}</strong> — {dp.msg}
              <div style={{ marginTop: '5px' }}>
                {dp.found.map(d => <span key={d.id} className="badge bo" style={{ margin: '2px' }}>{d.ref} — {d.svc}</span>)}
              </div>
            </div>
          ))}
          <button className="btn bsm" style={{ background: 'var(--orange)', color: '#fff', border: 'none', marginTop: '6px' }} onClick={() => setActivePanel('doublons')}>Voir tout →</button>
        </div>
      )}

      <div className="tw">
        <div className="twh">
          <div><div className="twt">Dernières Demandes d'Archivage</div><div className="tws">10 dernières soumissions</div></div>
          {r === 'service' && <button className="btn bp2 bsm" onClick={() => setActivePanel('nouvelle')}>+ Nouvelle</button>}
        </div>
        <table>
          <thead>
            <tr><th>Référence</th><th>Type Document</th><th>Service</th><th>Période</th><th>Local</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {!last.length ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '26px', color: 'var(--text3)' }}>Aucune demande pour l'instant.</td></tr>
            ) : (
              last.map(d => (
                <tr key={d.id}>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{d.ref}</span></td>
                  <td className="tdm">{d.type}</td>
                  <td>{d.svc}</td>
                  <td style={{ fontSize: '10px' }}>{fmtDate(d.dd)} → {fmtDate(d.df)}</td>
                  <td>{d.local}</td>
                  <td>{statutBadge(d.statut)}</td>
                  <td>{d.statut === 'validated' ? <button className="btn bg2 bsm" onClick={() => setPrintDemande(d)}>🖨</button> : null}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeConsults.length > 0 && (
        <div className="tw">
          <div className="twh"><div className="twt">Consultations en Cours</div></div>
          <table>
            <thead>
              <tr><th>N° Demande</th><th>Demandeur</th><th>Boîtes demandées</th><th>Date</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {activeConsults.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--gold)', fontSize: '11px' }}>{c.ref}</span></td>
                  <td className="tdm">{c.nom}</td>
                  <td>{c.boites.map(b => <span key={b.id} className="badge by" style={{ margin: '1px' }}>{b.ref}</span>)}</td>
                  <td style={{ fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{c.created}</td>
                  <td>{cStatutBadge(c.statut)}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
