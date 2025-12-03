const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const ReadingProgress = require('../models/ReadingProgress');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/dashboard - Dashboard administrativo
router.get('/dashboard', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Estatísticas gerais
    const totalUsers = await User.countDocuments({ userType: 'user', isActive: true });
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalChapters = await Chapter.countDocuments({ isActive: true });
    const pendingBooks = await Book.countDocuments({ isActive: true, isApproved: false });

    // Usuários ativos (leram nos últimos 7 dias)
    const activeUsers = await User.countDocuments({
      userType: 'user',
      isActive: true,
      'gamification.streak.lastReadDate': { $gte: sevenDaysAgo }
    });

    // Novos usuários (últimos 30 dias)
    const newUsers = await User.countDocuments({
      userType: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Livros mais lidos (últimos 30 dias)
    const popularBooks = await ReadingProgress.aggregate([
      {
        $match: {
          startedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$book',
          readers: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      {
        $unwind: '$bookInfo'
      },
      {
        $match: {
          'bookInfo.isActive': true
        }
      },
      {
        $sort: { readers: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          title: '$bookInfo.title',
          author: '$bookInfo.author',
          readers: 1,
          completions: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completions', '$readers'] },
              100
            ]
          }
        }
      }
    ]);

    // Distribuição por gênero
    const genreDistribution = await Book.aggregate([
      {
        $match: { isActive: true, isApproved: true }
      },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Top usuários por pontos
    const topUsers = await User.find({
      userType: 'user',
      isActive: true
    })
    .select('name gamification.totalPoints gamification.level')
    .sort({ 'gamification.totalPoints': -1 })
    .limit(5);

    // Atividade recente (últimos 7 dias)
    const recentActivity = await ReadingProgress.aggregate([
      {
        $match: {
          lastReadAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastReadAt'
            }
          },
          activeUsers: { $addToSet: '$user' },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $addFields: {
          activeUsersCount: { $size: '$activeUsers' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      message: 'Dashboard obtido com sucesso',
      dashboard: {
        overview: {
          totalUsers,
          totalBooks,
          totalChapters,
          pendingBooks,
          activeUsers,
          newUsers,
          activeUserPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
        },
        popularBooks,
        genreDistribution: genreDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topUsers: topUsers.map((user, index) => ({
          position: index + 1,
          name: user.name,
          level: user.gamification.level,
          totalPoints: user.gamification.totalPoints
        })),
        recentActivity: recentActivity.map(day => ({
          date: day._id,
          activeUsers: day.activeUsersCount,
          totalSessions: day.totalSessions
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/users - Gerenciar usuários
router.get('/users', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    let filters = { userType: 'user' };

    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filters)
      .select('name email age isActive createdAt gamification')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filters);

    // Enriquecer com estatísticas de leitura
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const readingStats = await ReadingProgress.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: null,
              totalBooks: { $sum: 1 },
              completedBooks: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              totalReadingTime: { $sum: '$timeSpent.total' },
              averageProgress: { $avg: '$progress.percentage' }
            }
          }
        ]);

        const stats = readingStats[0] || {
          totalBooks: 0,
          completedBooks: 0,
          totalReadingTime: 0,
          averageProgress: 0
        };

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          isActive: user.isActive,
          createdAt: user.createdAt,
          gamification: {
            level: user.gamification.level,
            totalPoints: user.gamification.totalPoints,
            currentStreak: user.gamification.streak.current
          },
          readingStats: {
            totalBooks: stats.totalBooks,
            completedBooks: stats.completedBooks,
            totalReadingTime: Math.round(stats.totalReadingTime),
            averageProgress: Math.round(stats.averageProgress || 0),
            completionRate: stats.totalBooks > 0 ? 
              Math.round((stats.completedBooks / stats.totalBooks) * 100) : 0
          }
        };
      })
    );

    res.json({
      message: 'Usuários obtidos com sucesso',
      users: enrichedUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/admin/users/:userId/toggle-status - Ativar/desativar usuário
router.put('/users/:userId/toggle-status', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user || user.userType !== 'user') {
      return res.status(404).json({
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Não permitir desativar a própria conta
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Não é possível alterar o status da própria conta',
        error: 'CANNOT_MODIFY_SELF'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `Usuário ${user.isActive ? 'ativado' : 'desativado'} com sucesso`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/books/pending - Livros pendentes de aprovação
router.get('/books/pending', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pendingBooks = await Book.find({
      isActive: true,
      isApproved: false
    })
    .select('title author genre difficulty description cover createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Book.countDocuments({
      isActive: true,
      isApproved: false
    });

    // Adicionar contagem de capítulos para cada livro
    const enrichedBooks = await Promise.all(
      pendingBooks.map(async (book) => {
        const chapterCount = await Chapter.countDocuments({
          book: book._id,
          isActive: true
        });

        return {
          ...book.toObject(),
          chapterCount
        };
      })
    );

    res.json({
      message: 'Livros pendentes obtidos com sucesso',
      books: enrichedBooks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Erro ao obter livros pendentes:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/admin/books/:bookId/approve - Aprovar livro
router.put('/books/:bookId/approve', authenticateToken, requireLibrarian, [
  body('approved')
    .isBoolean()
    .withMessage('Campo "approved" deve ser booleano'),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Motivo da rejeição deve ter no máximo 500 caracteres')
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

    const { approved, rejectionReason } = req.body;

    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    if (approved) {
      book.isApproved = true;
      book.approvedAt = new Date();
      book.approvedBy = req.user._id;
    } else {
      book.isActive = false;
      book.rejectionReason = rejectionReason;
      book.rejectedAt = new Date();
      book.rejectedBy = req.user._id;
    }

    await book.save();

    res.json({
      message: `Livro ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        isApproved: book.isApproved,
        isActive: book.isActive,
        rejectionReason: book.rejectionReason
      }
    });

  } catch (error) {
    console.error('Erro ao aprovar/rejeitar livro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/reports/reading - Relatório de leitura
router.get('/reports/reading', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      genre,
      difficulty,
      format = 'summary' 
    } = req.query;

    // Definir período padrão (últimos 30 dias)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Construir filtros
    let bookFilters = { isActive: true, isApproved: true };
    if (genre) bookFilters.genre = genre;
    if (difficulty) bookFilters.difficulty = difficulty;

    // Buscar dados de leitura no período
    const readingData = await ReadingProgress.aggregate([
      {
        $match: {
          startedAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      {
        $unwind: '$bookInfo'
      },
      {
        $match: bookFilters
      },
      {
        $group: {
          _id: null,
          totalReads: { $sum: 1 },
          completedReads: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalReadingTime: { $sum: '$timeSpent.total' },
          uniqueReaders: { $addToSet: '$user' },
          genreBreakdown: {
            $push: '$bookInfo.genre'
          },
          difficultyBreakdown: {
            $push: '$bookInfo.difficulty'
          }
        }
      }
    ]);

    const data = readingData[0] || {
      totalReads: 0,
      completedReads: 0,
      totalReadingTime: 0,
      uniqueReaders: [],
      genreBreakdown: [],
      difficultyBreakdown: []
    };

    // Processar dados por gênero
    const genreStats = data.genreBreakdown.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    // Processar dados por dificuldade
    const difficultyStats = data.difficultyBreakdown.reduce((acc, difficulty) => {
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    // Relatório detalhado se solicitado
    let detailedData = null;
    if (format === 'detailed') {
      detailedData = await ReadingProgress.find({
        startedAt: { $gte: start, $lte: end }
      })
      .populate('user', 'name email')
      .populate('book', 'title author genre difficulty')
      .select('status progress timeSpent startedAt completedAt')
      .sort({ startedAt: -1 });
    }

    const report = {
      period: {
        start,
        end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalReads: data.totalReads,
        completedReads: data.completedReads,
        completionRate: data.totalReads > 0 ? 
          Math.round((data.completedReads / data.totalReads) * 100) : 0,
        uniqueReaders: data.uniqueReaders.length,
        totalReadingTime: Math.round(data.totalReadingTime),
        averageReadingTime: data.totalReads > 0 ? 
          Math.round(data.totalReadingTime / data.totalReads) : 0
      },
      breakdown: {
        byGenre: genreStats,
        byDifficulty: difficultyStats
      }
    };

    if (detailedData) {
      report.details = detailedData;
    }

    res.json({
      message: 'Relatório gerado com sucesso',
      report
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/admin/bulk-actions/users - Ações em lote para usuários
router.post('/bulk-actions/users', authenticateToken, requireLibrarian, [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('Lista de IDs de usuários é obrigatória'),
  body('userIds.*')
    .isMongoId()
    .withMessage('IDs de usuários inválidos'),
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Ação inválida')
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

    const { userIds, action } = req.body;

    // Verificar se não está tentando modificar a própria conta
    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({
        message: 'Não é possível executar ações em lote na própria conta',
        error: 'CANNOT_MODIFY_SELF'
      });
    }

    let updateQuery = {};
    let successMessage = '';

    switch (action) {
      case 'activate':
        updateQuery = { isActive: true };
        successMessage = 'Usuários ativados com sucesso';
        break;
      case 'deactivate':
        updateQuery = { isActive: false };
        successMessage = 'Usuários desativados com sucesso';
        break;
      case 'delete':
        // Soft delete - apenas desativar
        updateQuery = { isActive: false };
        successMessage = 'Usuários removidos com sucesso';
        break;
    }

    const result = await User.updateMany(
      { 
        _id: { $in: userIds },
        userType: 'user'
      },
      updateQuery
    );

    res.json({
      message: successMessage,
      result: {
        modifiedCount: result.modifiedCount,
        action
      }
    });

  } catch (error) {
    console.error('Erro em ação em lote:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/system/health - Status do sistema
router.get('/system/health', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'healthy',
        api: 'healthy'
      },
      statistics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    // Verificar conexão com banco de dados
    try {
      await User.findOne().limit(1);
      systemHealth.services.database = 'healthy';
    } catch (dbError) {
      systemHealth.services.database = 'unhealthy';
      systemHealth.status = 'degraded';
    }

    res.json({
      message: 'Status do sistema obtido com sucesso',
      health: systemHealth
    });

  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR',
      health: {
        status: 'unhealthy',
        timestamp: new Date()
      }
    });
  }
});

module.exports = router;