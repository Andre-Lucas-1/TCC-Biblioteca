import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar perfil'
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao atualizar perfil'
      );
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updateUserPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await userAPI.updatePreferences(preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao atualizar preferências'
      );
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'user/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar estatísticas'
      );
    }
  }
);

export const fetchGoalsProgress = createAsyncThunk(
  'user/fetchGoalsProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getGoalsProgress();
      try { await AsyncStorage.setItem('cache:/users/goals-progress', JSON.stringify(response.data)); } catch {}
      return response.data;
    } catch (error) {
      try {
        const raw = await AsyncStorage.getItem('cache:/users/goals-progress');
        if (raw) {
          const cached = JSON.parse(raw);
          return cached;
        }
      } catch {}
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar progresso de metas');
    }
  }
);

export const fetchUserGoals = createAsyncThunk(
  'user/fetchUserGoals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getGoals();
      try { await AsyncStorage.setItem('cache:/users/goals', JSON.stringify(response.data)); } catch {}
      return response.data;
    } catch (error) {
      try {
        const raw = await AsyncStorage.getItem('cache:/users/goals');
        if (raw) {
          const cached = JSON.parse(raw);
          return cached;
        }
      } catch {}
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar metas');
    }
  }
);

export const createUserGoal = createAsyncThunk(
  'user/createUserGoal',
  async (goal, { rejectWithValue }) => {
    try {
      const response = await userAPI.createGoal(goal);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar meta');
    }
  }
);

export const updateUserGoal = createAsyncThunk(
  'user/updateUserGoal',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateGoal(id, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar meta');
    }
  }
);

export const deleteUserGoal = createAsyncThunk(
  'user/deleteUserGoal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userAPI.deleteGoal(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao excluir meta');
    }
  }
);

export const fetchUserAchievements = createAsyncThunk(
  'user/fetchUserAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getAchievements();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar conquistas'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await userAPI.changePassword({
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao alterar senha'
      );
    }
  }
);

const initialState = {
  // Dados do perfil
  profile: null,
  preferences: {
    theme: 'light',
    notifications: {
      reading: true,
      achievements: true,
      recommendations: true,
      challenges: true,
    },
    privacy: {
      showProfile: true,
      showProgress: true,
      showAchievements: true,
    },
    reading: {
      fontSize: 'medium',
      fontFamily: 'default',
      lineHeight: 'normal',
      backgroundColor: 'white',
      textColor: 'black',
    },
  },
  
  // Estatísticas
  stats: {
    totalBooksRead: 0,
    totalReadingTime: 0,
    booksRead: 0,
    readingTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteGenres: [],
    readingGoals: {
      daily: 30, // minutos
      weekly: 3, // livros
      monthly: 12, // livros
    },
    goalsProgress: {
      dailyMinutes: 0,
      weeklyBooks: 0,
      monthlyBooks: 0,
    },
  },
  goals: [],
  isLoadingGoals: false,
  goalsError: null,
  
  // Conquistas
  achievements: [],
  badges: [],
  
  // Estados de loading
  isLoading: false,
  isLoadingStats: false,
  isLoadingAchievements: false,
  isUpdatingProfile: false,
  isUpdatingPreferences: false,
  isChangingPassword: false,
  
  // Erros
  error: null,
  statsError: null,
  achievementsError: null,
  profileError: null,
  preferencesError: null,
  passwordError: null,
  
  // Mensagens de sucesso
  successMessage: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.statsError = null;
      state.achievementsError = null;
      state.profileError = null;
      state.preferencesError = null;
      state.passwordError = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    updateLocalPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateReadingGoals: (state, action) => {
      state.stats.readingGoals = { ...state.stats.readingGoals, ...action.payload };
    },
    incrementReadingTime: (state, action) => {
      state.stats.totalReadingTime += action.payload;
    },
    updateStreak: (state, action) => {
      state.stats.currentStreak = action.payload.current;
      if (action.payload.current > state.stats.longestStreak) {
        state.stats.longestStreak = action.payload.current;
      }
    },
    addAchievement: (state, action) => {
      const achievement = action.payload;
      const exists = state.achievements.find(a => a.id === achievement.id);
      if (!exists) {
        state.achievements.push(achievement);
      }
    },
    addBadge: (state, action) => {
      const badge = action.payload;
      const exists = state.badges.find(b => b.id === badge.id);
      if (!exists) {
        state.badges.push(badge);
      }
    },
    incrementBooksRead: (state) => {
      state.stats.booksRead = (state.stats.booksRead || 0) + 1;
      state.stats.totalBooksRead = (state.stats.totalBooksRead || 0) + 1;
    },
    addGoalLocal: (state, action) => {
      const g = action.payload.goal || action.payload;
      if (!g || !g._id) return;
      const exists = state.goals.some(x => x._id === g._id);
      if (!exists) {
        state.goals.unshift({ ...g, current: g.current || 0, percentage: g.percentage || 0 });
      }
    },
    removeGoalLocal: (state, action) => {
      const id = action.payload;
      state.goals = state.goals.filter(g => g._id !== id);
    },
    updateGoalsProgressLocal: (state, action) => {
      const { deltaDailyMinutes = 0, deltaWeeklyBooks = 0, deltaMonthlyBooks = 0 } = action.payload || {};
      state.stats.goalsProgress.dailyMinutes = (state.stats.goalsProgress.dailyMinutes || 0) + deltaDailyMinutes;
      state.stats.goalsProgress.weeklyBooks = (state.stats.goalsProgress.weeklyBooks || 0) + deltaWeeklyBooks;
      state.stats.goalsProgress.monthlyBooks = (state.stats.goalsProgress.monthlyBooks || 0) + deltaMonthlyBooks;
    },
    updateCustomGoalsProgressLocal: (state, action) => {
      const { dailyMinutes, weeklyBooks, monthlyBooks } = action.payload || {};
      state.goals = (state.goals || []).map(g => {
        let current = g.current || 0;
        if (g.type === 'minutes' && g.period === 'day' && typeof dailyMinutes === 'number') current = dailyMinutes;
        if (g.type === 'books' && g.period === 'week' && typeof weeklyBooks === 'number') current = weeklyBooks;
        if (g.type === 'books' && g.period === 'month' && typeof monthlyBooks === 'number') current = monthlyBooks;
        const target = g.target || 0;
        const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return { ...g, current, percentage };
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.user;
        if (action.payload.preferences) {
          state.preferences = { ...state.preferences, ...action.payload.preferences };
        }
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdatingProfile = true;
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.profile = { ...state.profile, ...action.payload.user };
        state.successMessage = 'Perfil atualizado com sucesso!';
        state.profileError = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.profileError = action.payload;
      })
      
      // Update user preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.isUpdatingPreferences = true;
        state.preferencesError = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isUpdatingPreferences = false;
        state.preferences = { ...state.preferences, ...action.payload.preferences };
        state.successMessage = 'Preferências atualizadas com sucesso!';
        state.preferencesError = null;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isUpdatingPreferences = false;
        state.preferencesError = action.payload;
      })
      
      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoadingStats = true;
        state.statsError = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = { ...state.stats, ...action.payload.stats };
        state.statsError = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.statsError = action.payload;
      })
      // Fetch goals progress
      .addCase(fetchGoalsProgress.pending, (state) => {
        state.isLoadingStats = true;
      })
      .addCase(fetchGoalsProgress.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats.goalsProgress = action.payload.progress || state.stats.goalsProgress;
      })
      .addCase(fetchGoalsProgress.rejected, (state) => {
        state.isLoadingStats = false;
      })
      .addCase(fetchUserGoals.pending, (state) => {
        state.isLoadingGoals = true;
        state.goalsError = null;
      })
      .addCase(fetchUserGoals.fulfilled, (state, action) => {
        state.isLoadingGoals = false;
        const remote = action.payload.goals || [];
        const byId = new Map(remote.map(g => [g._id, g]));
        state.goals.forEach(g => { if (!byId.has(g._id)) byId.set(g._id, g); });
        state.goals = Array.from(byId.values());
      })
      .addCase(fetchUserGoals.rejected, (state, action) => {
        state.isLoadingGoals = false;
        state.goalsError = action.payload;
      })
      .addCase(createUserGoal.fulfilled, (state, action) => {
        if (action.payload.goal) {
          const g = action.payload.goal;
          state.goals.unshift({ ...g, current: 0, percentage: 0 });
        }
      })
      .addCase(updateUserGoal.fulfilled, (state, action) => {
        const updated = action.payload.goal;
        if (!updated) return;
        const idx = state.goals.findIndex(g => g._id === updated._id);
        if (idx !== -1) state.goals[idx] = updated;
      })
      .addCase(deleteUserGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter(g => g._id !== action.payload.id);
      })
      
      // Fetch user achievements
      .addCase(fetchUserAchievements.pending, (state) => {
        state.isLoadingAchievements = true;
        state.achievementsError = null;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.isLoadingAchievements = false;
        state.achievements = action.payload.achievements || [];
        state.badges = action.payload.badges || [];
        state.achievementsError = null;
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.isLoadingAchievements = false;
        state.achievementsError = action.payload;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isChangingPassword = true;
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isChangingPassword = false;
        state.successMessage = 'Senha alterada com sucesso!';
        state.passwordError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isChangingPassword = false;
        state.passwordError = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  updateLocalPreferences,
  updateReadingGoals,
  incrementReadingTime,
  updateStreak,
  addAchievement,
  addBadge,
  incrementBooksRead,
  addGoalLocal,
  removeGoalLocal,
  updateGoalsProgressLocal,
  updateCustomGoalsProgressLocal,
} = userSlice.actions;

// Selectors
export const selectUserProfile = (state) => state.user.profile;
export const selectUserPreferences = (state) => state.user.preferences;
export const selectUserStats = (state) => state.user.stats;
export const selectUserAchievements = (state) => state.user.achievements;
export const selectUserBadges = (state) => state.user.badges;
export const selectUserLoading = (state) => state.user.isLoading;
export const selectUserError = (state) => state.user.error;
export const selectUserSuccessMessage = (state) => state.user.successMessage;
export const selectIsUpdatingProfile = (state) => state.user.isUpdatingProfile;
export const selectIsUpdatingPreferences = (state) => state.user.isUpdatingPreferences;
export const selectIsChangingPassword = (state) => state.user.isChangingPassword;

export default userSlice.reducer;
