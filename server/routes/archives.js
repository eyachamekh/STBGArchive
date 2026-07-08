const express = require('express');
const archiveController = require('../controllers/archiveController');

const router = express.Router();

// GET ALL ARCHIVES
router.get('/', archiveController.getArchives);

// GET SINGLE ARCHIVE WITH BOITES
router.get('/:id', archiveController.getArchiveById);

// ADD NEW ARCHIVE
router.post('/', archiveController.createArchive);

// UPDATE ARCHIVE (full edit)
router.put('/:id', archiveController.updateArchive);

// UPDATE ARCHIVE STATUS
router.put('/:id/status', archiveController.updateArchiveStatus);

// DELETE ARCHIVE
router.delete('/:id', archiveController.deleteArchive);

module.exports = router;