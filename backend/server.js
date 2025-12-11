const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares de segurança
// Necessário para ambientes com proxies (ngrok, render) e rate-limit correto
app.set('trust proxy', 1);
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por windowMs
  message: 'Muitas tentativas, tente novamente mais tarde.'
  , keyGenerator: (req) => req.ip
});
app.use(limiter);

// CORS
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leiaeapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado ao MongoDB'))
.catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/books', require('./routes/books'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/books/external', require('./routes/externalBooks'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Leiaê API está funcionando!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Algo deu errado!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
