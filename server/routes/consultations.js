const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'stbg_secret_key';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Consultation auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const parseConsultationRow = (row) => ({
  ...row,
  boites: row.boites ? JSON.parse(row.boites) : [],
});

router.get('/', authenticate, (req, res) => {
  const { role, id } = req.user;
  let query = 'SELECT c.*, u.full_name as requester, u.username FROM consultations c LEFT JOIN users u ON c.user_id = u.id';
  const params = [];

  if (role !== 'admin' && role !== 'archiviste') {
    query += ' WHERE c.user_id = ?';
    params.push(id);
  }

  query += ' ORDER BY c.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching consultations:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results.map(parseConsultationRow));
  });
});

router.post('/', authenticate, (req, res) => {
  const { motif, retour_prevu, obs, boites } = req.body;
  const userId = req.user.id;

  if (!motif || !retour_prevu || !boites || !Array.isArray(boites) || boites.length === 0) {
    return res.status(400).json({ message: 'Motif, date de retour et boîtes sont requis.' });
  }

  const ref = `CONS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  db.query(
    'INSERT INTO consultations (ref, user_id, motif, boites, retour_prevu, obs) VALUES (?, ?, ?, ?, ?, ?)',
    [ref, userId, motif, JSON.stringify(boites), retour_prevu, obs || null],
    (err, result) => {
      if (err) {
        console.error('Error creating consultation:', err);
        return res.status(500).json({ error: err.message });
      }

      const consultationId = result.insertId;
      db.query(
        'SELECT c.*, u.full_name as requester, u.username FROM consultations c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?',
        [consultationId],
        (err, rows) => {
          if (err) {
            console.error('Error fetching created consultation:', err);
            return res.status(500).json({ error: err.message });
          }
          const consultation = parseConsultationRow(rows[0]);

          db.query('SELECT id FROM users WHERE role = ?', ['admin'], (err, adminRows) => {
            if (!err && adminRows.length) {
              const notifText = `Nouvelle demande de consultation ${consultation.ref} par ${consultation.requester}.`;
              adminRows.forEach(admin => {
                db.query(
                  'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
                  [admin.id, 'consultation', 'Nouvelle demande de consultation', notifText, JSON.stringify({ consultationId: consultation.id })],
                  (notifErr) => {
                    if (notifErr) console.error('Error creating admin notification:', notifErr);
                  }
                );
              });
            }
          });

          res.json(consultation);
        }
      );
    }
  );
});

router.put('/:id/status', authenticate, (req, res) => {
  const { statut, remiseObs, retourEtat } = req.body;
  const { role, id: userId } = req.user;
  const { id } = req.params;

  if (!statut) {
    return res.status(400).json({ message: 'Statut requis.' });
  }

  if (statut === 'remis' || statut === 'cloture') {
    if (role !== 'admin' && role !== 'archiviste') {
      return res.status(403).json({ message: 'Accès admin requis.' });
    }
  }

  if (statut === 'returned') {
    if (role === 'admin' || role === 'archiviste') {
      return res.status(403).json({ message: 'Seul le demandeur peut marquer le retour.' });
    }
  }

  db.query('SELECT * FROM consultations WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error fetching consultation:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!rows.length) {
      return res.status(404).json({ message: 'Consultation non trouvée.' });
    }

    const consult = parseConsultationRow(rows[0]);

    if (statut === 'returned' && consult.user_id !== String(userId)) {
      return res.status(403).json({ message: 'Vous ne pouvez pas retourner cette consultation.' });
    }

    const updates = [];
    const params = [];
    updates.push('statut = ?');
    params.push(statut);

    if (statut === 'remis' && remiseObs !== undefined) {
      updates.push('remise_obs = ?');
      params.push(remiseObs);
    }
    if (statut === 'cloture' && retourEtat !== undefined) {
      updates.push('retour_etat = ?');
      params.push(retourEtat);
    }

    params.push(id);

    db.query(`UPDATE consultations SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
      if (err) {
        console.error('Error updating consultation status:', err);
        return res.status(500).json({ error: err.message });
      }

      const statusLabel = statut === 'remis' ? 'remis au demandeur' : statut === 'returned' ? 'marqué comme retourné' : 'clôturé';

      const notifDetails = {
        consultationId: parseInt(id, 10),
      };
      let targetUserId = consult.user_id;
      let notifType = 'info';
      let notifTitle = 'Consultation mise à jour';
      let notifMsg = `La consultation ${consult.ref} a été ${statusLabel}.`;

      if (statut === 'remis') {
        notifType = 'success';
        notifTitle = 'Consultation remise';
        notifMsg = `Votre demande ${consult.ref} a été remise au demandeur.`;
      } else if (statut === 'returned') {
        notifType = 'info';
        notifTitle = 'Consultation retournée';
        notifMsg = `La demande ${consult.ref} a été retournée par le demandeur.`;
        targetUserId = null;
      } else if (statut === 'cloture') {
        notifType = 'success';
        notifTitle = 'Consultation clôturée';
        notifMsg = `La consultation ${consult.ref} est maintenant clôturée.`;
      }

      const sendNotification = (userIdToNotify) => {
        db.query(
          'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
          [userIdToNotify, notifType, notifTitle, notifMsg, JSON.stringify(notifDetails)],
          (notifErr) => {
            if (notifErr) console.error('Error creating consultation notification:', notifErr);
          }
        );
      };

      if (statut === 'returned') {
        db.query('SELECT id FROM users WHERE role = ?', ['admin'], (err, adminRows) => {
          if (!err && adminRows.length) {
            adminRows.forEach(admin => sendNotification(admin.id));
          }
        });
      } else {
        sendNotification(targetUserId);
      }

      db.query('SELECT c.*, u.full_name as requester, u.username FROM consultations c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id], (err, updatedRows) => {
        if (err) {
          console.error('Error fetching updated consultation:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(parseConsultationRow(updatedRows[0]));
      });
    });
  });
});

module.exports = router;
