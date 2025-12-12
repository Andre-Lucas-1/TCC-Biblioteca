import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { readingAPI } from '../../services/api';

// Async thunks
export const fetchReadingProgress = createAsyncThunk(
  'reading/fetchReadingProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await readingAPI.getProgress();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar progresso de leitura'
      );
    }
  }
);

export const fetchBookProgress = createAsyncThunk(
  'reading/fetchBookProgress',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.getBookProgress(bookId);
      return { bookId, progress: response.data.progress };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar progresso do livro'
      );
    }
  }
);

export const startReading = createAsyncThunk(
  'reading/startReading',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.startReading(bookId);
      return { bookId, progress: response.data.progress };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao iniciar leitura'
      );
    }
  }
);

export const startReadingSession = createAsyncThunk(
  'reading/startReadingSession',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.startSession(bookId);
      return { bookId, session: response.data.session };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao iniciar sessão de leitura'
      );
    }
  }
);

export const endReadingSession = createAsyncThunk(
  'reading/endReadingSession',
  async ({ bookId, sessionId, readingTime }, { rejectWithValue }) => {
    try {
      const response = await readingAPI.endSession(bookId, sessionId, { readingTime });
      return { bookId, session: response.data.session, progress: response.data.progress };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao finalizar sessão de leitura'
      );
    }
  }
);

export const markChapterComplete = createAsyncThunk(
  'reading/markChapterComplete',
  async ({ bookId, chapterId }, { rejectWithValue }) => {
    try {
      const response = await readingAPI.markChapterComplete(bookId, chapterId);
      return { 
        bookId, 
        chapterId, 
        progress: response.data.progress,
        experience: response.data.experience,
        achievements: response.data.achievements
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao marcar capítulo como completo'
      );
    }
  }
);

export const updateReadingStatus = createAsyncThunk(
  'reading/updateReadingStatus',
  async ({ bookId, status }, { rejectWithValue }) => {
    try {
      const response = await readingAPI.updateReadingStatus(bookId, status);
      return { bookId, progress: response.data.progress };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao atualizar status de leitura'
      );
    }
  }
);

export const addToFavorites = createAsyncThunk(
  'reading/addToFavorites',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.addToFavorites(bookId);
      return { bookId, favorites: response.data.favorites };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao adicionar aos favoritos'
      );
    }
  }
);

export const removeFromFavorites = createAsyncThunk(
  'reading/removeFromFavorites',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.removeFromFavorites(bookId);
      return { bookId, favorites: response.data.favorites };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao remover dos favoritos'
      );
    }
  }
);

export const addReadingNote = createAsyncThunk(
  'reading/addReadingNote',
  async ({ bookId, chapterId, note }, { rejectWithValue }) => {
    try {
      const response = await readingAPI.addNote(bookId, { chapterId, note });
      return { bookId, note: response.data.note };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao adicionar nota'
      );
    }
  }
);

export const fetchReadingNotes = createAsyncThunk(
  'reading/fetchReadingNotes',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await readingAPI.getNotes(bookId);
      return { bookId, notes: response.data.notes };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar notas'
      );
    }
  }
);

const initialState = {
  // Progresso geral
  overallProgress: {
    booksInProgress: [],
    booksCompleted: [],
    totalReadingTime: 0,
    currentStreak: 0,
    weeklyGoalProgress: 0,
  },
  
  // Progresso por livro
  bookProgress: {},
  
  // Sessões de leitura ativas
  activeSessions: {},
  
  // Favoritos
  favorites: [],
  
  // Notas de leitura
  readingNotes: {},
  
  // Estados de loading
  isLoading: false,
  isLoadingBookProgress: false,
  isStartingReading: false,
  isStartingSession: false,
  isEndingSession: false,
  isMarkingComplete: false,
  isUpdatingStatus: false,
  isAddingToFavorites: false,
  isRemovingFromFavorites: false,
  isAddingNote: false,
  isLoadingNotes: false,
  
  // Erros
  error: null,
  bookProgressError: null,
  sessionError: null,
  markCompleteError: null,
  statusError: null,
  favoritesError: null,
  notesError: null,
  
  // Mensagens de sucesso e conquistas
  successMessage: null,
  newAchievements: [],
  experienceGained: 0,
};

const readingSlice = createSlice({
  name: 'reading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.bookProgressError = null;
      state.sessionError = null;
      state.markCompleteError = null;
      state.statusError = null;
      state.favoritesError = null;
      state.notesError = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearNewAchievements: (state) => {
      state.newAchievements = [];
      state.experienceGained = 0;
    },
    updateLocalReadingTime: (state, action) => {
      const { bookId, timeSpent } = action.payload;
      if (state.bookProgress[bookId]) {
        state.bookProgress[bookId].totalReadingTime += timeSpent;
      }
      state.overallProgress.totalReadingTime += timeSpent;
    },
    setActiveSession: (state, action) => {
      const { bookId, session } = action.payload;
      state.activeSessions[bookId] = session;
    },
    clearActiveSession: (state, action) => {
      const { bookId } = action.payload;
      delete state.activeSessions[bookId];
    },
    updateSessionTime: (state, action) => {
      const { bookId, timeSpent } = action.payload;
      if (state.activeSessions[bookId]) {
        state.activeSessions[bookId].timeSpent = timeSpent;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reading progress
      .addCase(fetchReadingProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overallProgress = action.payload.progress;
        state.favorites = action.payload.favorites || [];
        state.error = null;
      })
      .addCase(fetchReadingProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch book progress
      .addCase(fetchBookProgress.pending, (state) => {
        state.isLoadingBookProgress = true;
        state.bookProgressError = null;
      })
      .addCase(fetchBookProgress.fulfilled, (state, action) => {
        state.isLoadingBookProgress = false;
        state.bookProgress[action.payload.bookId] = action.payload.progress;
        state.bookProgressError = null;
      })
      .addCase(fetchBookProgress.rejected, (state, action) => {
        state.isLoadingBookProgress = false;
        state.bookProgressError = action.payload;
      })
      
      // Start reading
      .addCase(startReading.pending, (state) => {
        state.isStartingReading = true;
        state.error = null;
      })
      .addCase(startReading.fulfilled, (state, action) => {
        state.isStartingReading = false;
        state.bookProgress[action.payload.bookId] = action.payload.progress;
        state.successMessage = 'Leitura iniciada com sucesso!';
        state.error = null;
      })
      .addCase(startReading.rejected, (state, action) => {
        state.isStartingReading = false;
        state.error = action.payload;
      })
      
      // Start reading session
      .addCase(startReadingSession.pending, (state) => {
        state.isStartingSession = true;
        state.sessionError = null;
      })
      .addCase(startReadingSession.fulfilled, (state, action) => {
        state.isStartingSession = false;
        state.activeSessions[action.payload.bookId] = action.payload.session;
        state.sessionError = null;
      })
      .addCase(startReadingSession.rejected, (state, action) => {
        state.isStartingSession = false;
        state.sessionError = action.payload;
      })
      
      // End reading session
      .addCase(endReadingSession.pending, (state) => {
        state.isEndingSession = true;
        state.sessionError = null;
      })
      .addCase(endReadingSession.fulfilled, (state, action) => {
        state.isEndingSession = false;
        const { bookId, progress } = action.payload;
        
        // Atualizar progresso do livro
        state.bookProgress[bookId] = progress;
        
        // Remover sessão ativa
        delete state.activeSessions[bookId];
        
        state.sessionError = null;
      })
      .addCase(endReadingSession.rejected, (state, action) => {
        state.isEndingSession = false;
        state.sessionError = action.payload;
      })
      
      // Mark chapter complete
      .addCase(markChapterComplete.pending, (state) => {
        state.isMarkingComplete = true;
        state.markCompleteError = null;
      })
      .addCase(markChapterComplete.fulfilled, (state, action) => {
        state.isMarkingComplete = false;
        const { bookId, progress, experience, achievements } = action.payload;
        
        // Atualizar progresso do livro
        state.bookProgress[bookId] = progress;
        
        // Definir conquistas e experiência
        if (achievements && achievements.length > 0) {
          state.newAchievements = achievements;
        }
        if (experience > 0) {
          state.experienceGained = experience;
        }
        
        state.successMessage = 'Capítulo marcado como completo!';
        state.markCompleteError = null;
      })
      .addCase(markChapterComplete.rejected, (state, action) => {
        state.isMarkingComplete = false;
        state.markCompleteError = action.payload;
      })
      
      // Update reading status
      .addCase(updateReadingStatus.pending, (state) => {
        state.isUpdatingStatus = true;
        state.statusError = null;
      })
      .addCase(updateReadingStatus.fulfilled, (state, action) => {
        state.isUpdatingStatus = false;
        state.bookProgress[action.payload.bookId] = action.payload.progress;
        state.successMessage = 'Status de leitura atualizado!';
        state.statusError = null;
      })
      .addCase(updateReadingStatus.rejected, (state, action) => {
        state.isUpdatingStatus = false;
        state.statusError = action.payload;
      })
      
      // Add to favorites
      .addCase(addToFavorites.pending, (state) => {
        state.isAddingToFavorites = true;
        state.favoritesError = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.isAddingToFavorites = false;
        state.favorites = action.payload.favorites;
        state.successMessage = 'Livro adicionado aos favoritos!';
        state.favoritesError = null;
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.isAddingToFavorites = false;
        state.favoritesError = action.payload;
      })
      
      // Remove from favorites
      .addCase(removeFromFavorites.pending, (state) => {
        state.isRemovingFromFavorites = true;
        state.favoritesError = null;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.isRemovingFromFavorites = false;
        state.favorites = action.payload.favorites;
        state.successMessage = 'Livro removido dos favoritos!';
        state.favoritesError = null;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.isRemovingFromFavorites = false;
        state.favoritesError = action.payload;
      })
      
      // Add reading note
      .addCase(addReadingNote.pending, (state) => {
        state.isAddingNote = true;
        state.notesError = null;
      })
      .addCase(addReadingNote.fulfilled, (state, action) => {
        state.isAddingNote = false;
        const { bookId, note } = action.payload;
        
        if (!state.readingNotes[bookId]) {
          state.readingNotes[bookId] = [];
        }
        state.readingNotes[bookId].push(note);
        
        state.successMessage = 'Nota adicionada com sucesso!';
        state.notesError = null;
      })
      .addCase(addReadingNote.rejected, (state, action) => {
        state.isAddingNote = false;
        state.notesError = action.payload;
      })
      
      // Fetch reading notes
      .addCase(fetchReadingNotes.pending, (state) => {
        state.isLoadingNotes = true;
        state.notesError = null;
      })
      .addCase(fetchReadingNotes.fulfilled, (state, action) => {
        state.isLoadingNotes = false;
        state.readingNotes[action.payload.bookId] = action.payload.notes;
        state.notesError = null;
      })
      .addCase(fetchReadingNotes.rejected, (state, action) => {
        state.isLoadingNotes = false;
        state.notesError = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  clearNewAchievements,
  updateLocalReadingTime,
  setActiveSession,
  clearActiveSession,
  updateSessionTime,
} = readingSlice.actions;

// Selectors
export const selectOverallProgress = (state) => state.reading.overallProgress;
export const selectBookProgress = (bookId) => (state) => state.reading.bookProgress[bookId];
export const selectActiveSessions = (state) => state.reading.activeSessions;
export const selectActiveSession = (bookId) => (state) => state.reading.activeSessions[bookId];
export const selectFavorites = (state) => state.reading.favorites;
export const selectReadingNotes = (bookId) => (state) => state.reading.readingNotes[bookId] || [];
export const selectReadingLoading = (state) => state.reading.isLoading;
export const selectReadingError = (state) => state.reading.error;
export const selectReadingSuccessMessage = (state) => state.reading.successMessage;
export const selectNewAchievements = (state) => state.reading.newAchievements;
export const selectExperienceGained = (state) => state.reading.experienceGained;

export default readingSlice.reducer;
