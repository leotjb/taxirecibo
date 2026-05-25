import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { mascaraPlaca, validarPlaca, detectarTipo } from '../utils/placa';
import api from '../services/api';

interface DadosVeiculo {
  placa: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  ano?: number;
  situacao?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onVeiculoEncontrado?: (dados: DadosVeiculo) => void;
  error?: string;
}

export default function PlacaInput({ value, onChange, onVeiculoEncontrado, error }: Props) {
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<DadosVeiculo | null>(null);
  const [erroConsulta, setErroConsulta] = useState('');

  const tipo = detectarTipo(value);
  const valida = validarPlaca(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = mascaraPlaca(e.target.value);
    onChange(masked);
    setResultado(null);
    setErroConsulta('');
  };

  const consultarPlaca = async () => {
    if (!valida) return;
    setConsultando(true);
    setErroConsulta('');
    try {
      const { data } = await api.get(`/veiculo/placa/${value.replace('-', '')}`);
      if (data.success && data.data) {
        setResultado(data.data);
        if (onVeiculoEncontrado) onVeiculoEncontrado(data.data);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Não foi possível consultar a placa';
      setErroConsulta(msg);
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={handleChange}
            placeholder="ABC-1234 ou ABC1D23"
            maxLength={8}
            className={`input-field uppercase tracking-widest font-mono pr-8 ${
              value.length >= 7 && !valida ? 'border-red-400 focus:ring-red-400' : ''
            } ${valida ? 'border-green-400 focus:ring-green-400' : ''}`}
          />
          {value.length >= 7 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {valida
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <XCircle className="w-4 h-4 text-red-400" />
              }
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={consultarPlaca}
          disabled={!valida || consultando}
          title="Consultar dados do veículo"
          className={`px-3 py-2 rounded-lg border font-medium text-sm flex items-center gap-1 transition-all ${
            valida && !consultando
              ? 'bg-taxi-yellow border-taxi-yellow text-black hover:opacity-90'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700'
          }`}
        >
          {consultando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Search className="w-4 h-4" />
          }
          <span className="hidden sm:inline">{consultando ? 'Consultando...' : 'Consultar'}</span>
        </button>
      </div>

      {/* Status da placa */}
      {valida && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Placa válida •{' '}
          <span className="font-medium">
            {tipo === 'mercosul' ? 'Padrão Mercosul (2018+)' : 'Padrão antigo'}
          </span>
        </p>
      )}
      {value.length >= 7 && !valida && (
        <p className="text-xs text-red-500">
          Formato inválido. Use ABC-1234 (antigo) ou ABC1D23 (Mercosul)
        </p>
      )}
      {error && <p className="error-text">{error}</p>}

      {/* Resultado da consulta */}
      {resultado && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-400 mb-1">✓ Veículo encontrado</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-green-700 dark:text-green-300">
            {resultado.marca && <span><b>Marca:</b> {resultado.marca}</span>}
            {resultado.modelo && <span><b>Modelo:</b> {resultado.modelo}</span>}
            {resultado.cor && <span><b>Cor:</b> {resultado.cor}</span>}
            {resultado.ano && <span><b>Ano:</b> {resultado.ano}</span>}
            {resultado.situacao && (
              <span className={resultado.situacao === 'regular' ? 'text-green-600' : 'text-red-600'}>
                <b>Situação:</b> {resultado.situacao}
              </span>
            )}
          </div>
        </div>
      )}

      {erroConsulta && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ {erroConsulta}
        </div>
      )}
    </div>
  );
}
