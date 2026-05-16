import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Send, Copy, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Ride } from '../types';

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX', voucher: 'Voucher',
};

const badgeClass: Record<string, string> = {
  dinheiro: 'bg-green-100 text-green-700',
  cartao: 'bg-blue-100 text-blue-700',
  pix: 'bg-purple-100 text-purple-700',
  voucher: 'bg-amber-100 text-amber-700',
};

export default function HistoricoPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (paymentFilter) params.set('paymentMethod', paymentFilter);
      const { data } = await api.get(`/rides?${params}`);
      setRides(data.data);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentFilter]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const handleSendEmail = async (ride: Ride) => {
    if (!ride.passengerEmail) return toast.error('Passageiro sem e-mail');
    setSendingId(ride.id);
    try {
      await api.post(`/rides/${ride.id}/send-email`);
      toast.success('E-mail enviado!');
      fetchRides();
    } catch {
      toast.error('Erro ao enviar e-mail');
    } finally {
      setSendingId(null);
    }
  };

  const handleDuplicate = async (ride: Ride) => {
    try {
      await api.post(`/rides/${ride.id}/duplicate`);
      toast.success('Corrida duplicada!');
      navigate('/nova-viagem');
    } catch {
      toast.error('Erro ao duplicar');
    }
  };

  const handleDownloadPdf = async (ride: Ride) => {
    try {
      const res = await api.get(`/receipts/${ride.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${ride.receiptCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Histórico de Corridas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} corridas registradas</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por passageiro ou destino..."
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={paymentFilter}
            onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}
            className="input-field pl-9 pr-8 appearance-none min-w-0 w-auto"
          >
            <option value="">Todos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="pix">PIX</option>
            <option value="voucher">Voucher</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-taxi-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rides.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Nenhuma corrida encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rides.map(ride => (
            <div key={ride.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === ride.id ? null : ride.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{ride.passengerName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeClass[ride.paymentMethod] || 'bg-gray-100 text-gray-600'}`}>
                      {PAYMENT_LABELS[ride.paymentMethod] || ride.paymentMethod}
                    </span>
                    {ride.emailSent && <span className="text-xs text-green-500">✓ Email</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{ride.destAddress}</p>
                  <p className="text-xs text-gray-400">{formatDate(ride.rideDate)} · #{String(ride.receiptNumber).padStart(4, '0')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(ride.totalValue)}</p>
                </div>
              </button>

              {expandedId === ride.id && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-50 dark:border-gray-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-400">Origem:</span><p className="text-gray-700 dark:text-gray-200 text-xs">{ride.originAddress}</p></div>
                    <div><span className="text-gray-400">Destino:</span><p className="text-gray-700 dark:text-gray-200 text-xs">{ride.destAddress}</p></div>
                    {ride.distanceKm && <div><span className="text-gray-400">Distância:</span><p className="text-gray-700 dark:text-gray-200 text-xs">{ride.distanceKm} km</p></div>}
                    {ride.durationMinutes && <div><span className="text-gray-400">Duração:</span><p className="text-gray-700 dark:text-gray-200 text-xs">{ride.durationMinutes} min</p></div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ride.passengerEmail && (
                      <button onClick={() => handleSendEmail(ride)} disabled={sendingId === ride.id} className="btn-primary text-xs py-1.5 px-3">
                        {sendingId === ride.id ? <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
                        E-mail
                      </button>
                    )}
                    <button onClick={() => window.open(`/recibo/${ride.receiptCode}`, '_blank')} className="btn-secondary text-xs py-1.5 px-3">
                      <Eye className="w-3 h-3" /> Ver
                    </button>
                    <button onClick={() => handleDownloadPdf(ride)} className="btn-secondary text-xs py-1.5 px-3">
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    <button onClick={() => handleDuplicate(ride)} className="btn-secondary text-xs py-1.5 px-3">
                      <Copy className="w-3 h-3" /> Duplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3">Anterior</button>
          <span className="text-sm text-gray-500">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1.5 px-3">Próxima</button>
        </div>
      )}
    </div>
  );
}
