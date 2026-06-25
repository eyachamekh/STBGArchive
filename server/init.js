const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stbgarchive'
});

db.connect((err) => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');

  // Create tables
  const schema = `
    -- Create Services Table
    CREATE TABLE IF NOT EXISTS services (
        code VARCHAR(10) PRIMARY KEY,
        service_name VARCHAR(100) NOT NULL
    );

    -- Create Users Table
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        service_code VARCHAR(10) NOT NULL,
        role VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        FOREIGN KEY (service_code) REFERENCES services(code)
    );

    -- Create Document Types Table
    CREATE TABLE IF NOT EXISTS document_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_code VARCHAR(10) NOT NULL,
        document_name VARCHAR(150) NOT NULL,
        retention_duration VARCHAR(50) NOT NULL,
        FOREIGN KEY (service_code) REFERENCES services(code)
    );

    -- Create Archives Table (for archiving requests)
    CREATE TABLE IF NOT EXISTS archives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ref VARCHAR(50) UNIQUE NOT NULL,
        service_code VARCHAR(10) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(150) NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        delai_legale VARCHAR(50),
        date_destruction_prevue DATE,
        boites INT DEFAULT 1,
        local_destination VARCHAR(100),
        observations TEXT,
        statut VARCHAR(20) DEFAULT 'pending',
        motif TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_code) REFERENCES services(code)
    );

    -- Create Archive Boites Details Table (for multiple boites with individual refs)
    CREATE TABLE IF NOT EXISTS archive_boites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        archive_id INT NOT NULL,
        boite_number INT NOT NULL,
        ref_debut VARCHAR(100),
        ref_fin VARCHAR(100),
        FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE
    );

    -- Create Consultations Table
    CREATE TABLE IF NOT EXISTS consultations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ref VARCHAR(50) UNIQUE NOT NULL,
        archive_id INT,
        user_id VARCHAR(50) NOT NULL,
        motif TEXT NOT NULL,
        boites TEXT,
        retour_prevu DATE,
        obs TEXT,
        remise_obs TEXT,
        retour_etat VARCHAR(100),
        statut VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (archive_id) REFERENCES archives(id)
    );

    -- Create Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50),
        title VARCHAR(150),
        message TEXT,
        meta TEXT,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create Duplicate Rules Table
    CREATE TABLE IF NOT EXISTS duplicate_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword_name VARCHAR(100) NOT NULL,
        message TEXT
    );

    -- Create Duplicate Rule Services Table
    CREATE TABLE IF NOT EXISTS duplicate_rule_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_id INT NOT NULL,
        service_code VARCHAR(10) NOT NULL,
        FOREIGN KEY (rule_id) REFERENCES duplicate_rules(id) ON DELETE CASCADE,
        FOREIGN KEY (service_code) REFERENCES services(code)
    );

    -- Create Duplicate Rule Types Table
    CREATE TABLE IF NOT EXISTS duplicate_rule_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_id INT NOT NULL,
        document_type VARCHAR(150) NOT NULL,
        FOREIGN KEY (rule_id) REFERENCES duplicate_rules(id) ON DELETE CASCADE
    );
  `;

  // Split and execute statements
  const statements = schema.split(';').filter(s => s.trim());
  let completed = 0;

  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.query(statement, (err) => {
        if (err) {
          console.error(`Error executing statement ${index + 1}:`, err.message);
        } else {
          console.log(`✓ Statement ${index + 1} executed`);
        }
        completed++;
        if (completed === statements.length) {
          console.log('\n✓ All tables created successfully');
          
          // Now seed data
          seedData();
        }
      });
    }
  });
});

function seedData() {
  // Insert services
  const services = [
    ['AUD', 'Audit'],
    ['ADM', 'Administration'],
    ['CPT', 'Comptabilité'],
    ['COM', 'Commercial'],
    ['REC', 'Recouvrement'],
    ['FOR', 'Formation'],
    ['ASS', 'Assurance'],
    ['QHS', 'QHSE'],
    ['FIN', 'Finance'],
    ['ACH', 'Achat'],
    ['SCH', 'Supply Chain'],
    ['RH', 'RH'],
    ['SEC', 'Sécurité'],
    ['STP', 'Stock Plein'],
    ['MAG', 'Magasin Central'],
    ['STV', 'Stock Vide'],
    ['CQL', 'QHSE - Contrôle Qualité'],
    ['HSE', 'QHSE - HSE'],
    ['BME', 'Bureau Méthodes'],
    ['PRD', 'Production'],
    ['SIR', 'Siroperie'],
    ['STE', 'STEP'],
    ['PNC', 'PNC'],
    ['PAR', 'Parc Roulant'],
    ['LOG', 'Logistique']
  ];

  let servicesInserted = 0;
  services.forEach(([code, name]) => {
    db.query('INSERT IGNORE INTO services (code, service_name) VALUES (?, ?)', [code, name], (err) => {
      if (err) console.error('Error inserting service:', err.message);
      else console.log(`✓ Service ${code} inserted`);
      servicesInserted++;
      
      if (servicesInserted === services.length) {
        console.log('\n✓ All services seeded');
        seedDocuments();
      }
    });
  });
}

function seedDocuments() {
  const docs = [
    ['AUD', "Plans d'audit", '5 ans'],
    ['AUD', "Rapports d'audit interne", '5 ans'],
    ['AUD', 'Fiches écarts et non-conformités', '5 ans'],
    ['CPT', 'Journaux comptables', '10 ans'],
    ['CPT', 'États financiers / Bilans', '10 ans'],
    ['CPT', 'Déclarations fiscales IS/TVA', '10 ans'],
    ['COM', 'Contrats commerciaux clients', '5 ans'],
    ['COM', 'Factures clients', '10 ans'],
    ['REC', 'Dossiers clients contentieux', '10 ans'],
    ['FOR', 'Plans de formation annuels', '5 ans'],
    ['ASS', "Polices d'assurance", '5 ans'],
    ['QHS', 'Procédures QHSE', '5 ans'],
    ['FIN', 'Règlements chèques', '10 ans'],
    ['FIN', 'Virements bancaires', '10 ans'],
    ['ACH', 'Contrats fournisseurs', '5 ans'],
    ['RH', 'Déclarations CNSS', '10 ans'],
    ['RH', 'Bulletins de paie', '10 ans'],
    ['PRD', 'Cahiers de production', '5 ans'],
    ['LOG', 'Bons de livraison logistique', '5 ans'],
  ];

  let docsInserted = 0;
  docs.forEach(([code, name, duration]) => {
    db.query(
      'INSERT IGNORE INTO document_types (service_code, document_name, retention_duration) VALUES (?, ?, ?)',
      [code, name, duration],
      (err) => {
        if (err) console.error('Error inserting document type:', err.message);
        docsInserted++;
        
        if (docsInserted === docs.length) {
          console.log('\n✓ All document types seeded');
          console.log('\n✓✓✓ Database initialization complete! ✓✓✓\n');
          db.end();
          process.exit(0);
        }
      }
    );
  });
}
