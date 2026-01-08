const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database/ujian.db');
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');

let db = null;

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Get database connection
function getDB() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      }
    });
  }
  return db;
}

// Initialize database with schema
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDB();
    
    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_PATH)) {
      // Create schema if not exists
      createSchemaFile();
    }
    
    // Read and execute schema
    fs.readFile(SCHEMA_PATH, 'utf8', (err, sql) => {
      if (err) {
        console.error('Error reading schema file:', err);
        // Create tables directly if schema file read fails
        createTables(resolve, reject);
        return;
      }
      
      db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing schema:', err);
          // Try creating tables directly if schema execution fails
          createTables(resolve, reject);
        } else {
          console.log('✅ Database schema initialized');
          // Migrate tables (add columns if needed)
          migrateTables().then(() => {
            // Insert default admin user if not exists
            insertDefaultData().then(() => {
              resolve();
            }).catch(reject);
          }).catch(reject);
        }
      });
    });
  });
}

// Create tables directly
function createTables(resolve, reject) {
  const db = getDB();
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'peserta'
    );
  `;
  
  const createKategoriTable = `
    CREATE TABLE IF NOT EXISTS kategori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT UNIQUE NOT NULL,
      deskripsi TEXT
    );
  `;
  
  const createSoalTable = `
    CREATE TABLE IF NOT EXISTS soal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pertanyaan TEXT NOT NULL,
      opsi_a TEXT NOT NULL,
      opsi_b TEXT NOT NULL,
      opsi_c TEXT NOT NULL,
      opsi_d TEXT NOT NULL,
      jawaban_benar TEXT NOT NULL,
      kategori_id INTEGER DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kategori_id) REFERENCES kategori(id)
    );
  `;
  
  const createJawabanSiswaTable = `
    CREATE TABLE IF NOT EXISTS jawaban_siswa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      soal_id INTEGER NOT NULL,
      jawaban TEXT,
      waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (soal_id) REFERENCES soal(id)
    );
  `;
  
  const createHasilTable = `
    CREATE TABLE IF NOT EXISTS hasil (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nilai INTEGER NOT NULL,
      waktu_mulai TEXT NOT NULL,
      waktu_selesai TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  
  const createPelanggaranTable = `
    CREATE TABLE IF NOT EXISTS pelanggaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      jenis TEXT NOT NULL,
      deskripsi TEXT,
      waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  
  const createExamSessionsTable = `
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
  `;
  
  const createActivityLogsTable = `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      details TEXT,
      waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  
  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
    });
    
    db.run(createKategoriTable, (err) => {
      if (err) {
        console.error('Error creating kategori table:', err);
      }
    });
    
    db.run(createSoalTable, (err) => {
      if (err) {
        console.error('Error creating soal table:', err);
        reject(err);
        return;
      }
    });
    
    db.run(createJawabanSiswaTable, (err) => {
      if (err) {
        console.error('Error creating jawaban_siswa table:', err);
        reject(err);
        return;
      }
    });
    
    db.run(createHasilTable, (err) => {
      if (err) {
        console.error('Error creating hasil table:', err);
        reject(err);
        return;
      }
    });
    
    db.run(createPelanggaranTable, (err) => {
      if (err) {
        console.error('Error creating pelanggaran table:', err);
      }
    });
    
    db.run(createExamSessionsTable, (err) => {
      if (err) {
        console.error('Error creating exam_sessions table:', err);
      }
    });
    
    db.run(createActivityLogsTable, (err) => {
      if (err) {
        console.error('Error creating activity_logs table:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Database tables created');
      
      // Migrate existing tables (add new columns if needed)
      migrateTables().then(() => {
        insertDefaultData().then(() => {
          resolve();
        }).catch(reject);
      }).catch(reject);
    });
  });
}

// Migrate existing tables (add columns if not exist)
function migrateTables() {
  return new Promise((resolve, reject) => {
    const db = getDB();
    
    // Check and add kategori_id to soal table
    db.all("PRAGMA table_info(soal)", (err, rows) => {
      if (err) {
        console.error('Error checking soal table info:', err);
        resolve(); // Continue even if check fails
        return;
      }
      
      // Check if columns exist
      const hasKategoriId = rows ? rows.some(row => row.name === 'kategori_id') : false;
      const hasCreatedAt = rows ? rows.some(row => row.name === 'created_at') : false;
      
      db.serialize(() => {
        if (!hasKategoriId) {
          db.run("ALTER TABLE soal ADD COLUMN kategori_id INTEGER DEFAULT NULL", (err) => {
            if (err) {
              // Ignore error if column already exists
              if (err.message && !err.message.includes('duplicate')) {
                console.error('Error adding kategori_id column:', err.message);
              }
            } else {
              console.log('✅ Added kategori_id column to soal table');
            }
          });
        } else {
          console.log('ℹ️  kategori_id column already exists');
        }
        
        if (!hasCreatedAt) {
          // SQLite doesn't support CURRENT_TIMESTAMP in ALTER TABLE, use NULL instead
          db.run("ALTER TABLE soal ADD COLUMN created_at TEXT DEFAULT NULL", (err) => {
            if (err) {
              // Ignore error if column already exists
              if (err.message && !err.message.includes('duplicate')) {
                console.error('Error adding created_at column:', err.message);
              }
            } else {
              console.log('✅ Added created_at column to soal table');
            }
          });
        } else {
          console.log('ℹ️  created_at column already exists');
        }
        
        // Wait a bit for async operations
        setTimeout(() => {
          resolve();
        }, 100);
      });
    });
  });
}

// Create schema.sql file
function createSchemaFile() {
  const schemaContent = `-- Database Schema for Sistem Ujian

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'peserta'
);

-- Table: kategori
CREATE TABLE IF NOT EXISTS kategori (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT UNIQUE NOT NULL,
  deskripsi TEXT
);

-- Table: soal
CREATE TABLE IF NOT EXISTS soal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pertanyaan TEXT NOT NULL,
  opsi_a TEXT NOT NULL,
  opsi_b TEXT NOT NULL,
  opsi_c TEXT NOT NULL,
  opsi_d TEXT NOT NULL,
  jawaban_benar TEXT NOT NULL,
  kategori_id INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id)
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
`;
  
  const schemaDir = path.dirname(SCHEMA_PATH);
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }
  
  fs.writeFileSync(SCHEMA_PATH, schemaContent, 'utf8');
  console.log('✅ Schema file created');
}

// Insert default data
async function insertDefaultData() {
  return new Promise((resolve, reject) => {
    const db = getDB();
    
    // Check if admin user exists
    db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        // Insert default admin user (password: admin123)
        db.run(
          "INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)",
          ['admin', 'admin123', 'Administrator', 'admin'],
          (err) => {
            if (err) {
              console.error('Error inserting default admin:', err);
            } else {
              console.log('✅ Default admin user created (username: admin, password: admin123)');
            }
          }
        );
        
        // Insert sample soal
        const sampleSoal = [
          ['Apa ibukota Indonesia?', 'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'a'],
          ['2 + 2 = ?', '3', '4', '5', '6', 'b'],
          ['Warna bendera Indonesia adalah?', 'Merah Putih', 'Merah Kuning', 'Biru Putih', 'Merah Hijau', 'a'],
          ['Planet terdekat dari Matahari adalah?', 'Venus', 'Mercury', 'Mars', 'Earth', 'b'],
          ['Bahasa pemrograman yang digunakan di frontend web?', 'Python', 'Java', 'JavaScript', 'C++', 'c']
        ];
        
        sampleSoal.forEach((soal) => {
          db.run(
            "INSERT INTO soal (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar) VALUES (?, ?, ?, ?, ?, ?)",
            soal,
            (err) => {
              if (err) {
                console.error('Error inserting sample soal:', err);
              }
            }
          );
        });
        
        console.log('✅ Sample soal inserted');
      }
      
      resolve();
    });
  });
}

module.exports = {
  getDB,
  initializeDatabase
};

