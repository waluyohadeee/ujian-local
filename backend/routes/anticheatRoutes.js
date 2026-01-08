const express = require('express');
const router = express.Router();
const anticheatController = require('../controllers/anticheatController');

router.post('/violation', anticheatController.logViolation);
router.get('/violations/:user_id', anticheatController.getUserViolations);
router.get('/violations', anticheatController.getAllViolations);
router.get('/lock-status/:user_id', anticheatController.checkLockStatus);
router.post('/lock', anticheatController.lockUser);

module.exports = router;

