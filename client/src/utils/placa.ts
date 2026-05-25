export type TipoPlaca = 'antiga' | 'mercosul' | 'invalida';

/** Remove traços, espaços e converte para maiúsculas */
export const normalizarPlaca = (placa: string): string =>
  placa.replace(/[-\s]/g, '').toUpperCase().slice(0, 7);

/** Detecta o tipo da placa */
export const detectarTipo = (placa: string): TipoPlaca => {
  const p = normalizarPlaca(placa);
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return 'antiga';
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p)) return 'mercosul';
  return 'invalida';
};

/** Retorna true se a placa for válida */
export const validarPlaca = (placa: string): boolean =>
  detectarTipo(placa) !== 'invalida';

/** Formata a placa com traço: ABC-1234 ou ABC1D23 */
export const formatarPlaca = (raw: string): string => {
  const p = normalizarPlaca(raw);
  if (p.length < 4) return p;
  return `${p.slice(0, 3)}-${p.slice(3)}`;
};

/** Aplica máscara enquanto o usuário digita */
export const mascaraPlaca = (raw: string): string => {
  const letras = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (letras.length <= 3) return letras;
  return `${letras.slice(0, 3)}-${letras.slice(3)}`;
};
