const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['not-started', 'reading', 'paused', 'completed', 'abandoned'],
    default: 'not-started'
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  chaptersRead: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  chaptersCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  startedAt: {
    type: Date,
    default: null
  },
  lastReadAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  totalReadingTime: {
    type: Number,
    default: 0 // em minutos
  },
  readingSessions: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true // em minutos
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    },
    wordsRead: {
      type: Number,
      default: 0
    }
  }],
  bookmarks: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    position: {
      type: Number,
      default: 0 // posição no texto do capítulo
    },
    note: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    position: {
      type: Number,
      default: 0
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizResults: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    answers: [{
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
      timeSpent: Number // em segundos
    }],
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statistics: {
    averageReadingSpeed: {
      type: Number,
      default: 0 // palavras por minuto
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    longestSession: {
      type: Number,
      default: 0 // em minutos
    },
    averageSessionTime: {
      type: Number,
      default: 0 // em minutos
    },
    streakDays: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices compostos
readingProgressSchema.index({ user: 1, book: 1 }, { unique: true });
readingProgressSchema.index({ user: 1, status: 1 });
readingProgressSchema.index({ book: 1, status: 1 });
readingProgressSchema.index({ lastReadAt: -1 });

// Middleware para atualizar timestamps
readingProgressSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'reading' && !this.startedAt) {
      this.startedAt = now;
    }
    
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
      this.progressPercentage = 100;
    }
    
    if (['reading', 'paused'].includes(this.status)) {
      this.lastReadAt = now;
    }
  }
  
  next();
});

// Método para iniciar sessão de leitura
readingProgressSchema.methods.startReadingSession = function(chapterId) {
  const session = {
    startTime: new Date(),
    chapter: chapterId
  };
  
  this.readingSessions.push(session);
  this.status = 'reading';
  this.currentChapter = chapterId;
  
  return session;
};

// Método para finalizar sessão de leitura
readingProgressSchema.methods.endReadingSession = function(wordsRead = 0) {
  const lastSession = this.readingSessions[this.readingSessions.length - 1];
  
  if (lastSession && !lastSession.endTime) {
    lastSession.endTime = new Date();
    lastSession.duration = Math.round((lastSession.endTime - lastSession.startTime) / (1000 * 60));
    lastSession.wordsRead = wordsRead;
    
    // Atualizar tempo total de leitura
    this.totalReadingTime += lastSession.duration;
    
    // Atualizar estatísticas
    this.updateStatistics();
  }
};

// Método para marcar capítulo como lido
readingProgressSchema.methods.markChapterAsRead = function(chapterId) {
  if (!this.chaptersRead.includes(chapterId)) {
    this.chaptersRead.push(chapterId);
  }
};

// Método para marcar capítulo como completo
readingProgressSchema.methods.markChapterAsCompleted = function(chapterId) {
  this.markChapterAsRead(chapterId);
  
  if (!this.chaptersCompleted.includes(chapterId)) {
    this.chaptersCompleted.push(chapterId);
  }
  
  // Atualizar progresso percentual
  this.updateProgressPercentage();
};

// Método para atualizar progresso percentual
readingProgressSchema.methods.updateProgressPercentage = async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  
  if (book && book.totalChapters > 0) {
    this.progressPercentage = Math.round((this.chaptersCompleted.length / book.totalChapters) * 100);
    
    if (this.progressPercentage >= 100) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
};

// Método para adicionar bookmark
readingProgressSchema.methods.addBookmark = function(chapterId, position, note = '') {
  this.bookmarks.push({
    chapter: chapterId,
    position: position,
    note: note,
    createdAt: new Date()
  });
};

// Método para adicionar nota
readingProgressSchema.methods.addNote = function(chapterId, content, position = 0, isPrivate = true) {
  this.notes.push({
    chapter: chapterId,
    content: content,
    position: position,
    isPrivate: isPrivate,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

// Método para registrar resultado do quiz
readingProgressSchema.methods.addQuizResult = function(chapterId, score, totalQuestions, correctAnswers, answers) {
  this.quizResults.push({
    chapter: chapterId,
    score: score,
    totalQuestions: totalQuestions,
    correctAnswers: correctAnswers,
    answers: answers,
    completedAt: new Date()
  });
};

// Método para atualizar estatísticas
readingProgressSchema.methods.updateStatistics = function() {
  const sessions = this.readingSessions.filter(s => s.endTime);
  
  if (sessions.length > 0) {
    // Total de sessões
    this.statistics.totalSessions = sessions.length;
    
    // Sessão mais longa
    this.statistics.longestSession = Math.max(...sessions.map(s => s.duration));
    
    // Tempo médio de sessão
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    this.statistics.averageSessionTime = Math.round(totalTime / sessions.length);
    
    // Velocidade média de leitura
    const totalWords = sessions.reduce((sum, s) => sum + (s.wordsRead || 0), 0);
    if (totalTime > 0) {
      this.statistics.averageReadingSpeed = Math.round(totalWords / totalTime);
    }
  }
};

// Virtual para obter progresso em dias
readingProgressSchema.virtual('readingDays').get(function() {
  if (!this.startedAt) return 0;
  
  const now = new Date();
  const diffTime = Math.abs(now - this.startedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);