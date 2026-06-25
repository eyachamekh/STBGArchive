const express = require('express');
const db = require('../db');

const router = express.Router();

console.log('Document Types Route Handler: Initializing');

// GET ALL DOCUMENT TYPES
router.get('/', (req, res) => {
  console.log('GET / request received in document_types route');
  db.query('SELECT * FROM document_types ORDER BY service_code, document_name', (err, result) => {
    if (err) {
      console.error('Database error in GET /:', err);
      return res.status(500).json(err);
    }
    console.log(`Returning ${result.length} document types`);
    res.json(result);
  });
});

// GET SERVICES (for dropdowns)
router.get('/services', (req, res) => {
  db.query('SELECT * FROM services ORDER BY service_name', (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ADD NEW DOCUMENT TYPE
router.post('/', (req, res) => {
  const { service_code, document_name, retention_duration } = req.body;
  if (!service_code || !document_name || !retention_duration) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.query(
    'INSERT INTO document_types (service_code, document_name, retention_duration) VALUES (?, ?, ?)',
    [service_code, document_name, retention_duration],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Document type added", id: result.insertId });
    }
  );
});

// UPDATE DOCUMENT TYPE
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { service_code, document_name, retention_duration } = req.body;
  
  db.query(
    'UPDATE document_types SET service_code = ?, document_name = ?, retention_duration = ? WHERE id = ?',
    [service_code, document_name, retention_duration, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Document type updated" });
    }
  );
});

// DELETE DOCUMENT TYPE
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM document_types WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Document type deleted" });
  });
});

module.exports = router;
