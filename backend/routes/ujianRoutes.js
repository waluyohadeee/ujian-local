const express = require('express');
const router = express.Router();
const ujianController = require('../controllers/ujianController');

router.get('/start', ujianController.startExam);
router.post('/start', ujianController.startExam);
router.post('/jawab', ujianController.submitJawaban);
router.post('/jawab-auto', ujianController.autoSaveJawaban);
router.post('/selesai', ujianController.finishExam);
router.post('/force-submit', ujianController.forceSubmit);
router.get('/hasil/:user_id', ujianController.getLatestResult);
router.get('/hasil', ujianController.getLatestResult);

module.exports = router;

