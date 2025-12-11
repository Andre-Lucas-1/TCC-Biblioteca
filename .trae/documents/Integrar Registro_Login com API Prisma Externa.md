## Objetivo
Vincular registro e login do app/ backend à API externa Prisma em https://banco-z4ar.onrender.com (rotas: POST /users, GET /users), mantendo JWT local para proteger rotas (importação, progresso, etc.).

## Considerações de Segurança
- Nunca armazenar senha em texto puro. Gerar hash com bcrypt antes de enviar ao serviço externo e guardar apenas `passwordHash`.
- Emitir JWT no backend (usando segredo já configurado) e adaptar middleware para reconhecer usuários espelhados.

## Backend (Adapter/Proxy)
- Criar um serviço `externalAuthService` apontando para `EXTERNAL_AUTH_BASE_URL=https://banco-z4ar.onrender.com`.
- Registro `/api/auth/register` (proxy):
  1. Recebe `name, email, password`.
  2. Gera `passwordHash` (bcrypt).
  3. POST para `/users` do Prisma com `{ name, email, passwordHash, userType: 'user', isActive: true }`.
  4. Cria um espelho do usuário no Mongo (`User`), salvando `name, email, userType, isActive` (sem senha).
  5. Emite JWT (`userId` do Mongo) e retorna `user` + `token`.
- Login `/api/auth/login` (proxy):
  1. Recebe `email, password`.
  2. GET `/users` do Prisma, filtra por `email` (client-side; caso haja muitos usuários, posterior melhoria: suporte a query server-side).
  3. Compara `password` com `passwordHash` (bcrypt.compare).
  4. Se não existir espelho no Mongo, cria-o.
  5. Emite JWT e retorna `user` + `token`.
- Middleware `authenticateToken` permanece emitindo e verificando JWT, mas ao buscar `User` no Mongo:
  - Se não encontrar, opcionalmente realiza uma busca rápida no Prisma e cria espelho (tolerância a falhas).

## Frontend (React Native)
- Manter `authAPI` do app apontando para `/api/auth/register` e `/api/auth/login` do backend.
- Logout: apenas limpar storage local (`authToken`, `refreshToken`, `userData`).
- Em telas protegidas (importar/começar a ler): ao detectar 401, exibir mensagem e redirecionar para login.

## Fluxo de Dados
- Registro:
  - App → Backend `/api/auth/register` → Prisma `/users` → Backend cria espelho no Mongo → JWT → App salva token.
- Login:
  - App → Backend `/api/auth/login` → Prisma `/users` (lista e filtra) → bcrypt.compare → Backend espelha se necessário → JWT.
- Rotas protegidas (ex.: importação): usam JWT emitido pelo backend.

## Erros e Mensagens
- Prisma 400: retornar mensagens claras (email já existe, dados inválidos).
- JWT 401: “Sessão expirada/Token requerido”, instruir login.

## Próximas Melhorias (opcional)
- Adicionar rota `/users?email=...` no Prisma para evitar listar tudo.
- Adicionar `/login` no serviço externo para centralizar validação de senha.
- Sincronizar preferências/ gamificação com o Prisma se quiser mover tudo para fora.

Confirma que posso implementar o adapter no backend e ajustar o app para usar `/api/auth/register` e `/api/auth/login` com a API Prisma externa?