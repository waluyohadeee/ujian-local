const { getDB } = require('../database');

class Activity {
  static create(activityData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO activity_logs (user_id, activity_type, details) VALUES (?, ?, ?)",
        [
          activityData.user_id,
          activityData.activity_type,
          activityData.details || null
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...activityData });
          }
        }
      );
    });
  }
  
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY waktu DESC",
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
  
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        `SELECT a.*, u.nama, u.username 
         FROM activity_logs a 
         JOIN users u ON a.user_id = u.id 
         ORDER BY a.waktu DESC`,
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

module.exports = Activity;

