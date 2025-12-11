const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const User = require('../models/User');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// Modelo para Desafios (inline para simplicidade)
const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['books_count', 'reading_time', 'genre_diversity', 'difficulty_challenge', 'streak', 'custom'],
    required: true
  },
  target: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['books', 'minutes', 'hours', 'days', 'genres', 'levels'],
      required: true
    }
  },
  criteria: {
    genres: [String],
    difficulties: [{
      type: String,
      enum: ['easy', 'medium', 'hard']
    }],
    minRating: {
      type: Number,
      min: 1,
      max: 5
    },
    timeFrame: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    customDuration: {
      type: Number, // em dias
      min: 1
    }
  },
  rewards: {
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    badge: {
      name: String,
      icon: String,
      color: String
    },
    title: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      current: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    abandoned: {
      type: Boolean,
      default: false
    },
    abandonedAt: Date
  }],
  statistics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    activeParticipants: {
      type: Number,
      default: 0
    },
    completedParticipants: {
      type: Number,
      default: 0
    },
    averageProgress: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Middleware para calcular estatísticas
challengeSchema.pre('save', function(next) {
  if (this.participants && this.participants.length > 0) {
    this.statistics.totalParticipants = this.participants.length;
    this.statistics.activeParticipants = this.participants.filter(p => !p.completed && !p.abandoned).length;
    this.statistics.completedParticipants = this.participants.filter(p => p.completed).length;
    
    const totalProgress = this.participants.reduce((sum, p) => sum + p.progress.percentage, 0);
    this.statistics.averageProgress = this.participants.length > 0 ? totalProgress / this.participants.length : 0;
    
    this.statistics.completionRate = this.participants.length > 0 
      ? (this.statistics.completedParticipants / this.participants.length) * 100 
      : 0;
  }
  next();
});

const Challenge = mongoose.model('Challenge', challengeSchema);

// GET /api/challenges - Listar desafios disponíveis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status = 'active', type, page = 1, limit = 10 } = req.query;
    
    const filters = { isActive: true };
    
    // Filtrar por status
    const now = new Date();
    switch (status) {
      case 'active':
        filters.startDate = { $lte: now };
        filters.endDate = { $gte: now };
        break;
      case 'upcoming':
        filters.startDate = { $gt: now };
        break;
      case 'ended':
        filters.endDate = { $lt: now };
        break;
    }
    
    if (type) filters.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const challenges = await Challenge.find(filters)
      .populate('createdBy', 'name')
      .select('-participants') // Não incluir participantes na listagem
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Verificar se o usuário está participando de cada desafio
    const challengesWithParticipation = await Promise.all(
      challenges.map(async (challenge) => {
        const participation = await Challenge.findById(challenge._id)
          .select('participants')
          .lean();
        
        const userParticipation = participation.participants.find(
          p => p.user.toString() === req.user._id.toString()
        );
        
        return {
          ...challenge,
          userParticipating: !!userParticipation,
          userProgress: userParticipation ? userParticipation.progress : null
        };
      })
    );
    
    const total = await Challenge.countDocuments(filters);
    
    res.json({
      message: 'Desafios listados com sucesso',
      challenges: challengesWithParticipation,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar desafios:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/challenges/:id - Obter detalhes de um desafio
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('participants.user', 'name gamification.level')
      .lean();
    
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Verificar se o usuário está participando
    const userParticipation = challenge.participants.find(
      p => p.user._id.toString() === req.user._id.toString()
    );
    
    // Ordenar participantes por progresso
    challenge.participants.sort((a, b) => b.progress.percentage - a.progress.percentage);
    
    // Adicionar ranking
    challenge.participants = challenge.participants.map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));
    
    res.json({
      message: 'Detalhes do desafio obtidos com sucesso',
      challenge: {
        ...challenge,
        userParticipating: !!userParticipation,
        userProgress: userParticipation ? userParticipation.progress : null,
        userRank: userParticipation ? challenge.participants.find(p => p.user._id.toString() === req.user._id.toString()).rank : null
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do desafio:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/challenges - Criar novo desafio (apenas bibliotecários)
router.post('/', authenticateToken, requireLibrarian, [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Título é obrigatório e deve ter até 200 caracteres'),
  body('description')
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Descrição é obrigatória e deve ter até 1000 caracteres'),
  body('type')
    .isIn(['books_count', 'reading_time', 'genre_diversity', 'difficulty_challenge', 'streak', 'custom'])
    .withMessage('Tipo de desafio inválido'),
  body('target.value')
    .isInt({ min: 1 })
    .withMessage('Valor da meta deve ser um inteiro positivo'),
  body('target.unit')
    .isIn(['books', 'minutes', 'hours', 'days', 'genres', 'levels'])
    .withMessage('Unidade da meta inválida'),
  body('startDate')
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  body('endDate')
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const challenge = new Challenge({
      ...req.body,
      createdBy: req.user._id
    });
    
    await challenge.save();
    await challenge.populate('createdBy', 'name');
    
    res.status(201).json({
      message: 'Desafio criado com sucesso',
      challenge
    });
  } catch (error) {
    console.error('Erro ao criar desafio:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/challenges/:id/join - Participar de um desafio
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Verificar se o desafio está ativo
    const now = new Date();
    if (now < challenge.startDate) {
      return res.status(400).json({ message: 'Desafio ainda não começou' });
    }
    
    if (now > challenge.endDate) {
      return res.status(400).json({ message: 'Desafio já terminou' });
    }
    
    // Verificar se o usuário já está participando
    const existingParticipation = challenge.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (existingParticipation) {
      return res.status(400).json({ message: 'Você já está participando deste desafio' });
    }
    
    // Adicionar participante
    challenge.participants.push({
      user: req.user._id,
      joinedAt: new Date()
    });
    
    await challenge.save();
    
    res.json({
      message: 'Você entrou no desafio com sucesso!',
      challenge: {
        _id: challenge._id,
        title: challenge.title,
        type: challenge.type,
        target: challenge.target
      }
    });
  } catch (error) {
    console.error('Erro ao entrar no desafio:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/challenges/:id/leave - Sair de um desafio
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Encontrar participação do usuário
    const participantIndex = challenge.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Você não está participando deste desafio' });
    }
    
    // Marcar como abandonado ao invés de remover
    challenge.participants[participantIndex].abandoned = true;
    challenge.participants[participantIndex].abandonedAt = new Date();
    
    await challenge.save();
    
    res.json({
      message: 'Você saiu do desafio'
    });
  } catch (error) {
    console.error('Erro ao sair do desafio:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/challenges/:id/progress - Atualizar progresso no desafio
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Encontrar participação do usuário
    const participantIndex = challenge.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Você não está participando deste desafio' });
    }
    
    const participant = challenge.participants[participantIndex];
    
    if (participant.completed || participant.abandoned) {
      return res.status(400).json({ message: 'Desafio já foi concluído ou abandonado' });
    }
    
    // Calcular progresso baseado no tipo de desafio
    let currentProgress = 0;
    
    switch (challenge.type) {
      case 'books_count':
        // Contar livros completados no período do desafio
        const completedBooks = await ReadingProgress.countDocuments({
          user: req.user._id,
          status: 'completed',
          completedAt: {
            $gte: challenge.startDate,
            $lte: challenge.endDate
          }
        });
        currentProgress = completedBooks;
        break;
        
      case 'reading_time':
        // Somar tempo de leitura no período
        const readingProgress = await ReadingProgress.find({
          user: req.user._id,
          lastReadAt: {
            $gte: challenge.startDate,
            $lte: challenge.endDate
          }
        }).select('totalReadingTime');
        
        currentProgress = readingProgress.reduce((sum, p) => sum + p.totalReadingTime, 0);
        if (challenge.target.unit === 'hours') {
          currentProgress = Math.floor(currentProgress / 60); // Converter minutos para horas
        }
        break;
        
      case 'genre_diversity':
        // Contar gêneros únicos lidos
        const genreBooks = await ReadingProgress.find({
          user: req.user._id,
          status: 'completed',
          completedAt: {
            $gte: challenge.startDate,
            $lte: challenge.endDate
          }
        }).populate('book', 'genre');
        
        const uniqueGenres = new Set();
        genreBooks.forEach(progress => {
          if (progress.book && progress.book.genre) {
            uniqueGenres.add(progress.book.genre);
          }
        });
        currentProgress = uniqueGenres.size;
        break;
        
      case 'streak':
        // Usar streak atual do usuário
        currentProgress = req.user.gamification.streak.current;
        break;
        
      default:
        currentProgress = participant.progress.current;
    }
    
    // Atualizar progresso
    participant.progress.current = currentProgress;
    participant.progress.percentage = Math.min(100, (currentProgress / challenge.target.value) * 100);
    participant.progress.lastUpdated = new Date();
    
    // Verificar se completou o desafio
    if (currentProgress >= challenge.target.value) {
      participant.completed = true;
      participant.completedAt = new Date();
      
      // Conceder recompensas
      if (challenge.rewards.experience > 0) {
        await req.user.addExperience(challenge.rewards.experience);
      }
      
      // Adicionar badge se especificado
      if (challenge.rewards.badge) {
        req.user.gamification.badges.push({
          badgeId: `challenge_${challenge._id}`,
          name: challenge.rewards.badge.name,
          unlockedAt: new Date()
        });
        await req.user.save();
      }
    }
    
    await challenge.save();
    
    res.json({
      message: participant.completed ? 'Parabéns! Desafio completado!' : 'Progresso atualizado',
      progress: participant.progress,
      completed: participant.completed,
      rewards: participant.completed ? challenge.rewards : null
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/challenges/my/active - Obter desafios ativos do usuário
router.get('/my/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    const challenges = await Challenge.find({
      'participants.user': req.user._id,
      'participants.completed': false,
      'participants.abandoned': false,
      startDate: { $lte: now },
      endDate: { $gte: now },
      isActive: true
    })
      .select('title description type target startDate endDate participants.$')
      .lean();
    
    // Extrair apenas o progresso do usuário
    const userChallenges = challenges.map(challenge => {
      const userParticipation = challenge.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );
      
      return {
        ...challenge,
        userProgress: userParticipation ? userParticipation.progress : null,
        participants: undefined // Remover dados de outros participantes
      };
    });
    
    res.json({
      message: 'Desafios ativos obtidos com sucesso',
      challenges: userChallenges
    });
  } catch (error) {
    console.error('Erro ao obter desafios ativos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/challenges/my/completed - Obter desafios completados pelo usuário
router.get('/my/completed', authenticateToken, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      'participants.user': req.user._id,
      'participants.completed': true
    })
      .select('title description type target rewards participants.$')
      .sort({ 'participants.completedAt': -1 })
      .lean();
    
    // Extrair apenas os dados do usuário
    const userCompletedChallenges = challenges.map(challenge => {
      const userParticipation = challenge.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );
      
      return {
        ...challenge,
        completedAt: userParticipation ? userParticipation.completedAt : null,
        participants: undefined
      };
    });
    
    res.json({
      message: 'Desafios completados obtidos com sucesso',
      challenges: userCompletedChallenges
    });
  } catch (error) {
    console.error('Erro ao obter desafios completados:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/challenges/leaderboard/:id - Ranking de um desafio específico
router.get('/leaderboard/:id', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.user', 'name gamification.level')
      .select('title participants')
      .lean();
    
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Filtrar apenas participantes ativos e ordenar por progresso
    const activeParticipants = challenge.participants
      .filter(p => !p.abandoned)
      .sort((a, b) => {
        // Primeiro por completado, depois por progresso, depois por data
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        if (a.progress.percentage !== b.progress.percentage) {
          return b.progress.percentage - a.progress.percentage;
        }
        return new Date(a.progress.lastUpdated) - new Date(b.progress.lastUpdated);
      })
      .map((participant, index) => ({
        rank: index + 1,
        user: participant.user,
        progress: participant.progress,
        completed: participant.completed,
        completedAt: participant.completedAt
      }));
    
    res.json({
      message: 'Ranking obtido com sucesso',
      challenge: {
        _id: challenge._id,
        title: challenge.title
      },
      leaderboard: activeParticipants
    });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/challenges/:id - Excluir desafio (apenas bibliotecários)
router.delete('/:id', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Desafio não encontrado' });
    }
    
    // Verificar se é o criador do desafio
    if (challenge.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Apenas o criador pode excluir o desafio' });
    }
    
    // Soft delete
    challenge.isActive = false;
    await challenge.save();
    
    res.json({
      message: 'Desafio excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir desafio:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;