const { getDB } = require('../database');

class User {
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
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
  
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT id, username, nama, role FROM users WHERE id = ?",
        [id],
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
  
  static create(userData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)",
        [userData.username, userData.password, userData.nama, userData.role || 'peserta'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...userData });
          }
        }
      );
    });
  }
}

module.exports = User;

