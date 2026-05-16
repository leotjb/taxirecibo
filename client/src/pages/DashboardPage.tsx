import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Car, CreditCard, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { DashboardData, Ride } from '../types';
import { useAuth } from '../contexts/AuthContext';

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const PAYMENT_COLORS: Record<string, string> = {
  dinheiro: '#22c55e',
  cartao: '#3b82f6',
  pix: '#a855f7',
  voucher: '#f59e0b',
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  voucher: 'Voucher',
};

const paymentBadge = (method: string) => {
  const colors: Record<string, string> = {
    dinheiro: 'bg-green-100 text-green-700',
    cartao: 'bg-blue-100 text-blue-700',
    pix: 'bg-purple-100 text-purple-700',
    voucher: 'bg-amber-100 text-amber-700',
  };
  return colors[method] || 'bg-gray-100 text-gray-700';
};

const StatCard = ({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
}) => (
  <div className="card p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const pieData = data
    ? Object.entries(data.paymentMethods).map(([k, v]) => ({
        name: PAYMENT_LABELS[k] || k,
        value: v,
        color: PAYMENT_COLORS[k] || '#9ca3af',
      }))
    : [];

  const name = user?.profile?.fullName?.split(' ')[0] || 'Taxista';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-taxi-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Olá, {name}!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aqui está seu resumo financeiro</p>
        </div>
        <Link to="/nova-viagem" className="btn-primary text-sm px-3 py-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Viagem</span>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Hoje"
          value={formatCurrency(data?.today.total ?? 0)}
          sub={`${data?.today.count ?? 0} corridas`}
          icon={TrendingUp}
          color="bg-taxi-yellow/20 text-yellow-700"
        />
        <StatCard
          label="Esta semana"
          value={formatCurrency(data?.week.total ?? 0)}
          sub={`${data?.week.count ?? 0} corridas`}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Este mês"
          value={formatCurrency(data?.month.total ?? 0)}
          sub={`${data?.month.count ?? 0} corridas`}
          icon={Car}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Maior corrida"
          value={formatCurrency(data?.maxRideValue ?? 0)}
          sub="valor histórico"
          icon={CreditCard}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Payment pie chart */}
      {pieData.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Formas de Pagamento</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} corridas`]} />
              <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-300">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent rides */}
      {(data?.recentRides?.length ?? 0) > 0 && (
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Últimas Corridas</h2>
            <Link to="/historico" className="text-xs text-taxi-yellow font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {data?.recentRides.map((ride: Ride) => (
              <div key={ride.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{ride.passengerName}</p>
                  <p className="text-xs text-gray-400 truncate">{ride.destAddress}</p>
                  <p className="text-xs text-gray-400">{formatDate(ride.rideDate)}</p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(ride.totalValue)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${paymentBadge(ride.paymentMethod)}`}>
                    {PAYMENT_LABELS[ride.paymentMethod] || ride.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.recentRides?.length ?? 0) === 0 && !loading && (
        <div className="card p-8 text-center">
          <Car className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma corrida ainda</p>
          <Link to="/nova-viagem" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Registrar primeira corrida
          </Link>
        </div>
      )}
    </div>
  );
}
