const WebSocket = require('ws');
const ExamSession = require('./models/session');
const Pelanggaran = require('./models/pelanggaran');

let wss = null;
const connectedClients = new Map(); // Map of userId -> Set of WebSocket connections

// Initialize WebSocket server
function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case 'register':
            await handleRegister(ws, data);
            break;
          case 'status_update':
            await handleStatusUpdate(ws, data);
            break;
          case 'heartbeat':
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      // Remove from connected clients
      for (const [userId, connections] of connectedClients.entries()) {
        connections.delete(ws);
        if (connections.size === 0) {
          connectedClients.delete(userId);
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  console.log('✅ WebSocket server initialized');
}

// Handle client registration
async function handleRegister(ws, data) {
  const { user_id, role } = data;
  
  if (!user_id) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'User ID required' 
    }));
    return;
  }
  
  // Add to connected clients
  if (!connectedClients.has(user_id)) {
    connectedClients.set(user_id, new Set());
  }
  connectedClients.get(user_id).add(ws);
  
  // Store user info in ws
  ws.userId = user_id;
  ws.role = role || 'peserta';
  
  ws.send(JSON.stringify({ 
    type: 'registered', 
    user_id,
    timestamp: Date.now()
  }));
  
  // If admin, send all active sessions
  if (role === 'admin') {
    await broadcastActiveSessions();
  }
}

// Handle status update
async function handleStatusUpdate(ws, data) {
  const { user_id, status } = data;
  
  if (!user_id || ws.userId !== user_id) {
    return; // Security check
  }
  
  // Broadcast to admins
  broadcastToAdmins({
    type: 'status_update',
    user_id,
    status,
    timestamp: Date.now()
  });
}

// Broadcast to all admins
function broadcastToAdmins(message) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.role === 'admin') {
      client.send(messageStr);
    }
  });
}

// Broadcast active sessions to admins
async function broadcastActiveSessions() {
  try {
    const sessions = await ExamSession.findAllActive();
    
    const violations = await Pelanggaran.findAll();
    const violationMap = {};
    violations.forEach(v => {
      if (!violationMap[v.user_id]) {
        violationMap[v.user_id] = [];
      }
      violationMap[v.user_id].push(v);
    });
    
    const sessionData = sessions.map(session => {
      const userViolations = violationMap[session.user_id] || [];
      return {
        user_id: session.user_id,
        nama: session.nama,
        username: session.username,
        waktu_mulai: session.waktu_mulai,
        pelanggaran_count: session.pelanggaran_count || userViolations.length,
        locked: session.locked === 1 || session.locked === true,
        status: session.status
      };
    });
    
    broadcastToAdmins({
      type: 'active_sessions',
      sessions: sessionData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error broadcasting active sessions:', error);
  }
}

// Send message to specific user
function sendToUser(userId, message) {
  const connections = connectedClients.get(userId);
  if (connections) {
    const messageStr = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

// Broadcast lock/force submit to user
function notifyUser(userId, type, data) {
  sendToUser(userId, {
    type,
    ...data,
    timestamp: Date.now()
  });
}

// Periodic update (every 5 seconds)
setInterval(async () => {
  if (wss && connectedClients.size > 0) {
    await broadcastActiveSessions();
  }
}, 5000);

module.exports = {
  initializeWebSocket,
  broadcastToAdmins,
  sendToUser,
  notifyUser,
  broadcastActiveSessions
};

