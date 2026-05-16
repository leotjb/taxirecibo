import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export const profileRouter = Router();
profileRouter.use(authenticate);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '5')) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'));
  },
});

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  licensePlate: z.string().min(1, 'Placa obrigatória'),
  carModel: z.string().min(1, 'Modelo obrigatório'),
  carColor: z.string().min(1, 'Cor obrigatória'),
  licenseNumber: z.string().min(1, 'Número de habilitação obrigatório'),
  pixKey: z.string().optional(),
  pixBank: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  darkMode: z.boolean().optional(),
});

profileRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.taxiProfile.findUnique({ where: { userId: req.userId } });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/', async (req: AuthRequest, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await prisma.taxiProfile.upsert({
      where: { userId: req.userId! },
      update: data,
      create: { userId: req.userId!, ...data },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    if (err instanceof z.ZodError) return next(createError(err.errors[0].message, 400));
    next(err);
  }
});

profileRouter.post('/photo', upload.single('photo'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return next(createError('Nenhum arquivo enviado', 400));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    await prisma.taxiProfile.update({ where: { userId: req.userId }, data: { photoUrl } });
    res.json({ success: true, data: { photoUrl } });
  } catch (err) {
    next(err);
  }
});

profileRouter.post('/logo', upload.single('logo'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return next(createError('Nenhum arquivo enviado', 400));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    await prisma.taxiProfile.update({ where: { userId: req.userId }, data: { logoUrl } });
    res.json({ success: true, data: { logoUrl } });
  } catch (err) {
    next(err);
  }
});
