import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { booksAPI } from '../../services/api';

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async ({ page = 1, limit = 10, search = '', genre = '', difficulty = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBooks({ page, limit, search, genre, difficulty });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar livros'
      );
    }
  }
);

export const fetchBookDetails = createAsyncThunk(
  'books/fetchBookDetails',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBookById(bookId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar detalhes do livro'
      );
    }
  }
);

export const fetchBookChapters = createAsyncThunk(
  'books/fetchBookChapters',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getBookChapters(bookId);
      return { bookId, chapters: response.data.chapters };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar capítulos'
      );
    }
  }
);

export const fetchChapterDetails = createAsyncThunk(
  'books/fetchChapterDetails',
  async ({ bookId, chapterId }, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getChapter(bookId, chapterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar capítulo'
      );
    }
  }
);

export const rateBook = createAsyncThunk(
  'books/rateBook',
  async ({ bookId, rating, review }, { rejectWithValue }) => {
    try {
      const response = await booksAPI.rateBook(bookId, { rating, review });
      return { bookId, rating: response.data.rating };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao avaliar livro'
      );
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'books/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getRecommendations();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar recomendações'
      );
    }
  }
);

export const fetchTrendingBooks = createAsyncThunk(
  'books/fetchTrendingBooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getTrendingBooks();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao carregar livros em alta'
      );
    }
  }
);

export const addBookToLibrary = createAsyncThunk(
  'books/addBookToLibrary',
  async (bookData, { rejectWithValue }) => {
    try {
      const response = await booksAPI.addBook(bookData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro ao adicionar livro à biblioteca'
      );
    }
  }
);

const initialState = {
  // Lista de livros
  books: [],
  totalBooks: 0,
  currentPage: 1,
  totalPages: 1,
  
  // Livro selecionado
  selectedBook: null,
  bookChapters: {},
  selectedChapter: null,
  
  // Recomendações e trending
  recommendations: [],
  trendingBooks: [],
  
  // Filtros
  filters: {
    search: '',
    genre: '',
    difficulty: '',
  },
  
  // Estados de loading
  isLoading: false,
  isLoadingDetails: false,
  isLoadingChapters: false,
  isLoadingChapter: false,
  isLoadingRecommendations: false,
  isLoadingTrending: false,
  
  // Erros
  error: null,
  detailsError: null,
  chaptersError: null,
  chapterError: null,
  recommendationsError: null,
  trendingError: null,
};

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.detailsError = null;
      state.chaptersError = null;
      state.chapterError = null;
      state.recommendationsError = null;
      state.trendingError = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        genre: '',
        difficulty: '',
      };
    },
    setSelectedBook: (state, action) => {
      state.selectedBook = action.payload;
    },
    clearSelectedBook: (state) => {
      state.selectedBook = null;
      state.selectedChapter = null;
    },
    setSelectedChapter: (state, action) => {
      state.selectedChapter = action.payload;
    },
    clearSelectedChapter: (state) => {
      state.selectedChapter = null;
    },
    updateBookRating: (state, action) => {
      const { bookId, rating } = action.payload;
      
      // Atualizar na lista de livros
      const bookIndex = state.books.findIndex(book => book._id === bookId);
      if (bookIndex !== -1) {
        state.books[bookIndex].statistics.averageRating = rating.averageRating;
        state.books[bookIndex].statistics.totalRatings = rating.totalRatings;
      }
      
      // Atualizar no livro selecionado
      if (state.selectedBook && state.selectedBook._id === bookId) {
        state.selectedBook.statistics.averageRating = rating.averageRating;
        state.selectedBook.statistics.totalRatings = rating.totalRatings;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.totalBooks = action.payload.pagination.total;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.pages;
        state.error = null;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch book details
      .addCase(fetchBookDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchBookDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.selectedBook = action.payload.book;
        state.detailsError = null;
      })
      .addCase(fetchBookDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload;
      })
      
      // Fetch book chapters
      .addCase(fetchBookChapters.pending, (state) => {
        state.isLoadingChapters = true;
        state.chaptersError = null;
      })
      .addCase(fetchBookChapters.fulfilled, (state, action) => {
        state.isLoadingChapters = false;
        state.bookChapters[action.payload.bookId] = action.payload.chapters;
        state.chaptersError = null;
      })
      .addCase(fetchBookChapters.rejected, (state, action) => {
        state.isLoadingChapters = false;
        state.chaptersError = action.payload;
      })
      
      // Fetch chapter details
      .addCase(fetchChapterDetails.pending, (state) => {
        state.isLoadingChapter = true;
        state.chapterError = null;
      })
      .addCase(fetchChapterDetails.fulfilled, (state, action) => {
        state.isLoadingChapter = false;
        state.selectedChapter = action.payload.chapter;
        state.chapterError = null;
      })
      .addCase(fetchChapterDetails.rejected, (state, action) => {
        state.isLoadingChapter = false;
        state.chapterError = action.payload;
      })
      
      // Rate book
      .addCase(rateBook.fulfilled, (state, action) => {
        const { bookId, rating } = action.payload;
        
        // Atualizar na lista de livros
        const bookIndex = state.books.findIndex(book => book._id === bookId);
        if (bookIndex !== -1) {
          state.books[bookIndex].statistics = {
            ...state.books[bookIndex].statistics,
            ...rating
          };
        }
        
        // Atualizar no livro selecionado
        if (state.selectedBook && state.selectedBook._id === bookId) {
          state.selectedBook.statistics = {
            ...state.selectedBook.statistics,
            ...rating
          };
        }
      })
      
      // Fetch recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.isLoadingRecommendations = true;
        state.recommendationsError = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isLoadingRecommendations = false;
        state.recommendations = action.payload.recommendations;
        state.recommendationsError = null;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.isLoadingRecommendations = false;
        state.recommendationsError = action.payload;
      })
      
      // Fetch trending books
      .addCase(fetchTrendingBooks.pending, (state) => {
        state.isLoadingTrending = true;
        state.trendingError = null;
      })
      .addCase(fetchTrendingBooks.fulfilled, (state, action) => {
        state.isLoadingTrending = false;
        state.trendingBooks = action.payload.books;
        state.trendingError = null;
      })
      .addCase(fetchTrendingBooks.rejected, (state, action) => {
        state.isLoadingTrending = false;
        state.trendingError = action.payload;
      })
      
      // Add book to library
      .addCase(addBookToLibrary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addBookToLibrary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books.unshift(action.payload.book);
        state.totalBooks += 1;
        state.error = null;
      })
      .addCase(addBookToLibrary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSelectedBook,
  clearSelectedBook,
  setSelectedChapter,
  clearSelectedChapter,
  updateBookRating,
} = booksSlice.actions;

// Selectors
export const selectBooks = (state) => state.books.books;
export const selectBooksLoading = (state) => state.books.isLoading;
export const selectBooksError = (state) => state.books.error;
export const selectBooksPagination = (state) => ({
  currentPage: state.books.currentPage,
  totalPages: state.books.totalPages,
  totalBooks: state.books.totalBooks,
});
export const selectBooksFilters = (state) => state.books.filters;
export const selectSelectedBook = (state) => state.books.selectedBook;
export const selectBookChapters = (bookId) => (state) => state.books.bookChapters[bookId] || [];
export const selectSelectedChapter = (state) => state.books.selectedChapter;
export const selectRecommendations = (state) => state.books.recommendations;
export const selectTrendingBooks = (state) => state.books.trendingBooks;

export default booksSlice.reducer;