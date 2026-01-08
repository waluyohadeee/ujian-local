const Kategori = require('../models/kategori');

const getAllKategori = async (req, res) => {
  try {
    const kategori = await Kategori.findAll();
    res.json({ success: true, data: kategori });
  } catch (error) {
    console.error('Get all kategori error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getKategoriById = async (req, res) => {
  try {
    const { id } = req.params;
    const kategori = await Kategori.findById(id);
    
    if (!kategori) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    
    res.json({ success: true, data: kategori });
  } catch (error) {
    console.error('Get kategori by id error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const createKategori = async (req, res) => {
  try {
    const { nama, deskripsi } = req.body;
    
    if (!nama) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama kategori harus diisi' 
      });
    }
    
    const kategori = await Kategori.create({ nama, deskripsi });
    res.status(201).json({ success: true, data: kategori });
  } catch (error) {
    console.error('Create kategori error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi } = req.body;
    
    const existingKategori = await Kategori.findById(id);
    if (!existingKategori) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    
    const kategori = await Kategori.update(id, {
      nama: nama || existingKategori.nama,
      deskripsi: deskripsi !== undefined ? deskripsi : existingKategori.deskripsi
    });
    
    res.json({ success: true, data: kategori });
  } catch (error) {
    console.error('Update kategori error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Kategori.delete(id);
    
    if (!result.deleted) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete kategori error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori
};

