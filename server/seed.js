const db = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config();

const USERS = [
  {id:'karim',   name:'Karim Sghaouria',  svc:'Audit',                  code:'AUD',role:'archiviste'},
  {id:'admin',   name:'Administrateur',    svc:'Administration',         code:'ADM',role:'admin'},
  {id:'imen',    name:'Imen Ben Achour',   svc:'Comptabilité',           code:'CPT',role:'service'},
  {id:'sonia',   name:'Sonia Fligene',     svc:'Commercial',             code:'COM',role:'service'},
  {id:'jihene',  name:'Jihene Fredj',      svc:'Recouvrement',           code:'REC',role:'service'},
  {id:'sofiane', name:'Sofiane Mnasri',    svc:'Formation',              code:'FOR',role:'service'},
  {id:'dallel',  name:'Dallel Kaabachi',   svc:'Assurance',              code:'ASS',role:'service'},
  {id:'maroua',  name:'Maroua Baks',       svc:'QHSE',                   code:'QHS',role:'service'},
  {id:'sondes',  name:'Sondes Daly',       svc:'Finance',                code:'FIN',role:'service'},
  {id:'bselmen', name:'Bechir Selmen',     svc:'Achat',                  code:'ACH',role:'service'},
  {id:'anis',    name:'Anis Mefteh',       svc:'Supply Chain',           code:'SCH',role:'service'},
  {id:'wiem',    name:'Wiem Khiari',       svc:'RH',                     code:'RH', role:'service'},
  {id:'mourad',  name:'Mourad Ben Azzouz', svc:'Sécurité',               code:'SEC',role:'service'},
  {id:'belhassen',name:'Belhassen Mannai', svc:'Stock Plein',            code:'STP',role:'service'},
  {id:'faouzi',  name:'Faouzi Ghenimi',    svc:'Magasin Central',        code:'MAG',role:'service'},
  {id:'keissi',  name:'Mohamed Keissi',    svc:'Stock Vide',             code:'STV',role:'service'},
  {id:'emna',    name:'Emna Rahhali',      svc:'QHSE - Contrôle Qualité',code:'CQL',role:'service'},
  {id:'nizar',   name:'Nizar Khemiri',     svc:'QHSE - HSE',             code:'HSE',role:'service'},
  {id:'mourad2', name:'Mourad Bouzidi',    svc:'Bureau Méthodes',        code:'BME',role:'service'},
  {id:'mhassen', name:'Mohamed Hassen',    svc:'Production',             code:'PRD',role:'service'},
  {id:'moncef',  name:'Moncef Ben Zayed',  svc:'Siroperie',              code:'SIR',role:'service'},
  {id:'step',    name:'Mohamed Hassen',    svc:'STEP',                   code:'STE',role:'service'},
  {id:'habib',   name:'Habib Hammouda',    svc:'PNC',                    code:'PNC',role:'service'},
  {id:'bilel',   name:'Bilel Souabni',     svc:'Parc Roulant',           code:'PAR',role:'service'},
  {id:'braddadi',name:'Bechir Raddadi',    svc:'Logistique',             code:'LOG',role:'service'},
];


const DOCS = {
  CPT:[{n:'Journaux comptables',d:'10 ans'},{n:'États financiers / Bilans',d:'10 ans'},{n:'Comptes de résultat',d:'10 ans'},{n:'Déclarations fiscales IS/TVA',d:'10 ans'},{n:'Grand livre comptable',d:'10 ans'},{n:'Pièces justificatives comptables',d:'10 ans'},{n:'Balances de vérification',d:'10 ans'}],
  COM:[{n:'Contrats commerciaux clients',d:'5 ans'},{n:'Factures clients',d:'10 ans'},{n:'Bons de commande clients',d:'5 ans'},{n:'Tarifs et barèmes commerciaux',d:'5 ans'},{n:'Correspondances commerciales',d:'5 ans'}],
  REC:[{n:'Dossiers clients contentieux',d:'10 ans'},{n:'Factures ristournes / avoirs',d:'10 ans'},{n:'Factures PNC retours clients',d:'10 ans'},{n:'Mises en demeure',d:'10 ans'},{n:'PV de recouvrement',d:'10 ans'},{n:'Relevés de compte clients',d:'10 ans'}],
  FOR:[{n:'Plans de formation annuels',d:'5 ans'},{n:'Attestations de formation',d:'5 ans'},{n:'Contrats organismes formation CDC',d:'5 ans'},{n:'Évaluations post-formation',d:'5 ans'},{n:'Cahiers de présence formations',d:'5 ans'}],
  ASS:[{n:"Polices d'assurance",d:'5 ans'},{n:'Déclarations de sinistres',d:'5 ans'},{n:'Correspondances assureurs',d:'5 ans'},{n:'Rapports d\'expertise',d:'5 ans'},{n:'Quittances de prime',d:'5 ans'}],
  AUD:[{n:"Rapports d'audit interne",d:'5 ans'},{n:"Plans d'audit",d:'5 ans'},{n:'Fiches écarts et non-conformités',d:'5 ans'},{n:'Inventaires physiques',d:'5 ans'},{n:'Rapports de suivi actions',d:'5 ans'}],
  QHS:[{n:'Procédures QHSE',d:'5 ans'},{n:"Rapports d'audit qualité",d:'5 ans'},{n:'PV de réunions QHSE',d:'5 ans'},{n:'Fiches de non-conformité',d:'5 ans'},{n:"Plans d'action corrective",d:'5 ans'}],
  FIN:[{n:'Règlements chèques',d:'10 ans'},{n:'Règlements traites',d:'10 ans'},{n:'Virements bancaires',d:'10 ans'},{n:'Inventaires caisses',d:'10 ans'},{n:'Dossiers de crédits',d:'10 ans'},{n:'Rapprochements bancaires',d:'10 ans'},{n:'Journaux de caisse',d:'10 ans'}],
  ACH:[{n:'Contrats fournisseurs',d:'5 ans'},{n:'Consultations annuelles / AO',d:'5 ans'},{n:"Bons de commande achat",d:'5 ans'},{n:'Factures fournisseurs',d:'10 ans'},{n:'Cahiers des charges',d:'5 ans'},{n:'PV de réception commandes',d:'5 ans'}],
  SCH:[{n:'Rapports de production',d:'5 ans'},{n:'Plannings de production',d:'5 ans'},{n:'Bilans supply chain',d:'5 ans'},{n:'Tableaux de bord logistiques',d:'5 ans'},{n:'Contrats de sous-traitance',d:'5 ans'}],
  RH: [{n:'Déclarations CNSS',d:'10 ans'},{n:'Bulletins de paie',d:'10 ans'},{n:'Contrats de travail',d:'5 ans'},{n:'Dossiers disciplinaires',d:'5 ans'},{n:'Registre du personnel',d:'10 ans'},{n:'Attestations de travail',d:'5 ans'},{n:'Fiches de poste',d:'5 ans'}],
  SEC:[{n:"Fiches d'entrée et sortie",d:'5 ans'},{n:'Carnets consommation gaz',d:'5 ans'},{n:'Registres de ronde sécurité',d:'5 ans'},{n:"Rapports d'incidents sécurité",d:'5 ans'},{n:'Permis de travail',d:'5 ans'}],
  STP:[{n:'Inventaires stock plein',d:'5 ans'},{n:'Bons de transfert',d:'5 ans'},{n:"Bons d'entrée de stock",d:'5 ans'},{n:'Bons de livraison',d:'5 ans'},{n:'Feuilles de casse',d:'5 ans'},{n:'Fiches manquant',d:'5 ans'},{n:'Bons de retour',d:'5 ans'}],
  MAG:[{n:'Inventaires magasin central',d:'5 ans'},{n:'Bons de transfert interne',d:'5 ans'},{n:'Bons de livraison',d:'5 ans'},{n:'Carnets laissez-passer',d:'5 ans'},{n:'OT provisoires',d:'5 ans'},{n:'Bons de sortie matières',d:'5 ans'},{n:'Fiches de réception',d:'5 ans'}],
  STV:[{n:'Inventaires stock vide',d:'5 ans'},{n:'Bons de transfert emballages',d:'5 ans'},{n:'Bons de livraison emballages',d:'5 ans'},{n:'Fiches de casse emballages',d:'5 ans'},{n:'Fiches de retour emballages',d:'5 ans'}],
  CQL:[{n:"Rapports d'analyses laboratoire",d:'5 ans'},{n:'Fiches contrôle qualité production',d:'5 ans'},{n:'Certificats de conformité',d:'5 ans'},{n:"Résultats audits qualité",d:'5 ans'},{n:'Fiches de dégustation',d:'5 ans'}],
  HSE:[{n:'Rapports HSE',d:'5 ans'},{n:"Fiches d'accidents de travail",d:'5 ans'},{n:'Registre médical',d:'10 ans'},{n:"Plans d'évacuation",d:'5 ans'},{n:"PV exercices incendie",d:'5 ans'},{n:'Fiches EPI',d:'5 ans'}],
  BME:[{n:'Gammes opératoires',d:'5 ans'},{n:'Fiches techniques machines',d:'5 ans'},{n:'Rapports de maintenance',d:'5 ans'},{n:'Plans de maintenance préventive',d:'5 ans'},{n:'OT maintenance corrective',d:'5 ans'}],
  PRD:[{n:'Cahiers de production',d:'5 ans'},{n:'Fiches de fabrication',d:'5 ans'},{n:'Rapports de rendement',d:'5 ans'},{n:"Registres d'arrêts machines",d:'5 ans'},{n:'Bilans de production journaliers',d:'5 ans'}],
  SIR:[{n:'Fiches formules sirops',d:'5 ans'},{n:'Carnets de production sirops',d:'5 ans'},{n:'Registres matières premières',d:'5 ans'},{n:'Fiches de dosage',d:'5 ans'}],
  STE:[{n:'Rapports STEP',d:'5 ans'},{n:'Analyses eaux usées',d:'5 ans'},{n:'Registres traitement',d:'5 ans'},{n:'Bilans environnementaux',d:'5 ans'}],
  PNC:[{n:'Rapports de retours PNC clients',d:'5 ans'},{n:'Fiches non-conformité produits',d:'5 ans'},{n:'Registres de retours',d:'5 ans'},{n:'Statistiques PNC',d:'5 ans'}],
  PAR:[{n:'Carnets checklist contrôle véhicules',d:'5 ans'},{n:"Registres d'entretien",d:'5 ans'},{n:'Factures garage',d:'5 ans'},{n:'Carnets de bord',d:'5 ans'},{n:'Vignettes et assurances véhicules',d:'5 ans'}],
  LOG:[{n:'Bons de livraison logistique',d:'5 ans'},{n:'Feuilles de route chauffeurs',d:'5 ans'},{n:'Plannings de tournées',d:'5 ans'},{n:'Rapports de livraison',d:'5 ans'},{n:'Carnets laissez-passer',d:'5 ans'}],
};

const DUP_RULES = [
  {kw:'PNC',svcs:['PNC','REC'],types:['Rapports de retours PNC','Factures PNC'],msg:'Services PNC et Recouvrement archivent tous deux des documents liés aux retours PNC clients.'},
  {kw:'livraison',svcs:['STP','MAG','STV','LOG'],types:['Bons de livraison'],msg:'Bons de livraison présents dans plusieurs services stocks et logistique. Définir un service référent unique.'},
  {kw:'inventaire',svcs:['STP','MAG','STV','AUD'],types:['Inventaires'],msg:"Inventaires archivés par plusieurs services. Seul l'original du service gestionnaire doit être conservé."},
  {kw:'transfert',svcs:['STP','MAG','STV','LOG'],types:['Bons de transfert'],msg:'Bons de transfert présents dans plusieurs services. Un seul exemplaire doit être archivé.'},
];

async function seed() {
  console.log("Seeding database...");
  
  // Clean tables
  await new Promise((resolve, reject) => {
    db.query("DELETE FROM duplicate_rule_services", (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    db.query("DELETE FROM duplicate_rule_types", (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    db.query("DELETE FROM duplicate_rules", (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    db.query("DELETE FROM document_types", (err) => err ? reject(err) : resolve());
  });
  await new Promise((resolve, reject) => {
    db.query("DELETE FROM users", (err) => err ? reject(err) : resolve());
  });

  // Seed Users
  for (let u of USERS) {
    let password;
    if (u.role === 'admin') {
      password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    } else if (u.role === 'archiviste') {
      password = process.env.SEED_ARCHIVISTE_PASSWORD || 'stbg2025';
    } else {
      const suffix = process.env.SEED_USER_PASSWORD_SUFFIX || '2025';
      password = process.env.SEED_USER_PASSWORD || `${u.code.toLowerCase()}${suffix}`;
    }
    const hash = await bcrypt.hash(password, 10);
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO users (username, full_name, service_code, role, password) VALUES (?,?,?,?,?)",
        [u.id, u.name, u.code, u.role, hash],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
  console.log("Users seeded successfully.");

  // Seed Document Types
  for (let code in DOCS) {
    for (let doc of DOCS[code]) {
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO document_types (service_code, document_name, retention_duration) VALUES (?,?,?)",
          [code, doc.n, doc.d],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
  }
  console.log("Document types seeded successfully.");

  // Seed Duplicate Rules
  for (let rule of DUP_RULES) {
    const ruleId = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO duplicate_rules (keyword_name, message) VALUES (?,?)",
        [rule.kw, rule.msg],
        (err, res) => err ? reject(err) : resolve(res.insertId)
      );
    });

    for (let svc of rule.svcs) {
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO duplicate_rule_services (rule_id, service_code) VALUES (?,?)",
          [ruleId, svc],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    for (let type of rule.types) {
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO duplicate_rule_types (rule_id, document_type) VALUES (?,?)",
          [ruleId, type],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
  }
  console.log("Duplicate rules seeded successfully.");

  console.log("Seeding finished successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
