const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['user', 'librarian'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    age: {
      type: Number,
      min: 8,
      max: 120
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: 500
    },
    favoriteGenres: [{
      type: String,
      enum: ['fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'self-help', 'young-adult', 'children']
    }],
    readingLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    dailyReadingGoal: {
      type: Number,
      default: 30, // minutos
      min: 5,
      max: 120
    }
  },
  gamification: {
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastReadDate: {
        type: Date,
        default: null
      }
    },
    achievements: [{
      id: String,
      name: String,
      description: String,
      unlockedAt: {
        type: Date,
        default: Date.now
      }
    }],
    badges: [{
      id: String,
      name: String,
      icon: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  statistics: {
    totalBooksRead: {
      type: Number,
      default: 0
    },
    totalReadingTime: {
      type: Number,
      default: 0 // em minutos
    },
    averageRating: {
      type: Number,
      default: 0
    },
    booksStarted: {
      type: Number,
      default: 0
    },
    booksCompleted: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notifications: {
      dailyReminder: {
        type: Boolean,
        default: true
      },
      achievementUnlocked: {
        type: Boolean,
        default: true
      },
      newBookRecommendation: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showReadingProgress: {
        type: Boolean,
        default: true
      },
      showAchievements: {
        type: Boolean,
        default: true
      }
    }
  }
  , maintenance: {
    gamificationResetApplied: {
      type: Boolean,
      default: false
    },
    streakRemoved: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para calcular nível baseado na experiência
userSchema.methods.calculateLevel = function() {
  // Cada nível requer 100 pontos de experiência a mais que o anterior
  // Nível 1: 0-99, Nível 2: 100-299, Nível 3: 300-599, etc.
  const level = Math.floor(Math.sqrt(this.gamification.experience / 100)) + 1;
  return Math.max(1, level);
};

// Método para adicionar experiência
userSchema.methods.addExperience = function(points) {
  this.gamification.experience += points;
  this.gamification.level = this.calculateLevel();
};

// Método para atualizar streak de leitura
userSchema.methods.updateReadingStreak = function() {
  const today = new Date();
  const lastRead = this.gamification.streak.lastReadDate;
  
  if (!lastRead) {
    // Primeira leitura
    this.gamification.streak.current = 1;
    this.gamification.streak.lastReadDate = today;
  } else {
    const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Leitura consecutiva
      this.gamification.streak.current += 1;
      this.gamification.streak.lastReadDate = today;
      
      if (this.gamification.streak.current > this.gamification.streak.longest) {
        this.gamification.streak.longest = this.gamification.streak.current;
      }
    } else if (daysDiff > 1) {
      // Streak quebrado
      this.gamification.streak.current = 1;
      this.gamification.streak.lastReadDate = today;
    }
    // Se daysDiff === 0, já leu hoje, não faz nada
  }
};

// Remover senha do JSON de resposta
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
