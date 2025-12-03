# ⚡ Início Rápido - Leiaê App

Este guia te ajudará a rodar o aplicativo Leiaê em **menos de 10 minutos**.

## 🚀 Método Rápido (Docker)

**Pré-requisitos:** Docker instalado

```bash
# 1. Clone o projeto
git clone <URL_DO_REPOSITORIO>
cd TCC-UNICO

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Inicie tudo com Docker
docker-compose up -d

# 4. Configure o mobile app
cd mobile-app
npm install
npm start
```

**Pronto!** Escaneie o QR Code com o Expo Go.

## 🛠️ Método Manual (Sem Docker)

### Pré-requisitos Rápidos

```bash
# Instale o Node.js (se não tiver)
# Windows/Mac: https://nodejs.org/
# Linux: sudo apt install nodejs npm

# Instale o Expo CLI
npm install -g @expo/cli

# Instale o MongoDB (ou use MongoDB Atlas)
# Windows/Mac: https://www.mongodb.com/try/download/community
# Linux: sudo apt install mongodb
```

### Setup em 5 Passos

```bash
# 1. Clone e entre no projeto
git clone <URL_DO_REPOSITORIO>
cd TCC-UNICO

# 2. Configure o Backend
cd backend
npm install
cp .env.example .env
# Edite o .env se necessário (as configurações padrão funcionam)

# 3. Inicie o Backend (novo terminal)
npm run dev

# 4. Configure o Mobile App (novo terminal)
cd ../mobnile-app
npm install

# 5. Inicie o Mobile App
npm start
```

## 📱 Testando

1. **Instale o Expo Go** no seu celular
2. **Escaneie o QR Code** que aparece no terminal
3. **Crie uma conta** no app
4. **Comece a usar!**

## 🔧 Configurações Importantes

### Se estiver usando dispositivo físico:

Edite `mobile-app/src/services/api.js`:

```javascript
// Troque localhost pelo IP da sua máquina
const API_BASE_URL = 'http://SEU_IP:3000/api';
```

**Para descobrir seu IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

### Se o MongoDB não estiver rodando:

```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Cannot connect to API" | Verifique se o backend está rodando na porta 3000 |
| "MongoDB connection error" | Inicie o MongoDB ou use MongoDB Atlas |
| "Expo CLI not found" | Execute `npm install -g @expo/cli` |
| "Port 3000 already in use" | Mate o processo: `lsof -i :3000` e `kill -9 PID` |

## 📚 Próximos Passos

- Leia o [README.md](README.md) completo
- Consulte o [SETUP.md](SETUP.md) para configuração detalhada
- Explore o código em `backend/` e `mobile-app/`

---

**🎉 Em menos de 10 minutos você deve estar com o app rodando!**

**Problemas?** Consulte o [SETUP.md](SETUP.md) para instruções detalhadas.