-- Database Schema for Sistem Ujian

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'peserta'
);

-- Table: soal
CREATE TABLE IF NOT EXISTS soal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pertanyaan TEXT NOT NULL,
  opsi_a TEXT NOT NULL,
  opsi_b TEXT NOT NULL,
  opsi_c TEXT NOT NULL,
  opsi_d TEXT NOT NULL,
  jawaban_benar TEXT NOT NULL
);

-- Table: jawaban_siswa
CREATE TABLE IF NOT EXISTS jawaban_siswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  soal_id INTEGER NOT NULL,
  jawaban TEXT,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (soal_id) REFERENCES soal(id)
);

-- Table: hasil
CREATE TABLE IF NOT EXISTS hasil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nilai INTEGER NOT NULL,
  waktu_mulai TEXT NOT NULL,
  waktu_selesai TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: kategori (new)
CREATE TABLE IF NOT EXISTS kategori (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT UNIQUE NOT NULL,
  deskripsi TEXT
);

-- Table: soal updated with kategori
-- Note: ALTER TABLE untuk kolom baru harus dilakukan dengan hati-hati
-- Kolom akan ditambahkan via database.js migration function

-- Table: pelanggaran (anti-cheat)
CREATE TABLE IF NOT EXISTS pelanggaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  jenis TEXT NOT NULL,
  deskripsi TEXT,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: exam_sessions (tracking sessions)
CREATE TABLE IF NOT EXISTS exam_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  waktu_mulai TEXT NOT NULL,
  waktu_berakhir TEXT,
  status TEXT DEFAULT 'active',
  pelanggaran_count INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: activity_logs (logging aktivitas)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  details TEXT,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

