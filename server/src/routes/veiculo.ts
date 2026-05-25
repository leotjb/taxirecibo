import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export const veiculoRouter = Router();
veiculoRouter.use(authenticate);

type TipoPlaca = 'antiga' | 'mercosul' | 'invalida';

const normalizarPlaca = (placa: string): string =>
  placa.replace(/[-\s]/g, '').toUpperCase().slice(0, 7);

const detectarTipo = (placa: string): TipoPlaca => {
  const p = normalizarPlaca(placa);
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return 'antiga';
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p)) return 'mercosul';
  return 'invalida';
};

/**
 * GET /api/veiculo/placa/:placa
 *
 * Fase 1 (atual): valida formato e retorna tipo da placa.
 * Fase 2 (após contratar API): integra Consulta Placas / Placa Fácil / SERPRO
 * para retornar marca, modelo, cor, ano, situação e proprietário.
 */
veiculoRouter.get('/placa/:placa', async (req, res, next) => {
  try {
    const placa = normalizarPlaca(req.params.placa);
    const tipo = detectarTipo(placa);

    if (tipo === 'invalida') {
      return next(createError('Formato de placa inválido. Use ABC-1234 (antigo) ou ABC1D23 (Mercosul).', 400));
    }

    // ── Fase 2: API comercial ─────────────────────────────────────────────
    // Para ativar, configure a variável CONSULTA_PLACAS_TOKEN no Railway e
    // descomente o bloco abaixo (exemplo com consultaplacas.com.br):
    //
    // if (process.env.CONSULTA_PLACAS_TOKEN) {
    //   const resp = await fetch(
    //     `https://api.consultaplacas.com.br/v1/placa/${placa}`,
    //     { headers: { Authorization: `Bearer ${process.env.CONSULTA_PLACAS_TOKEN}` } }
    //   );
    //   if (resp.ok) {
    //     const dados = await resp.json();
    //     return res.json({
    //       success: true,
    //       data: {
    //         placa,
    //         tipo,
    //         marca: dados.marca,
    //         modelo: dados.modelo,
    //         cor: dados.cor,
    //         ano: dados.anoFabricacao,
    //         situacao: dados.situacao?.toLowerCase() === 'regular' ? 'regular' : 'irregular',
    //       },
    //     });
    //   }
    // }
    // ─────────────────────────────────────────────────────────────────────

    // Fase 1: retorna apenas validação de formato
    res.json({
      success: true,
      data: {
        placa: `${placa.slice(0, 3)}-${placa.slice(3)}`,
        tipo,
        mensagem: tipo === 'mercosul'
          ? 'Placa padrão Mercosul (emitida a partir de 2018)'
          : 'Placa padrão antigo (anterior a 2018)',
      },
    });
  } catch (err) {
    next(err);
  }
});
