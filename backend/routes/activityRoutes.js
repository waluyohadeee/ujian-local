const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

router.post('/log', activityController.logActivity);
router.get('/user/:user_id', activityController.getUserActivities);
router.get('/all', activityController.getAllActivities);

module.exports = router;

