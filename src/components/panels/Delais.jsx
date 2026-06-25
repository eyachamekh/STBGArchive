import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const INITIAL_ROWS = [
  { id: 1,  categorie: 'Comptabilité',  type: 'Journaux comptables, grands livres, balances',          delai: '10 ans',   ref: 'Code de Commerce Art. 11' },
  { id: 2,  categorie: 'Comptabilité',  type: 'États financiers, bilans, comptes de résultat',          delai: '10 ans',   ref: 'Code de Commerce Art. 11' },
  { id: 3,  categorie: 'Comptabilité',  type: 'Pièces justificatives, factures fournisseurs/clients',   delai: '10 ans',   ref: 'Code de Commerce Art. 11' },
  { id: 4,  categorie: 'Fiscal',        type: 'Déclarations IS, TVA, TFP, FOPROLOS',                    delai: '10 ans',   ref: 'CIR Art. 99 / Art. 265' },
  { id: 5,  categorie: 'Finance',       type: 'Règlements chèques, traites, virements',                 delai: '10 ans',   ref: 'Loi bancaire 2016-35' },
  { id: 6,  categorie: 'Finance',       type: 'Rapprochements bancaires, inventaires caisses',          delai: '10 ans',   ref: 'Code de Commerce' },
  { id: 7,  categorie: 'Finance',       type: 'Dossiers de crédits bancaires',                          delai: '10 ans',   ref: 'Loi bancaire 2016-35' },
  { id: 8,  categorie: 'Commercial',    type: 'Contrats commerciaux, contrats fournisseurs',            delai: '5 ans',    ref: 'COC Art. 399' },
  { id: 9,  categorie: 'Commercial',    type: 'Factures clients, factures ristournes, avoirs',          delai: '10 ans',   ref: 'Code de Commerce Art. 11' },
  { id: 10, categorie: 'Recouvrement',  type: 'Dossiers clients contentieux, factures PNC',             delai: '10 ans',   ref: 'COC Art. 399 + CIR' },
  { id: 11, categorie: 'RH & Paie',     type: 'Déclarations CNSS, bulletins de paie',                  delai: '10 ans',   ref: 'Loi 60-1985 CNSS' },
  { id: 12, categorie: 'RH & Paie',     type: 'Contrats de travail, avenants',                         delai: '5 ans',    ref: 'Code du Travail Art. 234' },
  { id: 13, categorie: 'Achat',         type: 'Contrats fournisseurs, consultations, AO',               delai: '5 ans',    ref: 'Décret marchés publics' },
  { id: 14, categorie: 'Stock',         type: 'Inventaires, bons de livraison/transfert/entrée',        delai: '5 ans',    ref: 'Code de Commerce' },
  { id: 15, categorie: 'Production',    type: 'Cahiers de fabrication, rapports de rendement',          delai: '5 ans',    ref: 'Pratique industrielle' },
  { id: 16, categorie: 'Qualité',       type: "Procédures QHSE, rapports d'audit, PV réunions",        delai: '5 ans',    ref: 'ISO 22000 / ISO 9001' },
  { id: 17, categorie: 'Sécurité',      type: 'Carnets consommation gaz, fiches entrée/sortie',         delai: '5 ans',    ref: 'Réglementation HSE' },
  { id: 18, categorie: 'Assurance',     type: 'Polices, sinistres, correspondances assureurs',          delai: '5 ans',    ref: 'Code des Assurances' },
  { id: 19, categorie: 'Logistique',    type: 'Feuilles de route, carnets laissez-passer, OT',          delai: '5 ans',    ref: 'Pratique logistique' },
  { id: 20, categorie: 'Parc Roulant',  type: 'Carnets checklist contrôle véhicules',                   delai: '5 ans',    ref: 'Code de la route / Assurance' },
  { id: 21, categorie: 'Formation',     type: 'Plans, attestations, contrats CDC',                      delai: '5 ans',    ref: 'Code du Travail' },
  { id: 22, categorie: 'Juridique',     type: 'Statuts société, actes notariés, PV AG',                 delai: 'Permanent',ref: 'Code des Sociétés' },
];

const EMPTY_FORM = { categorie: '', type: '', delai: '5 ans', ref: '' };

const delaiClass = (d) => {
  if (d === 'Permanent') return 'bb';
  if (d === '10 ans') return 'br';
  return 'bo';
};

const Delais = () => {
  const { currentUser } = useContext(AppContext);
  const isAdmin = currentUser?.role === 'admin';

  const [rows, setRows] = useState(INITIAL_ROWS);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add'); };
  const openEdit = (row) => { setForm({ categorie: row.categorie, type: row.type, delai: row.delai, ref: row.ref }); setEditId(row.id); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditId(null); };

  const save = () => {
    if (!form.categorie.trim() || !form.type.trim() || !form.ref.trim()) {
      alert('Tous les champs sont obligatoires.');
      return;
    }
    if (modal === 'add') {
      setRows(prev => [...prev, { ...form, id: Date.now() }]);
    } else {
      setRows(prev => prev.map(r => r.id === editId ? { ...r, ...form } : r));
    }
    closeModal();
  };

  const remove = (id) => {
    if (!window.confirm('Supprimer cette ligne ?')) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="panel active">
      <div className="al al-y">⚖ Référentiel légal tunisien. Délais : <strong>5 ans</strong> ou <strong>10 ans</strong> selon la nature du document. Documents stratégiques : <strong>Permanent</strong>.</div>
      <div className="tw">
        <div className="twh">
          <div><div className="twt">Délais de Conservation — Droit Tunisien</div></div>
          {isAdmin && <button className="btn bp2 bsm" onClick={openAdd}>+ Ajouter</button>}
        </div>
        <table>
          <thead>
            <tr>
              <th>Catégorie</th><th>Type de Document</th><th>Délai</th><th>Référence Légale</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className="tdm">{row.categorie}</td>
                <td>{row.type}</td>
                <td><span className={`badge ${delaiClass(row.delai)}`}>{row.delai}</span></td>
                <td>{row.ref}</td>
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn bg2 bsm" onClick={() => openEdit(row)}>✎</button>
                      <button className="btn bdanger bsm" onClick={() => remove(row.id)}>✕</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="mo show">
          <div className="modal modal-sm">
            <div className="mt">{modal === 'add' ? 'Ajouter une ligne' : 'Modifier la ligne'}</div>
            <div className="ms">Renseignez les informations du délai légal.</div>
            <div className="fg">
              <div className="fgrp">
                <div className="flbl">Catégorie *</div>
                <input className="finp" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} placeholder="Ex: Comptabilité" />
              </div>
              <div className="fgrp">
                <div className="flbl">Délai *</div>
                <select value={form.delai} onChange={e => setForm(f => ({ ...f, delai: e.target.value }))}>
                  <option value="5 ans">5 ans</option>
                  <option value="10 ans">10 ans</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div className="fgrp full">
                <div className="flbl">Type de Document *</div>
                <input className="finp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Ex: Journaux comptables..." />
              </div>
              <div className="fgrp full">
                <div className="flbl">Référence Légale *</div>
                <input className="finp" value={form.ref} onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} placeholder="Ex: Code de Commerce Art. 11" />
              </div>
            </div>
            <div className="mf">
              <button className="btn bg2" onClick={closeModal}>Annuler</button>
              <button className="btn bp2" onClick={save}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Delais;
