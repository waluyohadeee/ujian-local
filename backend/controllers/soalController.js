const Soal = require('../models/soal');
const { generateSessionKey, encryptSoal } = require('../utils/encryption');

const getAllSoal = async (req, res) => {
  try {
    const kategoriId = req.query.kategori_id ? parseInt(req.query.kategori_id) : null;
    let soal;
    
    if (kategoriId) {
      soal = await Soal.findByKategori(kategoriId);
    } else {
      soal = await Soal.findAll();
    }
    
    res.json({ success: true, data: soal });
  } catch (error) {
    console.error('Get all soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getRandomSoal = async (req, res) => {
  try {
    const jumlah = parseInt(req.query.jumlah) || 10;
    const kategoriId = req.query.kategori ? parseInt(req.query.kategori) : null;
    const userId = req.query.user_id || req.body.user_id;
    const encrypt = req.query.encrypt === 'true' || req.query.encrypt === '1';
    
    const soal = await Soal.findRandom(jumlah, kategoriId);
    
    // If encryption requested, encrypt soal data
    if (encrypt && userId) {
      const sessionKey = generateSessionKey(userId, Date.now());
      const encryptedSoal = soal.map(s => {
        const encrypted = encryptSoal(s, sessionKey);
        return {
          ...encrypted,
          id: s.id // Keep ID for reference
        };
      });
      
      res.json({ 
        success: true, 
        data: encryptedSoal,
        session_key: sessionKey // In production, send via secure channel
      });
    } else {
      res.json({ success: true, data: soal });
    }
  } catch (error) {
    console.error('Get random soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getSoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const soal = await Soal.findById(id);
    
    if (!soal) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }
    
    res.json({ success: true, data: soal });
  } catch (error) {
    console.error('Get soal by id error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const createSoal = async (req, res) => {
  try {
    const { pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, kategori_id } = req.body;
    
    if (!pertanyaan || !opsi_a || !opsi_b || !opsi_c || !opsi_d || !jawaban_benar) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field harus diisi' 
      });
    }
    
    if (!['a', 'b', 'c', 'd'].includes(jawaban_benar.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jawaban benar harus a, b, c, atau d' 
      });
    }
    
    const soal = await Soal.create({
      pertanyaan,
      opsi_a,
      opsi_b,
      opsi_c,
      opsi_d,
      jawaban_benar: jawaban_benar.toLowerCase(),
      kategori_id: kategori_id || null
    });
    
    res.status(201).json({ success: true, data: soal });
  } catch (error) {
    console.error('Create soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const updateSoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar } = req.body;
    
    const existingSoal = await Soal.findById(id);
    if (!existingSoal) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }
    
    if (jawaban_benar && !['a', 'b', 'c', 'd'].includes(jawaban_benar.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jawaban benar harus a, b, c, atau d' 
      });
    }
    
    const soal = await Soal.update(id, {
      pertanyaan: pertanyaan || existingSoal.pertanyaan,
      opsi_a: opsi_a || existingSoal.opsi_a,
      opsi_b: opsi_b || existingSoal.opsi_b,
      opsi_c: opsi_c || existingSoal.opsi_c,
      opsi_d: opsi_d || existingSoal.opsi_d,
      jawaban_benar: jawaban_benar ? jawaban_benar.toLowerCase() : existingSoal.jawaban_benar
    });
    
    res.json({ success: true, data: soal });
  } catch (error) {
    console.error('Update soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const deleteSoal = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Soal.delete(id);
    
    if (!result.deleted) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Soal berhasil dihapus' });
  } catch (error) {
    console.error('Delete soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const duplicateSoal = async (req, res) => {
  try {
    const { id } = req.params;
    const duplicated = await Soal.duplicate(id);
    res.json({ success: true, data: duplicated });
  } catch (error) {
    console.error('Duplicate soal error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  getAllSoal,
  getRandomSoal,
  getSoalById,
  createSoal,
  updateSoal,
  deleteSoal,
  duplicateSoal
};

