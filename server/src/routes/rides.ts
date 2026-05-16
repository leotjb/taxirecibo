import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { emailService } from '../services/email';

export const ridesRouter = Router();
ridesRouter.use(authenticate);

const extraSchema = z.object({
  description: z.string(),
  value: z.number().min(0),
});

const rideSchema = z.object({
  rideDate: z.string().min(1, 'Data obrigatória'),
  passengerName: z.string().min(2, 'Nome do passageiro obrigatório'),
  passengerEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  passengerPhone: z.string().optional(),
  originAddress: z.string().min(3, 'Endereço de origem obrigatório'),
  destAddress: z.string().min(3, 'Endereço de destino obrigatório'),
  distanceKm: z.number().min(0).optional(),
  durationMinutes: z.number().min(0).optional(),
  baseValue: z.number().min(0, 'Valor da corrida obrigatório'),
  extras: z.array(extraSchema).optional().default([]),
  paymentMethod: z.enum(['dinheiro', 'cartao', 'pix', 'voucher'], {
    errorMap: () => ({ message: 'Forma de pagamento inválida' }),
  }),
  observations: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
});

const getNextReceiptNumber = async (userId: string): Promise<number> => {
  const last = await prisma.ride.findFirst({
    where: { userId },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  return (last?.receiptNumber ?? 0) + 1;
};

ridesRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = rideSchema.parse(req.body);
    const extrasValue = data.extras.reduce((sum, e) => sum + e.value, 0);
    const totalValue = data.baseValue + extrasValue;
    const receiptNumber = await getNextReceiptNumber(req.userId!);
    const receiptCode = uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    const ride = await prisma.ride.create({
      data: {
        userId: req.userId!,
        receiptNumber,
        receiptCode,
        rideDate: new Date(data.rideDate),
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail || null,
        passengerPhone: data.passengerPhone || null,
        originAddress: data.originAddress,
        destAddress: data.destAddress,
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        baseValue: data.baseValue,
        extras: JSON.stringify(data.extras),
        totalValue,
        paymentMethod: data.paymentMethod,
        observations: data.observations,
        receiptUrl: `${baseUrl}/recibo/${receiptCode}`,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      include: { user: { include: { profile: true } } },
    });

    if (data.sendEmail && data.passengerEmail) {
      try {
        await emailService.sendReceipt(ride);
        await prisma.ride.update({
          where: { id: ride.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail:', emailErr);
      }
    }

    res.status(201).json({ success: true, data: ride });
  } catch (err) {
    if (err instanceof z.ZodError) return next(createError(err.errors[0].message, 400));
    next(err);
  }
});

ridesRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { search, paymentMethod, startDate, endDate, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };

    if (search) {
      where.OR = [
        { passengerName: { contains: search as string } },
        { destAddress: { contains: search as string } },
        { receiptCode: { contains: search as string } },
      ];
    }
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.rideDate = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) }),
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        orderBy: { rideDate: 'desc' },
        skip,
        take: limitNum,
        include: { user: { include: { profile: true } } },
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

ridesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { user: { include: { profile: true } } },
    });
    if (!ride) return next(createError('Corrida não encontrada', 404));
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
});

ridesRouter.post('/:id/send-email', async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { user: { include: { profile: true } } },
    });
    if (!ride) return next(createError('Corrida não encontrada', 404));
    if (!ride.passengerEmail) return next(createError('Passageiro sem e-mail cadastrado', 400));

    await emailService.sendReceipt(ride);
    await prisma.ride.update({
      where: { id: ride.id },
      data: { emailSent: true, emailSentAt: new Date() },
    });
    res.json({ success: true, message: 'E-mail enviado com sucesso' });
  } catch (err) {
    next(err);
  }
});

ridesRouter.post('/:id/duplicate', async (req: AuthRequest, res, next) => {
  try {
    const original = await prisma.ride.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!original) return next(createError('Corrida não encontrada', 404));

    const receiptNumber = await getNextReceiptNumber(req.userId!);
    const receiptCode = uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    const newRide = await prisma.ride.create({
      data: {
        userId: req.userId!,
        receiptNumber,
        receiptCode,
        rideDate: new Date(),
        passengerName: original.passengerName,
        passengerEmail: original.passengerEmail,
        passengerPhone: original.passengerPhone,
        originAddress: original.originAddress,
        destAddress: original.destAddress,
        distanceKm: original.distanceKm,
        durationMinutes: original.durationMinutes,
        baseValue: original.baseValue,
        extras: original.extras,
        totalValue: original.totalValue,
        paymentMethod: original.paymentMethod,
        observations: original.observations,
        receiptUrl: `${baseUrl}/recibo/${receiptCode}`,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json({ success: true, data: newRide });
  } catch (err) {
    next(err);
  }
});
