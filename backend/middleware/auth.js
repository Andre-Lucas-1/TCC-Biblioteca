const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Gerar token JWT com payload completo (sem dependência de User local)
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Middleware para autenticar token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Encontrar ou criar usuário local mínimo para funcionalidades (progresso/gamificação)
    const email = decoded.email;
    let user = null;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: decoded.name || email.split('@')[0],
          email,
          userType: decoded.userType || 'user',
          isActive: true
        });
        await user.save();
      }
    }
    req.user = user || decoded;
    if (!req.user._id && decoded.userId) req.user._id = decoded.userId;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar se o usuário é bibliotecário
const requireLibrarian = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (req.user.userType !== 'librarian') {
    return res.status(403).json({ 
      message: 'Acesso negado. Apenas bibliotecários podem acessar este recurso.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  next();
};

// Middleware para verificar se o usuário é admin ou o próprio usuário
const requireOwnershipOrLibrarian = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  const targetUserId = req.params.userId || req.params.id;
  
  // Permitir se for bibliotecário ou se for o próprio usuário
  if (req.user.userType === 'librarian' || req.user._id.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ 
    message: 'Acesso negado. Você só pode acessar seus próprios dados.',
    code: 'INSUFFICIENT_PERMISSIONS'
  });
};

// Middleware para verificar se o usuário pode acessar o recurso
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      const resourceId = req.params.id;
      
      // Bibliotecários têm acesso a todos os recursos
      if (req.user.userType === 'librarian') {
        return next();
      }
      
      // Verificar acesso baseado no tipo de recurso
      switch (resourceType) {
        case 'book':
          const Book = require('../models/Book');
          const book = await Book.findById(resourceId);
          
          if (!book) {
            return res.status(404).json({ 
              message: 'Livro não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
          
          // Usuários comuns só podem acessar livros aprovados e ativos
          if (!book.isApproved || !book.isActive) {
            return res.status(403).json({ 
              message: 'Acesso negado a este livro',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
          break;
          
        case 'progress':
          const ReadingProgress = require('../models/ReadingProgress');
          const progress = await ReadingProgress.findById(resourceId);
          
          if (!progress) {
            return res.status(404).json({ 
              message: 'Progresso não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
          
          // Usuários só podem acessar seu próprio progresso
          if (progress.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
              message: 'Acesso negado a este progresso',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
          break;
          
        default:
          return res.status(400).json({ 
            message: 'Tipo de recurso inválido',
            code: 'INVALID_RESOURCE_TYPE'
          });
      }
      
      next();
      
    } catch (error) {
      console.error('Erro na verificação de acesso:', error);
      return res.status(500).json({ 
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Middleware para rate limiting por usuário
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar requests antigos
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Muitas requisições. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Adicionar request atual
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    next();
  };
};

// Middleware para log de atividades
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`[${new Date().toISOString()}] User ${req.user._id} (${req.user.email}) performed action: ${action}`);
    }
    next();
  };
};

module.exports = {
  generateToken,
  authenticateToken,
  requireLibrarian,
  requireOwnershipOrLibrarian,
  requireResourceAccess,
  userRateLimit,
  logActivity
};
