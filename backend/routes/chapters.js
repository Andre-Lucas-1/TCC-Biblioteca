const express = require('express');
const { body, validationResult } = require('express-validator');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

// GET /api/chapters/book/:bookId - Listar capítulos de um livro
router.get('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const chapters = await Chapter.find({ 
      book: bookId, 
      isActive: true 
    })
      .select('title chapterNumber summary estimatedReadingTime wordCount order metadata.difficulty')
      .sort({ order: 1, chapterNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Chapter.countDocuments({ 
      book: bookId, 
      isActive: true 
    });
    
    res.json({
      message: 'Capítulos listados com sucesso',
      chapters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar capítulos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/chapters/:id - Obter capítulo específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { page = 1, wordsPerPage = 500 } = req.query;
    const perPage = Math.max(100, Math.min(parseInt(wordsPerPage) || 500, 2000));
    const currentPage = Math.max(1, parseInt(page) || 1);

    const chapterDoc = await Chapter.findById(req.params.id)
      .populate('book', 'title author isActive isApproved');
    const chapter = chapterDoc;
    
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Verificar se o usuário tem acesso ao livro
    if (!chapter.book.isActive || !chapter.book.isApproved) {
      if (req.user.userType !== 'librarian') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }
    
    // Verificar se o capítulo está ativo
    if (!chapter.isActive && req.user.userType !== 'librarian') {
      return res.status(403).json({ message: 'Capítulo não disponível' });
    }
    
    // Buscar progresso de leitura do usuário para este livro
    const readingProgress = await ReadingProgress.findOne({
      user: req.user._id,
      book: chapter.book._id
    });
    
    // Adicionar informações de progresso
    chapter.userProgress = {
      isRead: readingProgress ? readingProgress.chaptersRead.includes(chapter._id) : false,
      isCompleted: readingProgress ? readingProgress.chaptersCompleted.includes(chapter._id) : false
    };
    
    // Buscar capítulos anterior e próximo
    const previousChapter = await chapter.getPreviousChapter();
    const nextChapter = await chapter.getNextChapter();

    // Paginação de conteúdo por palavras
    const words = chapter.content.trim().split(/\s+/);
    const totalPages = Math.max(1, Math.ceil(words.length / perPage));
    const startIdx = (currentPage - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, words.length);
    const contentPage = words.slice(startIdx, endIdx).join(' ');
    
    chapter.navigation = {
      previous: previousChapter ? {
        _id: previousChapter._id,
        title: previousChapter.title,
        chapterNumber: previousChapter.chapterNumber
      } : null,
      next: nextChapter ? {
        _id: nextChapter._id,
        title: nextChapter.title,
        chapterNumber: nextChapter.chapterNumber
      } : null
    };
    
    const payload = chapter.toObject();
    payload.content = contentPage;
    payload.pagination = { page: currentPage, totalPages, wordsPerPage: perPage };
    res.json({
      message: 'Capítulo obtido com sucesso',
      chapter: payload
    });
  } catch (error) {
    console.error('Erro ao obter capítulo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/chapters - Criar novo capítulo (apenas bibliotecários)
router.post('/', authenticateToken, requireLibrarian, [
  body('book')
    .notEmpty()
    .isMongoId()
    .withMessage('ID do livro é obrigatório e deve ser válido'),
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título é obrigatório e deve ter até 200 caracteres'),
  body('chapterNumber')
    .isInt({ min: 1 })
    .withMessage('Número do capítulo deve ser um inteiro positivo'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Conteúdo é obrigatório'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resumo deve ter até 1000 caracteres'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ordem deve ser um inteiro positivo'),
  body('metadata.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard'),
  body('metadata.keywords')
    .optional()
    .isArray()
    .withMessage('Palavras-chave devem ser um array'),
  body('metadata.themes')
    .optional()
    .isArray()
    .withMessage('Temas devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    // Verificar se o livro existe
    const book = await Book.findById(req.body.book);
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    // Verificar se já existe um capítulo com o mesmo número
    const existingChapter = await Chapter.findOne({
      book: req.body.book,
      chapterNumber: req.body.chapterNumber
    });
    
    if (existingChapter) {
      return res.status(400).json({ 
        message: 'Já existe um capítulo com este número neste livro' 
      });
    }
    
    // Se não foi especificada uma ordem, usar o próximo número disponível
    if (!req.body.order) {
      const lastChapter = await Chapter.findOne({ book: req.body.book })
        .sort({ order: -1 })
        .select('order');
      req.body.order = lastChapter ? lastChapter.order + 1 : 1;
    }
    
    const chapter = new Chapter({
      ...req.body,
      createdBy: req.user._id
    });
    
    await chapter.save();
    
    // Atualizar total de capítulos no livro
    await Book.findByIdAndUpdate(req.body.book, {
      $inc: { totalChapters: 1 }
    });
    
    await chapter.populate('book', 'title author');
    
    res.status(201).json({
      message: 'Capítulo criado com sucesso',
      chapter
    });
  } catch (error) {
    console.error('Erro ao criar capítulo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/chapters/:id - Atualizar capítulo (apenas bibliotecários)
router.put('/:id', authenticateToken, requireLibrarian, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter até 200 caracteres'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Conteúdo não pode estar vazio'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resumo deve ter até 1000 caracteres'),
  body('chapterNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número do capítulo deve ser um inteiro positivo'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ordem deve ser um inteiro positivo'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Status ativo deve ser booleano'),
  body('metadata.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard'),
  body('metadata.keywords')
    .optional()
    .isArray()
    .withMessage('Palavras-chave devem ser um array'),
  body('metadata.themes')
    .optional()
    .isArray()
    .withMessage('Temas devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Se está mudando o número do capítulo, verificar se não há conflito
    if (req.body.chapterNumber && req.body.chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({
        book: chapter.book,
        chapterNumber: req.body.chapterNumber,
        _id: { $ne: chapter._id }
      });
      
      if (existingChapter) {
        return res.status(400).json({ 
          message: 'Já existe um capítulo com este número neste livro' 
        });
      }
    }
    
    // Atualizar capítulo
    Object.assign(chapter, req.body);
    chapter.updatedAt = new Date();
    
    await chapter.save();
    await chapter.populate('book', 'title author');
    
    res.json({
      message: 'Capítulo atualizado com sucesso',
      chapter
    });
  } catch (error) {
    console.error('Erro ao atualizar capítulo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/chapters/:id - Excluir capítulo (apenas bibliotecários)
router.delete('/:id', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Soft delete - apenas desativar
    chapter.isActive = false;
    chapter.updatedAt = new Date();
    await chapter.save();
    
    // Atualizar total de capítulos no livro
    await Book.findByIdAndUpdate(chapter.book, {
      $inc: { totalChapters: -1 }
    });
    
    res.json({
      message: 'Capítulo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir capítulo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/chapters/:id/questions - Adicionar pergunta ao capítulo
router.post('/:id/questions', authenticateToken, requireLibrarian, [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Pergunta é obrigatória'),
  body('options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Deve haver entre 2 e 6 opções'),
  body('correctAnswer')
    .isInt({ min: 0 })
    .withMessage('Resposta correta deve ser um índice válido'),
  body('explanation')
    .optional()
    .isString()
    .withMessage('Explicação deve ser texto'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Dificuldade deve ser easy, medium ou hard')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Verificar se o índice da resposta correta é válido
    if (req.body.correctAnswer >= req.body.options.length) {
      return res.status(400).json({ 
        message: 'Índice da resposta correta é inválido' 
      });
    }
    
    const question = {
      question: req.body.question,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      explanation: req.body.explanation || '',
      difficulty: req.body.difficulty || 'medium'
    };
    
    await chapter.addQuestion(question);
    
    res.status(201).json({
      message: 'Pergunta adicionada com sucesso',
      question
    });
  } catch (error) {
    console.error('Erro ao adicionar pergunta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/chapters/:id/answer - Responder pergunta do capítulo
router.post('/:id/answer', authenticateToken, [
  body('questionIndex')
    .isInt({ min: 0 })
    .withMessage('Índice da pergunta deve ser um inteiro não negativo'),
  body('answer')
    .isInt({ min: 0 })
    .withMessage('Resposta deve ser um inteiro não negativo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    const { questionIndex, answer } = req.body;
    
    // Validar resposta
    const result = await chapter.validateAnswer(questionIndex, answer);
    
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    
    // Salvar resultado no progresso de leitura
    let readingProgress = await ReadingProgress.findOne({
      user: req.user._id,
      book: chapter.book
    });
    
    if (!readingProgress) {
      readingProgress = new ReadingProgress({
        user: req.user._id,
        book: chapter.book
      });
    }
    
    await readingProgress.addQuizResult(chapter._id, {
      questionIndex,
      userAnswer: answer,
      isCorrect: result.isCorrect,
      timeSpent: req.body.timeSpent || 0
    });
    
    // Adicionar experiência se a resposta estiver correta
    if (result.isCorrect) {
      const experienceGained = chapter.questions[questionIndex].difficulty === 'hard' ? 15 : 
                              chapter.questions[questionIndex].difficulty === 'medium' ? 10 : 5;
      
      await req.user.addExperience(experienceGained);
      await req.user.save();
    }
    
    res.json({
      message: result.isCorrect ? 'Resposta correta!' : 'Resposta incorreta',
      isCorrect: result.isCorrect,
      explanation: chapter.questions[questionIndex].explanation,
      experienceGained: result.isCorrect ? 
        (chapter.questions[questionIndex].difficulty === 'hard' ? 15 : 
         chapter.questions[questionIndex].difficulty === 'medium' ? 10 : 5) : 0
    });
  } catch (error) {
    console.error('Erro ao responder pergunta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/chapters/:id/read - Marcar capítulo como lido
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo não encontrado' });
    }
    
    // Buscar ou criar progresso de leitura
    let readingProgress = await ReadingProgress.findOne({
      user: req.user._id,
      book: chapter.book
    });
    
    if (!readingProgress) {
      readingProgress = new ReadingProgress({
        user: req.user._id,
        book: chapter.book
      });
    }
    
    // Marcar capítulo como lido
    await readingProgress.markChapterAsRead(chapter._id);
    
    // Adicionar experiência
    const experienceGained = 10;
    await req.user.addExperience(experienceGained);
    await req.user.save();
    
    // Atualizar estatísticas do capítulo
    await chapter.updateStatistics('read');
    
    res.json({
      message: 'Capítulo marcado como lido',
      experienceGained,
      progress: readingProgress.progressPercentage
    });
  } catch (error) {
    console.error('Erro ao marcar capítulo como lido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
