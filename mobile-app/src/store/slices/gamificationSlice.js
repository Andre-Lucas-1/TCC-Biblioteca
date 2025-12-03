import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gamificationAPI } from '../../services/api';

// Async thunks
export const fetchGamificationProfile = createAsyncThunk(
  'gamification/fetchGamificationProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar perfil de gamificação'
      );
    }
  }
);

export const fetchAchievements = createAsyncThunk(
  'gamification/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getAchievements();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar conquistas'
      );
    }
  }
);

export const fetchBadges = createAsyncThunk(
  'gamification/fetchBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getBadges();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar badges'
      );
    }
  }
);

export const checkAchievements = createAsyncThunk(
  'gamification/checkAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.checkAchievements();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao verificar conquistas'
      );
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'gamification/fetchLeaderboard',
  async ({ type = 'experience', limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getLeaderboard({ type, limit });
      return { type, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar ranking'
      );
    }
  }
);

export const fetchGamificationStats = createAsyncThunk(
  'gamification/fetchGamificationStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar estatísticas de gamificação'
      );
    }
  }
);

const initialState = {
  // Perfil de gamificação
  profile: {
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    title: 'Leitor Iniciante',
    streak: {
      current: 0,
      longest: 0,
      lastReadDate: null,
    },
  },
  
  // Conquistas
  achievements: {
    available: [],
    unlocked: [],
    progress: {},
  },
  
  // Badges
  badges: {
    available: [],
    unlocked: [],
  },
  
  // Rankings
  leaderboards: {
    experience: [],
    level: [],
    streak: [],
    booksCompleted: [],
  },
  
  // Estatísticas
  stats: {
    totalExperience: 0,
    achievementsUnlocked: 0,
    badgesUnlocked: 0,
    currentRank: {
      experience: null,
      level: null,
      streak: null,
      booksCompleted: null,
    },
  },
  
  // Notificações de conquistas
  newAchievements: [],
  newBadges: [],
  experienceGained: 0,
  levelUp: false,
  
  // Estados de loading
  isLoading: false,
  isLoadingAchievements: false,
  isLoadingBadges: false,
  isLoadingLeaderboard: false,
  isLoadingStats: false,
  isCheckingAchievements: false,
  
  // Erros
  error: null,
  achievementsError: null,
  badgesError: null,
  leaderboardError: null,
  statsError: null,
  checkAchievementsError: null,
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.achievementsError = null;
      state.badgesError = null;
      state.leaderboardError = null;
      state.statsError = null;
      state.checkAchievementsError = null;
    },
    clearNotifications: (state) => {
      state.newAchievements = [];
      state.newBadges = [];
      state.experienceGained = 0;
      state.levelUp = false;
    },
    addExperience: (state, action) => {
      const experience = action.payload;
      const oldLevel = state.profile.level;
      
      state.profile.experience += experience;
      state.experienceGained += experience;
      
      // Calcular novo nível
      const newLevel = Math.floor(state.profile.experience / 100) + 1;
      if (newLevel > oldLevel) {
        state.profile.level = newLevel;
        state.levelUp = true;
        
        // Atualizar título baseado no nível
        if (newLevel >= 50) {
          state.profile.title = 'Mestre dos Livros';
        } else if (newLevel >= 25) {
          state.profile.title = 'Leitor Experiente';
        } else if (newLevel >= 10) {
          state.profile.title = 'Leitor Dedicado';
        } else if (newLevel >= 5) {
          state.profile.title = 'Leitor Ativo';
        }
      }
      
      // Calcular experiência para próximo nível
      state.profile.experienceToNextLevel = (newLevel * 100) - state.profile.experience;
    },
    updateStreak: (state, action) => {
      const { current, longest, lastReadDate } = action.payload;
      state.profile.streak = {
        current,
        longest: Math.max(longest, state.profile.streak.longest),
        lastReadDate,
      };
    },
    unlockAchievement: (state, action) => {
      const achievement = action.payload;
      
      // Verificar se já foi desbloqueada
      const alreadyUnlocked = state.achievements.unlocked.find(
        a => a.id === achievement.id
      );
      
      if (!alreadyUnlocked) {
        state.achievements.unlocked.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
        state.newAchievements.push(achievement);
        
        // Adicionar experiência da conquista
        if (achievement.experience) {
          state.profile.experience += achievement.experience;
          state.experienceGained += achievement.experience;
        }
      }
    },
    unlockBadge: (state, action) => {
      const badge = action.payload;
      
      // Verificar se já foi desbloqueado
      const alreadyUnlocked = state.badges.unlocked.find(
        b => b.id === badge.id
      );
      
      if (!alreadyUnlocked) {
        state.badges.unlocked.push({
          ...badge,
          unlockedAt: new Date().toISOString(),
        });
        state.newBadges.push(badge);
      }
    },
    updateAchievementProgress: (state, action) => {
      const { achievementId, progress } = action.payload;
      state.achievements.progress[achievementId] = progress;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch gamification profile
      .addCase(fetchGamificationProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGamificationProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = { ...state.profile, ...action.payload.profile };
        state.error = null;
      })
      .addCase(fetchGamificationProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch achievements
      .addCase(fetchAchievements.pending, (state) => {
        state.isLoadingAchievements = true;
        state.achievementsError = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.isLoadingAchievements = false;
        state.achievements.available = action.payload.available || [];
        state.achievements.unlocked = action.payload.unlocked || [];
        state.achievements.progress = action.payload.progress || {};
        state.achievementsError = null;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.isLoadingAchievements = false;
        state.achievementsError = action.payload;
      })
      
      // Fetch badges
      .addCase(fetchBadges.pending, (state) => {
        state.isLoadingBadges = true;
        state.badgesError = null;
      })
      .addCase(fetchBadges.fulfilled, (state, action) => {
        state.isLoadingBadges = false;
        state.badges.available = action.payload.available || [];
        state.badges.unlocked = action.payload.unlocked || [];
        state.badgesError = null;
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.isLoadingBadges = false;
        state.badgesError = action.payload;
      })
      
      // Check achievements
      .addCase(checkAchievements.pending, (state) => {
        state.isCheckingAchievements = true;
        state.checkAchievementsError = null;
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
        state.isCheckingAchievements = false;
        
        const { newAchievements, newBadges, experience } = action.payload;
        
        // Adicionar novas conquistas
        if (newAchievements && newAchievements.length > 0) {
          newAchievements.forEach(achievement => {
            const alreadyUnlocked = state.achievements.unlocked.find(
              a => a.id === achievement.id
            );
            if (!alreadyUnlocked) {
              state.achievements.unlocked.push({
                ...achievement,
                unlockedAt: new Date().toISOString(),
              });
              state.newAchievements.push(achievement);
            }
          });
        }
        
        // Adicionar novos badges
        if (newBadges && newBadges.length > 0) {
          newBadges.forEach(badge => {
            const alreadyUnlocked = state.badges.unlocked.find(
              b => b.id === badge.id
            );
            if (!alreadyUnlocked) {
              state.badges.unlocked.push({
                ...badge,
                unlockedAt: new Date().toISOString(),
              });
              state.newBadges.push(badge);
            }
          });
        }
        
        // Adicionar experiência
        if (experience > 0) {
          const oldLevel = state.profile.level;
          state.profile.experience += experience;
          state.experienceGained += experience;
          
          // Verificar level up
          const newLevel = Math.floor(state.profile.experience / 100) + 1;
          if (newLevel > oldLevel) {
            state.profile.level = newLevel;
            state.levelUp = true;
          }
          
          state.profile.experienceToNextLevel = (newLevel * 100) - state.profile.experience;
        }
        
        state.checkAchievementsError = null;
      })
      .addCase(checkAchievements.rejected, (state, action) => {
        state.isCheckingAchievements = false;
        state.checkAchievementsError = action.payload;
      })
      
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoadingLeaderboard = true;
        state.leaderboardError = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoadingLeaderboard = false;
        const { type, data } = action.payload;
        state.leaderboards[type] = data.leaderboard || [];
        
        // Atualizar ranking atual do usuário
        if (data.userRank) {
          state.stats.currentRank[type] = data.userRank;
        }
        
        state.leaderboardError = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.leaderboardError = action.payload;
      })
      
      // Fetch gamification stats
      .addCase(fetchGamificationStats.pending, (state) => {
        state.isLoadingStats = true;
        state.statsError = null;
      })
      .addCase(fetchGamificationStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = { ...state.stats, ...action.payload.stats };
        state.statsError = null;
      })
      .addCase(fetchGamificationStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.statsError = action.payload;
      });
  },
});

export const {
  clearError,
  clearNotifications,
  addExperience,
  updateStreak,
  unlockAchievement,
  unlockBadge,
  updateAchievementProgress,
} = gamificationSlice.actions;

// Selectors
export const selectGamificationProfile = (state) => state.gamification.profile;
export const selectAchievements = (state) => state.gamification.achievements;
export const selectBadges = (state) => state.gamification.badges;
export const selectLeaderboards = (state) => state.gamification.leaderboards;
export const selectGamificationStats = (state) => state.gamification.stats;
export const selectNewAchievements = (state) => state.gamification.newAchievements;
export const selectNewBadges = (state) => state.gamification.newBadges;
export const selectExperienceGained = (state) => state.gamification.experienceGained;
export const selectLevelUp = (state) => state.gamification.levelUp;
export const selectGamificationLoading = (state) => state.gamification.isLoading;
export const selectGamificationError = (state) => state.gamification.error;

// Computed selectors
export const selectUserLevel = (state) => state.gamification.profile.level;
export const selectUserExperience = (state) => state.gamification.profile.experience;
export const selectUserTitle = (state) => state.gamification.profile.title;
export const selectCurrentStreak = (state) => state.gamification.profile.streak.current;
export const selectLongestStreak = (state) => state.gamification.profile.streak.longest;
export const selectUnlockedAchievements = (state) => state.gamification.achievements.unlocked;
export const selectUnlockedBadges = (state) => state.gamification.badges.unlocked;
export const selectAchievementProgress = (achievementId) => (state) => 
  state.gamification.achievements.progress[achievementId] || 0;

export default gamificationSlice.reducer;