import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, MessageCircle, CarTaxiFront, CheckCircle, Clock, MapPin } from 'lucide-react';
import api from '../services/api';
import { Ride } from '../types';

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX', voucher: 'Voucher',
};

export default function ReciboPaginaPublica() {
  const { code } = useParams<{ code: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    api.get(`/receipts/public/${code}`)
      .then(r => setRide(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Recibo não encontrado'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/receipts/public/${code}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao gerar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleWhatsApp = () => {
    if (!ride) return;
    const text = encodeURIComponent(
      `🚕 Meu recibo de viagem #${String(ride.receiptNumber).padStart(4, '0')}\n` +
      `${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-taxi-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !ride) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🚕</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Recibo não encontrado</h1>
        <p className="text-gray-500">{error || 'Este recibo não existe ou expirou.'}</p>
      </div>
    </div>
  );

  const profile = ride.user?.profile;
  const themeColor = profile?.themeColor || '#F5C518';
  const extras = JSON.parse(ride.extras || '[]') as { description: string; value: number }[];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-4" style={{ background: themeColor }}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-1">
              {profile?.logoUrl
                ? <img src={profile.logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                : <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                    <CarTaxiFront className="w-6 h-6 text-white" />
                  </div>
              }
              <div>
                <h1 className="font-bold text-black text-lg leading-tight">{profile?.fullName}</h1>
                <p className="text-black/70 text-sm">{profile?.licensePlate} · {profile?.carModel} {profile?.carColor}</p>
              </div>
            </div>
          </div>
          <div className="bg-black/10 px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-black/60 text-xs font-medium">RECIBO</p>
              <p className="text-black font-bold text-xl">#{String(ride.receiptNumber).padStart(4, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-black/60 text-xs">{formatDate(ride.rideDate)}</p>
              <p className="text-black font-bold text-2xl">{formatCurrency(ride.totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Passenger */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Passageiro</h2>
          </div>
          <p className="text-gray-900 font-semibold">{ride.passengerName}</p>
        </div>

        {/* Route */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-taxi-yellow" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Trajeto</h2>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-0.5 h-6 bg-gray-200 my-0.5" />
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Origem</p>
                  <p className="text-sm text-gray-800 font-medium">{ride.originAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Destino</p>
                  <p className="text-sm text-gray-800 font-medium">{ride.destAddress}</p>
                </div>
              </div>
            </div>
            {(ride.distanceKm || ride.durationMinutes) && (
              <div className="flex gap-4 pt-1 border-t border-gray-50">
                {ride.distanceKm && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{ride.distanceKm} km</span>
                  </div>
                )}
                {ride.durationMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{ride.durationMinutes} min</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Valores</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Corrida base</span>
              <span className="font-medium">{formatCurrency(ride.baseValue)}</span>
            </div>
            {extras.map((e, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{e.description}</span>
                <span className="font-medium">{formatCurrency(e.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100" style={{ color: themeColor }}>
              <span>Total</span>
              <span>{formatCurrency(ride.totalValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pagamento</span>
              <span className="font-medium text-gray-700">{PAYMENT_LABELS[ride.paymentMethod] || ride.paymentMethod}</span>
            </div>
            {ride.paymentMethod === 'pix' && profile?.pixKey && (
              <div className="bg-purple-50 rounded-lg p-2 text-xs text-center">
                <p className="text-gray-500">Chave PIX</p>
                <p className="font-mono font-medium text-gray-800">{profile.pixKey}</p>
                {profile.pixBank && <p className="text-gray-400">{profile.pixBank}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Observations */}
        {ride.observations && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Observações</h2>
            <p className="text-sm text-gray-700">{ride.observations}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 mb-4">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full py-3 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition-opacity"
            style={{ background: themeColor }}
          >
            {downloadingPdf ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-full py-3 rounded-xl font-semibold bg-green-500 text-white flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Compartilhar no WhatsApp
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-4 space-y-1">
          <p className="font-medium text-gray-600">Obrigado pela preferência! 🙏</p>
          <p>Código: <span className="font-mono">{ride.receiptCode}</span></p>
          <p>Habilitação: {profile?.licenseNumber}</p>
          <p>Válido por 90 dias a partir da emissão</p>
        </div>
      </div>
    </div>
  );
}
