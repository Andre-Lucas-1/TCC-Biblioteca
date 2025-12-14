const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();
const EXTERNAL_AUTH_BASE_URL = process.env.EXTERNAL_AUTH_BASE_URL || 'https://banco-z4ar.onrender.com';
const externalAuth = axios.create({ baseURL: EXTERNAL_AUTH_BASE_URL, timeout: 30000 });
// Cache em memória para reduzir dependência de listagem lenta no serviço externo
const externalCache = new Map(); // key: email, value: { name, email, passwordHash }

async function findExternalUserByEmail(email) {
  try {
    await externalAuth.get('/');
  } catch {}
  // Primeiro tenta cache
  const cached = externalCache.get(String(email).toLowerCase());
  if (cached) return cached;
  // Busca completa
  const res = await externalAuth.get('/users');
  const users = Array.isArray(res.data) ? res.data : [];
  users.forEach(u => {
    externalCache.set(String(u.email).toLowerCase(), {
      name: u.name,
      email: u.email,
      passwordHash: u.password || u.passwordHash
    });
  });
  return externalCache.get(String(email).toLowerCase());
}

// Validações para registro
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('userType')
    .isIn(['user', 'librarian'])
    .withMessage('Tipo de usuário deve ser "user" ou "librarian"'),
  body('age')
    .optional()
    .isInt({ min: 8, max: 120 })
    .withMessage('Idade deve estar entre 8 e 120 anos')
];

// Validações para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// POST /api/auth/register - Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password, userType, age, preferredGenres, dailyReadingGoal } = req.body;

    // Integração somente com banco externo: não validar duplicidade local

    // Evitar chamada lenta de listagem externa para checar duplicidade.
    // Confiaremos no banco local para deduplicar e tentaremos criar o usuário externo em background.

    // Criar novo usuário
    const userData = {
      name,
      email,
      password,
      userType
    };

    // Adicionar dados do perfil se for usuário comum
    if (userType === 'user') {
      userData.profile = {
        age: age || null,
        preferredGenres: preferredGenres || [],
        dailyReadingGoal: dailyReadingGoal || 10
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    // Criar no serviço externo (best-effort)
    try { await externalAuth.get('/'); } catch {}
    try {
      await externalAuth.post('/users', { name, email, password: passwordHash });
      externalCache.set(String(email).toLowerCase(), { name, email, passwordHash });
    } catch (e) {
      // continua mesmo se externo indisponível; garantimos criação local
    }

    // Criar usuário local (ou reativar se não existir no externo)
    const existing = await User.findOne({ email });
    if (existing) {
      // Reativar/atualizar conta local independente do estado externo
      existing.password = passwordHash;
      existing.isActive = true;
      existing.name = name || existing.name;
      existing.userType = userType || existing.userType;
      if (userData.profile) existing.profile = { ...existing.profile, ...userData.profile };
      await existing.save();
      const token = generateToken({ userId: existing._id.toString(), email, name: existing.name, userType: existing.userType, isActive: true });
      return res.status(200).json({ message: 'Conta reativada com sucesso', user: { name: existing.name, email }, token });
    }
    const localUser = new User({ name, email, userType: userType || 'user', isActive: true, profile: userData.profile || {}, password: passwordHash });
    await localUser.save();
    const token = generateToken({ userId: localUser._id.toString(), email, name, userType: localUser.userType, isActive: true });
    res.status(201).json({ message: 'Usuário criado com sucesso', user: { name, email }, token });

  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: 'INTERNAL_ERROR' });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    let valid = false;
    let displayName = '';
    // Tenta validar pelo serviço externo
    try {
      const externalUser = await findExternalUserByEmail(email);
      if (externalUser) {
        const hash = externalUser.passwordHash || externalUser.password;
        valid = hash ? await bcrypt.compare(password, hash) : false;
        displayName = externalUser.name || '';
      }
    } catch {}
    // Se não validou externamente, tenta validar localmente
    const localUser = await User.findOne({ email });
    if (!valid && localUser && localUser.password) {
      valid = await bcrypt.compare(password, localUser.password);
      displayName = localUser.name || displayName;
    }
    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas', error: 'INVALID_CREDENTIALS' });
    }
    if (!localUser || localUser.isActive === false) {
      return res.status(403).json({ message: 'Conta inexistente ou desativada', error: 'ACCOUNT_DISABLED' });
    }
    const token = generateToken({ userId: localUser._id.toString(), email, name: localUser.name || displayName || '', userType: localUser.userType || 'user', isActive: true });
    res.json({ message: 'Login realizado com sucesso', user: { name: localUser.name || displayName || '', email }, token });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: 'INTERNAL_ERROR' });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('friends', 'name email profile.avatar');

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'Dados do usuário obtidos com sucesso',
      user
    });

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/profile - Atualizar perfil do usuário
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('profile.age')
    .optional()
    .isInt({ min: 8, max: 120 })
    .withMessage('Idade deve estar entre 8 e 120 anos'),
  body('profile.dailyReadingGoal')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Meta diária deve estar entre 5 e 120 minutos')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, profile } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Atualizar campos permitidos
    if (name) user.name = name;
    if (profile) {
      if (profile.age !== undefined) user.profile.age = profile.age;
      if (profile.preferredGenres) user.profile.preferredGenres = profile.preferredGenres;
      if (profile.dailyReadingGoal) user.profile.dailyReadingGoal = profile.dailyReadingGoal;
      if (profile.readingLevel) user.profile.readingLevel = profile.readingLevel;
    }

    await user.save();

    // Remover senha da resposta
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: userResponse
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Senha atual incorreta',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
