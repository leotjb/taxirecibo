import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const PAYMENT_METHODS = ['dinheiro', 'cartao', 'pix', 'voucher'] as const;

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.ride.deleteMany();
  await prisma.taxiProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('senha123', 12);

  const user = await prisma.user.create({
    data: {
      email: 'taxista@demo.com',
      password: hashedPassword,
      profile: {
        create: {
          fullName: 'João Carlos Silva',
          licensePlate: 'ABC-1234',
          carModel: 'Toyota Corolla',
          carColor: 'Branco',
          licenseNumber: '12345678901',
          pixKey: 'joao.taxista@pix.com',
          pixBank: 'Banco do Brasil',
          themeColor: '#F5C518',
        },
      },
    },
  });

  console.log(`✅ Usuário criado: ${user.email} / senha: senha123`);

  const passengers = [
    { name: 'Maria Oliveira', email: 'maria@email.com', phone: '5511999990001' },
    { name: 'Carlos Pereira', email: 'carlos@email.com', phone: '5511999990002' },
    { name: 'Ana Costa', email: 'ana@email.com', phone: '5511999990003' },
    { name: 'Roberto Lima', email: 'roberto@email.com', phone: '5511999990004' },
    { name: 'Fernanda Souza', email: 'fernanda@email.com', phone: '5511999990005' },
  ];

  const origins = [
    'Av. Paulista, 1000 - Bela Vista, São Paulo',
    'Rua Augusta, 500 - Consolação, São Paulo',
    'Aeroporto de Congonhas - Campo Belo, São Paulo',
    'Shopping Ibirapuera - Moema, São Paulo',
    'Terminal Tietê - Santana, São Paulo',
  ];

  const destinations = [
    'Aeroporto de Guarulhos - Cumbica, Guarulhos',
    'Av. Brigadeiro Faria Lima, 3000 - Itaim Bibi, São Paulo',
    'Shopping Morumbi - Vila Andrade, São Paulo',
    'Rua Oscar Freire, 100 - Jardins, São Paulo',
    'Parque Ibirapuera - Vila Mariana, São Paulo',
  ];

  let receiptNumber = 1;
  const baseDate = new Date();

  for (let i = 0; i < 15; i++) {
    const passenger = passengers[i % passengers.length];
    const rideDate = new Date(baseDate);
    rideDate.setDate(rideDate.getDate() - i);

    const baseValue = Math.round((15 + Math.random() * 85) * 100) / 100;
    const hasToll = Math.random() > 0.6;
    const extras = hasToll ? [{ description: 'Pedágio', value: 8.90 }] : [];
    const extrasValue = extras.reduce((s, e) => s + e.value, 0);
    const receiptCode = uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();

    await prisma.ride.create({
      data: {
        userId: user.id,
        receiptNumber: receiptNumber++,
        receiptCode,
        rideDate,
        passengerName: passenger.name,
        passengerEmail: passenger.email,
        passengerPhone: passenger.phone,
        originAddress: origins[i % origins.length],
        destAddress: destinations[i % destinations.length],
        distanceKm: Math.round((5 + Math.random() * 30) * 10) / 10,
        durationMinutes: Math.round(10 + Math.random() * 50),
        baseValue,
        extras: JSON.stringify(extras),
        totalValue: Math.round((baseValue + extrasValue) * 100) / 100,
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        receiptUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/recibo/${receiptCode}`,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        emailSent: Math.random() > 0.4,
      },
    });
  }

  console.log(`✅ 15 corridas criadas`);
  console.log('\n🚕 Seed concluído! Dados de acesso:');
  console.log('   E-mail: taxista@demo.com');
  console.log('   Senha: senha123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
