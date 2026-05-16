import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Send, MessageCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Ride } from '../types';

const schema = z.object({
  rideDate: z.string().min(1, 'Data obrigatória'),
  passengerName: z.string().min(2, 'Nome obrigatório'),
  passengerEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  passengerPhone: z.string().optional(),
  originAddress: z.string().min(3, 'Origem obrigatória'),
  destAddress: z.string().min(3, 'Destino obrigatório'),
  distanceKm: z.coerce.number().min(0).optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  baseValue: z.coerce.number().min(0.01, 'Valor obrigatório'),
  extras: z.array(z.object({ description: z.string().min(1, 'Descrição obrigatória'), value: z.coerce.number().min(0) })).optional().default([]),
  paymentMethod: z.enum(['dinheiro', 'cartao', 'pix', 'voucher']),
  observations: z.string().optional(),
  sendEmail: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const PAYMENT_OPTIONS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
  { value: 'voucher', label: 'Voucher' },
];

export default function NovaViagemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createdRide, setCreatedRide] = useState<Ride | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const { register, handleSubmit, watch, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      rideDate: localNow,
      paymentMethod: 'dinheiro',
      extras: [],
      sendEmail: false,
    },
  });

  const { fields: extraFields, append, remove } = useFieldArray({ control, name: 'extras' });
  const watchedExtras = watch('extras') ?? [];
  const baseValue = watch('baseValue') || 0;
  const totalExtras = watchedExtras.reduce((s, e) => s + (Number(e?.value) || 0), 0);
  const totalValue = Number(baseValue) + totalExtras;

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/rides', data);
      setCreatedRide(res.data.data);
      toast.success('Corrida registrada com sucesso!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao registrar corrida';
      toast.error(msg);
    }
  };

  const handleSendEmail = async () => {
    if (!createdRide) return;
    setSendingEmail(true);
    try {
      await api.post(`/rides/${createdRide.id}/send-email`);
      toast.success('E-mail enviado com sucesso!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao enviar e-mail';
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleWhatsApp = () => {
    if (!createdRide) return;
    const profile = user?.profile;
    const text = encodeURIComponent(
      `🚕 *Recibo de Viagem #${String(createdRide.receiptNumber).padStart(4, '0')}*\n\n` +
      `Taxista: ${profile?.fullName || ''}\n` +
      `Placa: ${profile?.licensePlate || ''}\n\n` +
      `📍 Origem: ${createdRide.originAddress}\n` +
      `📍 Destino: ${createdRide.destAddress}\n\n` +
      `💰 Total: ${createdRide.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` +
      `🔗 Ver recibo completo: ${window.location.origin}/recibo/${createdRide.receiptCode}`
    );
    const phone = createdRide.passengerPhone?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone ? phone : ''}?text=${text}`, '_blank');
  };

  const handleDownloadPdf = async () => {
    if (!createdRide) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/receipts/${createdRide.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${createdRide.receiptCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleNewRide = () => {
    setCreatedRide(null);
    reset();
  };

  if (createdRide) {
    return (
      <div className="space-y-5">
        <div className="card p-5 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Corrida Registrada!</h2>
          <p className="text-gray-500 text-sm mt-1">Recibo #{String(createdRide.receiptNumber).padStart(4, '0')} criado para {createdRide.passengerName}</p>
          <p className="text-2xl font-bold text-taxi-yellow mt-2">
            {createdRide.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="space-y-3">
          {createdRide.passengerEmail && (
            <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-primary w-full">
              {sendingEmail ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {sendingEmail ? 'Enviando e-mail...' : 'Enviar por E-mail'}
            </button>
          )}

          <button onClick={handleWhatsApp} className="btn-secondary w-full border-green-200 text-green-700 hover:bg-green-50">
            <MessageCircle className="w-4 h-4" />
            Enviar por WhatsApp
          </button>

          <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="btn-secondary w-full">
            {downloadingPdf ? <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>

          <button onClick={() => window.open(`/recibo/${createdRide.receiptCode}`, '_blank')} className="btn-secondary w-full text-sm">
            Ver recibo online
          </button>
        </div>

        <button onClick={handleNewRide} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
          + Registrar nova corrida
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nova Viagem</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados da corrida</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dados da viagem */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Dados da Viagem</h2>
          <div>
            <label className="label">Data e Hora</label>
            <input {...register('rideDate')} type="datetime-local" className="input-field" />
            {errors.rideDate && <p className="error-text">{errors.rideDate.message}</p>}
          </div>
          <div>
            <label className="label">Origem</label>
            <input {...register('originAddress')} placeholder="Endereço de partida" className="input-field" />
            {errors.originAddress && <p className="error-text">{errors.originAddress.message}</p>}
          </div>
          <div>
            <label className="label">Destino</label>
            <input {...register('destAddress')} placeholder="Endereço de chegada" className="input-field" />
            {errors.destAddress && <p className="error-text">{errors.destAddress.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Distância (km)</label>
              <input {...register('distanceKm')} type="number" step="0.1" min="0" placeholder="0.0" className="input-field" />
            </div>
            <div>
              <label className="label">Duração (min)</label>
              <input {...register('durationMinutes')} type="number" min="0" placeholder="0" className="input-field" />
            </div>
          </div>
        </div>

        {/* Passageiro */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Passageiro</h2>
          <div>
            <label className="label">Nome do Passageiro</label>
            <input {...register('passengerName')} placeholder="Nome completo" className="input-field" />
            {errors.passengerName && <p className="error-text">{errors.passengerName.message}</p>}
          </div>
          <div>
            <label className="label">E-mail (para envio do recibo)</label>
            <input {...register('passengerEmail')} type="email" placeholder="passageiro@email.com" className="input-field" />
            {errors.passengerEmail && <p className="error-text">{errors.passengerEmail.message}</p>}
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input {...register('passengerPhone')} placeholder="55 11 99999-9999" className="input-field" />
          </div>
        </div>

        {/* Valores */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Valores</h2>
          <div>
            <label className="label">Valor da corrida (R$)</label>
            <input {...register('baseValue')} type="number" step="0.01" min="0" placeholder="0,00" className="input-field" />
            {errors.baseValue && <p className="error-text">{errors.baseValue.message}</p>}
          </div>

          <div>
            <label className="label">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-taxi-yellow transition-colors has-[:checked]:border-taxi-yellow has-[:checked]:bg-taxi-yellow/10">
                  <input {...register('paymentMethod')} type="radio" value={opt.value} className="accent-yellow-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Taxas extras</label>
              <button type="button" onClick={() => append({ description: '', value: 0 })} className="text-xs text-taxi-yellow font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            {extraFields.map((field, i) => (
              <div key={field.id} className="flex gap-2 mb-2">
                <input {...register(`extras.${i}.description`)} placeholder="Ex: Pedágio" className="input-field flex-1" />
                <input {...register(`extras.${i}.value`)} type="number" step="0.01" min="0" placeholder="0,00" className="input-field w-24" />
                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Total preview */}
          <div className="bg-taxi-yellow/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Observações */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Extras</h2>
          <div>
            <label className="label">Observações</label>
            <textarea {...register('observations')} placeholder="Alguma observação sobre a viagem..." className="input-field h-20 resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('sendEmail')} type="checkbox" className="w-4 h-4 accent-yellow-400 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Enviar recibo por e-mail ao finalizar</span>
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-base py-3">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Registrando...
            </span>
          ) : 'Registrar Corrida'}
        </button>
      </form>
    </div>
  );
}
