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
    must_change_password TINYINT(1) DEFAULT 1,
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
    user_id INT NOT NULL,
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
    FOREIGN KEY (service_code) REFERENCES services(code),
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    user_id INT NOT NULL,
    motif TEXT NOT NULL,
    boites JSON,
    retour_prevu DATE,
    obs TEXT,
    statut VARCHAR(20) DEFAULT 'pending',
    remise_obs TEXT,
    retour_etat VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (archive_id) REFERENCES archives(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
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

-- Seed Services Data
INSERT IGNORE INTO services (code, service_name) VALUES 
('AUD', 'Audit'),
('ADM', 'Administration'),
('CPT', 'Comptabilité'),
('COM', 'Commercial'),
('REC', 'Recouvrement'),
('FOR', 'Formation'),
('ASS', 'Assurance'),
('QHS', 'QHSE'),
('FIN', 'Finance'),
('ACH', 'Achat'),
('SCH', 'Supply Chain'),
('RH', 'RH'),
('SEC', 'Sécurité'),
('STP', 'Stock Plein'),
('MAG', 'Magasin Central'),
('STV', 'Stock Vide'),
('CQL', 'QHSE - Contrôle Qualité'),
('HSE', 'QHSE - HSE'),
('BME', 'Bureau Méthodes'),
('PRD', 'Production'),
('SIR', 'Siroperie'),
('STE', 'STEP'),
('PNC', 'PNC'),
('PAR', 'Parc Roulant'),
('LOG', 'Logistique'),
('ARC', 'Service Archive');
