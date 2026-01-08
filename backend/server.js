const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.argv.includes('--host') && process.argv[process.argv.indexOf('--host') + 1] 
  ? process.argv[process.argv.indexOf('--host') + 1] 
  : (process.argv.includes('--host') ? '0.0.0.0' : 'localhost');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const soalRoutes = require('./routes/soalRoutes');
const ujianRoutes = require('./routes/ujianRoutes');
const anticheatRoutes = require('./routes/anticheatRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');

app.use('/api', authRoutes);
app.use('/api/soal', soalRoutes);
app.use('/api/ujian', ujianRoutes);
app.use('/api/anticheat', anticheatRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/activity', require('./routes/activityRoutes'));

// Initialize database
initializeDatabase().then(() => {
  console.log('✅ Database initialized successfully');
  
  // Start HTTP server
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📱 Access locally: http://localhost:${PORT}`);
    if (HOST === '0.0.0.0') {
      console.log(`🌐 Access via LAN: http://<your-ip>:${PORT}`);
    }
  });
  
  // Initialize WebSocket server
  const { initializeWebSocket } = require('./websocket');
  initializeWebSocket(server);
  
}).catch((err) => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

