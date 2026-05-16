export interface User {
  id: string;
  email: string;
  profile: TaxiProfile | null;
}

export interface TaxiProfile {
  id: string;
  userId: string;
  fullName: string;
  licensePlate: string;
  carModel: string;
  carColor: string;
  licenseNumber: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  pixKey?: string | null;
  pixBank?: string | null;
  themeColor: string;
  darkMode: boolean;
}

export interface Extra {
  description: string;
  value: number;
}

export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix' | 'voucher';

export interface Ride {
  id: string;
  receiptNumber: number;
  receiptCode: string;
  userId: string;
  rideDate: string;
  passengerName: string;
  passengerEmail?: string | null;
  passengerPhone?: string | null;
  originAddress: string;
  destAddress: string;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  baseValue: number;
  extras: string;
  totalValue: number;
  paymentMethod: PaymentMethod;
  observations?: string | null;
  receiptUrl?: string | null;
  emailSent: boolean;
  emailSentAt?: string | null;
  whatsappSent: boolean;
  expiresAt: string;
  createdAt: string;
  user?: {
    profile: TaxiProfile | null;
  };
}

export interface DashboardData {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  allTime: { total: number; count: number };
  maxRideValue: number;
  paymentMethods: Record<string, number>;
  recentRides: Ride[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
