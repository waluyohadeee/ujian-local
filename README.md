# Sistem Ujian Online Berbasis Web Full Local

Sistem ujian online lengkap yang dapat berjalan di server lokal dengan database SQLite.

## 🚀 Fitur

- ✅ Authentication (Login)
- ✅ Manajemen Soal
- ✅ Ujian dengan soal random
- ✅ Random opsi jawaban (A/B/C/D)
- ✅ Timer countdown
- ✅ Auto-save jawaban
- ✅ Hasil ujian dengan animasi
- ✅ Responsive design
- ✅ Animasi UI (fade-in, slide, pulse, glow, dll)

## 📁 Struktur Folder

```
/ujian-app/
   /backend/
      server.js
      database.js
      models/
         users.js
         soal.js
         jawaban.js
         hasil.js
      controllers/
         authController.js
         soalController.js
         ujianController.js
      routes/
         authRoutes.js
         soalRoutes.js
         ujianRoutes.js
   /database/
      ujian.db (auto create)
      schema.sql
   /public/
      index.html
      login.html
      instructions.html
      exam.html
      result.html
      /assets/
         css/style.css
         js/app.js
         js/exam.js
```

## 🛠️ Instalasi

1. **Clone atau download project ini**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan server:**
   ```bash
   npm start
   ```
   
   Atau untuk mode LAN (akses dari device lain di jaringan yang sama):
   ```bash
   npm run start:lan
   ```

4. **Akses aplikasi:**
   - Local: http://localhost:3000
   - LAN: http://<your-ip>:3000

## 🔐 Default Login

- **Username:** `admin`
- **Password:** `admin123`

## 📖 API Endpoints

### Authentication
- `POST /api/login` - Login user

### Soal
- `GET /api/soal` - Get all soal
- `GET /api/soal/random?jumlah=10` - Get random soal
- `GET /api/soal/:id` - Get soal by ID
- `POST /api/soal` - Create new soal
- `PUT /api/soal/:id` - Update soal
- `DELETE /api/soal/:id` - Delete soal

### Ujian
- `POST /api/ujian/start` - Start exam session
- `POST /api/ujian/jawab` - Submit answer
- `POST /api/ujian/selesai` - Finish exam and calculate score
- `GET /api/ujian/hasil?user_id=1` - Get latest result

## 🎨 Fitur Animasi

Sistem ini dilengkapi dengan berbagai animasi:
- **Fade-in/Fade-out** - Transisi halus
- **Slide-left/Slide-right** - Navigasi soal
- **Scale-up** - Munculnya elemen
- **Pulse** - Timer countdown
- **Glow** - Button hover effect
- **Float** - Floating animation pada tombol

## 💾 Database

Database SQLite akan otomatis dibuat saat pertama kali menjalankan server. File database berada di `database/ujian.db`.

### Tabel:

1. **users** - Data pengguna
2. **soal** - Bank soal
3. **jawaban_siswa** - Jawaban siswa
4. **hasil** - Hasil ujian

## 🎯 Cara Menggunakan

1. **Login** dengan akun admin
2. **Mulai Ujian** - Baca petunjuk terlebih dahulu
3. **Kerjakan Soal** - Soal dan opsi di-random secara otomatis
4. **Submit Jawaban** - Jawaban tersimpan otomatis
5. **Selesai** - Lihat hasil ujian dengan animasi score

## 🔧 Konfigurasi

### Mengubah Durasi Ujian

Edit file `public/assets/js/exam.js`:
```javascript
const EXAM_DURATION = 3600; // dalam detik (3600 = 60 menit)
```

### Mengubah Jumlah Soal

Edit file `public/assets/js/exam.js`:
```javascript
const response = await fetch('/api/soal/random?jumlah=10'); // ubah 10 sesuai kebutuhan
```

## 📝 Catatan

- Database dan soal sample akan otomatis dibuat saat pertama kali run
- Jawaban tersimpan otomatis saat memilih opsi
- Refresh halaman tidak akan mengubah soal yang sudah di-load (disimpan di localStorage)
- Timer countdown berjalan real-time

## 🐛 Troubleshooting

**Server tidak bisa diakses dari LAN:**
- Pastikan firewall mengizinkan koneksi pada port 3000
- Pastikan menggunakan `npm run start:lan` atau `node backend/server.js --host 0.0.0.0`
- Cek IP address server dengan `ipconfig` (Windows) atau `ifconfig` (Linux/Mac)

**Database error:**
- Pastikan folder `database/` dapat diakses
- Hapus file `database/ujian.db` untuk reset database

**Port already in use:**
- Ubah PORT di `backend/server.js` atau gunakan environment variable `PORT`

## 📄 License

MIT License

## 👨‍💻 Developer

Dibuat dengan ❤️ menggunakan Node.js, Express, SQLite, dan vanilla JavaScript.

