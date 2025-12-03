const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');

const router = express.Router();

const GUTENDEX_BASE_URL = 'https://gutendex.com';
const gutendexAPI = axios.create({ baseURL: GUTENDEX_BASE_URL, timeout: 15000 });

function pickTextFormat(formats) {
  if (!formats) return null;
  const keys = Object.keys(formats);
  const utf8 = keys.find(k => k.toLowerCase().startsWith('text/plain') && k.toLowerCase().includes('utf-8'));
  const plain = keys.find(k => k.toLowerCase().startsWith('text/plain'));
  return (utf8 && formats[utf8]) || (plain && formats[plain]) || null;
}

function normalizeGutendexBook(b) {
  return {
    externalId: b.id,
    title: b.title,
    authors: (b.authors || []).map(a => a.name),
    coverImage: b.formats?.['image/jpeg'] || null,
    textUrl: pickTextFormat(b.formats),
    languages: b.languages || [],
    download_count: b.download_count || 0,
    subjects: b.subjects || [],
    source: 'gutendex'
  };
}

function mapSubjectToGenre(subjects) {
  const s = (subjects || []).map(x => x.toLowerCase());
  if (s.some(x => x.includes('fantasy'))) return 'fantasy';
  if (s.some(x => x.includes('mystery'))) return 'mystery';
  if (s.some(x => x.includes('romance'))) return 'romance';
  if (s.some(x => x.includes('biography'))) return 'biography';
  if (s.some(x => x.includes('history'))) return 'history';
  if (s.some(x => x.includes('science fiction'))) return 'sci-fi';
  if (s.some(x => x.includes('children'))) return 'children';
  if (s.some(x => x.includes('self-help'))) return 'self-help';
  return 'fiction';
}

function stripGutenbergBoilerplate(text) {
  if (!text) return '';
  let t = text.replace(/\r\n/g, '\n');
  const startIdx = t.search(/\*+\s*START OF (THIS|THE) PROJECT GUTENBERG/i);
  const endIdx = t.search(/\*+\s*END OF (THIS|THE) PROJECT GUTENBERG/i);
  if (startIdx >= 0) t = t.slice(startIdx);
  if (endIdx > 0) t = t.slice(0, endIdx);
  return t.trim();
}

function splitIntoChapters(raw, minWords = 800, maxWords = 1500, target = 1200) {
  const words = raw.trim().split(/\s+/);
  const chapters = [];
  let start = 0;
  while (start < words.length) {
    let end = Math.min(start + target, words.length);
    // tentar ajustar para fim de parágrafo
    let searchWindow = words.slice(start, Math.min(start + maxWords, words.length)).join(' ');
    let paragraphBreak = searchWindow.lastIndexOf('\n\n');
    if (paragraphBreak !== -1) {
      const pbWords = searchWindow.substring(0, paragraphBreak).trim().split(/\s+/).length;
      if (pbWords >= minWords && pbWords <= maxWords) {
        end = start + pbWords;
      }
    }
    // garantir limites
    if (end - start < minWords) end = Math.min(start + minWords, words.length);
    if (end - start > maxWords) end = start + maxWords;
    chapters.push(words.slice(start, end).join(' '));
    start = end;
  }
  return chapters;
}

function splitFixed(raw, chunkSize = 1200) {
  const words = raw.trim().split(/\s+/);
  const chapters = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chapters.push(words.slice(i, Math.min(i + chunkSize, words.length)).join(' '));
  }
  return chapters;
}

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query = '', page = 1 } = req.query;
    const url = '/books/';
    const params = query && query.trim().length > 0
      ? { languages: 'pt', search: query, page }
      : { languages: 'pt', page };
    const response = await gutendexAPI.get(url, { params });
    const books = (response.data.results || []).map(normalizeGutendexBook);
    const count = response.data.count || 0;
    const next = response.data.next || null;
    const previous = response.data.previous || null;
    const pageSize = books.length;
    const nextPage = next ? Number(new URL(next).searchParams.get('page') || page + 1) : null;
    const prevPage = previous ? Number(new URL(previous).searchParams.get('page') || page - 1) : null;
    res.json({
      message: 'Busca realizada com sucesso',
      books,
      pagination: { count, page: Number(page), pageSize, nextPage, prevPage, hasNext: !!next }
    });
  } catch (error) {
    console.error('Erro na busca Gutendex:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor', error: 'INTERNAL_ERROR' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await gutendexAPI.get(`/books/${req.params.id}`);
    const book = normalizeGutendexBook(response.data);
    if (!book) return res.status(404).json({ message: 'Livro não encontrado' });
    res.json({ message: 'Detalhes do livro obtidos com sucesso', book });
  } catch (error) {
    console.error('Erro ao obter detalhes Gutendex:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id/content', authenticateToken, async (req, res) => {
  try {
    const response = await gutendexAPI.get(`/books/${req.params.id}`);
    const book = normalizeGutendexBook(response.data);
    if (!book?.textUrl) return res.status(404).json({ message: 'Conteúdo não disponível' });
    const txt = await axios.get(book.textUrl, { responseType: 'text' });
    const cleaned = stripGutenbergBoilerplate(txt.data);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(cleaned);
  } catch (error) {
    console.error('Erro ao obter conteúdo Gutendex:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/import/:id', authenticateToken, async (req, res) => {
  try {
    let response;
    try {
      response = await gutendexAPI.get(`/books/${req.params.id}`);
    } catch (e) {
      const status = e.response?.status || 500;
      if (status === 404) return res.status(404).json({ message: 'Livro não encontrado na Gutendex' });
      return res.status(502).json({ message: 'Falha ao consultar Gutendex' });
    }

    const gutBook = normalizeGutendexBook(response.data);

    // Garantir idioma português
    const langs = (gutBook.languages || []).map(l => String(l).toLowerCase());
    if (!langs.some(l => l === 'pt' || l === 'pt-br' || l === 'por')) {
      return res.status(422).json({ message: 'Idioma não suportado para importação (apenas português)' });
    }

    // Bloquear importação de obras de referência (dicionários/enciclopédias)
    const titleLower = (gutBook.title || '').toLowerCase();
    const subjLower = (gutBook.subjects || []).map(s => String(s).toLowerCase());
    if (
      titleLower.includes('dicionário') || titleLower.includes('dicionario') ||
      subjLower.some(s => s.includes('dictionary') || s.includes('dictionaries') || s.includes('reference'))
    ) {
      return res.status(422).json({ message: 'Tipo de obra não suportado para importação (referência/dicionário)' });
    }

    // Evitar duplicidade: se já existe, retornar dados
    const existing = await Book.findOne({ externalId: String(gutBook.externalId), source: 'gutendex', isActive: true });
    if (existing) {
      const chapters = await Chapter.find({ book: existing._id, isActive: true })
        .select('_id title chapterNumber')
        .sort({ order: 1, chapterNumber: 1 })
        .lean();
      if (chapters.length > 0) {
        return res.status(200).json({
          message: 'Livro já importado',
          book: { _id: existing._id, title: existing.title, totalChapters: existing.totalChapters },
          chapters
        });
      }
      // Sem capítulos: prosseguir criando-os a partir do texto
    }
    if (!gutBook?.textUrl) {
      return res.status(422).json({ message: 'Livro sem formato text/plain disponível para importação' });
    }

    let txtResp;
    try {
      txtResp = await axios.get(gutBook.textUrl, { responseType: 'text', headers: { 'User-Agent': 'LeiaApp/1.0 (Educational Reading App)' } });
    } catch (e) {
      return res.status(502).json({ message: 'Falha ao baixar conteúdo do livro (txt)' });
    }

    const rawText = stripGutenbergBoilerplate(txtResp.data);
    const totalWords = rawText.trim().split(/\s+/).length;
    if (totalWords < 200) {
      return res.status(422).json({ message: 'Conteúdo insuficiente para importar' });
    }

    let chaptersText = splitIntoChapters(rawText);
    if (!chaptersText.length) {
      chaptersText = splitFixed(rawText, 1200);
      if (!chaptersText.length) {
        return res.status(422).json({ message: 'Não foi possível segmentar o livro em capítulos' });
      }
    }

    const pageCount = Math.ceil(totalWords / 300);
    const estimatedReadingTime = Math.max(10, Math.ceil(totalWords / 200));
    const genre = mapSubjectToGenre(gutBook.subjects);
    const avgChapterSize = Math.round(totalWords / chaptersText.length);
    const difficulty = avgChapterSize > 1200 ? 'advanced' : avgChapterSize >= 900 ? 'intermediate' : 'beginner';

    const safeDescriptionBase = `${gutBook.title} por ${gutBook.authors[0] || 'Autor desconhecido'}. `;
    const remaining = 1000 - safeDescriptionBase.length - 3;
    const description = safeDescriptionBase + rawText.slice(0, Math.max(0, remaining)) + '...';

    let book = existing;
    if (!book) {
      book = new Book({
        title: gutBook.title,
        author: gutBook.authors[0] || 'Autor desconhecido',
        description,
        genre,
        difficulty,
        coverImage: gutBook.coverImage,
        language: 'portuguese',
        estimatedReadingTime,
        totalChapters: chaptersText.length,
        isActive: true,
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        createdBy: req.user._id,
        isExternal: true,
        externalId: String(gutBook.externalId),
        source: 'gutendex',
        pageCount,
        categories: ['domínio público'],
        tags: [...(gutBook.authors || []), ...(gutBook.subjects || [])],
        metadata: { wordCount: totalWords }
      });
      try {
        await book.save();
      } catch (e) {
        return res.status(422).json({ message: 'Falha ao salvar livro', details: e.message });
      }
    } else {
      // Atualizar metadados se necessário
      book.totalChapters = chaptersText.length;
      book.pageCount = pageCount;
      book.estimatedReadingTime = estimatedReadingTime;
      if (!book.metadata) book.metadata = {};
      book.metadata.wordCount = totalWords;
      await book.save();
    }

    let order = 1;
    const createdChapters = [];
    for (let i = 0; i < chaptersText.length; i++) {
      const text = chaptersText[i];
      let titleCandidate = (text.split(/\n|\.\s/)[0] || '').trim();
      if (/project gutenberg|start of/i.test(titleCandidate) || titleCandidate.length < 4) {
        titleCandidate = '';
      }
      const chapterTitle = titleCandidate ? titleCandidate.slice(0, 60) : `Capítulo ${i + 1}`;
      const chapter = new Chapter({
        book: book._id,
        title: chapterTitle,
        chapterNumber: i + 1,
        content: text,
        order: order++,
        isActive: true
      });
      try {
        await chapter.save();
      } catch (e) {
        return res.status(422).json({ message: 'Falha ao salvar capítulo', details: e.message });
      }
      createdChapters.push({ _id: chapter._id, title: chapter.title, chapterNumber: chapter.chapterNumber });
    }

    res.status(existing ? 201 : 201).json({
      message: existing ? 'Capítulos importados com sucesso' : 'Livro importado com sucesso',
      book: { _id: book._id, title: book.title, totalChapters: book.totalChapters },
      chapters: createdChapters
    });
  } catch (error) {
    console.error('Erro na importação Gutendex:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
