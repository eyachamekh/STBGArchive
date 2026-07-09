const db = require('../db');

// GET ALL ARCHIVES
exports.getArchives = (req, res) => {
  const { userId, role } = req.query;
  
  let query = 'SELECT a.*, u.full_name as responsable, u.username FROM archives a LEFT JOIN users u ON a.user_id = u.id';
  let params = [];
  
  if (role && role !== 'admin' && role !== 'archiviste') {
    query += ' WHERE a.user_id = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY a.created_at DESC';
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error fetching archives:', err);
      return res.status(500).json({ error: err.message });
    }
    
    let processed = 0;
    const results = result.map(archive => ({...archive, boites_details: []}));
    
    if (results.length === 0) {
      return res.json([]);
    }
    
    results.forEach((archive, index) => {
      db.query('SELECT * FROM archive_boites WHERE archive_id = ? ORDER BY boite_number', [archive.id], (err, boites) => {
        if (!err && boites) {
          results[index].boites_details = boites;
        }
        processed++;
        if (processed === results.length) {
          res.json(results);
        }
      });
    });
  });
};

// GET SINGLE ARCHIVE WITH BOITES
exports.getArchiveById = (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT * FROM archives WHERE id = ?', [id], (err, archiveResult) => {
    if (err) {
      console.error('Error fetching archive:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (archiveResult.length === 0) {
      return res.status(404).json({ message: "Archive not found" });
    }
    
    const archive = archiveResult[0];
    
    db.query('SELECT * FROM archive_boites WHERE archive_id = ? ORDER BY boite_number', [id], (err, boitesResult) => {
      if (err) {
        console.error('Error fetching boites:', err);
        return res.status(500).json({ error: err.message });
      }
      
      archive.boites_details = boitesResult || [];
      res.json(archive);
    });
  });
};

// ADD NEW ARCHIVE
exports.createArchive = (req, res) => {
  const {
    ref,
    service_code,
    user_id,
    document_type,
    date_debut,
    date_fin,
    delai_legale,
    date_destruction_prevue,
    boites,
    local_destination,
    observations,
    boites_details
  } = req.body;


  if (!ref || !service_code || !user_id || !document_type || !date_debut || !date_fin) {
    console.log('Missing required fields:', {
      ref: !!ref,
      service_code: !!service_code,
      user_id: !!user_id,
      document_type: !!document_type,
      date_debut: !!date_debut,
      date_fin: !!date_fin
    });
    return res.status(400).json({ 
      message: "Missing required fields",
      missing: {
        ref: !ref,
        service_code: !service_code,
        user_id: !user_id,
        document_type: !document_type,
        date_debut: !date_debut,
        date_fin: !date_fin
      }
    });
  }

  const userId = parseInt(user_id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user_id" });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date_debut) || !dateRegex.test(date_fin)) {
    return res.status(400).json({ 
      message: "Invalid date format. Expected YYYY-MM-DD",
      received: { date_debut, date_fin }
    });
  }

  db.query(
    `INSERT INTO archives 
    (ref, service_code, user_id, document_type, date_debut, date_fin, delai_legale, date_destruction_prevue, boites, local_destination, observations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ref, service_code, userId, document_type, date_debut, date_fin, delai_legale, date_destruction_prevue || null, boites, local_destination, observations],
    (err, result) => {
      if (err) {
        console.error('Error inserting archive:', err.code, err.sqlMessage || err.message);
        return res.status(500).json({ 
          error: err.sqlMessage || err.message, 
          code: err.code,
          details: err.code === 'ER_NO_REFERENCED_ROW_2' ? 'User or Service not found in database' : undefined
        });
      }

      const archiveId = result.insertId;
      console.log('Archive inserted with ID:', archiveId);

      if (boites_details && boites_details.length > 0) {
        let boitesInserted = 0;
        let hasError = false;
        
        boites_details.forEach((boite, index) => {
          db.query(
            `INSERT INTO archive_boites (archive_id, boite_number, ref_debut, ref_fin)
            VALUES (?, ?, ?, ?)`,
            [archiveId, index + 1, boite.ref_debut || '', boite.ref_fin || ''],
            (err) => {
              if (err) {
                console.error('Error inserting boite:', err);
                hasError = true;
              }
              boitesInserted++;
              
              if (boitesInserted === boites_details.length) {
                if (hasError) {
                  return res.status(500).json({ error: "Error inserting some boites" });
                }
                res.json({ 
                  message: "Archive added successfully", 
                  id: archiveId,
                  ref: ref
                });
              }
            }
          );
        });
      } else {
        res.json({ 
          message: "Archive added successfully", 
          id: archiveId,
          ref: ref
        });
      }
    }
  );
};

// UPDATE ARCHIVE (full edit)
exports.updateArchive = (req, res) => {
  const { id } = req.params;
  const {
    document_type,
    date_debut,
    date_fin,
    delai_legale,
    date_destruction_prevue,
    boites,
    local_destination,
    observations,
    boites_details
  } = req.body;

  console.log('Archive PUT request received for ID:', id);

  const archiveId = parseInt(id);
  if (isNaN(archiveId)) {
    return res.status(400).json({ message: "Invalid archive ID" });
  }

  if (!document_type || !date_debut || !date_fin) {
    return res.status(400).json({ 
      message: "Missing required fields",
      missing: {
        document_type: !document_type,
        date_debut: !date_debut,
        date_fin: !date_fin
      }
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date_debut) || !dateRegex.test(date_fin)) {
    return res.status(400).json({ 
      message: "Invalid date format. Expected YYYY-MM-DD",
      received: { date_debut, date_fin }
    });
  }

  db.query('SELECT id, ref FROM archives WHERE id = ?', [archiveId], (err, results) => {
    if (err) {
      console.error('Error checking archive:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!results.length) {
      return res.status(404).json({ message: 'Archive not found' });
    }

    const archiveRef = results[0].ref;

    db.query(
      `UPDATE archives 
       SET document_type = ?, date_debut = ?, date_fin = ?, delai_legale = ?, 
           date_destruction_prevue = ?, boites = ?, local_destination = ?, observations = ?, 
           statut = 'pending', motif = NULL, updated_at = NOW()
       WHERE id = ? AND id = ?`,
      [document_type, date_debut, date_fin, delai_legale, date_destruction_prevue || null, boites, local_destination, observations, archiveId, archiveId],
      (err, result) => {
        if (err) {
          console.error('Error updating archive:', err.code, err.sqlMessage || err.message);
          return res.status(500).json({ 
            error: err.sqlMessage || err.message,
            code: err.code
          });
        }

        if (boites_details && boites_details.length > 0) {
          db.query('DELETE FROM archive_boites WHERE archive_id = ?', [archiveId], (err) => {
            if (err) {
              console.error('Error deleting old boites:', err);
              return res.status(500).json({ error: 'Error updating boites' });
            }

            let boitesInserted = 0;
            let hasError = false;

            boites_details.forEach((boite, index) => {
              db.query(
                `INSERT INTO archive_boites (archive_id, boite_number, ref_debut, ref_fin)
                 VALUES (?, ?, ?, ?)`,
                [archiveId, index + 1, boite.ref_debut || '', boite.ref_fin || ''],
                (err) => {
                  if (err) {
                    console.error('Error inserting boite:', err);
                    hasError = true;
                  }
                  boitesInserted++;

                  if (boitesInserted === boites_details.length) {
                    if (hasError) {
                      return res.status(500).json({ error: "Error updating some boites" });
                    }
                    res.json({ message: "Archive updated successfully", id: archiveId, ref: archiveRef });
                  }
                }
              );
            });
          });
        } else {
          res.json({ message: "Archive updated successfully", id: archiveId, ref: archiveRef });
        }
      }
    );
  });
};

// UPDATE ARCHIVE STATUS
exports.updateArchiveStatus = (req, res) => {
  const { id } = req.params;
  const { statut, motif } = req.body;

  if (!statut) {
    return res.status(400).json({ message: "Status is required" });
  }

  const archiveId = parseInt(id);
  if (isNaN(archiveId)) {
    return res.status(400).json({ message: "Invalid archive ID" });
  }

  db.query('SELECT ref, user_id FROM archives WHERE id = ?', [archiveId], (err, results) => {
    if (err) {
      console.error('Error fetching archive for notification:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!results || !results.length) {
      return res.status(404).json({ message: 'Archive not found' });
    }

    const archive = results[0];

    db.query(
      'UPDATE archives SET statut = ?, motif = ? WHERE id = ?',
      [statut, motif || '', archiveId],
      (err) => {
        if (err) {
          console.error('Error updating archive status:', err);
          return res.status(500).json({ error: err.message });
        }

        let statusLabel = 'mise à jour';
        let notificationTitle = 'Mise à jour de votre demande';
        let notificationType = 'info';
        if (statut === 'validated') {
          statusLabel = 'validée';
          notificationTitle = 'Demande validée';
          notificationType = 'success';
        } else if (statut === 'rejected') {
          statusLabel = 'rejetée';
          notificationTitle = 'Demande rejetée';
          notificationType = 'error';
        } else if (statut === 'destroyed' || statut === 'détruite') {
          statusLabel = 'détruite (physiquement éliminée)';
          notificationTitle = 'Archive détruite';
          notificationType = 'info';
        }
        const notificationMessage = `Votre demande ${archive.ref} a été ${statusLabel}${motif ? ` : ${motif}` : ''}`;
        const notificationMeta = JSON.stringify({ archiveId: archiveId, ref: archive.ref, status: statut });

        db.query(
          'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
          [archive.user_id, notificationType, notificationTitle, notificationMessage, notificationMeta],
          (notifErr) => {
            if (notifErr) {
              console.error('Error creating notification:', notifErr);
            }
            res.json({ message: "Archive status updated", id: archiveId, statut: statut });
          }
        );
      }
    );
  });
};

// DELETE ARCHIVE
exports.deleteArchive = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM archives WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting archive:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Archive deleted" });
  });
};
