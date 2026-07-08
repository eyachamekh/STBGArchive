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

      <div className="locaux-grid">
        {localStats.map((loc, idx) => {
          const percentage = Math.min(Math.round((loc.occupied / loc.totalCapacity) * 100), 100);
          return (
            <div key={idx} className="tw locaux-card">
              <div>
                <div className="locaux-card-header">
                  <div className="locaux-card-title">{loc.name}</div>
                  <span className="locaux-card-badge" style={{ color: loc.color }}>
                    Local #{idx + 1}
                  </span>
                </div>
                <div className="locaux-card-desc">
                  {loc.desc}
                </div>
              </div>

              <div>
                <div className="locaux-bar-labels">
                  <span>Occupation ({loc.occupied} / {loc.totalCapacity} boîtes)</span>
                  <span>{percentage}%</span>
                </div>
                
                <div className="locaux-bar-wrap">
                  <div className="locaux-bar-fill" style={{ width: `${percentage}%`, background: loc.color }}></div>
                </div>

                <div className="locaux-bar-footer">
                  <span>Espace Libre: {Math.max(loc.totalCapacity - loc.occupied, 0)} boîtes</span>
                  <span>Status: {percentage > 85 ? '🚨 Critique' : percentage > 60 ? '⚠️ Élevé' : '✓ Normal'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tw mt-20">
        <div className="twh">
          <div className="twt">Consignes de Sécurité des Locaux</div>
        </div>
        <div className="locaux-rules">
          <ul className="m-0 pl-20">
            <li className="mb-8">🚫 L'accès aux locaux d'archives 1 & 2 est strictement réservé à l'archiviste central et aux personnes autorisées.</li>
            <li className="mb-8">💨 Les locaux doivent être maintenus à une température ambiante stable (18-22°C) et un taux d'humidité contrôlé (45-55%).</li>
            <li className="mb-8">🧯 Les extincteurs à CO2 doivent être vérifiés périodiquement et les issues de secours maintenues dégagées en toutes circonstances.</li>
            <li>📦 Toutes les boîtes d'archives entrantes doivent obligatoirement porter l'étiquette A4 réglementaire générée par l'application.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Locaux;
