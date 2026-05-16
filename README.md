# 🚕 TáxiRecibo

Sistema web para taxistas enviarem recibos digitais profissionais aos passageiros via e-mail, WhatsApp e PDF.

## Funcionalidades

- ✅ Cadastro e autenticação de taxistas (JWT)
- ✅ Perfil com foto, logo, dados do veículo e chave PIX
- ✅ Formulário de nova corrida com validação em tempo real
- ✅ Recibo digital com numeração sequencial e código único
- ✅ Página pública do recibo (válida por 90 dias)
- ✅ Envio por e-mail (HTML + PDF em anexo)
- ✅ Compartilhamento via WhatsApp (deep link)
- ✅ Download do recibo em PDF
- ✅ Histórico de corridas com filtros e busca
- ✅ Dashboard com métricas financeiras e gráfico de formas de pagamento
- ✅ Modo escuro
- ✅ Design mobile-first responsivo

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: SQLite via Prisma ORM
- **E-mail**: Nodemailer
- **PDF**: Puppeteer
- **Autenticação**: JWT com refresh token

---

## Instalação Local

### Pré-requisitos
- Node.js 18+
- npm 9+

### 1. Clone e instale as dependências

```bash
git clone <seu-repositorio>
cd taxirecibo

# Instalar dependências do projeto raiz
npm install

# Instalar dependências do servidor
cd server && npm install && cd ..

# Instalar dependências do cliente
cd client && npm install && cd ..
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example server/.env
```

Edite o arquivo `server/.env` com suas configurações:

```env
JWT_SECRET=sua_chave_secreta_muito_longa_aqui
JWT_REFRESH_SECRET=outra_chave_refresh_secreta
DATABASE_URL="file:./taxirecibo.db"

# Para envio de e-mail (Gmail):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASS=senha_de_app_do_gmail  # Não é sua senha normal!
```

> **Gmail**: Vá em `Conta Google > Segurança > Senhas de app` para gerar uma senha específica para o app.

### 3. Configure o banco de dados

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Popule com dados de exemplo (opcional)

```bash
npm run seed --workspace=server
# Acesso demo: taxista@demo.com / senha123
```

### 5. Inicie os servidores

```bash
# Na pasta raiz — inicia backend (porta 3001) e frontend (porta 5173) simultâneamente
npm run dev
```

Acesse: **http://localhost:5173**

---

## Docker (recomendado para produção)

### Rodar com um comando

```bash
# Configure as variáveis
cp .env.example .env
# Edite .env com suas credenciais SMTP

docker-compose up -d
```

Acesse: **http://localhost:3001**

### Parar

```bash
docker-compose down
```

---

## Deploy no Railway

1. Faça fork do repositório
2. Crie um projeto no [Railway](https://railway.app)
3. Conecte o repositório
4. Configure as variáveis de ambiente no painel do Railway
5. O deploy acontece automaticamente

---

## Deploy no Render

1. Crie um serviço Web no [Render](https://render.com)
2. Selecione "Docker" como ambiente
3. Configure as variáveis de ambiente
4. Faça o deploy

---

## Estrutura do Projeto

```
taxirecibo/
├── client/                # React frontend
│   └── src/
│       ├── pages/         # Dashboard, NovaViagem, Historico, Perfil, Recibo
│       ├── components/    # Layout, componentes compartilhados
│       ├── contexts/      # AuthContext
│       ├── services/      # api.ts (axios)
│       └── types/         # TypeScript types
├── server/                # Express backend
│   └── src/
│       ├── routes/        # auth, profile, rides, receipts, dashboard
│       ├── services/      # email, pdf
│       ├── middleware/    # auth, errorHandler
│       ├── lib/           # prisma client
│       └── seed.ts        # dados de exemplo
├── server/prisma/
│   └── schema.prisma      # Modelos do banco de dados
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `JWT_SECRET` | Chave secreta JWT | obrigatório |
| `JWT_REFRESH_SECRET` | Chave para refresh token | obrigatório |
| `DATABASE_URL` | Caminho do SQLite | `file:./taxirecibo.db` |
| `PORT` | Porta do servidor | `3001` |
| `BASE_URL` | URL pública do backend | `http://localhost:3001` |
| `CLIENT_URL` | URL do frontend | `http://localhost:5173` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | E-mail SMTP | obrigatório para e-mail |
| `SMTP_PASS` | Senha/App Password SMTP | obrigatório para e-mail |
| `EMAIL_FROM` | Nome e e-mail remetente | valor de SMTP_USER |
| `UPLOAD_DIR` | Pasta de uploads | `./uploads` |
| `MAX_FILE_SIZE_MB` | Tamanho máximo de upload | `5` |

---

## Licença

MIT
