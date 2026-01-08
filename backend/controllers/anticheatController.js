const Pelanggaran = require('../models/pelanggaran');
const ExamSession = require('../models/session');
const { getDB } = require('../database');

// Log violation
const logViolation = async (req, res) => {
  try {
    const { user_id, jenis, deskripsi } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    
    if (!user_id || !jenis) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID dan jenis pelanggaran harus diisi' 
      });
    }
    
    // Log violation
    const pelanggaran = await Pelanggaran.create({
      user_id,
      jenis,
      deskripsi: deskripsi || `${jenis} violation detected`,
      ip_address
    });
    
    // Update exam session violation count
    const session = await ExamSession.findByUserActive(user_id);
    let newCount = 1;
    if (session) {
      newCount = (session.pelanggaran_count || 0) + 1;
      await ExamSession.update(user_id, { pelanggaran_count: newCount });
      
      // Lock if violations exceed threshold (e.g., 5 violations)
      if (newCount >= 5) {
        await ExamSession.update(user_id, { locked: true, status: 'locked' });
        // Notify via WebSocket
        const { notifyUser } = require('../websocket');
        notifyUser(user_id, 'locked', { message: 'Akun Anda telah di-lock karena pelanggaran' });
      }
    }
    
    res.json({ 
      success: true, 
      data: pelanggaran,
      violation_count: newCount
    });
  } catch (error) {
    console.error('Log violation error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Get user violations
const getUserViolations = async (req, res) => {
  try {
    const { user_id } = req.params;
    const violations = await Pelanggaran.findByUser(user_id);
    const count = await Pelanggaran.countByUser(user_id);
    
    res.json({ 
      success: true, 
      data: violations,
      count 
    });
  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Check if user is locked
const checkLockStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const session = await ExamSession.findByUserActive(user_id);
    
    if (!session) {
      return res.json({ success: true, locked: false });
    }
    
    res.json({ 
      success: true, 
      locked: session.locked === 1 || session.locked === true,
      violation_count: session.pelanggaran_count || 0,
      status: session.status
    });
  } catch (error) {
    console.error('Check lock status error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Lock user
const lockUser = async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }
    
    const result = await ExamSession.update(user_id, { 
      locked: true, 
      status: 'locked' 
    });
    
    res.json({ 
      success: true, 
      message: 'User berhasil di-lock' 
    });
  } catch (error) {
    console.error('Lock user error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Get all violations
const getAllViolations = async (req, res) => {
  try {
    const violations = await Pelanggaran.findAll();
    res.json({ success: true, data: violations });
  } catch (error) {
    console.error('Get all violations error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  logViolation,
  getUserViolations,
  checkLockStatus,
  lockUser,
  getAllViolations
};

