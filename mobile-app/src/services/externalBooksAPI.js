import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lastSearchAt = new Map();
const inflight = new Map();

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const isRetriable = (err) => {
  const status = err?.response?.status;
  const msg = (err?.message || '').toLowerCase();
  return status === 429 || status === 500 || msg.includes('socket hang up') || msg.includes('network');
};

const getWithRetry = async (url, options = {}, retries = 2) => {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      const res = await api.get(url, options);
      return res;
    } catch (e) {
      lastErr = e;
      if (!isRetriable(e) || attempt === retries) break;
      const backoff = 500 * Math.pow(3, attempt);
      await sleep(backoff);
      attempt += 1;
    }
  }
  throw lastErr;
};

const postWithRetry = async (url, data = {}, options = {}, retries = 1) => {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      const res = await api.post(url, data, options);
      return res;
    } catch (e) {
      lastErr = e;
      if (!isRetriable(e) || attempt === retries) break;
      const backoff = 500 * Math.pow(3, attempt);
      await sleep(backoff);
      attempt += 1;
    }
  }
  throw lastErr;
};

export const gutendexAPI = {
  search: async (query = '', page = 1) => {
    const q = (query || '').trim();
    const cacheKey = `cache:/books/external/search:${q}:${page}`;
    const now = Date.now();
    const last = lastSearchAt.get(cacheKey) || 0;
    if (now - last < 15000) {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    if (inflight.has(cacheKey)) {
      try { return await inflight.get(cacheKey); } catch {}
    }
    const promise = (async () => {
      try {
        const response = await getWithRetry('/books/external/search', { params: { query: q, page } }, 2);
        const data = response.data;
        lastSearchAt.set(cacheKey, Date.now());
        try { await AsyncStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        return data;
      } catch (e) {
        try {
          const raw = await AsyncStorage.getItem(cacheKey);
          if (raw) return JSON.parse(raw);
        } catch {}
        return { books: [], pagination: { page: 1, hasNext: false } };
      } finally {
        inflight.delete(cacheKey);
      }
    })();
    inflight.set(cacheKey, promise);
    return await promise;
  },
  details: async (id) => {
    const cacheKey = `cache:/books/external/details:${id}`;
    try {
      const response = await getWithRetry(`/books/external/${id}`, {}, 2);
      const data = response.data;
      try { await AsyncStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      return data;
    } catch (e) {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) return JSON.parse(raw);
      } catch {}
      return { book: { externalId: id, title: 'Título não disponível', authors: [], description: 'Descrição não disponível', coverImage: '', pageCount: 0, subjects: [], languages: ['pt'], source: 'gutendex' } };
    }
  },
  import: async (id) => {
    const response = await postWithRetry(`/books/external/import/${id}`, {}, {}, 1);
    return response.data;
  },
  content: async (id) => {
    const response = await getWithRetry(`/books/external/${id}/content`, { responseType: 'text' }, 1);
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
