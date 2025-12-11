import api from './api';

export const gutendexAPI = {
  search: async (query = '', page = 1) => {
    const response = await api.get('/books/external/search', { params: { query, page } });
    return response.data;
  },
  details: async (id) => {
    const response = await api.get(`/books/external/${id}`);
    return response.data;
  },
  import: async (id) => {
    const response = await api.post(`/books/external/import/${id}`);
    return response.data;
  },
  content: async (id) => {
    const response = await api.get(`/books/external/${id}/content`, { responseType: 'text' });
    return response.data;
  },
};

export const bookUtils = {
  formatBookData: (book) => ({
    id: book.externalId,
    title: book.title || 'Título não disponível',
    authors: Array.isArray(book.authors) ? book.authors : [book.authors || 'Autor desconhecido'],
    description: book.description || 'Descrição não disponível',
    coverUrl: book.coverImage,
    pages: book.pageCount,
    categories: book.subjects || [],
    subjects: book.subjects || [],
    language: (book.languages && book.languages[0]) || 'pt',
    source: 'gutendex'
  }),
  isValidBook: (book) => book && book.title && (book.authors?.length > 0 || book.authors),
  getDefaultCoverUrl: (title) => `https://via.placeholder.com/300x400/7D4105/FFFFFF?text=${encodeURIComponent(title.substring(0, 20))}`,
};

export default { gutendexAPI, bookUtils };
