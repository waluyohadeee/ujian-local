const { getDB } = require('../database');

class ExamSession {
  static findByUserActive(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT * FROM exam_sessions WHERE user_id = ? AND status = 'active' ORDER BY waktu_mulai DESC LIMIT 1",
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
  
  static create(sessionData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO exam_sessions (user_id, waktu_mulai, status) VALUES (?, ?, ?)",
        [sessionData.user_id, sessionData.waktu_mulai, sessionData.status || 'active'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...sessionData });
          }
        }
      );
    });
  }
  
  static update(userId, sessionData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      const updates = [];
      const values = [];
      
      if (sessionData.waktu_berakhir) {
        updates.push('waktu_berakhir = ?');
        values.push(sessionData.waktu_berakhir);
      }
      if (sessionData.status) {
        updates.push('status = ?');
        values.push(sessionData.status);
      }
      if (sessionData.pelanggaran_count !== undefined) {
        updates.push('pelanggaran_count = ?');
        values.push(sessionData.pelanggaran_count);
      }
      if (sessionData.locked !== undefined) {
        updates.push('locked = ?');
        values.push(sessionData.locked ? 1 : 0);
      }
      
      values.push(userId);
      
      db.run(
        `UPDATE exam_sessions SET ${updates.join(', ')} WHERE user_id = ? AND status = 'active'`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ updated: this.changes > 0 });
          }
        }
      );
    });
  }
  
  static findAllActive() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        `SELECT s.*, u.nama, u.username 
         FROM exam_sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.status = 'active' 
         ORDER BY s.waktu_mulai DESC`,
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

module.exports = ExamSession;

