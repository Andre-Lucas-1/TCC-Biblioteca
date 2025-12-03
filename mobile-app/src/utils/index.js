import AsyncStorage from '@react-native-async-storage/async-storage';
import { VALIDATION, TIME_CONFIG, STORAGE_KEYS } from '../constants';

// Utilitários de formatação
export const formatUtils = {
  // Formatar tempo de leitura
  formatReadingTime: (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  },

  // Formatar data
  formatDate: (date, options = {}) => {
    const dateObj = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return dateObj.toLocaleDateString('pt-BR', defaultOptions);
  },

  // Formatar data relativa (há 2 dias, ontem, etc.)
  formatRelativeDate: (date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInMs = now - dateObj;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInMinutes < 60) {
      return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays === 1) {
      return 'Ontem';
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} dias`;
    } else {
      return formatUtils.formatDate(date);
    }
  },

  // Formatar número com separadores
  formatNumber: (number) => {
    return new Intl.NumberFormat('pt-BR').format(number);
  },

  // Formatar porcentagem
  formatPercentage: (value, total) => {
    if (total === 0) return '0%';
    const percentage = Math.round((value / total) * 100);
    return `${percentage}%`;
  },

  // Truncar texto
  truncateText: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  // Capitalizar primeira letra
  capitalize: (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Formatar nome do autor
  formatAuthorName: (firstName, lastName) => {
    return `${firstName} ${lastName}`.trim();
  },
};

// Utilitários de validação
export const validationUtils = {
  // Validar email
  validateEmail: (email) => {
    return VALIDATION.EMAIL_REGEX.test(email);
  },

  // Validar senha
  validatePassword: (password) => {
    return password && password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
  },

  // Validar nome
  validateName: (name) => {
    return (
      name &&
      name.trim().length >= VALIDATION.NAME_MIN_LENGTH &&
      name.trim().length <= VALIDATION.NAME_MAX_LENGTH
    );
  },

  // Validar campos obrigatórios
  validateRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  // Validar formulário de login
  validateLoginForm: (email, password) => {
    const errors = {};
    
    if (!validationUtils.validateRequired(email)) {
      errors.email = 'E-mail é obrigatório';
    } else if (!validationUtils.validateEmail(email)) {
      errors.email = 'E-mail inválido';
    }
    
    if (!validationUtils.validateRequired(password)) {
      errors.password = 'Senha é obrigatória';
    } else if (!validationUtils.validatePassword(password)) {
      errors.password = `Senha deve ter pelo menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Validar formulário de registro
  validateRegisterForm: (name, email, password, confirmPassword) => {
    const errors = {};
    
    if (!validationUtils.validateRequired(name)) {
      errors.name = 'Nome é obrigatório';
    } else if (!validationUtils.validateName(name)) {
      errors.name = `Nome deve ter entre ${VALIDATION.NAME_MIN_LENGTH} e ${VALIDATION.NAME_MAX_LENGTH} caracteres`;
    }
    
    if (!validationUtils.validateRequired(email)) {
      errors.email = 'E-mail é obrigatório';
    } else if (!validationUtils.validateEmail(email)) {
      errors.email = 'E-mail inválido';
    }
    
    if (!validationUtils.validateRequired(password)) {
      errors.password = 'Senha é obrigatória';
    } else if (!validationUtils.validatePassword(password)) {
      errors.password = `Senha deve ter pelo menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    }
    
    if (!validationUtils.validateRequired(confirmPassword)) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Utilitários de storage
export const storageUtils = {
  // Salvar dados
  setItem: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
      return false;
    }
  },

  // Recuperar dados
  getItem: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Erro ao recuperar do storage:', error);
      return null;
    }
  },

  // Remover item
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do storage:', error);
      return false;
    }
  },

  // Limpar storage
  clear: async () => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
      return false;
    }
  },

  // Salvar dados do usuário
  saveUserData: async (userData) => {
    return await storageUtils.setItem(STORAGE_KEYS.USER_DATA, userData);
  },

  // Recuperar dados do usuário
  getUserData: async () => {
    return await storageUtils.getItem(STORAGE_KEYS.USER_DATA);
  },

  // Salvar token de autenticação
  saveAuthToken: async (token) => {
    return await storageUtils.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  // Recuperar token de autenticação
  getAuthToken: async () => {
    return await storageUtils.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

// Utilitários de tempo
export const timeUtils = {
  // Calcular tempo de leitura estimado (palavras por minuto)
  calculateReadingTime: (wordCount, wpm = 200) => {
    return Math.ceil(wordCount / wpm);
  },

  // Verificar se uma data é hoje
  isToday: (date) => {
    const today = new Date();
    const dateObj = new Date(date);
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  },

  // Verificar se uma data é ontem
  isYesterday: (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateObj = new Date(date);
    return (
      dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear()
    );
  },

  // Calcular diferença em dias
  daysDifference: (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
  },

  // Verificar se o streak deve ser resetado
  shouldResetStreak: (lastReadDate) => {
    if (!lastReadDate) return true;
    const now = new Date();
    const lastRead = new Date(lastReadDate);
    const diffInHours = (now - lastRead) / (1000 * 60 * 60);
    return diffInHours > TIME_CONFIG.STREAK_RESET_HOURS;
  },

  // Obter início do dia
  getStartOfDay: (date = new Date()) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  },

  // Obter fim do dia
  getEndOfDay: (date = new Date()) => {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  },
};

// Utilitários de array
export const arrayUtils = {
  // Remover duplicatas
  removeDuplicates: (array, key) => {
    if (key) {
      return array.filter((item, index, self) => 
        index === self.findIndex(t => t[key] === item[key])
      );
    }
    return [...new Set(array)];
  },

  // Agrupar por propriedade
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // Ordenar por propriedade
  sortBy: (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  },

  // Embaralhar array
  shuffle: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Paginar array
  paginate: (array, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return {
      data: array.slice(startIndex, endIndex),
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNextPage: endIndex < array.length,
      hasPrevPage: page > 1,
    };
  },
};

// Utilitários de cor
export const colorUtils = {
  // Converter hex para rgba
  hexToRgba: (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // Gerar cor aleatória
  getRandomColor: () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  },

  // Verificar se uma cor é clara ou escura
  isLightColor: (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  },
};

// Utilitários de debounce e throttle
export const performanceUtils = {
  // Debounce
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Utilitários de erro
export const errorUtils = {
  // Extrair mensagem de erro
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'Erro desconhecido';
  },

  // Verificar se é erro de rede
  isNetworkError: (error) => {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('Network Error') ||
      !navigator.onLine
    );
  },

  // Verificar se é erro de autenticação
  isAuthError: (error) => {
    return error?.response?.status === 401;
  },
};

// Utilitários de URL
export const urlUtils = {
  // Construir query string
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  },

  // Extrair parâmetros da URL
  parseQueryString: (queryString) => {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  },
};

export default {
  formatUtils,
  validationUtils,
  storageUtils,
  timeUtils,
  arrayUtils,
  colorUtils,
  performanceUtils,
  errorUtils,
  urlUtils,
};