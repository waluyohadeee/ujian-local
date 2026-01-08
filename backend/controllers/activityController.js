const Activity = require('../models/activity');

const logActivity = async (req, res) => {
  try {
    const { user_id, activity_type, details } = req.body;
    
    if (!user_id || !activity_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID dan activity type harus diisi' 
      });
    }
    
    const activity = await Activity.create({
      user_id,
      activity_type,
      details
    });
    
    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getUserActivities = async (req, res) => {
  try {
    const { user_id } = req.params;
    const activities = await Activity.findByUser(user_id);
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll();
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  logActivity,
  getUserActivities,
  getAllActivities
};

