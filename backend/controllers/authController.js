const User = require('../models/users');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username dan password harus diisi' 
      });
    }
    
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }
    
    // Generate dummy token (in production, use JWT)
    const token = `token_${user.id}_${Date.now()}`;
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

module.exports = {
  login
};

