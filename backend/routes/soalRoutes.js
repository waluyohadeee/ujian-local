const express = require('express');
const router = express.Router();
const soalController = require('../controllers/soalController');

router.get('/', soalController.getAllSoal);
router.get('/random', soalController.getRandomSoal);
router.post('/:id/duplicate', soalController.duplicateSoal);
router.get('/:id', soalController.getSoalById);
router.post('/', soalController.createSoal);
router.put('/:id', soalController.updateSoal);
router.delete('/:id', soalController.deleteSoal);

module.exports = router;

