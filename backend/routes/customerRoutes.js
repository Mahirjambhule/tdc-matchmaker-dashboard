const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id/logs', customerController.updateCustomerStatusAndNotes);
router.delete('/:id/logs/:noteId', customerController.deleteCustomerNote);
router.get('/:id/matches', customerController.getAlgorithmicMatches);

module.exports = router;