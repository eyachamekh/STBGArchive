const express = require('express');
const docTypeController = require('../controllers/docTypeController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET ALL DOCUMENT TYPES
router.get('/', docTypeController.getDocumentTypes);

// GET SERVICES (for dropdowns)
router.get('/services', docTypeController.getServices);

// ADD NEW DOCUMENT TYPE
router.post('/', docTypeController.addDocumentType);

// UPDATE DOCUMENT TYPE
router.put('/:id', docTypeController.updateDocumentType);

// DELETE DOCUMENT TYPE
router.delete('/:id', docTypeController.deleteDocumentType);

module.exports = router;
