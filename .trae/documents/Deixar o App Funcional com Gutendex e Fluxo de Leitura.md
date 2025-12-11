## Diagnóstico Atual
- Algumas telas chamam endpoints que exigem token e falham com 401 (token expirado).
- Fluxo de exploração (Gutendex) deve ser público para listar/buscar/detalhar/conteúdo e apenas importação deve exigir login.
- Telas precisam tratar 401/422/502 com mensagens claras e fallbacks.
- Biblioteca deve mostrar livros locais quando autenticado e “Explorar” da Gutendex sempre.

## Backend
- Tornar públicas as rotas de navegação externa:
  - `GET /api/books/external/search`, `GET /api/books/external/:id`, `GET /api/books/external/:id/content` (sem auth)
  - Manter `POST /api/books/external/import/:id` autenticado
- Garantir apenas Gutendex:
  - Buscar em `https://gutendex.com/books/?languages=pt` com `page` e `search`
  - Detalhes em `GET /books/:id`
  - Conteúdo usando `formats["text/plain"]` (prioriza utf-8)
- Importação robusta:
  - Validar idioma pt/pt-BR/por
  - Bloquear obra de referência (dicionário/enciclopédia)
  - Remover boilerplate, dividir capítulos (800–1500; fallback 1200)
  - Atualizar/evitar duplicidade; criar capítulos para livros já existentes sem capítulos
- Modelo e index de texto:
  - `Book.language='portuguese'` e `textLanguage='portuguese'` com índice `{ default_language: 'portuguese', language_override: 'textLanguage' }`

## Frontend (React Native)
- Serviços
  - `externalBooksAPI.search(query, page)` usa backend paginado; normaliza campos e inclui `subjects` para filtros
  - `chaptersAPI` usa `/chapters/book/:bookId` e `/chapters/:id`; `markRead` via `PUT /chapters/:id/read`
- Biblioteca
  - View switch “Minha Biblioteca” (autenticado) e “Explorar” (público)
  - “Explorar”: busca com debounce, filtro de gênero (concatena termo+gênero), paginação infinita
  - “Minha Biblioteca”: filtro local por título/autor/gênero; abrir `ChaptersList`
  - Tratar 401 com fallback para “Explorar” e/ou prompt de login
- Detalhes do Livro
  - Botões:
    - “Adicionar à Biblioteca”: importa se necessário e abre `ChaptersList`
    - “Ver Capítulos”: abre lista (importa se necessário)
    - “Começar a Ler”: importa se necessário, busca capítulos e abre o primeiro
  - Tratamento de erros (422/404/502) com mensagens amigáveis
- Leitura
  - `ReadingScreen`: inicia progresso (`POST /progress/start`) e carrega capítulo real; navegação anterior/próximo; marca leitura ao avançar; remover chamadas de sessão antigas
  - Preservar modo noturno e ajuste de fonte
- Lista de Capítulos
  - `ChaptersListScreen`: exibe títulos, número, tempo estimado, palavra; suporta paginação (`page`) e navega para `ReadingScreen`

## Segurança e UX
- Axios: refresh token em 401 (onde aplicável); logs controlados
- Ngrok: manter cabeçalho `ngrok-skip-browser-warning`
- Mensagens localizadas para erros comuns (token expirado, importação indisponível, falha de download)

## Verificação
- Fluxo sem login: “Explorar” lista/busca/detalhes/conteúdo
- Fluxo com login: “Minha Biblioteca” lista; importar 55752 (Dom Casmurro), capítulos criados; “Começar a Ler” abre primeiro capítulo
- Progresso: `POST /progress/start` → 201; `GET /progress/book/:id` → 200; leitura marca capítulo
- Busca e gêneros: resultados refinados; rolagem carrega páginas adicionais

## Entregáveis
- Rotas backend atualizadas
- Telas RN com os três botões e leitura funcional
- Biblioteca com modo “Explorar” e “Minha Biblioteca” com filtros e paginação
- Tratamento de erros e UX melhorado

Confirma que posso aplicar essas mudanças e finalizar o fluxo end-to-end?