const { getDB } = require('../database');

class Hasil {
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM hasil WHERE user_id = ? ORDER BY waktu_selesai DESC",
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
  
  static findLatestByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT * FROM hasil WHERE user_id = ? ORDER BY waktu_selesai DESC LIMIT 1",
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }
  
  static create(hasilData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO hasil (user_id, nilai, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?)",
        [
          hasilData.user_id,
          hasilData.nilai,
          hasilData.waktu_mulai,
          hasilData.waktu_selesai
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...hasilData });
          }
        }
      );
    });
  }
  
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        `SELECT h.*, u.nama, u.username 
         FROM hasil h 
         JOIN users u ON h.user_id = u.id 
         ORDER BY h.waktu_selesai DESC`,
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

module.exports = Hasil;

