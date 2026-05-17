import express from 'express';
import cors from 'cors';
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
      path.resolve(__dirname, '../../node_modules/.bin/prisma'),
      path.resolve(__dirname, '../../../node_modules/.bin/prisma'),
      path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
      path.resolve(process.cwd(), 'server/node_modules/.bin/prisma'),
    ];

    console.log('Procurando prisma em:', possiblePrisma);
    console.log('Schema path:', schemaPath, '| Existe:', fs.existsSync(schemaPath));

    const prismaBin = possiblePrisma.find(p => fs.existsSync(p));
    if (prismaBin && fs.existsSync(schemaPath)) {
      console.log('Executando migração com:', prismaBin);
      execFileSync(prismaBin, ['migrate', 'deploy', '--schema', schemaPath], {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('Migração concluída.');
    } else {
      console.warn('Prisma bin não encontrado. Bin:', prismaBin, '| Schema existe:', fs.existsSync(schemaPath));
    }
  } catch (err) {
    console.warn('Aviso: migração falhou, continuando:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
console.log('uploads dir:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
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

// Serve o frontend em produção (deve ficar ANTES do errorHandler)
if (process.env.NODE_ENV === 'production') {
  const possibleClientPaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];

  console.log('Procurando build do cliente em:');
  possibleClientPaths.forEach(p => {
    const indexExists = fs.existsSync(path.join(p, 'index.html'));
    console.log(' ', p, '→', indexExists ? 'ENCONTRADO' : 'não encontrado');
  });

  const clientBuild = possibleClientPaths.find(p => fs.existsSync(path.join(p, 'index.html')));

  if (clientBuild) {
    console.log('Servindo frontend de:', clientBuild);
    app.use(express.static(clientBuild));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    console.warn('Frontend build NÃO encontrado.');
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', message: 'TaxiRecibo API rodando. Frontend não encontrado.' });
    });
  }
}

// Error handler (deve ficar por último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaxiRecibo rodando na porta ${PORT}`);
});

export default app;
