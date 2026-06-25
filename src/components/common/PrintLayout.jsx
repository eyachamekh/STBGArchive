import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/date';

const PrintLayout = ({ demande }) => {
  const { setPrintDemande } = useContext(AppContext);

  if (!demande) return null;

  const col = '#c8102e';

  const destFmt = demande.destFmt && demande.destFmt !== '—'
    ? formatDate(demande.destFmt)
    : demande.destRaw ? formatDate(demande.destRaw) : '—';

  const hasRefs =
    (demande.boites_details?.length > 0 &&
      (demande.boites_details[0].ref_debut || demande.boites_details[0].ref_fin)) ||
    demande.refDebut || demande.refFin;

  return (
    <div id="print-zone" className="show">
      <div className="etiq-outer">
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', fontFamily: "'DM Mono',monospace", marginBottom: '4mm' }}>
          ① ÉTIQUETTE DOS DE BOÎTE — Coller sur le dos (tranche visible sur étagère)
        </div>
        <div className="etiq-vertical">
          <div className="etiq-top-band" style={{ background: col }}>{demande.svc}</div>
          <div className="etiq-logo-zone">
            <div className="etiq-logo-circle"><img src="/logo-stbg.jpg" alt="STBG Logo" className="etiq-logo-img" /></div>
            <div>
              <div className="etiq-co-abbr">STBG</div>
              <div className="etiq-co-name">Société Tunisienne<br />des Boissons Gazeuses</div>
            </div>
          </div>
          <div className="etiq-ref-zone">
            <div className="etiq-ref-lbl">Référence unique</div>
            <div className="etiq-ref">{demande.ref}</div>
          </div>
          <div className="etiq-body">
            <div className="ef-row"><div className="ef-lbl">Type de Documents</div><div className="ef-val big">{demande.type}</div></div>
            <div className="ef-row"><div className="ef-lbl">Service</div><div className="ef-val">{demande.svc}</div></div>
            <div className="ef-row" style={{ display: 'flex', gap: '3mm' }}>
              <div className="ef-row" style={{ flex: 1, margin: 0 }}>
                <div className="ef-lbl">Date Début</div>
                <div className="ef-val" style={{ fontSize: '9px' }}>{formatDate(demande.dd)}</div>
              </div>
              <div className="ef-row" style={{ flex: 1, margin: 0 }}>
                <div className="ef-lbl">Date Fin</div>
                <div className="ef-val" style={{ fontSize: '9px' }}>{formatDate(demande.df)}</div>
              </div>
            </div>
            {hasRefs && (
              <div className="etiq-refs-zone">
                <div className="etiq-refs-title">Références des pièces dans la boîte</div>
                <div className="etiq-refs-grid">
                  <div className="etiq-ref-item">
                    <div className="ef-lbl">Réf. Début</div>
                    <div className="ef-val">{demande.boites_details?.[0]?.ref_debut || demande.refDebut || '—'}</div>
                  </div>
                  <div className="etiq-ref-item">
                    <div className="ef-lbl">Réf. Fin</div>
                    <div className="ef-val">{demande.boites_details?.[0]?.ref_fin || demande.refFin || '—'}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="ef-row"><div className="ef-lbl">Local d'Archives</div><div className="ef-val" style={{ fontWeight: 800 }}>{demande.local}</div></div>
            <div className="ef-row"><div className="ef-lbl">Conservation légale</div><div className="ef-val" style={{ color: '#b77700', fontWeight: 800 }}>{demande.delai}</div></div>
            <div className="etiq-dest">
              <div className="etiq-dest-lbl">⚠ Destruction prévue</div>
              <div className="etiq-dest-date">{destFmt}</div>
            </div>
          </div>
          <div className="etiq-signs">
            <div className="etiq-sign"><div className="etiq-sign-line">Archiviste</div></div>
            <div className="etiq-sign"><div className="etiq-sign-line">Cachet STBG</div></div>
          </div>
          <div className="etiq-foot">
            <span>{demande.ref}</span>
            <span>{new Date().toLocaleDateString('fr-TN')}</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '14px', display: 'flex', gap: '10px', justifyContent: 'center' }} className="no-print">
        <button
          onClick={() => setPrintDemande(null)}
          style={{ background: '#111', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}
        >
          ✕ Fermer
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: '#c8102e', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}
        >
          🖨 Imprimer A4
        </button>
      </div>
    </div>
  );
};

export default PrintLayout;
