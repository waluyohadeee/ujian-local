const { getDB } = require('../database');

class Soal {
  static findAll() {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM soal ORDER BY id",
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
  
  static findRandom(jumlah, kategoriId = null) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      let query = "SELECT * FROM soal";
      const params = [];
      
      if (kategoriId) {
        query += " WHERE kategori_id = ?";
        params.push(kategoriId);
      }
      
      query += " ORDER BY RANDOM() LIMIT ?";
      params.push(jumlah);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  static findByKategori(kategoriId) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.all(
        "SELECT * FROM soal WHERE kategori_id = ? ORDER BY id",
        [kategoriId],
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
        "SELECT * FROM soal WHERE id = ?",
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
  
  static create(soalData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "INSERT INTO soal (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, kategori_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          soalData.pertanyaan,
          soalData.opsi_a,
          soalData.opsi_b,
          soalData.opsi_c,
          soalData.opsi_d,
          soalData.jawaban_benar,
          soalData.kategori_id || null
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...soalData });
          }
        }
      );
    });
  }
  
  static update(id, soalData) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "UPDATE soal SET pertanyaan = ?, opsi_a = ?, opsi_b = ?, opsi_c = ?, opsi_d = ?, jawaban_benar = ?, kategori_id = ? WHERE id = ?",
        [
          soalData.pertanyaan,
          soalData.opsi_a,
          soalData.opsi_b,
          soalData.opsi_c,
          soalData.opsi_d,
          soalData.jawaban_benar,
          soalData.kategori_id || null,
          id
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...soalData });
          }
        }
      );
    });
  }
  
  static duplicate(id) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.get("SELECT * FROM soal WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Soal not found'));
          return;
        }
        
        // Insert duplicate with modified pertanyaan
        db.run(
          "INSERT INTO soal (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, kategori_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            `${row.pertanyaan} (Copy)`,
            row.opsi_a,
            row.opsi_b,
            row.opsi_c,
            row.opsi_d,
            row.jawaban_benar,
            row.kategori_id
          ],
          function(dupErr) {
            if (dupErr) {
              reject(dupErr);
            } else {
              resolve({ id: this.lastID, ...row, pertanyaan: `${row.pertanyaan} (Copy)` });
            }
          }
        );
      });
    });
  }
  
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDB();
      db.run(
        "DELETE FROM soal WHERE id = ?",
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

module.exports = Soal;

