const express = require('express');
const { body, validationResult } = require('express-validator');
const ReadingProgress = require('../models/ReadingProgress');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrLibrarian } = require('../middleware/auth');

const router = express.Router();

// GET /api/progress - Obter progresso de leitura do usuário logado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filters = { user: req.user._id };
    if (status) filters.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const progress = await ReadingProgress.find(filters)
      .populate('book', 'title author coverImage genre difficulty totalChapters')
      .sort({ lastReadAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ReadingProgress.countDocuments(filters);
    
    res.json({
      message: 'Progresso obtido com sucesso',
      progress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao obter progresso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/progress/book/:bookId - Obter progresso específico de um livro
router.get('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const progress = await ReadingProgress.findOne({
      user: req.user._id,
      book: req.params.bookId
    })
      .populate('book', 'title author coverImage genre difficulty totalChapters')
      .populate('chaptersRead', 'title chapterNumber')
      .populate('chaptersCompleted', 'title chapterNumber')
      .lean();
    
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    // Buscar informações dos capítulos
    const chapters = await Chapter.find({ 
      book: req.params.bookId, 
      isActive: true 
    })
      .select('title chapterNumber order')
      .sort({ order: 1, chapterNumber: 1 })
      .lean();
    
    // Adicionar status de leitura para cada capítulo
    const chaptersWithStatus = chapters.map(chapter => ({
      ...chapter,
      isRead: progress.chaptersRead.some(c => c._id.toString() === chapter._id.toString()),
      isCompleted: progress.chaptersCompleted.some(c => c._id.toString() === chapter._id.toString())
    }));
    
    progress.chaptersWithStatus = chaptersWithStatus;
    
    res.json({
      message: 'Progresso do livro obtido com sucesso',
      progress
    });
  } catch (error) {
    console.error('Erro ao obter progresso do livro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/progress/start - Iniciar leitura de um livro
router.post('/start', authenticateToken, [
  body('bookId')
    .notEmpty()
    .isMongoId()
    .withMessage('ID do livro é obrigatório e deve ser válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const { bookId } = req.body;
    
    // Verificar se o livro existe e está ativo
    const book = await Book.findOne({ 
      _id: bookId, 
      isActive: true, 
      isApproved: true 
    });
    
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado ou não disponível' });
    }
    
    // Verificar se já existe progresso para este livro
    let progress = await ReadingProgress.findOne({
      user: req.user._id,
      book: bookId
    });
    
    if (progress) {
      // Se já existe, apenas atualizar status se necessário
      if (progress.status === 'not_started') {
        progress.status = 'reading';
        progress.startedAt = new Date();
        await progress.save();
      }
    } else {
      // Criar novo progresso
      progress = new ReadingProgress({
        user: req.user._id,
        book: bookId,
        status: 'reading',
        startedAt: new Date()
      });
      await progress.save();
    }
    
    await progress.populate('book', 'title author coverImage genre difficulty totalChapters');
    
    // Adicionar experiência por iniciar um livro
    await req.user.addExperience(5);
    
    res.status(201).json({
      message: 'Leitura iniciada com sucesso',
      progress,
      experienceGained: 5
    });
  } catch (error) {
    console.error('Erro ao iniciar leitura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/progress/:id/session/start - Iniciar sessão de leitura
router.put('/:id/session/start', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    await progress.startReadingSession();
    
    res.json({
      message: 'Sessão de leitura iniciada',
      sessionStartedAt: progress.currentSession.startedAt
    });
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/progress/:id/session/end - Finalizar sessão de leitura
router.put('/:id/session/end', authenticateToken, requireOwnershipOrLibrarian, [
  body('readingTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tempo de leitura deve ser um inteiro positivo (em minutos)'),
  body('pagesRead')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Páginas lidas deve ser um inteiro não negativo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const sessionData = {
      readingTime: req.body.readingTime,
      pagesRead: req.body.pagesRead || 0
    };
    
    await progress.endReadingSession(sessionData);
    
    // Adicionar experiência baseada no tempo de leitura
    const experienceGained = Math.floor((req.body.readingTime || 0) / 5); // 1 XP a cada 5 minutos
    if (experienceGained > 0) {
      await req.user.addExperience(experienceGained);
    }
    
    // Atualizar streak de leitura
    await req.user.updateReadingStreak();
    
    res.json({
      message: 'Sessão de leitura finalizada',
      sessionTime: req.body.readingTime || 0,
      experienceGained,
      totalReadingTime: progress.totalReadingTime
    });
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/progress/:id/chapter/:chapterId/complete - Marcar capítulo como completo
router.put('/:id/chapter/:chapterId/complete', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Verificar se o capítulo pertence ao livro
    if (chapter.book.toString() !== progress.book.toString()) {
      return res.status(400).json({ message: 'Capítulo não pertence a este livro' });
    }
    
    await progress.markChapterAsCompleted(req.params.chapterId);
    
    // Adicionar experiência por completar capítulo
    const experienceGained = 20;
    await req.user.addExperience(experienceGained);
    
    // Atualizar estatísticas do capítulo
    await chapter.updateStatistics('completed');
    
    // Verificar se o livro foi completado
    const book = await Book.findById(progress.book);
    const totalChapters = await Chapter.countDocuments({ 
      book: progress.book, 
      isActive: true 
    });
    
    let bookCompleted = false;
    if (progress.chaptersCompleted.length >= totalChapters) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      await progress.save();
      
      // Experiência extra por completar o livro
      await req.user.addExperience(100);
      bookCompleted = true;
    }
    
    res.json({
      message: bookCompleted ? 'Livro completado!' : 'Capítulo marcado como completo',
      experienceGained: bookCompleted ? experienceGained + 100 : experienceGained,
      progress: progress.progressPercentage,
      bookCompleted
    });
  } catch (error) {
    console.error('Erro ao marcar capítulo como completo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/progress/:id/status - Atualizar status do progresso
router.put('/:id/status', authenticateToken, requireOwnershipOrLibrarian, [
  body('status')
    .isIn(['reading', 'paused', 'completed', 'abandoned'])
    .withMessage('Status deve ser: reading, paused, completed ou abandoned')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const oldStatus = progress.status;
    progress.status = req.body.status;
    
    // Definir data de conclusão se necessário
    if (req.body.status === 'completed' && oldStatus !== 'completed') {
      progress.completedAt = new Date();
      // Adicionar experiência por completar o livro
      await req.user.addExperience(100);
    } else if (req.body.status === 'abandoned' && oldStatus !== 'abandoned') {
      progress.abandonedAt = new Date();
    }
    
    await progress.save();
    
    res.json({
      message: 'Status atualizado com sucesso',
      progress,
      experienceGained: (req.body.status === 'completed' && oldStatus !== 'completed') ? 100 : 0
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/progress/:id/favorite - Adicionar/remover dos favoritos
router.post('/:id/favorite', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const isFavorited = progress.isFavorited;
    await progress.toggleFavorite();
    
    res.json({
      message: isFavorited ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('Erro ao alterar favorito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/progress/:id/note - Adicionar nota
router.post('/:id/note', authenticateToken, requireOwnershipOrLibrarian, [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Nota é obrigatória e deve ter até 1000 caracteres'),
  body('chapterId')
    .optional()
    .isMongoId()
    .withMessage('ID do capítulo deve ser válido'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um inteiro positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const note = {
      content: req.body.content,
      chapterId: req.body.chapterId,
      page: req.body.page
    };
    
    await progress.addNote(note);
    
    res.status(201).json({
      message: 'Nota adicionada com sucesso',
      note
    });
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/progress/:id/notes - Obter notas do progresso
router.get('/:id/notes', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const progress = await ReadingProgress.findById(req.params.id)
      .populate('notes.chapterId', 'title chapterNumber')
      .select('notes')
      .lean();
    
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    res.json({
      message: 'Notas obtidas com sucesso',
      notes: progress.notes
    });
  } catch (error) {
    console.error('Erro ao obter notas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/progress/:id/note/:noteId - Excluir nota
router.delete('/:id/note/:noteId', authenticateToken, requireOwnershipOrLibrarian, async (req, res) => {
  try {
    const progress = await ReadingProgress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progresso não encontrado' });
    }
    
    const noteIndex = progress.notes.findIndex(note => 
      note._id.toString() === req.params.noteId
    );
    
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }
    
    progress.notes.splice(noteIndex, 1);
    await progress.save();
    
    res.json({
      message: 'Nota excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/progress/stats/summary - Obter resumo das estatísticas de leitura
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Buscar todos os progressos do usuário
    const allProgress = await ReadingProgress.find({ user: userId })
      .populate('book', 'genre difficulty')
      .lean();
    
    // Calcular estatísticas
    const stats = {
      totalBooks: allProgress.length,
      booksCompleted: allProgress.filter(p => p.status === 'completed').length,
      booksReading: allProgress.filter(p => p.status === 'reading').length,
      booksPaused: allProgress.filter(p => p.status === 'paused').length,
      booksAbandoned: allProgress.filter(p => p.status === 'abandoned').length,
      totalReadingTime: allProgress.reduce((sum, p) => sum + p.totalReadingTime, 0),
      averageProgress: allProgress.length > 0 
        ? Math.round(allProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / allProgress.length)
        : 0,
      favoriteGenres: {},
      readingByDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      readingStreak: req.user.gamification.streak.current,
      longestStreak: req.user.gamification.streak.longest,
      level: req.user.gamification.level,
      experience: req.user.gamification.experience
    };
    
    // Calcular distribuição por gênero e dificuldade
    allProgress.forEach(progress => {
      if (progress.book) {
        // Gêneros
        if (progress.book.genre) {
          const genre = progress.book.genre;
          stats.favoriteGenres[genre] = (stats.favoriteGenres[genre] || 0) + 1;
        }
        
        // Dificuldade
        if (progress.book.difficulty) {
          stats.readingByDifficulty[progress.book.difficulty]++;
        }
      }
    });
    
    // Atividade dos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentProgress = allProgress.filter(p => 
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

module.exports = router;