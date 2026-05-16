import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { pdfService } from '../services/pdf';

export const receiptsRouter = Router();

receiptsRouter.get('/public/:code', async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { receiptCode: req.params.code },
      include: { user: { include: { profile: true } } },
    });

    if (!ride) return next(createError('Recibo não encontrado', 404));
    if (new Date() > ride.expiresAt) return next(createError('Recibo expirado', 410));

    const safeRide = {
      ...ride,
      user: {
        profile: {
          fullName: ride.user.profile?.fullName,
          licensePlate: ride.user.profile?.licensePlate,
          carModel: ride.user.profile?.carModel,
          carColor: ride.user.profile?.carColor,
          licenseNumber: ride.user.profile?.licenseNumber,
          photoUrl: ride.user.profile?.photoUrl,
          logoUrl: ride.user.profile?.logoUrl,
          pixKey: ride.user.profile?.pixKey,
          pixBank: ride.user.profile?.pixBank,
          themeColor: ride.user.profile?.themeColor,
        },
      },
    };

    res.json({ success: true, data: safeRide });
  } catch (err) {
    next(err);
  }
});

receiptsRouter.get('/:id/pdf', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { user: { include: { profile: true } } },
    });
    if (!ride) return next(createError('Recibo não encontrado', 404));

    const pdfBuffer = await pdfService.generate(ride);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${ride.receiptCode}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

receiptsRouter.get('/public/:code/pdf', async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { receiptCode: req.params.code },
      include: { user: { include: { profile: true } } },
    });
    if (!ride) return next(createError('Recibo não encontrado', 404));
    if (new Date() > ride.expiresAt) return next(createError('Recibo expirado', 410));

    const pdfBuffer = await pdfService.generate(ride);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${ride.receiptCode}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
