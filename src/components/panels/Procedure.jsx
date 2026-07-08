import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../utils/constants';

const CLASSIFICATION_CODES = [
  { code: 'CPT', service: 'Comptabilité', responsible: 'Imen Ben Achour', color: COLORS['CPT'] || '#666' },
  { code: 'COM', service: 'Commercial', responsible: 'Sonia Fligene', color: COLORS['COM'] || '#666' },
  { code: 'REC', service: 'Recouvrement', responsible: 'Jihene Fredj', color: COLORS['REC'] || '#666' },
  { code: 'FOR', service: 'Formation', responsible: 'Sofiane Mnasri', color: COLORS['FOR'] || '#666' },
  { code: 'ASS', service: 'Assurance', responsible: 'Dallel Kaabachi', color: COLORS['ASS'] || '#666' },
  { code: 'QHS', service: 'QHSE', responsible: 'Maroua Baks', color: COLORS['QHS'] || '#666' },
  { code: 'FIN', service: 'Finance', responsible: 'Sondes Daly', color: COLORS['FIN'] || '#666' },
  { code: 'ACH', service: 'Achat', responsible: 'Bechir Selmen', color: COLORS['ACH'] || '#666' },
  { code: 'SCH', service: 'Supply Chain', responsible: 'Anis Mefteh', color: COLORS['SCH'] || '#666' },
  { code: 'RH', service: 'RH', responsible: 'Wiem Khiari', color: COLORS['RH'] || '#666' },
  { code: 'SEC', service: 'Sécurité', responsible: 'Mourad Ben Azzouz', color: COLORS['SEC'] || '#666' },
  { code: 'STP', service: 'Stock Plein', responsible: 'Belhassen Mannai', color: COLORS['STP'] || '#666' },
  { code: 'MAG', service: 'Magasin Central', responsible: 'Faouzi Ghenimi', color: COLORS['MAG'] || '#666' },
  { code: 'STV', service: 'Stock Vide', responsible: 'Mohamed Keissi', color: COLORS['STV'] || '#666' },
  { code: 'CQL', service: 'QHSE - Contrôle Qualité', responsible: 'Emna Rahhali', color: COLORS['CQL'] || '#666' },
  { code: 'HSE', service: 'QHSE - HSE', responsible: 'Nizar Khemiri', color: COLORS['HSE'] || '#666' },
  { code: 'BME', service: 'Bureau Méthodes', responsible: 'Mourad Bouzidi', color: COLORS['BME'] || '#666' },
  { code: 'PRD', service: 'Production', responsible: 'Mohamed Hassen', color: COLORS['PRD'] || '#666' },
  { code: 'SIR', service: 'Siroperie', responsible: 'Moncef Ben Zayed', color: COLORS['SIR'] || '#666' },
  { code: 'STE', service: 'STEP', responsible: 'Mohamed Hassen', color: COLORS['STE'] || '#666' },
  { code: 'PNC', service: 'PNC', responsible: 'Habib Hammouda', color: COLORS['PNC'] || '#666' },
  { code: 'PAR', service: 'Parc Roulant', responsible: 'Bilel Souabni', color: COLORS['PAR'] || '#666' },
  { code: 'LOG', service: 'Logistique', responsible: 'Bechir Raddadi', color: COLORS['LOG'] || '#666' },
];

const DEFAULT_PROCEDURE = [
  { step: 'ARCHIVAGE 1', action: 'Connexion et remplissage du formulaire (type, période, réf. début/fin)', responsible: 'Resp. Service', application: 'Nouvelle Demande' },
  { step: 'ARCHIVAGE 2', action: 'Référence unique générée + date de destruction calculée automatiquement', responsible: 'Système', application: 'Automatique' },
  { step: 'ARCHIVAGE 3', action: 'Impression étiquette A4 verticale (dos de boîte) + étiquette face', responsible: 'Resp. Service', application: 'Bouton Imprimer' },
  { step: 'ARCHIVAGE 4', action: 'Dépôt boîte au local indiqué. Statut = En attente validation', responsible: 'Resp. Service', application: 'Automatique' },
  { step: 'ARCHIVAGE 5', action: 'Vérification physique et validation (ou rejet avec motif) par l\'archiviste', responsible: 'Archiviste', application: 'Validation' },
  { step: 'CONSULTATION 1', action: 'Recherche des boîtes par type/service/période et sélection', responsible: 'Tout utilisateur', application: 'Consultation' },
  { step: 'CONSULTATION 2', action: 'Soumission demande à l\'archiviste avec motif et date de retour prévue', responsible: 'Tout utilisateur', application: 'Consultation' },
  { step: 'CONSULTATION 3', action: 'Archiviste sort les boîtes et valide la remise dans l\'app', responsible: 'Archiviste', application: 'Gestion Consultations' },
  { step: 'CONSULTATION 4', action: 'Retour des boîtes : l\'archiviste valide le retour et clôture la demande', responsible: 'Archiviste', application: 'Gestion Consultations' },
  { step: 'DESTRUCTION', action: 'Purge annuelle (janvier) — PV signé DG + DAF + Archiviste', responsible: 'DG + DAF + Archiviste', application: 'À Détruire' },
];

const Procedure = () => {
  const { currentUser } = useContext(AppContext);
  const [procedureSteps, setProcedureSteps] = useState(DEFAULT_PROCEDURE);
  const [classificationCodes, setClassificationCodes] = useState(CLASSIFICATION_CODES);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingClassIndex, setEditingClassIndex] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('stbg_procedure_steps');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          setProcedureSteps(parsed);
        }
      }
    } catch (err) {
      console.error('Could not load saved procedure:', err);
    }

    try {
      const storedCodes = localStorage.getItem('stbg_classification_codes');
      if (storedCodes) {
        const parsedCodes = JSON.parse(storedCodes);
        if (Array.isArray(parsedCodes) && parsedCodes.length) {
          setClassificationCodes(parsedCodes);
        }
      }
    } catch (err) {
      console.error('Could not load saved classification codes:', err);
    }
  }, []);

  const saveProcedure = () => {
    localStorage.setItem('stbg_procedure_steps', JSON.stringify(procedureSteps));
    setEditMode(false);
    setEditingIndex(null);
  };

  const saveRow = () => {
    localStorage.setItem('stbg_procedure_steps', JSON.stringify(procedureSteps));
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const resetProcedure = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la procédure aux valeurs par défaut ? Toutes vos modifications seront perdues.')) {
      setProcedureSteps(DEFAULT_PROCEDURE);
      setClassificationCodes(CLASSIFICATION_CODES);
      localStorage.removeItem('stbg_procedure_steps');
      localStorage.removeItem('stbg_classification_codes');
      setEditingIndex(null);
      setEditingClassIndex(null);
    }
  };

  const saveClassificationCodes = (codes) => {
    localStorage.setItem('stbg_classification_codes', JSON.stringify(codes));
    setClassificationCodes(codes);
  };

  const updateClassificationField = (index, field, value) => {
    setClassificationCodes(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const saveClassificationEdit = () => {
    localStorage.setItem('stbg_classification_codes', JSON.stringify(classificationCodes));
    setEditingClassIndex(null);
  };

  const cancelClassificationEdit = () => {
    setEditingClassIndex(null);
    const storedCodes = localStorage.getItem('stbg_classification_codes');
    if (storedCodes) {
      try {
        const parsedCodes = JSON.parse(storedCodes);
        if (Array.isArray(parsedCodes)) setClassificationCodes(parsedCodes);
      } catch (err) {
        console.error('Unable to restore classification codes from storage:', err);
      }
    } else {
      setClassificationCodes(CLASSIFICATION_CODES);
    }
  };

  const updateStep = (index, field, value) => {
    setProcedureSteps(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addStep = () => {
    setProcedureSteps(prev => [...prev, { step: 'NOUVELLE ÉTAPE', action: '', responsible: '', application: '' }]);
  };

  const removeStep = (index) => {
    setProcedureSteps(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="panel active">
      <div className="tw mt-24">
        <div className="twh"><div className="twt">Codes de Classement Normalisés STBG</div></div>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Service</th>
              <th>Responsable</th>
              <th>Couleur étiquette</th>
              {isAdmin && <th className="col-narrow">Modifier</th>}
            </tr>
          </thead>
          <tbody>
            {classificationCodes.map((entry, index) => {
              return (
                <tr key={`${entry.code}-${index}`}>
                  <td className="ref-mono">
                    {editingClassIndex === index && isAdmin ? (
                      <input
                        value={entry.code}
                        onChange={(e) => updateClassificationField(index, 'code', e.target.value)}
                        className="table-input-mono"
                      />
                    ) : entry.code}
                  </td>
                  <td>
                    {editingClassIndex === index && isAdmin ? (
                      <input
                        value={entry.service}
                        onChange={(e) => updateClassificationField(index, 'service', e.target.value)}
                        className="table-input"
                      />
                    ) : (
                      <span className="tdm">{entry.service}</span>
                    )}
                  </td>
                  <td>
                    {editingClassIndex === index && isAdmin ? (
                      <input
                        value={entry.responsible}
                        onChange={(e) => updateClassificationField(index, 'responsible', e.target.value)}
                        className="table-input"
                      />
                    ) : entry.responsible}
                  </td>
                  <td>
                    {editingClassIndex === index && isAdmin ? (
                      <input
                        type="color"
                        value={entry.color}
                        onChange={(e) => updateClassificationField(index, 'color', e.target.value)}
                        className="color-input"
                      />
                    ) : (
                      <span className="color-swatch-label">
                        <span className="color-swatch" style={{ background: entry.color }}></span>
                        {entry.color.toUpperCase()}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="text-center">
                      {editingClassIndex === index ? (
                        <div className="icon-btn-group">
                          <button className="btn bgreen bsm icon-btn" onClick={saveClassificationEdit}>✓</button>
                          <button className="btn bg2 bsm icon-btn" onClick={cancelClassificationEdit}>✕</button>
                        </div>
                      ) : (
                        <button className="btn bg2 bsm icon-btn" onClick={() => setEditingClassIndex(index)}>✎</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Procedure;
