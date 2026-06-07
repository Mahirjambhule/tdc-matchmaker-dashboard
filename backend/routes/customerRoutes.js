const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id/logs', customerController.updateCustomerStatusAndNotes);
router.get('/:id/matches', customerController.getAlgorithmicMatches);

router.post('/ai/analyze', customerController.getAIMatchAnalysis);

module.exports = router;