import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseWhere = { userId: req.userId! };

    const [allRides, todayRides, weekRides, monthRides, recentRides] = await Promise.all([
      prisma.ride.findMany({ where: baseWhere, select: { totalValue: true, paymentMethod: true } }),
      prisma.ride.findMany({ where: { ...baseWhere, rideDate: { gte: startOfDay } }, select: { totalValue: true } }),
      prisma.ride.findMany({ where: { ...baseWhere, rideDate: { gte: startOfWeek } }, select: { totalValue: true } }),
      prisma.ride.findMany({ where: { ...baseWhere, rideDate: { gte: startOfMonth } }, select: { totalValue: true } }),
      prisma.ride.findMany({
        where: baseWhere,
        orderBy: { rideDate: 'desc' },
        take: 5,
        include: { user: { include: { profile: true } } },
      }),
    ]);

    const sum = (rides: { totalValue: number }[]) => rides.reduce((a: number, r) => a + r.totalValue, 0);
    type RideVal = { totalValue: number; paymentMethod: string };
    const maxRide = allRides.reduce(
      (max: RideVal | undefined, r: RideVal) => (!max || r.totalValue > max.totalValue) ? r : max,
      undefined
    );

    const paymentCounts: Record<string, number> = {};
    for (const ride of allRides) {
      paymentCounts[ride.paymentMethod] = (paymentCounts[ride.paymentMethod] ?? 0) + 1;
    }

    res.json({
      success: true,
      data: {
        today: { total: sum(todayRides), count: todayRides.length },
        week: { total: sum(weekRides), count: weekRides.length },
        month: { total: sum(monthRides), count: monthRides.length },
        allTime: { total: sum(allRides), count: allRides.length },
        maxRideValue: maxRide?.totalValue ?? 0,
        paymentMethods: paymentCounts,
        recentRides,
      },
    });
  } catch (err) {
    next(err);
  }
});
