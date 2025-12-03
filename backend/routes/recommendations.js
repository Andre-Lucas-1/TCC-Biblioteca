const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const User = require('../models/User');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// Algoritmo de recomendação baseado em conteúdo
const getContentBasedRecommendations = async (userId, limit = 10) => {
  try {
    // Buscar histórico de leitura do usuário
    const userProgress = await ReadingProgress.find({ 
      user: userId,
      status: { $in: ['completed', 'reading'] }
    })
      .populate('book', 'genre tags difficulty author')
      .lean();
    
    if (userProgress.length === 0) {
      // Se não há histórico, recomendar livros populares para iniciantes
      return await Book.find({ 
        isActive: true, 
        isApproved: true,
        difficulty: 'easy'
      })
        .sort({ 'statistics.totalReaders': -1 })
        .limit(limit)
        .select('title author genre difficulty coverImage description tags statistics')
        .lean();
    }
    
    // Analisar preferências do usuário
    const genrePreferences = {};
    const tagPreferences = {};
    const authorPreferences = {};
    const difficultyPreferences = {};
    
    userProgress.forEach(progress => {
      if (progress.book) {
        const book = progress.book;
        const weight = progress.status === 'completed' ? 2 : 1;
        
        // Gêneros
        if (book.genre) {
          genrePreferences[book.genre] = (genrePreferences[book.genre] || 0) + weight;
        }
        
        // Tags
        if (book.tags && book.tags.length > 0) {
          book.tags.forEach(tag => {
            tagPreferences[tag] = (tagPreferences[tag] || 0) + weight;
          });
        }
        
        // Autores
        if (book.author) {
          authorPreferences[book.author] = (authorPreferences[book.author] || 0) + weight;
        }
        
        // Dificuldade
        if (book.difficulty) {
          difficultyPreferences[book.difficulty] = (difficultyPreferences[book.difficulty] || 0) + weight;
        }
      }
    });
    
    // Livros já lidos pelo usuário
    const readBookIds = userProgress.map(p => p.book._id.toString());
    
    // Buscar livros candidatos
    const candidateBooks = await Book.find({
      _id: { $nin: readBookIds },
      isActive: true,
      isApproved: true
    })
      .select('title author genre difficulty coverImage description tags statistics')
      .lean();
    
    // Calcular pontuação para cada livro
    const scoredBooks = candidateBooks.map(book => {
      let score = 0;
      
      // Pontuação por gênero
      if (book.genre && genrePreferences[book.genre]) {
        score += genrePreferences[book.genre] * 3;
      }
      
      // Pontuação por tags
      if (book.tags && book.tags.length > 0) {
        book.tags.forEach(tag => {
          if (tagPreferences[tag]) {
            score += tagPreferences[tag] * 2;
          }
        });
      }
      
      // Pontuação por autor
      if (book.author && authorPreferences[book.author]) {
        score += authorPreferences[book.author] * 4;
      }
      
      // Pontuação por dificuldade
      if (book.difficulty && difficultyPreferences[book.difficulty]) {
        score += difficultyPreferences[book.difficulty] * 1.5;
      }
      
      // Bonus por popularidade
      score += (book.statistics.totalReaders || 0) * 0.1;
      score += (book.statistics.averageRating || 0) * 0.5;
      
      return { ...book, recommendationScore: score };
    });
    
    // Ordenar por pontuação e retornar os melhores
    return scoredBooks
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Erro no algoritmo de recomendação por conteúdo:', error);
    throw error;
  }
};

// Algoritmo de filtragem colaborativa
const getCollaborativeRecommendations = async (userId, limit = 10) => {
  try {
    // Buscar usuários com gostos similares
    const userProgress = await ReadingProgress.find({ 
      user: userId,
      status: 'completed'
    })
      .select('book')
      .lean();
    
    if (userProgress.length === 0) {
      return [];
    }
    
    const userBooks = userProgress.map(p => p.book.toString());
    
    // Encontrar usuários que leram livros similares
    const similarUsers = await ReadingProgress.aggregate([
      {
        $match: {
          book: { $in: userBooks.map(id => require('mongoose').Types.ObjectId(id)) },
          user: { $ne: require('mongoose').Types.ObjectId(userId) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$user',
          commonBooks: { $sum: 1 },
          books: { $push: '$book' }
        }
      },
      {
        $match: {
          commonBooks: { $gte: Math.min(2, Math.floor(userBooks.length * 0.3)) }
        }
      },
      { $sort: { commonBooks: -1 } },
      { $limit: 20 }
    ]);
    
    if (similarUsers.length === 0) {
      return [];
    }
    
    // Buscar livros lidos por usuários similares
    const similarUserIds = similarUsers.map(u => u._id);
    const recommendedBooks = await ReadingProgress.aggregate([
      {
        $match: {
          user: { $in: similarUserIds },
          book: { $nin: userBooks.map(id => require('mongoose').Types.ObjectId(id)) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$book',
          recommendedBy: { $sum: 1 }
        }
      },
      { $sort: { recommendedBy: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $match: {
          'book.isActive': true,
          'book.isApproved': true
        }
      },
      {
        $project: {
          _id: '$book._id',
          title: '$book.title',
          author: '$book.author',
          genre: '$book.genre',
          difficulty: '$book.difficulty',
          coverImage: '$book.coverImage',
          description: '$book.description',
          tags: '$book.tags',
          statistics: '$book.statistics',
          recommendationScore: '$recommendedBy'
        }
      }
    ]);
    
    return recommendedBooks;
    
  } catch (error) {
    console.error('Erro no algoritmo de filtragem colaborativa:', error);
    throw error;
  }
};

// GET /api/recommendations - Obter recomendações personalizadas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type = 'mixed', limit = 10 } = req.query;
    const userId = req.user._id;
    
    let recommendations = [];
    
    switch (type) {
      case 'content':
        recommendations = await getContentBasedRecommendations(userId, parseInt(limit));
        break;
        
      case 'collaborative':
        recommendations = await getCollaborativeRecommendations(userId, parseInt(limit));
        break;
        
      case 'mixed':
      default:
        // Combinar ambos os algoritmos
        const contentRecs = await getContentBasedRecommendations(userId, Math.ceil(parseInt(limit) * 0.7));
        const collaborativeRecs = await getCollaborativeRecommendations(userId, Math.ceil(parseInt(limit) * 0.3));
        
        // Remover duplicatas e combinar
        const combinedRecs = [...contentRecs];
        const existingIds = new Set(contentRecs.map(book => book._id.toString()));
        
        collaborativeRecs.forEach(book => {
          if (!existingIds.has(book._id.toString())) {
            combinedRecs.push(book);
          }
        });
        
        recommendations = combinedRecs.slice(0, parseInt(limit));
        break;
    }
    
    // Adicionar motivo da recomendação
    const recommendationsWithReason = recommendations.map(book => {
      let reason = 'Recomendado para você';
      
      if (book.recommendationScore > 10) {
        reason = 'Baseado nos seus gostos';
      } else if (book.statistics && book.statistics.totalReaders > 100) {
        reason = 'Popular entre leitores';
      } else if (book.statistics && book.statistics.averageRating > 4) {
        reason = 'Bem avaliado';
      }
      
      return {
        ...book,
        recommendationReason: reason
      };
    });
    
    res.json({
      message: 'Recomendações obtidas com sucesso',
      recommendations: recommendationsWithReason,
      type,
      total: recommendationsWithReason.length
    });
  } catch (error) {
    console.error('Erro ao obter recomendações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/recommendations/trending - Livros em alta
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, period = 'week' } = req.query;
    
    // Calcular data de início baseada no período
    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Buscar livros mais lidos no período
    const trendingBooks = await ReadingProgress.aggregate([
      {
        $match: {
          startedAt: { $gte: startDate },
          status: { $in: ['reading', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$book',
          recentReaders: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { recentReaders: -1, completions: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $match: {
          'book.isActive': true,
          'book.isApproved': true
        }
      },
      {
        $project: {
          _id: '$book._id',
          title: '$book.title',
          author: '$book.author',
          genre: '$book.genre',
          difficulty: '$book.difficulty',
          coverImage: '$book.coverImage',
          description: '$book.description',
          tags: '$book.tags',
          statistics: '$book.statistics',
          trendingStats: {
            recentReaders: '$recentReaders',
            completions: '$completions'
          }
        }
      }
    ]);
    
    res.json({
      message: 'Livros em alta obtidos com sucesso',
      trending: trendingBooks,
      period,
      total: trendingBooks.length
    });
  } catch (error) {
    console.error('Erro ao obter livros em alta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/recommendations/similar/:bookId - Livros similares
router.get('/similar/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { limit = 5 } = req.query;
    
    // Buscar o livro de referência
    const referenceBook = await Book.findById(bookId)
      .select('genre tags author difficulty')
      .lean();
    
    if (!referenceBook) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    // Buscar livros similares
    const similarBooks = await Book.find({
      _id: { $ne: bookId },
      isActive: true,
      isApproved: true,
      $or: [
        { genre: referenceBook.genre },
        { author: referenceBook.author },
        { tags: { $in: referenceBook.tags || [] } },
        { difficulty: referenceBook.difficulty }
      ]
    })
      .select('title author genre difficulty coverImage description tags statistics')
      .lean();
    
    // Calcular pontuação de similaridade
    const scoredBooks = similarBooks.map(book => {
      let score = 0;
      
      // Mesmo gênero
      if (book.genre === referenceBook.genre) score += 3;
      
      // Mesmo autor
      if (book.author === referenceBook.author) score += 4;
      
      // Mesma dificuldade
      if (book.difficulty === referenceBook.difficulty) score += 2;
      
      // Tags em comum
      if (book.tags && referenceBook.tags) {
        const commonTags = book.tags.filter(tag => referenceBook.tags.includes(tag));
        score += commonTags.length * 1.5;
      }
      
      // Bonus por popularidade
      score += (book.statistics.averageRating || 0) * 0.3;
      
      return { ...book, similarityScore: score };
    });
    
    // Ordenar por similaridade e retornar os melhores
    const recommendations = scoredBooks
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, parseInt(limit));
    
    res.json({
      message: 'Livros similares obtidos com sucesso',
      similar: recommendations,
      referenceBook: {
        _id: referenceBook._id,
        title: referenceBook.title,
        author: referenceBook.author,
        genre: referenceBook.genre
      },
      total: recommendations.length
    });
  } catch (error) {
    console.error('Erro ao obter livros similares:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/recommendations/by-genre/:genre - Recomendações por gênero
router.get('/by-genre/:genre', authenticateToken, async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 10, difficulty, sortBy = 'rating' } = req.query;
    
    const filters = {
      genre: genre,
      isActive: true,
      isApproved: true
    };
    
    if (difficulty) {
      filters.difficulty = difficulty;
    }
    
    // Definir ordenação
    let sortOptions = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { 'statistics.averageRating': -1, 'statistics.totalReaders': -1 };
        break;
      case 'popularity':
        sortOptions = { 'statistics.totalReaders': -1, 'statistics.averageRating': -1 };
        break;
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { 'statistics.averageRating': -1 };
    }
    
    const books = await Book.find(filters)
      .select('title author genre difficulty coverImage description tags statistics createdAt')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      message: `Recomendações de ${genre} obtidas com sucesso`,
      books,
      genre,
      filters: { difficulty, sortBy },
      total: books.length
    });
  } catch (error) {
    console.error('Erro ao obter recomendações por gênero:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/recommendations/for-level - Recomendações baseadas no nível do usuário
router.get('/for-level', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userLevel = req.user.gamification.level;
    
    // Determinar dificuldade baseada no nível
    let recommendedDifficulties = [];
    if (userLevel <= 5) {
      recommendedDifficulties = ['easy', 'medium'];
    } else if (userLevel <= 15) {
      recommendedDifficulties = ['medium', 'hard'];
    } else {
      recommendedDifficulties = ['medium', 'hard'];
    }
    
    // Buscar livros adequados ao nível
    const books = await Book.find({
      difficulty: { $in: recommendedDifficulties },
      isActive: true,
      isApproved: true
    })
      .select('title author genre difficulty coverImage description tags statistics')
      .sort({ 'statistics.averageRating': -1, 'statistics.totalReaders': -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Adicionar motivo da recomendação
    const booksWithReason = books.map(book => ({
      ...book,
      recommendationReason: `Adequado para seu nível (${userLevel})`
    }));
    
    res.json({
      message: 'Recomendações por nível obtidas com sucesso',
      books: booksWithReason,
      userLevel,
      recommendedDifficulties,
      total: booksWithReason.length
    });
  } catch (error) {
    console.error('Erro ao obter recomendações por nível:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/recommendations/feedback - Feedback sobre recomendação
router.post('/feedback', authenticateToken, [
  body('bookId')
    .notEmpty()
    .isMongoId()
    .withMessage('ID do livro é obrigatório e deve ser válido'),
  body('helpful')
    .isBoolean()
    .withMessage('Feedback deve ser booleano'),
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
    
    const { bookId, helpful, reason } = req.body;
    
    // Verificar se o livro existe
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    // Salvar feedback (aqui você pode implementar um modelo específico para feedback)
    // Por enquanto, vamos apenas registrar no log
    console.log('Feedback de recomendação:', {
      userId: req.user._id,
      bookId,
      helpful,
      reason,
      timestamp: new Date()
    });
    
    res.json({
      message: 'Feedback registrado com sucesso',
      feedback: { helpful, reason }
    });
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/recommendations/admin/stats - Estatísticas de recomendações (apenas bibliotecários)
router.get('/admin/stats', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    // Livros mais recomendados
    const mostRecommended = await ReadingProgress.aggregate([
      {
        $match: {
          status: { $in: ['reading', 'completed'] },
          startedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 dias
        }
      },
      {
        $group: {
          _id: '$book',
          starts: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { starts: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          title: '$book.title',
          author: '$book.author',
          genre: '$book.genre',
          starts: 1,
          completions: 1,
          completionRate: {
            $cond: [
              { $gt: ['$starts', 0] },
              { $multiply: [{ $divide: ['$completions', '$starts'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    // Gêneros mais populares
    const popularGenres = await ReadingProgress.aggregate([
      {
        $match: {
          startedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: '$book.genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Taxa de engajamento por dificuldade
    const engagementByDifficulty = await ReadingProgress.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: '$book.difficulty',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          abandoned: {
            $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          difficulty: '$_id',
          total: 1,
          completed: 1,
          abandoned: 1,
          completionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
              0
            ]
          },
          abandonmentRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$abandoned', '$total'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    const stats = {
      mostRecommended,
      popularGenres,
      engagementByDifficulty,
      period: 'Últimos 30 dias'
    };
    
    res.json({
      message: 'Estatísticas de recomendações obtidas com sucesso',
      stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de recomendações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;