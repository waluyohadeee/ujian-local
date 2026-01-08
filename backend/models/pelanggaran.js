const { getDB } = require('../database');

class Pelanggaran {
  static create(pelanggaranData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO pelanggaran (user_id, jenis, deskripsi, ip_address) VALUES (?, ?, ?, ?)",
        [
          pelanggaranData.user_id,
          pelanggaranData.jenis,
          pelanggaranData.deskripsi || null,
          pelanggaranData.ip_address || null
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...pelanggaranData });
          }
        }
      );
    });
  }
  
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM pelanggaran WHERE user_id = ? ORDER BY waktu DESC",
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }
  
  static countByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT COUNT(*) as count FROM pelanggaran WHERE user_id = ?",
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.count : 0);
          }
        }
      );
    });
  }
  
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        `SELECT p.*, u.nama, u.username 
         FROM pelanggaran p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.waktu DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }
}

module.exports = Pelanggaran;

