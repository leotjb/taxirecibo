import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return next(createError('E-mail já cadastrado', 409));

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const { accessToken, refreshToken } = generateTokens('temp');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        refreshToken,
        profile: {
          create: {
            fullName: data.fullName,
            licensePlate: '',
            carModel: '',
            carColor: '',
            licenseNumber: '',
          },
        },
      },
    });

    const tokens = generateTokens(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(createError(err.errors[0].message, 400));
    }
    next(err);
  }
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return next(createError('Credenciais inválidas', 401));

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) return next(createError('Credenciais inválidas', 401));

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      success: true,
      data: { accessToken, refreshToken },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(createError(err.errors[0].message, 400));
    }
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(createError('Refresh token ausente', 401));

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh_secret'
    ) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return next(createError('Refresh token inválido', 401));
    }

    const tokens = generateTokens(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    res.json({ success: true, data: tokens });
  } catch {
    next(createError('Refresh token inválido ou expirado', 401));
  }
});

authRouter.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.userId }, data: { refreshToken: null } });
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, profile: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});
