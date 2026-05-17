import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { authRouter } from './routes/auth';
import { profileRouter } from './routes/profile';
import { ridesRouter } from './routes/rides';
import { receiptsRouter } from './routes/receipts';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

console.log('=== TaxiRecibo iniciando ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL definida:', !!process.env.DATABASE_URL);
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

// Executa migrações ao iniciar em produção
if (process.env.NODE_ENV === 'production') {
  try {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const possiblePrisma = [
      path.resolve(process.cwd(), 'server/node_modules/.bin/prisma'),
      path.resolve(__dirname, '../../node_modules/.bin/prisma'),
      path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
    ];

    console.log('Schema path:', schemaPath, '| Existe:', fs.existsSync(schemaPath));
    const prismaBin = possiblePrisma.find(p => fs.existsSync(p));
    console.log('Prisma bin encontrado:', prismaBin || 'NENHUM');

    if (prismaBin && fs.existsSync(schemaPath)) {
      console.log('Executando db push...');
      execFileSync(prismaBin, [
        'db', 'push', '--schema', schemaPath, '--skip-generate', '--accept-data-loss',
      ], { stdio: 'inherit', env: process.env });
      console.log('Banco sincronizado.');
    } else {
      console.warn('Prisma bin não encontrado. Tentados:', possiblePrisma);
    }
  } catch (err) {
    console.warn('Aviso: migração falhou, continuando:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS manual — evita bug do pacote cors com credentials + wildcard
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve o frontend em produção
if (process.env.NODE_ENV === 'production') {
  const candidatos = [
    path.resolve(__dirname, 'public'),            // server/dist/public  ← cp do nixpacks
    path.resolve(__dirname, '../public'),          // server/public
    path.resolve(__dirname, '../../client/dist'),  // client/dist
    path.resolve(process.cwd(), 'client/dist'),   // /app/client/dist
  ];

  candidatos.forEach(p => {
    console.log('Frontend?', p, '→', fs.existsSync(path.join(p, 'index.html')) ? 'SIM' : 'não');
  });

  const clientBuild = candidatos.find(p => fs.existsSync(path.join(p, 'index.html')));

  if (clientBuild) {
    console.log('Servindo frontend de:', clientBuild);
    app.use(express.static(clientBuild));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    console.warn('Frontend não encontrado em nenhum caminho.');
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', message: 'API rodando. Frontend não encontrado.' });
    });
  }
}

// Error handler (deve ficar por último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaxiRecibo rodando na porta ${PORT}`);
});

export default app;
