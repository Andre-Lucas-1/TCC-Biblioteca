const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const ReadingProgress = require('../models/ReadingProgress');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// GET /api/books - Listar livros
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      genre, 
      difficulty, 
      author,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Construir filtros
    const filters = { isActive: true };
    
    // Apenas bibliotecários podem ver livros não aprovados
    if (req.user.userType !== 'librarian') {
      filters.isApproved = true;
    }
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (genre) filters.genre = genre;
    if (difficulty) filters.difficulty = difficulty;
    if (author) filters.author = { $regex: author, $options: 'i' };

    // Paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Book.find(filters)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Book.countDocuments(filters);

    res.json({
      message: 'Livros obtidos com sucesso',
      books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/books/:id - Obter livro específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');

    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    // Verificar se usuário comum pode ver o livro
    if (req.user.userType !== 'librarian' && (!book.isActive || !book.isApproved)) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    // Buscar capítulos do livro
    const chapters = await Chapter.find({ 
      book: req.params.id, 
      isActive: true 
    }).sort({ chapterNumber: 1 });

    res.json({
      message: 'Livro obtido com sucesso',
      book: {
        ...book.toObject(),
        chapters: chapters.map(chapter => ({
          _id: chapter._id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          estimatedReadingTime: chapter.estimatedReadingTime,
          wordCount: chapter.wordCount
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/books/:id/chapters - Alias para listar capítulos de um livro
router.get('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const chapters = await Chapter.find({ book: id, isActive: true })
      .select('title chapterNumber summary estimatedReadingTime wordCount order')
      .sort({ order: 1, chapterNumber: 1 })
      .lean();
    res.json({ message: 'Capítulos listados com sucesso', chapters });
  } catch (error) {
    console.error('Erro ao listar capítulos do livro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/books/add-to-library - Adicionar livro externo à biblioteca do usuário
router.post('/add-to-library', authenticateToken, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Autor deve ter entre 1 e 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('URL da capa deve ser válida'),
  body('isbn')
    .optional()
    .trim(),
  body('publishedDate')
    .optional()
    .trim(),
  body('pageCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de páginas deve ser um inteiro positivo'),
  body('language')
    .optional()
    .trim(),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categorias devem ser um array'),
  body('externalId')
    .optional()
    .trim(),
  body('source')
    .optional()
    .isIn(['openlibrary', 'googlebooks'])
    .withMessage('Fonte deve ser openlibrary ou googlebooks')
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

    const {
      title,
      author,
      description,
      coverImage,
      isbn,
      publishedDate,
      pageCount,
      language,
      categories,
      externalId,
      source
    } = req.body;

    // Verificar se o livro já existe na biblioteca do usuário
    let existingProgress = null;
    if (isbn) {
      const existingBook = await Book.findOne({ isbn, isActive: true });
      if (existingBook) {
        existingProgress = await ReadingProgress.findOne({
          user: req.user._id,
          book: existingBook._id
        });
        if (existingProgress) {
          return res.status(409).json({
            message: 'Livro já está na sua biblioteca',
            error: 'BOOK_ALREADY_IN_LIBRARY'
          });
        }
      }
    }

    // Criar ou encontrar o livro no sistema
    let book;
    if (isbn) {
      book = await Book.findOne({ isbn, isActive: true });
    }

    if (!book) {
      // Criar novo livro no sistema
      const bookData = {
        title,
        author,
        description: description || 'Descrição não disponível',
        coverImage,
        isbn,
        publishedDate,
        pageCount,
        language: language || 'pt',
        categories: categories || [],
        externalId,
        source,
        genre: 'fiction', // Padrão
        difficulty: 'intermediate', // Padrão
        estimatedReadingTime: pageCount ? Math.ceil(pageCount * 2) : 120, // 2 min por página
        createdBy: req.user._id,
        isApproved: true, // Livros externos são aprovados automaticamente
        isExternal: true // Marcar como livro externo
      };

      book = new Book(bookData);
      await book.save();
    }

    // Criar progresso de leitura para o usuário
    const progress = new ReadingProgress({
      user: req.user._id,
      book: book._id,
      status: 'not_started'
    });
    await progress.save();

    await progress.populate('book', 'title author coverImage genre difficulty');

    res.status(201).json({
      message: 'Livro adicionado à biblioteca com sucesso',
      book: progress.book,
      progress
    });

  } catch (error) {
    console.error('Erro ao adicionar livro à biblioteca:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Livro já existe no sistema',
        error: 'DUPLICATE_BOOK'
      });
    }

    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/books - Criar novo livro (apenas bibliotecários)
router.post('/', authenticateToken, requireLibrarian, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Autor deve ter entre 1 e 100 caracteres'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descrição deve ter entre 10 e 1000 caracteres'),
  body('genre')
    .isIn(['fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'self-help', 'young-adult', 'children'])
    .withMessage('Gênero inválido'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Dificuldade inválida'),
  body('estimatedReadingTime')
    .isInt({ min: 10 })
    .withMessage('Tempo estimado deve ser pelo menos 10 minutos')
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

    const bookData = {
      ...req.body,
      createdBy: req.user._id,
      approvedBy: req.user._id,
      isApproved: true
    };

    const book = new Book(bookData);
    await book.save();

    const populatedBook = await Book.findById(book._id)
      .populate('addedBy', 'name')
      .populate('approvedBy', 'name');

    res.status(201).json({
      message: 'Livro criado com sucesso',
      book: populatedBook
    });

  } catch (error) {
    console.error('Erro ao criar livro:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'ISBN já existe',
        error: 'DUPLICATE_ISBN'
      });
    }

    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/books/:id - Atualizar livro (apenas bibliotecários)
router.put('/:id', authenticateToken, requireLibrarian, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Autor deve ter entre 1 e 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descrição deve ter entre 10 e 1000 caracteres')
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

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    // Atualizar campos permitidos
    const allowedFields = [
      'title', 'author', 'description', 'genre', 'subGenres', 'cover',
      'isbn', 'publishedYear', 'publisher', 'language', 'difficulty',
      'estimatedReadingTime', 'tags', 'isActive', 'isApproved'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        book[key] = req.body[key];
      }
    });

    await book.save();

    const populatedBook = await Book.findById(book._id)
      .populate('addedBy', 'name')
      .populate('approvedBy', 'name');

    res.json({
      message: 'Livro atualizado com sucesso',
      book: populatedBook
    });

  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'ISBN já existe',
        error: 'DUPLICATE_ISBN'
      });
    }

    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/books/:id - Desativar livro (apenas bibliotecários)
router.delete('/:id', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    book.isActive = false;
    await book.save();

    // Desativar capítulos relacionados
    await Chapter.updateMany(
      { book: req.params.id },
      { isActive: false }
    );

    res.json({
      message: 'Livro desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar livro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/books/:id/rating - Avaliar livro
router.post('/:id/rating', authenticateToken, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser entre 1 e 5'),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Resenha não pode ter mais de 500 caracteres')
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

    const { rating, review } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    // Verificar se usuário completou o livro
    const progress = await ReadingProgress.findOne({
      user: req.user._id,
      book: req.params.id,
      status: 'completed'
    });

    if (!progress) {
      return res.status(400).json({
        message: 'Você precisa completar o livro para avaliá-lo',
        error: 'BOOK_NOT_COMPLETED'
      });
    }

    // Verificar se já avaliou
    if (progress.rating) {
      return res.status(400).json({
        message: 'Você já avaliou este livro',
        error: 'ALREADY_RATED'
      });
    }

    // Atualizar avaliação no progresso
    progress.rating = rating;
    if (review) progress.review = review;
    await progress.save();

    // Atualizar média do livro
    book.updateRating(rating);
    await book.save();

    res.json({
      message: 'Avaliação registrada com sucesso',
      book: {
        _id: book._id,
        title: book.title,
        rating: book.rating
      }
    });

  } catch (error) {
    console.error('Erro ao avaliar livro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/books/:id/stats - Estatísticas do livro (apenas bibliotecários)
router.get('/:id/stats', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        message: 'Livro não encontrado',
        error: 'BOOK_NOT_FOUND'
      });
    }

    // Buscar estatísticas de leitura
    const allProgress = await ReadingProgress.find({ book: req.params.id })
      .populate('user', 'name');

    const stats = {
      totalReaders: allProgress.length,
      completedReaders: allProgress.filter(p => p.status === 'completed').length,
      currentReaders: allProgress.filter(p => p.status === 'reading').length,
      averageProgress: 0,
      averageReadingTime: 0,
      averageCompletionTime: 0,
      ratings: book.rating,
      recentReaders: []
    };

    if (allProgress.length > 0) {
      // Calcular progresso médio
      stats.averageProgress = allProgress.reduce((sum, p) => sum + p.progress.percentage, 0) / allProgress.length;
      
      // Calcular tempo médio de leitura
      stats.averageReadingTime = allProgress.reduce((sum, p) => sum + p.timeSpent.total, 0) / allProgress.length;
      
      // Calcular tempo médio de conclusão (apenas para livros completados)
      const completedProgress = allProgress.filter(p => p.status === 'completed' && p.completedAt);
      if (completedProgress.length > 0) {
        const totalCompletionTime = completedProgress.reduce((sum, p) => {
          const days = Math.ceil((new Date(p.completedAt) - new Date(p.startedAt)) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        stats.averageCompletionTime = totalCompletionTime / completedProgress.length;
      }

      // Leitores recentes
      stats.recentReaders = allProgress
        .sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt))
        .slice(0, 10)
        .map(p => ({
          user: p.user,
          status: p.status,
          progress: p.progress.percentage,
          lastReadAt: p.lastReadAt
        }));
    }

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      stats
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do livro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
