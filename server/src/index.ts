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

// Executa migrações do banco ao iniciar (sem depender de npx)
if (process.env.NODE_ENV === 'production') {
  try {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const possiblePrisma = [
      path.resolve(__dirname, '../../node_modules/.bin/prisma'),
      path.resolve(__dirname, '../../../node_modules/.bin/prisma'),
      path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
      path.resolve(process.cwd(), 'server/node_modules/.bin/prisma'),
    ];
    const prismaBin = possiblePrisma.find(p => fs.existsSync(p));
    if (prismaBin && fs.existsSync(schemaPath)) {
      console.log('Executando migração do banco...');
      execFileSync(prismaBin, ['migrate', 'deploy', '--schema', schemaPath], {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('Migração concluída.');
    }
  } catch (err) {
    console.warn('Aviso: migração falhou, continuando:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(uploadsDir)));

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// Em produção, serve o frontend React junto com o backend
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`TaxiRecibo rodando na porta ${PORT}`);
});

export default app;
