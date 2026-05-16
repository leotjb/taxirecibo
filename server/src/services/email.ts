import nodemailer from 'nodemailer';
import { Ride, TaxiProfile, User } from '@prisma/client';
import { pdfService } from './pdf';

type RideWithUser = Ride & {
  user: User & { profile: TaxiProfile | null };
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: Date) =>
  new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  voucher: 'Voucher',
};

const buildEmailHtml = (ride: RideWithUser): string => {
  const profile = ride.user.profile;
  const themeColor = profile?.themeColor || '#F5C518';
  const extras = JSON.parse(ride.extras || '[]') as { description: string; value: number }[];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recibo de Viagem #${String(ride.receiptNumber).padStart(4, '0')}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: ${themeColor}; padding: 24px; text-align: center; }
  .header h1 { margin: 0; color: #000; font-size: 24px; }
  .header p { margin: 4px 0 0; color: #333; }
  .body { padding: 24px; }
  .receipt-num { text-align: center; font-size: 28px; font-weight: bold; color: ${themeColor}; margin-bottom: 20px; }
  .section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 16px; }
  .section:last-child { border-bottom: none; }
  .section h3 { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .row .label { color: #666; }
  .row .value { font-weight: 500; text-align: right; }
  .total-row { font-size: 18px; font-weight: bold; color: ${themeColor}; margin-top: 8px; }
  .footer { background: #f9f9f9; padding: 16px 24px; text-align: center; color: #888; font-size: 12px; }
  .code { font-family: monospace; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
  .btn { display: inline-block; background: ${themeColor}; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🚕 ${profile?.fullName || 'Taxista'}</h1>
    <p>Placa: ${profile?.licensePlate || ''} &nbsp;|&nbsp; ${profile?.carModel || ''} ${profile?.carColor || ''}</p>
  </div>
  <div class="body">
    <div class="receipt-num">Recibo #${String(ride.receiptNumber).padStart(4, '0')}</div>

    <div class="section">
      <h3>Dados da Viagem</h3>
      <div class="row"><span class="label">Data e Hora</span><span class="value">${formatDate(ride.rideDate)}</span></div>
      <div class="row"><span class="label">Passageiro</span><span class="value">${ride.passengerName}</span></div>
      <div class="row"><span class="label">Origem</span><span class="value">${ride.originAddress}</span></div>
      <div class="row"><span class="label">Destino</span><span class="value">${ride.destAddress}</span></div>
      ${ride.distanceKm ? `<div class="row"><span class="label">Distância</span><span class="value">${ride.distanceKm} km</span></div>` : ''}
      ${ride.durationMinutes ? `<div class="row"><span class="label">Duração</span><span class="value">${ride.durationMinutes} min</span></div>` : ''}
    </div>

    <div class="section">
      <h3>Valores</h3>
      <div class="row"><span class="label">Corrida base</span><span class="value">${formatCurrency(ride.baseValue)}</span></div>
      ${extras.map(e => `<div class="row"><span class="label">${e.description}</span><span class="value">${formatCurrency(e.value)}</span></div>`).join('')}
      <div class="row total-row"><span>Total</span><span>${formatCurrency(ride.totalValue)}</span></div>
      <div class="row" style="margin-top:8px"><span class="label">Pagamento</span><span class="value">${paymentLabels[ride.paymentMethod] || ride.paymentMethod}</span></div>
      ${ride.paymentMethod === 'pix' && profile?.pixKey ? `<div class="row"><span class="label">Chave PIX</span><span class="value">${profile.pixKey}</span></div>` : ''}
    </div>

    ${ride.observations ? `<div class="section"><h3>Observações</h3><p style="margin:0;color:#555">${ride.observations}</p></div>` : ''}

    <div style="text-align:center;margin-top:16px">
      <p style="margin:0;color:#888;font-size:13px">Código de verificação: <span class="code">${ride.receiptCode}</span></p>
      <a href="${ride.receiptUrl}" class="btn">Ver Recibo Online</a>
    </div>
  </div>
  <div class="footer">
    <p>Obrigado pela preferência! 🙏</p>
    <p>Habilitação: ${profile?.licenseNumber || ''}</p>
  </div>
</div>
</body>
</html>`;
};

export const emailService = {
  async sendReceipt(ride: RideWithUser): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Configuração de SMTP não encontrada. Configure as variáveis SMTP_USER e SMTP_PASS.');
    }

    const transporter = createTransporter();
    const html = buildEmailHtml(ride);
    let pdfBuffer: Buffer | undefined;

    try {
      pdfBuffer = await pdfService.generate(ride);
    } catch {
      console.warn('Não foi possível gerar PDF para o e-mail');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: ride.passengerEmail!,
      subject: `Recibo de Viagem #${String(ride.receiptNumber).padStart(4, '0')} - ${ride.user.profile?.fullName || 'Táxi'}`,
      html,
      attachments: pdfBuffer
        ? [{ filename: `recibo-${ride.receiptCode}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        : [],
    };

    await transporter.sendMail(mailOptions);
  },
};
