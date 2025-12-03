// Cores do tema
export const COLORS = {
  // Cores primárias
  primary: '#7bb3b6', // Cor da marca Leiaê
  primaryDark: '#5A2D04', // Marrom mais escuro
  primaryLight: '#E8A15A', // Dourado claro
  
  // Cores secundárias
  secondary: '#10B981', // Emerald
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  
  // Cores de fundo
  background: 'transparent',
  backgroundDark: '#1F2937',
  surface: '#F9FAFB',
  surfaceDark: '#374151',
  
  // Cores de texto
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textDark: '#FFFFFF',
  textSecondaryDark: '#D1D5DB',
  
  // Cores de status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Cores neutras
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Cores de gamificação
  experience: '#F59E0B', // Amber
  achievement: '#8B5CF6', // Violet
  badge: '#EC4899', // Pink
  level: '#06B6D4', // Cyan
  streak: '#EF4444', // Red
  
  // Cores de gêneros de livros
  genres: {
    fiction: '#8B5CF6',
    nonFiction: '#10B981',
    mystery: '#374151',
    romance: '#EC4899',
    sciFi: '#06B6D4',
    fantasy: '#7C3AED',
    biography: '#F59E0B',
    history: '#DC2626',
    selfHelp: '#059669',
    business: '#1F2937',
  },
};

// Tamanhos e espaçamentos
export const SIZES = {
  // Padding e margin
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Tamanhos de ícones
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Raios de borda
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // Alturas de componentes
  button: 48,
  input: 48,
  header: 56,
  tabBar: 60,
  
  // Larguras
  screenWidth: '100%',
  containerWidth: '90%',
};

// Fontes
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
  
  // Pesos de fonte
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};

// Sombras
export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Textos e mensagens
export const TEXTS = {
  // Títulos de telas
  screenTitles: {
    home: 'Início',
    library: 'Biblioteca',
    reading: 'Lendo',
    profile: 'Perfil',
    search: 'Buscar',
    favorites: 'Favoritos',
    achievements: 'Conquistas',
    challenges: 'Desafios',
    leaderboard: 'Ranking',
    settings: 'Configurações',
  },
  
  // Mensagens de erro
  errors: {
    network: 'Erro de conexão. Verifique sua internet.',
    generic: 'Algo deu errado. Tente novamente.',
    unauthorized: 'Sessão expirada. Faça login novamente.',
    notFound: 'Conteúdo não encontrado.',
    validation: 'Dados inválidos. Verifique os campos.',
  },
  
  // Mensagens de sucesso
  success: {
    login: 'Login realizado com sucesso!',
    register: 'Conta criada com sucesso!',
    profileUpdated: 'Perfil atualizado com sucesso!',
    bookAdded: 'Livro adicionado aos favoritos!',
    chapterCompleted: 'Capítulo concluído!',
    achievementUnlocked: 'Nova conquista desbloqueada!',
  },
  
  // Placeholders
  placeholders: {
    search: 'Buscar livros, autores...',
    email: 'Digite seu e-mail',
    password: 'Digite sua senha',
    name: 'Digite seu nome',
    note: 'Adicione uma nota...',
  },
  
  // Botões
  buttons: {
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    save: 'Salvar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    startReading: 'Começar a Ler',
    continueReading: 'Continuar Lendo',
    addToFavorites: 'Adicionar aos Favoritos',
    removeFromFavorites: 'Remover dos Favoritos',
    share: 'Compartilhar',
    retry: 'Tentar Novamente',
  },
};

// Status de leitura
export const READING_STATUS = {
  NOT_STARTED: 'not_started',
  READING: 'reading',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  DROPPED: 'dropped',
};

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  ACHIEVEMENT: 'achievement',
  CHALLENGE: 'challenge',
  REMINDER: 'reminder',
  SOCIAL: 'social',
  SYSTEM: 'system',
};

// Tipos de conquista
export const ACHIEVEMENT_TYPES = {
  BOOKS_READ: 'books_read',
  CHAPTERS_READ: 'chapters_read',
  READING_TIME: 'reading_time',
  STREAK: 'streak',
  GENRE_EXPLORER: 'genre_explorer',
  SPEED_READER: 'speed_reader',
  DEDICATED_READER: 'dedicated_reader',
};

// Tipos de desafio
export const CHALLENGE_TYPES = {
  BOOKS_COUNT: 'books_count',
  READING_TIME: 'reading_time',
  CHAPTERS_COUNT: 'chapters_count',
  GENRE_DIVERSITY: 'genre_diversity',
  STREAK: 'streak',
};

// Gêneros de livros
export const BOOK_GENRES = [
  { id: 'fiction', name: 'Ficção', color: COLORS.genres.fiction },
  { id: 'non-fiction', name: 'Não-ficção', color: COLORS.genres.nonFiction },
  { id: 'mystery', name: 'Mistério', color: COLORS.genres.mystery },
  { id: 'romance', name: 'Romance', color: COLORS.genres.romance },
  { id: 'sci-fi', name: 'Ficção Científica', color: COLORS.genres.sciFi },
  { id: 'fantasy', name: 'Fantasia', color: COLORS.genres.fantasy },
  { id: 'biography', name: 'Biografia', color: COLORS.genres.biography },
  { id: 'history', name: 'História', color: COLORS.genres.history },
  { id: 'self-help', name: 'Autoajuda', color: COLORS.genres.selfHelp },
  { id: 'business', name: 'Negócios', color: COLORS.genres.business },
];

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SEARCH_LIMIT: 10,
  LEADERBOARD_LIMIT: 50,
};

// Configurações de tempo
export const TIME_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  READING_SESSION_MIN: 5 * 60 * 1000, // 5 minutos mínimos
  STREAK_RESET_HOURS: 24, // 24 horas para manter streak
  NOTIFICATION_DELAY: 2000, // 2 segundos
};

// Configurações de validação
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NOTE_MAX_LENGTH: 500,
};

// URLs e links
export const URLS = {
  PRIVACY_POLICY: 'https://example.com/privacy',
  TERMS_OF_SERVICE: 'https://example.com/terms',
  SUPPORT: 'https://example.com/support',
  FEEDBACK: 'mailto:feedback@example.com',
};

// Configurações de animação
export const ANIMATIONS = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
};

// Configurações de storage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  READING_PREFERENCES: 'readingPreferences',
  NOTIFICATION_SETTINGS: 'notificationSettings',
};

// Temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Configurações de imagem
export const IMAGE_CONFIG = {
  QUALITY: 0.8,
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  TEXTS,
  READING_STATUS,
  NOTIFICATION_TYPES,
  ACHIEVEMENT_TYPES,
  CHALLENGE_TYPES,
  BOOK_GENRES,
  PAGINATION,
  TIME_CONFIG,
  VALIDATION,
  URLS,
  ANIMATIONS,
  STORAGE_KEYS,
  THEMES,
  IMAGE_CONFIG,
};