import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração base da API
// NGROK CONFIGURADO - URL pública para dispositivos físicos
// URL do ngrok: https://dane-shabbier-interpolatively.ngrok-free.dev
const API_BASE_URL = __DEV__
  ? (Platform.OS === 'web'
      ? 'http://localhost:3000/api'
      : 'https://dane-shabbier-interpolatively.ngrok-free.dev/api')
  : 'https://your-production-api.com/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Debug: Log da requisição
      console.log('🚀 API Request:', {
        url: config.baseURL + config.url,
        method: config.method?.toUpperCase(),
        data: config.data
      });
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        dataType: typeof config.data,
        serializedData: JSON.stringify(config.data)
      });
      
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
    }
    return config;
  },
  (error) => {
    console.log('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Remover interceptor que estava causando dupla serialização
// O axios já serializa automaticamente objetos JavaScript para JSON

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.log('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    const originalRequest = error.config;

    // Se o token expirou (401) e não é uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          await AsyncStorage.setItem('authToken', token);

          // Repetir a requisição original com o novo token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se o refresh falhar, limpar tokens e redirecionar para login
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
        // Aqui você pode disparar uma ação para redirecionar para login
        console.error('Erro ao renovar token:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// Serviços de Usuário
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  getStats: () => api.get('/users/stats'),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteAccount: () => api.delete('/users/account'),
};

// Serviços de Livros
export const booksAPI = {
  getBooks: (params = {}) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  addBook: (bookData) => api.post('/books/add-to-library', bookData),
  searchBooks: (query, filters = {}) => api.get('/books/search', {
    params: { q: query, ...filters },
  }),
  getBooksByGenre: (genre, params = {}) => api.get(`/books/genre/${genre}`, { params }),
  getBooksByAuthor: (author, params = {}) => api.get(`/books/author/${author}`, { params }),
  getFeaturedBooks: () => api.get('/books/featured'),
  getNewReleases: () => api.get('/books/new-releases'),
  getPopularBooks: () => api.get('/books/popular'),
  rateBook: (bookId, rating) => api.post(`/books/${bookId}/rate`, { rating }),
  reviewBook: (bookId, review) => api.post(`/books/${bookId}/review`, review),
  getBookReviews: (bookId, params = {}) => api.get(`/books/${bookId}/reviews`, { params }),
};

// Serviços de Capítulos
export const chaptersAPI = {
  getChapters: (bookId) => api.get(`/chapters/book/${bookId}`),
  getChapter: (chapterId) => api.get(`/chapters/${chapterId}`),
  markRead: (chapterId) => api.put(`/chapters/${chapterId}/read`),
};

// Serviços de Leitura
export const readingAPI = {
  getReadingProgress: () => api.get('/progress'),
  getBookProgress: (bookId) => api.get(`/progress/book/${bookId}`),
  startReading: (bookId) => api.post('/progress/start', { bookId }),
  startSession: (bookId, chapterId) => api.post('/reading/session/start', { bookId, chapterId }),
  endSession: (sessionId, data) => api.post(`/reading/session/${sessionId}/end`, data),
  markChapterComplete: (bookId, chapterId) => api.post('/reading/chapter/complete', {
    bookId,
    chapterId,
  }),
  updateReadingStatus: (bookId, status) => api.put(`/reading/status/${bookId}`, { status }),
  addToFavorites: (bookId) => api.post('/reading/favorites', { bookId }),
  removeFromFavorites: (bookId) => api.delete(`/reading/favorites/${bookId}`),
  getFavorites: () => api.get('/reading/favorites'),
  addNote: (bookId, chapterId, note) => api.post('/reading/notes', {
    bookId,
    chapterId,
    ...note,
  }),
  getNotes: (bookId, chapterId) => api.get('/reading/notes', {
    params: { bookId, chapterId },
  }),
  updateNote: (noteId, note) => api.put(`/reading/notes/${noteId}`, note),
  deleteNote: (noteId) => api.delete(`/reading/notes/${noteId}`),
};

// Serviços de Gamificação
export const gamificationAPI = {
  getProfile: () => api.get('/gamification/profile'),
  getAchievements: () => api.get('/gamification/achievements'),
  getBadges: () => api.get('/gamification/badges'),
  checkAchievements: () => api.post('/gamification/check-achievements'),
  getLeaderboard: (params = {}) => api.get('/gamification/leaderboard', { params }),
  getStats: () => api.get('/gamification/stats'),
};

// Serviços de Recomendações
export const recommendationsAPI = {
  getRecommendations: (params = {}) => api.get('/recommendations', { params }),
  getTrendingBooks: () => api.get('/recommendations/trending'),
  getSimilarBooks: (bookId) => api.get(`/recommendations/similar/${bookId}`),
  getRecommendationsByGenre: (genre) => api.get(`/recommendations/genre/${genre}`),
  getRecommendationsByLevel: () => api.get('/recommendations/level'),
  provideFeedback: (bookId, feedback) => api.post('/recommendations/feedback', {
    bookId,
    feedback,
  }),
};

// Serviços de Desafios
export const challengesAPI = {
  getChallenges: (params = {}) => api.get('/challenges', { params }),
  getChallenge: (id) => api.get(`/challenges/${id}`),
  createChallenge: (challenge) => api.post('/challenges', challenge),
  joinChallenge: (id) => api.post(`/challenges/${id}/join`),
  leaveChallenge: (id) => api.post(`/challenges/${id}/leave`),
  updateProgress: (id, progress) => api.post(`/challenges/${id}/progress`, progress),
  getUserChallenges: () => api.get('/challenges/user'),
  deleteChallenge: (id) => api.delete(`/challenges/${id}`),
};

// Serviços de Notificações
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  updatePushToken: (token) => api.post('/notifications/push-token', { token }),
};

// Serviços de Upload
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadFile: (formData) => api.post('/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Utilitários
export const apiUtils = {
  // Função para fazer logout e limpar dados
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  },
  
  // Função para verificar se o usuário está autenticado
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  },
  
  // Função para obter dados do usuário do storage
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  },
  
  // Função para salvar dados do usuário no storage
  saveUserData: async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
    }
  },
};

export default api;
