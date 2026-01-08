const Jawaban = require('../models/jawaban');
const Hasil = require('../models/hasil');
const Soal = require('../models/soal');
const User = require('../models/users');
const ExamSession = require('../models/session');
const { getDB } = require('../database');

let examSessions = {}; // Store exam start times (in-memory cache)

const startExam = async (req, res) => {
  try {
    const userId = req.body.user_id || req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }
    
    // Check if user already has active session
    const existingSession = await ExamSession.findByUserActive(userId);
    if (existingSession) {
      return res.json({ 
        success: true, 
        waktu_mulai: existingSession.waktu_mulai,
        session_id: existingSession.id
      });
    }
    
    const waktuMulai = new Date().toISOString();
    examSessions[userId] = { waktuMulai };
    
    // Save to database
    const session = await ExamSession.create({
      user_id: userId,
      waktu_mulai: waktuMulai,
      status: 'active'
    });
    
    res.json({ 
      success: true, 
      waktu_mulai: waktuMulai,
      session_id: session.id
    });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const submitJawaban = async (req, res) => {
  try {
    const { user_id, soal_id, jawaban } = req.body;
    
    if (!user_id || !soal_id || !jawaban) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, Soal ID, dan Jawaban harus diisi' 
      });
    }
    
    // Check if answer already exists and same (avoid unnecessary updates)
    const existing = await Jawaban.findByUserAndSoal(user_id, soal_id);
    if (existing && existing.jawaban === jawaban) {
      return res.json({ 
        success: true, 
        message: 'Jawaban sudah tersimpan',
        data: existing,
        unchanged: true
      });
    }
    
    const result = await Jawaban.createOrUpdate(user_id, soal_id, jawaban);
    
    res.json({ 
      success: true, 
      message: 'Jawaban berhasil disimpan',
      data: result 
    });
  } catch (error) {
    console.error('Submit jawaban error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Auto-save endpoint - batch save answers
const autoSaveJawaban = async (req, res) => {
  try {
    const { user_id, jawaban_data } = req.body;
    
    if (!user_id || !jawaban_data || !Array.isArray(jawaban_data)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID dan jawaban_data array diperlukan' 
      });
    }
    
    const saved = [];
    const errors = [];
    
    for (const item of jawaban_data) {
      if (item.soal_id && item.jawaban) {
        try {
          const existing = await Jawaban.findByUserAndSoal(user_id, item.soal_id);
          
          // Only update if different
          if (!existing || existing.jawaban !== item.jawaban) {
            const result = await Jawaban.createOrUpdate(user_id, item.soal_id, item.jawaban);
            saved.push(result);
          }
        } catch (error) {
          errors.push({ soal_id: item.soal_id, error: error.message });
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Auto-save berhasil',
      saved_count: saved.length,
      saved,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Auto-save jawaban error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const finishExam = async (req, res) => {
  try {
    const { user_id, jawaban_data } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }
    
    // Save all answers if provided
    if (jawaban_data && Array.isArray(jawaban_data)) {
      for (const item of jawaban_data) {
        if (item.soal_id && item.jawaban) {
          await Jawaban.createOrUpdate(user_id, item.soal_id, item.jawaban);
        }
      }
    }
    
    // Calculate and save result
    const result = await finishExamCalculation(user_id);
    
    // Get user info
    const user = await User.findById(user_id);
    
    res.json({
      success: true,
      data: {
        id: result.id,
        user: user,
        nilai: result.nilai,
        benar: result.benar,
        total: result.total,
        waktu_mulai: result.waktu_mulai,
        waktu_selesai: result.waktu_selesai
      }
    });
  } catch (error) {
    console.error('Finish exam error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getLatestResult = async (req, res) => {
  try {
    const userId = req.query.user_id || req.params.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }
    
    const hasil = await Hasil.findLatestByUser(userId);
    
    if (!hasil) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hasil ujian tidak ditemukan' 
      });
    }
    
    // Get user info
    const user = await User.findById(userId);
    
    // Get all answers
    const jawabanList = await Jawaban.findByUser(userId);
    let benar = 0;
    let total = 0;
    
    for (const jawaban of jawabanList) {
      const soal = await Soal.findById(jawaban.soal_id);
      if (soal) {
        total++;
        if (soal.jawaban_benar.toLowerCase() === jawaban.jawaban.toLowerCase()) {
          benar++;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        ...hasil,
        user: user,
        benar,
        total
      }
    });
  } catch (error) {
    console.error('Get latest result error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Force submit exam (admin function)
const forceSubmit = async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID diperlukan' 
      });
    }
    
    // End exam session
    const session = await ExamSession.findByUserActive(user_id);
    if (session) {
      await ExamSession.update(user_id, {
        status: 'force_submitted',
        waktu_berakhir: new Date().toISOString()
      });
    }
    
    // Calculate and save result
    const result = await finishExamCalculation(user_id);
    
    res.json({ 
      success: true, 
      message: 'Ujian dipaksa selesai',
      data: result
    });
  } catch (error) {
    console.error('Force submit error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Helper: Calculate exam result
async function finishExamCalculation(user_id) {
  const session = await ExamSession.findByUserActive(user_id);
  let waktuMulai;
  
  if (session) {
    waktuMulai = session.waktu_mulai;
  } else if (examSessions[user_id]) {
    waktuMulai = examSessions[user_id].waktuMulai;
  } else {
    waktuMulai = new Date().toISOString();
  }
  
  const waktuSelesai = new Date().toISOString();
  
  // Get all answers
  const jawabanList = await Jawaban.findByUser(user_id);
  
  // Calculate score
  let benar = 0;
  let total = 0;
  
  for (const jawaban of jawabanList) {
    const soal = await Soal.findById(jawaban.soal_id);
    if (soal) {
      total++;
      if (soal.jawaban_benar.toLowerCase() === jawaban.jawaban.toLowerCase()) {
        benar++;
      }
    }
  }
  
  const nilai = total > 0 ? Math.round((benar / total) * 100) : 0;
  
  // Save result
  const hasil = await Hasil.create({
    user_id,
    nilai,
    waktu_mulai: waktuMulai,
    waktu_selesai: waktuSelesai
  });
  
  // Update session
  if (session) {
    await ExamSession.update(user_id, {
      status: 'completed',
      waktu_berakhir: waktuSelesai
    });
  }
  
  // Clear from memory
  delete examSessions[user_id];
  
  return {
    id: hasil.id,
    nilai,
    benar,
    total,
    waktu_mulai: waktuMulai,
    waktu_selesai: waktuSelesai
  };
}

module.exports = {
  startExam,
  submitJawaban,
  autoSaveJawaban,
  finishExam,
  getLatestResult,
  forceSubmit
};

