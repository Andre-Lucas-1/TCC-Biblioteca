const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: 1
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500
  },
  estimatedReadingTime: {
    type: Number,
    required: true,
    min: 1 // em minutos
  },
  wordCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    keyWords: [{
      type: String,
      trim: true
    }],
    themes: [{
      type: String,
      trim: true
    }],
    characterCount: {
      type: Number,
      default: 0
    }
  },
  questions: [{
    question: {
      type: String,
      required: true,
      maxlength: 300
    },
    options: [{
      text: {
        type: String,
        required: true,
        maxlength: 200
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    explanation: {
      type: String,
      maxlength: 500
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  statistics: {
    totalReaders: {
      type: Number,
      default: 0
    },
    completedReaders: {
      type: Number,
      default: 0
    },
    averageReadingTime: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices compostos para melhor performance
chapterSchema.index({ book: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ book: 1, order: 1 });
chapterSchema.index({ isActive: 1 });

// Middleware para calcular contagem de palavras e caracteres
chapterSchema.pre('validate', function(next) {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    this.metadata.characterCount = this.content.length;
    this.estimatedReadingTime = Math.max(1, Math.ceil(this.wordCount / 200));
  }
  next();
});

// Método para obter próximo capítulo
chapterSchema.methods.getNextChapter = async function() {
  return await this.constructor.findOne({
    book: this.book,
    order: this.order + 1,
    isActive: true
  }).sort({ order: 1 });
};

// Método para obter capítulo anterior
chapterSchema.methods.getPreviousChapter = async function() {
  return await this.constructor.findOne({
    book: this.book,
    order: this.order - 1,
    isActive: true
  }).sort({ order: -1 });
};

// Método para adicionar pergunta
chapterSchema.methods.addQuestion = function(questionData) {
  this.questions.push({
    question: questionData.question,
    options: questionData.options,
    explanation: questionData.explanation,
    difficulty: questionData.difficulty || 'medium'
  });
};

// Método para validar resposta
chapterSchema.methods.validateAnswer = function(questionIndex, selectedOptionIndex) {
  if (questionIndex >= this.questions.length) {
    throw new Error('Pergunta não encontrada');
  }
  
  const question = this.questions[questionIndex];
  if (selectedOptionIndex >= question.options.length) {
    throw new Error('Opção não encontrada');
  }
  
  const selectedOption = question.options[selectedOptionIndex];
  return {
    isCorrect: selectedOption.isCorrect,
    explanation: question.explanation,
    correctAnswer: question.options.findIndex(opt => opt.isCorrect)
  };
};

// Método para calcular estatísticas
chapterSchema.methods.updateStatistics = async function() {
  const ReadingProgress = mongoose.model('ReadingProgress');
  
  const stats = await ReadingProgress.aggregate([
    {
      $match: {
        book: this.book,
        'chaptersRead': { $in: [this._id] }
      }
    },
    {
      $group: {
        _id: null,
        totalReaders: { $sum: 1 },
        completedReaders: {
          $sum: {
            $cond: [
              { $in: [this._id, '$chaptersCompleted'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.statistics.totalReaders = stats[0].totalReaders;
    this.statistics.completedReaders = stats[0].completedReaders;
  }
};

// Virtual para progresso percentual
chapterSchema.virtual('progressPercentage').get(function() {
  if (this.statistics.totalReaders === 0) return 0;
  return Math.round((this.statistics.completedReaders / this.statistics.totalReaders) * 100);
});

module.exports = mongoose.model('Chapter', chapterSchema);
