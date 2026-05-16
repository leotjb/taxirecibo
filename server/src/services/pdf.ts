import puppeteer from 'puppeteer';
import { Ride, TaxiProfile, User } from '@prisma/client';

type RideWithUser = Ride & {
  user: User & { profile: TaxiProfile | null };
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: Date) =>
  new Date(date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  voucher: 'Voucher',
};

const buildReceiptHtml = (ride: RideWithUser): string => {
  const profile = ride.user.profile;
  const themeColor = profile?.themeColor || '#F5C518';
  const extras = JSON.parse(ride.extras || '[]') as { description: string; value: number }[];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: white; padding: 24px; color: #1a1a1a; font-size: 13px; }
  .header { background: ${themeColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
  .header-info h1 { font-size: 20px; font-weight: bold; }
  .header-info p { font-size: 12px; color: #333; margin-top: 2px; }
  .receipt-badge { text-align: right; flex: 1; }
  .receipt-badge .num { font-size: 24px; font-weight: bold; }
  .receipt-badge .code { font-size: 10px; color: #555; font-family: monospace; }
  .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 14px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: bold; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .row .lbl { color: #6b7280; }
  .row .val { font-weight: 500; }
  .divider { border-top: 1px dashed #e5e7eb; margin: 8px 0; }
  .total { font-size: 16px; font-weight: bold; color: ${themeColor}; }
  .footer { text-align: center; margin-top: 20px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
  .logo-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
</style>
</head>
<body>
<div class="header">
  ${profile?.logoUrl ? `<img src="${profile.logoUrl}" class="logo-img" alt="Logo">` : ''}
  <div class="header-info">
    <h1>${profile?.fullName || 'Taxista'}</h1>
    <p>Placa: ${profile?.licensePlate || ''} &nbsp;|&nbsp; ${profile?.carModel || ''} ${profile?.carColor || ''}</p>
    <p>Habilitação: ${profile?.licenseNumber || ''}</p>
  </div>
  <div class="receipt-badge">
    <div class="num">Recibo #${String(ride.receiptNumber).padStart(4, '0')}</div>
    <div class="code">${ride.receiptCode}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Dados da Viagem</div>
  <div class="row"><span class="lbl">Data e Hora</span><span class="val">${formatDate(ride.rideDate)}</span></div>
  <div class="row"><span class="lbl">Passageiro</span><span class="val">${ride.passengerName}</span></div>
  <div class="row"><span class="lbl">Origem</span><span class="val">${ride.originAddress}</span></div>
  <div class="row"><span class="lbl">Destino</span><span class="val">${ride.destAddress}</span></div>
  ${ride.distanceKm ? `<div class="row"><span class="lbl">Distância</span><span class="val">${ride.distanceKm} km</span></div>` : ''}
  ${ride.durationMinutes ? `<div class="row"><span class="lbl">Duração</span><span class="val">${ride.durationMinutes} min</span></div>` : ''}
</div>

<div class="section">
  <div class="section-title">Valores</div>
  <div class="row"><span class="lbl">Corrida base</span><span class="val">${formatCurrency(ride.baseValue)}</span></div>
  ${extras.map(e => `<div class="row"><span class="lbl">${e.description}</span><span class="val">${formatCurrency(e.value)}</span></div>`).join('')}
  <div class="divider"></div>
  <div class="row total"><span>TOTAL</span><span>${formatCurrency(ride.totalValue)}</span></div>
</div>

<div class="section">
  <div class="section-title">Pagamento</div>
  <div class="row"><span class="lbl">Forma</span><span class="val">${paymentLabels[ride.paymentMethod] || ride.paymentMethod}</span></div>
  ${ride.paymentMethod === 'pix' && profile?.pixKey ? `<div class="row"><span class="lbl">Chave PIX</span><span class="val">${profile.pixKey}</span></div>` : ''}
  ${ride.paymentMethod === 'pix' && profile?.pixBank ? `<div class="row"><span class="lbl">Banco</span><span class="val">${profile.pixBank}</span></div>` : ''}
</div>

${ride.observations ? `<div class="section"><div class="section-title">Observações</div><p style="color:#555">${ride.observations}</p></div>` : ''}

<div class="footer">
  <p style="font-size:14px;font-weight:bold;color:#374151;margin-bottom:6px">Obrigado pela preferência! 🙏</p>
  <p>Este recibo é válido por 90 dias &nbsp;|&nbsp; Código: ${ride.receiptCode}</p>
  <p>${ride.receiptUrl || ''}</p>
</div>
</body>
</html>`;
};

export const pdfService = {
  async generate(ride: RideWithUser): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(buildReceiptHtml(ride), { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  },
};
