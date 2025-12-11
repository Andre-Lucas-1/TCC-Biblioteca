# Leiaê - Aplicativo de Leitura Gamificada

O **Leiaê** é um aplicativo móvel desenvolvido para incentivar o hábito da leitura através de gamificação. O app permite que os usuários registrem suas leituras, acompanhem seu progresso, ganhem pontos e conquistas, e interajam com outros leitores.

## 🎯 Problema que Resolve

Muitas pessoas têm dificuldade em manter o hábito da leitura devido à falta de motivação e acompanhamento do progresso. O Leiaê resolve isso através de:

- Sistema de gamificação com pontos e conquistas
- Acompanhamento detalhado do progresso de leitura
- Interface intuitiva e motivadora
- Integração com APIs de livros para informações detalhadas

## 🚀 Funcionalidades Principais

- **Registro de Leituras**: Adicione livros à sua biblioteca pessoal
- **Acompanhamento de Progresso**: Monitore páginas lidas e tempo de leitura
- **Sistema de Gamificação**: Ganhe pontos e conquistas por suas leituras
- **Perfil do Usuário**: Visualize suas estatísticas e histórico
- **Busca de Livros**: Integração com Open Library e Google Books API
- **Interface Responsiva**: Design moderno e intuitivo

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **MongoDB** para banco de dados
- **JWT** para autenticação
- **Redis** para cache (opcional)
- **Docker** para containerização

### Mobile App
- **React Native** com Expo
- **Redux Toolkit** para gerenciamento de estado
- **React Navigation** para navegação
- **Axios** para requisições HTTP

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **MongoDB** (local ou remoto)
- **Docker** e **Docker Compose** (opcional, mas recomendado)
- **Expo CLI** para o mobile app

### Instalação do Node.js
```bash
# Verifique se o Node.js está instalado
node --version
npm --version

# Se não estiver instalado, baixe em: https://nodejs.org/
```

### Instalação do Expo CLI
```bash
npm install -g @expo/cli
```

### Instalação do Docker (Opcional)
- Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux: [Docker Engine](https://docs.docker.com/engine/install/)

## 🚀 Configuração e Instalação

### Opção 1: Usando Docker (Recomendado)

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd TCC-UNICO
```

2. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
# As configurações padrão funcionam para desenvolvimento local
```

3. **Execute com Docker Compose**
```bash
# Inicie todos os serviços (MongoDB, Redis, Backend, Nginx)
docker-compose up -d

# Verifique se os serviços estão rodando
docker-compose ps
```

4. **Configure o Mobile App**
```bash
cd mobile-app
npm install
npm start
```

### Opção 2: Instalação Manual

#### Backend

1. **Navegue para o diretório do backend**
```bash
cd backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações:
# - MONGODB_URI: URL do seu MongoDB
# - JWT_SECRET: Chave secreta para JWT (mínimo 32 caracteres)
# - PORT: Porta do servidor (padrão: 3000)
```

4. **Inicie o MongoDB**
```bash
# Se usando MongoDB local
mongod

# Ou use MongoDB Atlas (nuvem) e configure a MONGODB_URI
```

5. **Execute o backend**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

#### Mobile App

1. **Navegue para o diretório do mobile-app**
```bash
cd mobile-app
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure a URL da API**
```bash
# Edite o arquivo src/services/api.js
# Altere a baseURL para o endereço do seu backend
# Exemplo: http://localhost:3000 ou http://seu-ip:3000
```

4. **Execute o app**
```bash
# Inicia o Expo Dev Server
npm start

# Ou execute diretamente em uma plataforma
npm run android  # Para Android
npm run ios      # Para iOS
npm run web      # Para Web
```

## 📱 Como Usar o App

1. **Instale o Expo Go** no seu dispositivo móvel
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. **Escaneie o QR Code** que aparece no terminal ou navegador

3. **Crie uma conta** ou faça login

4. **Comece a usar** o app para registrar suas leituras!

## 🔧 Configurações Importantes

### Variáveis de Ambiente do Backend

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/leiaeapp

# Autenticação
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_minimo_32_caracteres
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuração da API no Mobile

Edite o arquivo `mobile-app/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://SEU_IP_OU_LOCALHOST:3000';
```

**Importante**: Se estiver testando em dispositivo físico, use o IP da sua máquina, não `localhost`.

## 🐛 Solução de Problemas Comuns

### 1. Erro de Conexão com a API
- Verifique se o backend está rodando
- Confirme se a URL da API está correta no mobile app
- Se usando dispositivo físico, use o IP da máquina, não localhost

### 2. Erro de Banco de Dados
- Verifique se o MongoDB está rodando
- Confirme a string de conexão no .env
- Verifique as permissões de acesso ao banco

### 3. Erro no Expo
- Execute `npx expo start --clear` para limpar o cache
- Verifique se todas as dependências estão instaladas
- Atualize o Expo CLI: `npm install -g @expo/cli@latest`

### 4. Problemas com Docker
- Execute `docker-compose down && docker-compose up -d` para reiniciar
- Verifique os logs: `docker-compose logs -f`
- Limpe volumes se necessário: `docker-compose down -v`

## 📚 Estrutura do Projeto

```
TCC-UNICO/
├── backend/                 # API Backend (Node.js + Express)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── mobile-app/             # App Mobile (React Native + Expo)
│   ├── src/
│   ├── package.json
│   └── app.json
├── docker-compose.yml      # Configuração Docker
├── .env.example           # Variáveis de ambiente globais
└── README.md              # Este arquivo
```

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Matheus Viana**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@exemplo.com

---

**Desenvolvido com ❤️ para incentivar o hábito da leitura**