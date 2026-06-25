export const USERS = [
  { id: 'admin', name: 'Administrateur STBG', svc: 'Direction Générale', role: 'admin', pass: 'stbg2025', code: 'ADM' },
  { id: 'archiviste', name: 'Archiviste Central', svc: 'Archives Centrales', role: 'archiviste', pass: 'archive123', code: 'ARC' },
  { id: 'commercial', name: 'Responsable Commercial', svc: 'Service Commercial', role: 'service', pass: 'commercial123', code: 'COM' },
  { id: 'finances', name: 'Responsable Finances', svc: 'Service Financier', role: 'service', pass: 'finance123', code: 'FIN' },
  { id: 'logistique', name: 'Responsable Logistique', svc: 'Service Logistique', role: 'service', pass: 'logistique123', code: 'LOG' },
];

export const DUP_RULES = [
  {
    kw: 'facture',
    types: ['Facture', 'Factures'],
    svcs: ['COM', 'FIN', 'LOG'],
    msg: 'Vérifiez les factures similaires dans plusieurs services pour éviter les doublons.',
  },
  {
    kw: 'contrat',
    types: ['Contrat', 'Contrats'],
    svcs: ['COM', 'ADM'],
    msg: 'Plusieurs contrats semblables peuvent être archivés par différents services.',
  },
  {
    kw: 'inventaire',
    types: ['Inventaire', 'Inventaires'],
    svcs: ['COM', 'FIN'],
    msg: 'Attention aux archives d’inventaire dupliquées entre services.',
  },
];
