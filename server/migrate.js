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

  // Drop and recreate archives table with correct schema
  const queries = [
    `DROP TABLE IF EXISTS consultations;`,
    `DROP TABLE IF EXISTS archive_boites;`,
    `DROP TABLE IF EXISTS archives;`,
    `CREATE TABLE archives (
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
    );`,
    `CREATE TABLE archive_boites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      archive_id INT NOT NULL,
      boite_number INT NOT NULL,
      ref_debut VARCHAR(100),
      ref_fin VARCHAR(100),
      FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE consultations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ref VARCHAR(50) UNIQUE NOT NULL,
      archive_id INT,
      user_id VARCHAR(50) NOT NULL,
      motif TEXT NOT NULL,
      boites JSON,
      retour_prevu DATE,
      obs TEXT,
      statut VARCHAR(20) DEFAULT 'pending',
      remise_obs TEXT,
      retour_etat VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (archive_id) REFERENCES archives(id)
    );`,
    `CREATE TABLE notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50),
      title VARCHAR(150),
      message TEXT,
      meta TEXT,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`
  ];

  let completed = 0;
  queries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err) {
        console.error(`Error on query ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Query ${index + 1} executed`);
      }
      completed++;
      if (completed === queries.length) {
        console.log('\n✓✓✓ Database migration complete! ✓✓✓\n');
        db.end();
        process.exit(0);
      }
    });
  });
});
