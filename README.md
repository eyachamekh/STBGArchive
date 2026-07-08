# 📦 STBG Archive

## 📖 Description

**STBG Archive** est une application web dédiée à l'archivage physique et à la gestion du cycle de vie des documents de la STBG.

Elle permet de centraliser les demandes d'archivage des différents services, de contrôler leur conformité, de gérer les consultations temporaires des archives physiques, ainsi que de garantir une destruction sécurisée et réglementaire des documents arrivés à expiration de leur durée légale de conservation.

L'objectif principal est de remplacer les processus papier par une solution numérique sécurisée, traçable et simple d'utilisation.

---

# ✨ Fonctionnalités

## Gestion des archives

- Création de demandes d'archivage
- Génération automatique des références d'archives
- Calcul automatique de la date de destruction
- Gestion des dépôts multi-boîtes
- Impression des étiquettes de boîtes
- Historique complet des archives

---

## Validation des demandes

- Validation des demandes par l'archiviste
- Rejet avec motif
- Modification puis renvoi d'une demande rejetée
- Notifications automatiques

---

## Gestion des consultations

- Recherche multicritère des archives
- Demande d'emprunt
- Validation par l'archiviste
- Enregistrement de la remise
- Gestion du retour des boîtes
- Suivi de l'état des documents

---

## Gestion des destructions

- Détection automatique des archives expirées
- Génération du Procès-Verbal de destruction
- Validation finale
- Historique des destructions

---

## Administration

- Gestion des utilisateurs
- Gestion des services
- Gestion des types de documents
- Gestion des règles de doublons
- Attribution des rôles

---

# 🛠 Architecture Technique

## Frontend

- React


## Backend

- Node.js
- Express.js
- REST API

## Base de données

- MySQL

## Authentification

- JWT (JSON Web Tokens)

---

# 🗄 Base de données

Le système repose sur plusieurs tables principales :

| Table | Description |
|--------|-------------|
| **services** | Directions et services de la STBG |
| **users** | Comptes utilisateurs |
| **document_types** | Types de documents et durée légale |
| **archives** | Demandes d'archivage |
| **archive_boites** | Contenu détaillé des boîtes |
| **consultations** | Demandes de consultation |
| **notifications** | Notifications internes |
| **duplicate_rules** | Règles de détection des doublons |
| **duplicate_rule_services** | Services concernés par une règle |
| **duplicate_rule_types** | Types de documents concernés |

---

# 👥 Gestion des rôles

## 👤 Utilisateur Service

- Tableau de bord
- Nouvelle demande d'archivage
- Mes demandes
- Mes validations
- Consultation des archives
- Réception des notifications

---

## 📁 Archiviste

Toutes les fonctionnalités du rôle **Service**, ainsi que :

- Validation des demandes
- Rejet des demandes
- Gestion des consultations
- Registre général des archives
- Gestion des retours
- Visualisation des archives à détruire

---

## 👑 Administrateur

Toutes les fonctionnalités de l'Archiviste, ainsi que :

- Génération du Procès-Verbal de destruction
- Gestion des utilisateurs
- Attribution des rôles
- Administration complète du système

---

# 🔄 Workflows

## 📥 Archivage

1. Création de la demande
2. Génération automatique de la référence
3. Calcul automatique de la date de destruction
4. Validation ou rejet par l'archiviste
5. Impression de l'étiquette
6. Archivage physique

---

## 📤 Consultation

1. Recherche d'une archive
2. Sélection des boîtes
3. Demande de consultation
4. Validation par l'archiviste
5. Remise de la boîte
6. Retour
7. Vérification de l'état
8. Clôture de la demande

---

## 🗑 Destruction

1. Détection des archives expirées
2. Sélection des archives
3. Génération du Procès-Verbal
4. Validation administrative
5. Confirmation de destruction
6. Archivage de l'historique


---

# 🛠 Installation & Setup

## 1. Clone the repository

```bash
git clone https://github.com/eyachamekh/STBGArchive.git
```

```bash
cd stbg-archive
```

---

## 2. Install Frontend


```bash
npm install
```

---

## 3. Install Backend

```bash
cd server
```

```bash
npm install
```

---

## 4. Configure MySQL

Create a MySQL database.

```sql
CREATE DATABASE stbgarchive;
```

Import the SQL file.

```
database/stbgArchive.sql
```

---

## 5. Configure Environment Variables

Create a `.env` file inside the **server** folder.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stbgarchive

JWT_SECRET=your_secret_key
```

---

## 6. Run Backend

```bash
cd server
```

```bash
npm start
```

or

```bash
npm run dev
```

---

## 7. Run Frontend


```bash
npm run dev
```

---

## 8. Open the application

```
http://localhost:5174
```

---

# 🔐 Authentication

The application uses **JWT (JSON Web Tokens)** for secure authentication.

Users authenticate using their credentials. After successful login, a JWT token is generated and attached to all protected API requests.



---

# 📌 Main Features

- Secure Authentication
- Role-Based Access Control
- Archive Management
- Consultation Management
- Archive Validation
- Archive Destruction Workflow
- Automatic Notifications
- Duplicate Detection Rules
- Dashboard Statistics
- Search & Filters
- Printable Archive Labels
- PDF Destruction Report Generation

---

# 👨‍💻 Authors

Developed as part of the **STBG Archive** project for the digital management of physical archives within the STBG.
