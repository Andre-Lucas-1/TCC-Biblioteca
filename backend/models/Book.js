const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  genre: {
    type: String,
    required: true,
    enum: ['fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'self-help', 'young-adult', 'children']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  coverImage: {
    type: String,
    default: null
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  publishedYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  language: {
    type: String,
    default: 'portuguese'
  },
  // Campo usado apenas para override de idioma no índice de texto do MongoDB
  textLanguage: {
    type: String,
    default: 'portuguese'
  },
  estimatedReadingTime: {
    type: Number,
    required: true,
    min: 10 // em minutos
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Campos para livros externos
  isExternal: {
    type: Boolean,
    default: false
  },
  externalId: {
    type: String,
    sparse: true
  },
  source: {
    type: String,
    enum: ['openlibrary', 'googlebooks', 'gutendex'],
    default: null
  },
  publishedDate: {
    type: String,
    default: null
  },
  pageCount: {
    type: Number,
    min: 1,
    default: null
  },
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
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
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    averageReadingTime: {
      type: Number,
      default: 0 // em minutos
    }
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingLevel: {
      type: String,
      enum: ['elementary', 'middle', 'high', 'college'],
      default: 'middle'
    },
    themes: [{
      type: String,
      trim: true
    }],
    ageRating: {
      type: String,
      enum: ['all-ages', '8+', '12+', '16+', '18+'],
      default: 'all-ages'
    }
  }
}, {
  timestamps: true
});

// Índices para melhor performance
bookSchema.index(
  { title: 'text', author: 'text', description: 'text' },
  { default_language: 'portuguese', language_override: 'textLanguage' }
);
bookSchema.index({ genre: 1, difficulty: 1 });
bookSchema.index({ isActive: 1, isApproved: 1 });
bookSchema.index({ 'statistics.averageRating': -1 });
bookSchema.index({ createdAt: -1 });

// Middleware para atualizar estatísticas
bookSchema.methods.updateRatingStats = function() {
  if (this.ratings.length === 0) {
    this.statistics.averageRating = 0;
    this.statistics.totalRatings = 0;
    return;
  }
  
  const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  this.statistics.averageRating = Number((totalRating / this.ratings.length).toFixed(1));
  this.statistics.totalRatings = this.ratings.length;
};

// Método para adicionar avaliação
bookSchema.methods.addRating = function(userId, rating, review = '') {
  // Remover avaliação anterior do mesmo usuário
  this.ratings = this.ratings.filter(r => !r.user.equals(userId));
  
  // Adicionar nova avaliação
  this.ratings.push({
    user: userId,
    rating: rating,
    review: review,
    createdAt: new Date()
  });
  
  // Atualizar estatísticas
  this.updateRatingStats();
};

// Método para obter avaliação de um usuário específico
bookSchema.methods.getUserRating = function(userId) {
  return this.ratings.find(r => r.user.equals(userId));
};

// Virtual para URL da capa
bookSchema.virtual('coverImageUrl').get(function() {
  if (this.coverImage) {
    return `/uploads/covers/${this.coverImage}`;
  }
  return '/images/default-book-cover.jpg';
});

// Método para calcular progresso médio de leitura
bookSchema.methods.calculateAverageProgress = async function() {
  const ReadingProgress = mongoose.model('ReadingProgress');
  
  const progressData = await ReadingProgress.aggregate([
    { $match: { book: this._id } },
    {
      $group: {
        _id: null,
        averageProgress: { $avg: '$progressPercentage' },
        totalReaders: { $sum: 1 },
        completedReaders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (progressData.length > 0) {
    this.statistics.totalReaders = progressData[0].totalReaders;
    this.statistics.completedReaders = progressData[0].completedReaders;
  }
};

module.exports = mongoose.model('Book', bookSchema);
