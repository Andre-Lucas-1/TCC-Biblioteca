const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// Definições de conquistas e badges
const ACHIEVEMENTS = {
  FIRST_BOOK: {
    id: 'first_book',
    name: 'Primeiro Livro',
    description: 'Complete seu primeiro livro',
    icon: '📚',
    experience: 50,
    condition: (user, progress) => {
      const resetAt = user.maintenance?.gamificationResetAt;
      const after = progress.filter(p => {
        const d = p.completedAt || p.lastReadAt || p.startedAt;
        return p.status === 'completed' && (!resetAt || (d && d > resetAt));
      });
      return after.length >= 1;
    }
  },
  BOOKWORM: {
    id: 'bookworm',
    name: 'Ratão de Biblioteca',
    description: 'Complete 10 livros',
    icon: '🐛',
    experience: 200,
    condition: (user, progress) => {
      const resetAt = user.maintenance?.gamificationResetAt;
      const after = progress.filter(p => {
        const d = p.completedAt || p.lastReadAt || p.startedAt;
        return p.status === 'completed' && (!resetAt || (d && d > resetAt));
      });
      return after.length >= 10;
    }
  },
  SPEED_READER: {
    id: 'speed_reader',
    name: 'Leitor Veloz',
    description: 'Complete um livro em menos de 3 dias',
    icon: '⚡',
    experience: 100,
    condition: (user, progress) => {
      const resetAt = user.maintenance?.gamificationResetAt;
      return progress.some(p => {
        if (p.status === 'completed' && p.startedAt && p.completedAt) {
          if (resetAt && !(p.completedAt > resetAt || p.startedAt > resetAt)) return false;
          const timeDiff = p.completedAt - p.startedAt;
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          return daysDiff < 3;
        }
        return false;
      });
    }
  },
  MARATHON_READER: {
    id: 'marathon_reader',
    name: 'Maratonista da Leitura',
    description: 'Leia por mais de 2 horas em um dia',
    icon: '🏃',
    experience: 75,
    condition: (user, progress) => {
      const resetAt = user.maintenance?.gamificationResetAt;
      return progress.some(p => {
        if (!Array.isArray(p.readingSessions)) return false;
        return p.readingSessions.some(session => {
          const end = session.endedAt || p.lastReadAt || p.completedAt || p.startedAt;
          return session.duration > 120 && (!resetAt || (end && end > resetAt));
        });
      });
    }
  }
};

const BADGES = {
  BRONZE_READER: {
    id: 'bronze_reader',
    name: 'Leitor Bronze',
    description: 'Complete 5 livros',
    icon: '🥉',
    color: '#CD7F32',
    condition: (user, progress) => {
      return progress.filter(p => p.status === 'completed').length >= 5;
    }
  },
  SILVER_READER: {
    id: 'silver_reader',
    name: 'Leitor Prata',
    description: 'Complete 25 livros',
    icon: '🥈',
    color: '#C0C0C0',
    condition: (user, progress) => {
      return progress.filter(p => p.status === 'completed').length >= 25;
    }
  },
  GOLD_READER: {
    id: 'gold_reader',
    name: 'Leitor Ouro',
    description: 'Complete 50 livros',
    icon: '🥇',
    color: '#FFD700',
    condition: (user, progress) => {
      return progress.filter(p => p.status === 'completed').length >= 50;
    }
  },
  TIME_MASTER: {
    id: 'time_master',
    name: 'Mestre do Tempo',
    description: 'Acumule 100 horas de leitura',
    icon: '⏰',
    color: '#4169E1',
    condition: (user, progress) => {
      const totalMinutes = progress.reduce((sum, p) => sum + p.totalReadingTime, 0);
      return totalMinutes >= 6000; // 100 horas = 6000 minutos
    }
  }
};

// GET /api/gamification/profile - Obter perfil de gamificação do usuário
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('gamification name')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Calcular próximo nível
    const currentLevel = user.gamification.level;
    const currentExp = user.gamification.experience;
    const expForNextLevel = (currentLevel + 1) * 100; // 100 XP por nível
    const expToNextLevel = expForNextLevel - currentExp;
    
    const profile = {
      ...user.gamification,
      name: user.name,
      expForNextLevel,
      expToNextLevel: Math.max(0, expToNextLevel),
      progressToNextLevel: Math.min(100, (currentExp / expForNextLevel) * 100)
    };
    
    res.json({
      message: 'Perfil de gamificação obtido com sucesso',
      profile
    });
  } catch (error) {
    console.error('Erro ao obter perfil de gamificação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/achievements - Listar todas as conquistas disponíveis
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('gamification.achievements')
      .lean();
    
    const resetAt = user.maintenance?.gamificationResetAt ? new Date(user.maintenance.gamificationResetAt) : null;
    const userUnlocked = (user.gamification.achievements || []).filter(a => {
      if ((a.id || a.achievementId) === 'consistent_reader') return false;
      if (!resetAt) return true;
      const unlocked = a.unlockedAt ? new Date(a.unlockedAt) : null;
      return unlocked && unlocked > resetAt;
    });
    const userAchievementIds = userUnlocked.map(a => a.id || a.achievementId);
    const available = Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: userAchievementIds.includes(achievement.id),
      unlockedAt: userUnlocked.find(a => (a.id || a.achievementId) === achievement.id)?.unlockedAt || null
    }));
    res.json({
      message: 'Conquistas listadas com sucesso',
      available,
      unlocked: userUnlocked
    });
  } catch (error) {
    console.error('Erro ao listar conquistas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/badges - Listar todas as badges disponíveis
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('gamification.badges')
      .lean();
    
    const resetAtB = user.maintenance?.gamificationResetAt ? new Date(user.maintenance.gamificationResetAt) : null;
    const userUnlocked = (user.gamification.badges || []).filter(b => {
      if (!resetAtB) return true;
      const earned = b.earnedAt ? new Date(b.earnedAt) : null;
      return earned && earned > resetAtB;
    });
    const userBadgeIds = userUnlocked.map(b => b.id || b.badgeId);
    const available = Object.values(BADGES).map(badge => ({
      ...badge,
      unlocked: userBadgeIds.includes(badge.id),
      unlockedAt: userUnlocked.find(b => (b.id || b.badgeId) === badge.id)?.earnedAt || null
    }));
    res.json({
      message: 'Badges listadas com sucesso',
      available,
      unlocked: userUnlocked
    });
  } catch (error) {
    console.error('Erro ao listar badges:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/gamification/check-achievements - Verificar e desbloquear conquistas
router.post('/check-achievements', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Buscar progresso de leitura do usuário
    const progress = await ReadingProgress.find({ user: req.user._id })
      .populate('book', 'genre difficulty')
      .lean();
    
    const unlockedAchievements = [];
    const unlockedBadges = [];
    
    // Verificar conquistas
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      const alreadyUnlocked = user.gamification.achievements.some(a => (a.id || a.achievementId) === achievement.id);
      
      if (!alreadyUnlocked && achievement.condition(user, progress)) {
        user.gamification.achievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          unlockedAt: new Date()
        });
        
        // Adicionar experiência
        await user.addExperience(achievement.experience);
        
        unlockedAchievements.push({
          ...achievement,
          experienceGained: achievement.experience
        });
      }
    }
    
    // Verificar badges
    for (const badge of Object.values(BADGES)) {
      const alreadyUnlocked = user.gamification.badges.some(b => (b.id || b.badgeId) === badge.id);
      
      if (!alreadyUnlocked && badge.condition(user, progress)) {
        user.gamification.badges.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date()
        });
        
        unlockedBadges.push(badge);
      }
    }
    
    await user.save();
    
    res.json({
      message: 'Verificação de conquistas concluída',
      newAchievements: unlockedAchievements,
      newBadges: unlockedBadges,
      experience: unlockedAchievements.reduce((sum, a) => sum + a.experienceGained, 0)
    });
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    user.gamification.experience = 0;
    user.gamification.level = 1;
    user.gamification.achievements = [];
    user.gamification.badges = [];
    user.gamification.streak.current = 0;
    user.gamification.streak.longest = 0;
    user.gamification.streak.lastReadDate = null;
    await user.save();
    res.json({ message: 'Gamificação resetada', profile: user.gamification });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/reset-all', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const users = await User.find({});
    for (const user of users) {
      user.gamification.experience = 0;
      user.gamification.level = 1;
      user.gamification.achievements = [];
      user.gamification.badges = [];
      user.gamification.streak.current = 0;
      user.gamification.streak.longest = 0;
      user.gamification.streak.lastReadDate = null;
      await user.save();
    }
    res.json({ message: 'Gamificação resetada para todos os usuários', total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/leaderboard - Obter ranking de usuários
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { type = 'experience', limit = 10 } = req.query;
    
    let sortField;
    switch (type) {
      case 'experience':
        sortField = { 'gamification.experience': -1 };
        break;
      case 'level':
        sortField = { 'gamification.level': -1, 'gamification.experience': -1 };
        break;
      case 'books':
        // Para livros completados, precisamos fazer uma agregação
        const bookLeaderboard = await ReadingProgress.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$user', booksCompleted: { $sum: 1 } } },
          { $sort: { booksCompleted: -1 } },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: '$user._id',
              name: '$user.name',
              level: '$user.gamification.level',
              experience: '$user.gamification.experience',
              booksCompleted: 1
            }
          }
        ]);
        
        // Adicionar posição do usuário atual
        const userPosition = bookLeaderboard.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;
        
        return res.json({
          message: 'Ranking obtido com sucesso',
          leaderboard: bookLeaderboard,
          userPosition: userPosition || null,
          type
        });
      default:
        sortField = { 'gamification.experience': -1 };
    }
    
    const leaderboard = await User.find({ isActive: true })
      .select('name gamification.level gamification.experience gamification.streak')
      .sort(sortField)
      .limit(parseInt(limit))
      .lean();
    
    // Adicionar posição do usuário atual se não estiver no top
    let userPosition = leaderboard.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;
    
    if (userPosition === 0) {
      // Usuário não está no top, buscar sua posição
      const userRank = await User.countDocuments({
        isActive: true,
        $or: [
          { 'gamification.experience': { $gt: req.user.gamification.experience } },
          {
            'gamification.experience': req.user.gamification.experience,
            _id: { $lt: req.user._id }
          }
        ]
      });
      userPosition = userRank + 1;
    }
    
    res.json({
      message: 'Ranking obtido com sucesso',
      leaderboard,
      userPosition,
      type
    });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/stats - Obter estatísticas gerais de gamificação
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('gamification')
      .lean();
    
    const progress = await ReadingProgress.find({ user: req.user._id })
      .populate('book', 'genre difficulty')
      .lean();
    
    // Calcular estatísticas
    const stats = {
      level: user.gamification.level,
      experience: user.gamification.experience,
      expToNextLevel: Math.max(0, ((user.gamification.level + 1) * 100) - user.gamification.experience),
      achievementsUnlocked: user.gamification.achievements.length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      badgesUnlocked: user.gamification.badges.length,
      totalBadges: Object.keys(BADGES).length,
      currentStreak: user.gamification.streak.current,
      longestStreak: user.gamification.streak.longest,
      booksCompleted: progress.filter(p => p.status === 'completed').length,
      totalReadingTime: progress.reduce((sum, p) => sum + p.totalReadingTime, 0),
      averageReadingTime: progress.length > 0 
        ? Math.round(progress.reduce((sum, p) => sum + p.totalReadingTime, 0) / progress.length)
        : 0,
      favoriteGenre: null,
      hardestBookCompleted: null
    };
    
    // Calcular gênero favorito
    const genreCount = {};
    progress.forEach(p => {
      if (p.book && p.book.genre) {
        genreCount[p.book.genre] = (genreCount[p.book.genre] || 0) + 1;
      }
    });
    
    if (Object.keys(genreCount).length > 0) {
      stats.favoriteGenre = Object.keys(genreCount).reduce((a, b) => 
        genreCount[a] > genreCount[b] ? a : b
      );
    }
    
    // Encontrar livro mais difícil completado
    const completedBooks = progress.filter(p => p.status === 'completed' && p.book);
    const hardBooks = completedBooks.filter(p => p.book.difficulty === 'hard');
    if (hardBooks.length > 0) {
      stats.hardestBookCompleted = 'hard';
    } else {
      const mediumBooks = completedBooks.filter(p => p.book.difficulty === 'medium');
      if (mediumBooks.length > 0) {
        stats.hardestBookCompleted = 'medium';
      } else if (completedBooks.length > 0) {
        stats.hardestBookCompleted = 'easy';
      }
    }
    
    res.json({
      message: 'Estatísticas obtidas com sucesso',
      stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/gamification/admin/award-achievement - Conceder conquista manualmente (apenas bibliotecários)
router.post('/admin/award-achievement', authenticateToken, requireLibrarian, [
  body('userId')
    .notEmpty()
    .isMongoId()
    .withMessage('ID do usuário é obrigatório e deve ser válido'),
  body('achievementId')
    .notEmpty()
    .withMessage('ID da conquista é obrigatório'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Motivo deve ser texto')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { userId, achievementId, reason } = req.body;
    
    // Verificar se a conquista existe
    const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
    if (!achievement) {
      return res.status(404).json({ message: 'Conquista não encontrada' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar se o usuário já possui a conquista
    const alreadyUnlocked = user.gamification.achievements.some(a => a.achievementId === achievement.id);
    if (alreadyUnlocked) {
      return res.status(400).json({ message: 'Usuário já possui esta conquista' });
    }
    
    // Conceder conquista
    user.gamification.achievements.push({
      achievementId: achievement.id,
      unlockedAt: new Date(),
      awardedBy: req.user._id,
      reason: reason || 'Concedida manualmente por bibliotecário'
    });
    
    // Adicionar experiência
    await user.addExperience(achievement.experience);
    
    res.json({
      message: 'Conquista concedida com sucesso',
      achievement: {
        ...achievement,
        experienceGained: achievement.experience
      }
    });
  } catch (error) {
    console.error('Erro ao conceder conquista:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/gamification/admin/stats - Estatísticas gerais de gamificação (apenas bibliotecários)
router.get('/admin/stats', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    // Estatísticas gerais
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersWithAchievements = await User.countDocuments({ 
      isActive: true,
      'gamification.achievements.0': { $exists: true }
    });
    
    // Distribuição por nível
    const levelDistribution = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$gamification.level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Conquistas mais comuns
    const achievementStats = await User.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$gamification.achievements' },
      { $group: { _id: '$gamification.achievements.achievementId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Top usuários por experiência
    const topUsers = await User.find({ isActive: true })
      .select('name gamification.level gamification.experience')
      .sort({ 'gamification.experience': -1 })
      .limit(5)
      .lean();
    
    const stats = {
      totalUsers,
      usersWithAchievements,
      achievementEngagement: Math.round((usersWithAchievements / totalUsers) * 100),
      levelDistribution,
      achievementStats: achievementStats.map(stat => ({
        achievementId: stat._id,
        name: ACHIEVEMENTS[stat._id.toUpperCase()]?.name || stat._id,
        count: stat.count,
        percentage: Math.round((stat.count / totalUsers) * 100)
      })),
      topUsers
    };
    
    res.json({
      message: 'Estatísticas administrativas obtidas com sucesso',
      stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas administrativas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
