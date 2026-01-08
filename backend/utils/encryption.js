const crypto = require('crypto');

// Generate encryption key for session (simplified - in production use secure key management)
function generateSessionKey(userId, timestamp) {
  const hash = crypto.createHash('sha256');
  hash.update(`${userId}_${timestamp}_${Date.now()}`);
  return hash.digest('hex').substring(0, 32); // Use 32 bytes for AES-256
}

// Encrypt soal data
function encryptSoal(soal, sessionKey) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(sessionKey, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(soal), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

// Decrypt soal data (for reference - actual decryption happens on frontend)
function decryptSoal(encryptedData, sessionKey, ivHex) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(sessionKey, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

module.exports = {
  generateSessionKey,
  encryptSoal,
  decryptSoal
};

