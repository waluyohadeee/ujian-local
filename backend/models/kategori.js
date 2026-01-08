const { getDB } = require('../database');

class Kategori {
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM kategori ORDER BY nama",
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
  
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get(
        "SELECT * FROM kategori WHERE id = ?",
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
  
  static create(kategoriData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO kategori (nama, deskripsi) VALUES (?, ?)",
        [kategoriData.nama, kategoriData.deskripsi || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...kategoriData });
          }
        }
      );
    });
  }
  
  static update(id, kategoriData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "UPDATE kategori SET nama = ?, deskripsi = ? WHERE id = ?",
        [kategoriData.nama, kategoriData.deskripsi || null, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...kategoriData });
          }
        }
      );
    });
  }
  
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "DELETE FROM kategori WHERE id = ?",
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deleted: this.changes > 0 });
          }
        }
      );
    });
  }
}

module.exports = Kategori;

