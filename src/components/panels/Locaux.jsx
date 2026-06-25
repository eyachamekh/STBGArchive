import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const Locaux = () => {
  const { demandes } = useContext(AppContext);

  // Count active boxes in each local
  const countBoxes = (localName) => {
    return demandes
      .filter(d => d.statut === 'validated' && d.local === localName)
      .reduce((sum, d) => sum + (d.nb || 1), 0);
  };

  const localStats = [
    {
      name: "Bureau / Service (accès quotidien)",
      dbName: "Bureau / Service",
      totalCapacity: 100,
      occupied: countBoxes("Bureau / Service"),
      desc: "Destiné aux documents à forte fréquence de consultation. Conservation à court terme.",
      color: "var(--blue)"
    },
    {
      name: "Local Archives 1 (semi-actif)",
      dbName: "Local Archives 1",
      totalCapacity: 500,
      occupied: countBoxes("Local Archives 1"),
      desc: "Pour les documents consultés ponctuellement, à conservation intermédiaire.",
      color: "var(--gold)"
    },
    {
      name: "Local Archives 2 (définitif)",
      dbName: "Local Archives 2",
      totalCapacity: 1000,
      occupied: countBoxes("Local Archives 2"),
      desc: "Espace de stockage de masse et de longue durée. Sécurisé pour conservation finale.",
      color: "var(--green)"
    }
  ];

  return (
    <div className="panel active">
      <div className="al al-b">
        📊 Aperçu physique de l'état des stocks d'archives par local de stockage. Les taux d'occupation sont calculés d'après les boîtes validées.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '15px' }}>
        {localStats.map((loc, idx) => {
          const percentage = Math.min(Math.round((loc.occupied / loc.totalCapacity) * 100), 100);
          return (
            <div key={idx} className="tw" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>{loc.name}</div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: loc.color, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    Local #{idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '15px', lineHeight: '1.4' }}>
                  {loc.desc}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px' }}>
                  <span>Occupation ({loc.occupied} / {loc.totalCapacity} boîtes)</span>
                  <span>{percentage}%</span>
                </div>
                
                <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: loc.color, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)' }}>
                  <span>Espace Libre: {Math.max(loc.totalCapacity - loc.occupied, 0)} boîtes</span>
                  <span>Status: {percentage > 85 ? '🚨 Critique' : percentage > 60 ? '⚠️ Élevé' : '✓ Normal'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tw" style={{ marginTop: '20px' }}>
        <div className="twh">
          <div className="twt">Consignes de Sécurité des Locaux</div>
        </div>
        <div style={{ padding: '20px', fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>🚫 L'accès aux locaux d'archives 1 & 2 est strictement réservé à l'archiviste central et aux personnes autorisées.</li>
            <li style={{ marginBottom: '8px' }}>💨 Les locaux doivent être maintenus à une température ambiante stable (18-22°C) et un taux d'humidité contrôlé (45-55%).</li>
            <li style={{ marginBottom: '8px' }}>🧯 Les extincteurs à CO2 doivent être vérifiés périodiquement et les issues de secours maintenues dégagées en toutes circonstances.</li>
            <li>📦 Toutes les boîtes d'archives entrantes doivent obligatoirement porter l'étiquette A4 réglementaire générée par l'application.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Locaux;
