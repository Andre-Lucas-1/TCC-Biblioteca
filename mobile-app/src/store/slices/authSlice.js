import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../../services/api';
import { resetGamificationState, fetchGamificationProfile, fetchAchievements, fetchBadges } from './gamificationSlice';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await authAPI.login({email, password});
      
      // Salvar token no AsyncStorage
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      try {
        const profileRes = await userAPI.getProfile();
        if (!profileRes?.data?.user) {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          return rejectWithValue('Conta inválida');
        }
      } catch (e) {
        await AsyncStorage.multiRemove(['authToken', 'userData']);
        return rejectWithValue('Conta inválida');
      }

      dispatch(resetGamificationState());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao fazer login'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      
      // Salvar token no AsyncStorage
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      try {
        const profileRes = await userAPI.getProfile();
        if (!profileRes?.data?.user) {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          return rejectWithValue('Conta inválida');
        }
      } catch (e) {
        await AsyncStorage.multiRemove(['authToken', 'userData']);
        return rejectWithValue('Conta inválida');
      }

      dispatch(resetGamificationState());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao criar conta'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      dispatch(resetGamificationState());
      return true;
    } catch (error) {
      return rejectWithValue('Erro ao fazer logout');
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        try {
          const profileRes = await userAPI.getProfile();
          if (!profileRes?.data?.user) {
            await AsyncStorage.multiRemove(['authToken', 'userData']);
            return null;
          }
        } catch (e) {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          return null;
        }
        dispatch(resetGamificationState());
        dispatch(fetchGamificationProfile());
        dispatch(fetchAchievements());
        dispatch(fetchBadges());
        return {
          token,
          user: JSON.parse(userData)
        };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue('Erro ao carregar dados do usuário');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Atualizar dados no AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao atualizar perfil'
      );
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    updateUserData: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load user from storage
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLoading, updateUserData } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;

export default authSlice.reducer;
