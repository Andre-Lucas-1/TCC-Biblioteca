const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const { authenticateToken, requireOwnershipOrLibrarian, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile - Obter perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      message: 'Perfil obtido com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id - Obter perfil de usuário específico
router.get('/:id', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Se não for bibliotecário e não for o próprio usuário, limitar dados
    if (req.user.userType !== 'librarian' && req.user._id.toString() !== req.params.id) {
      // Verificar configurações de privacidade
      if (!user.preferences.privacy.showProfile) {
        return res.status(403).json({ message: 'Perfil privado' });
      }
      
      // Remover dados sensíveis
      delete user.email;
      delete user.preferences;
      
      if (!user.preferences.privacy.showReadingProgress) {
        delete user.statistics;
      }
      
      if (!user.preferences.privacy.showAchievements) {
        delete user.gamification.achievements;
        delete user.gamification.badges;
      }
    }
    
    res.json({
      message: 'Perfil obtido com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/users/profile - Atualizar perfil do usuário
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('profile.age')
    .optional()
    .isInt({ min: 8, max: 120 })
    .withMessage('Idade deve estar entre 8 e 120 anos'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio não pode ter mais de 500 caracteres'),
  body('profile.dailyReadingGoal')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Meta diária deve estar entre 5 e 120 minutos'),
  body('profile.favoriteGenres')
    .optional()
    .isArray()
    .withMessage('Gêneros favoritos deve ser um array'),
  body('profile.readingLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Nível de leitura inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const updateData = {};
    
    // Campos permitidos para atualização
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.profile) {
      updateData.profile = {
        ...req.user.profile,
        ...req.body.profile
      };
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/users/preferences - Atualizar preferências do usuário
router.put('/preferences', authenticateToken, [
  body('notifications.dailyReminder')
    .optional()
    .isBoolean()
    .withMessage('Lembrete diário deve ser booleano'),
  body('notifications.achievementUnlocked')
    .optional()
    .isBoolean()
    .withMessage('Notificação de conquista deve ser booleano'),
  body('notifications.newBookRecommendation')
    .optional()
    .isBoolean()
    .withMessage('Recomendação de livro deve ser booleano'),
  body('privacy.showProfile')
    .optional()
    .isBoolean()
    .withMessage('Mostrar perfil deve ser booleano'),
  body('privacy.showReadingProgress')
    .optional()
    .isBoolean()
    .withMessage('Mostrar progresso deve ser booleano'),
  body('privacy.showAchievements')
    .optional()
    .isBoolean()
    .withMessage('Mostrar conquistas deve ser booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const updateData = {
      preferences: {
        ...req.user.preferences,
        ...req.body
      }
    };
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Preferências atualizadas com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id/reading-stats - Obter estatísticas de leitura
router.get('/:id/reading-stats', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Buscar progresso de leitura do usuário
    const readingProgress = await ReadingProgress.find({ user: userId })
      .populate('book', 'title author genre difficulty')
      .lean();
    
    // Calcular estatísticas
    const stats = {
      totalBooks: readingProgress.length,
      booksCompleted: readingProgress.filter(p => p.status === 'completed').length,
      booksReading: readingProgress.filter(p => p.status === 'reading').length,
      booksPaused: readingProgress.filter(p => p.status === 'paused').length,
      booksAbandoned: readingProgress.filter(p => p.status === 'abandoned').length,
      totalReadingTime: readingProgress.reduce((sum, p) => sum + p.totalReadingTime, 0),
      averageProgress: readingProgress.length > 0 
        ? Math.round(readingProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / readingProgress.length)
        : 0,
      favoriteGenres: {},
      readingStreak: 0,
      longestStreak: 0
    };
    
    // Calcular gêneros favoritos
    readingProgress.forEach(progress => {
      if (progress.book && progress.book.genre) {
        const genre = progress.book.genre;
        stats.favoriteGenres[genre] = (stats.favoriteGenres[genre] || 0) + 1;
      }
    });
    
    // Progresso nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentProgress = readingProgress.filter(p => 
      p.lastReadAt && p.lastReadAt >= thirtyDaysAgo
    );
    
    stats.recentActivity = {
      booksRead: recentProgress.length,
      totalTime: recentProgress.reduce((sum, p) => sum + p.totalReadingTime, 0),
      averageDaily: Math.round(recentProgress.reduce((sum, p) => sum + p.totalReadingTime, 0) / 30)
    };
    
    res.json({
      message: 'Estatísticas obtidas com sucesso',
      stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id/achievements - Obter conquistas do usuário
router.get('/:id/achievements', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('gamification.achievements gamification.badges gamification.level gamification.experience')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const resetApplied = user.maintenance?.gamificationResetApplied;
    const removedIds = new Set(['consistent_reader','note_taker','challenge_seeker','genre_explorer']);
    const achievements = resetApplied ? [] : (user.gamification.achievements || []).filter(a => !removedIds.has(a.id || a.achievementId));
    const badges = resetApplied ? [] : (user.gamification.badges || []);
    res.json({
      message: 'Conquistas obtidas com sucesso',
      achievements,
      badges,
      level: user.gamification.level,
      experience: user.gamification.experience
    });
  } catch (error) {
    console.error('Erro ao obter conquistas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/users/search - Buscar usuários (apenas para bibliotecários)
router.get('/search', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { q, page = 1, limit = 10, userType, isActive } = req.query;
    
    const filters = {};
    
    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (userType) filters.userType = userType;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filters)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();
    
    const total = await User.countDocuments(filters);
    
    res.json({
      message: 'Usuários encontrados',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/users/:id - Desativar conta (soft delete)
router.delete('/:id', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      message: 'Conta desativada com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao desativar conta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
