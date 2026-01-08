const { getDB } = require('../database');

class Jawaban {
  static findByUserAndSoal(userId, soalId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT * FROM jawaban_siswa WHERE user_id = ? AND soal_id = ?",
        [userId, soalId],
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
  
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM jawaban_siswa WHERE user_id = ?",
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
  
  static createOrUpdate(userId, soalId, jawaban) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      
      // Check if answer exists
      db.get(
        "SELECT id FROM jawaban_siswa WHERE user_id = ? AND soal_id = ?",
        [userId, soalId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            // Update existing
            db.run(
              "UPDATE jawaban_siswa SET jawaban = ?, waktu = CURRENT_TIMESTAMP WHERE user_id = ? AND soal_id = ?",
              [jawaban, userId, soalId],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve({ id: row.id, user_id: userId, soal_id: soalId, jawaban, updated: true });
                }
              }
            );
          } else {
            // Insert new
            db.run(
              "INSERT INTO jawaban_siswa (user_id, soal_id, jawaban) VALUES (?, ?, ?)",
              [userId, soalId, jawaban],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve({ id: this.lastID, user_id: userId, soal_id: soalId, jawaban, updated: false });
                }
              }
            );
          }
        }
      );
    });
  }
  
  static deleteByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "DELETE FROM jawaban_siswa WHERE user_id = ?",
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deleted: this.changes });
          }
        }
      );
    });
  }
}

module.exports = Jawaban;

