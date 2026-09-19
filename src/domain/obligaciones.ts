/**
 * Modelo de las obligaciones periódicas de cumplimiento y de sus reglas de
 * vencimiento.
 *
 * En Colombia el día de vencimiento rara vez es una fecha fija: depende del
 * calendario de días hábiles y, para buena parte de las obligaciones ante la
 * DIAN, del último dígito del NIT. Estas reglas se modelan explícitamente
 * para que el resultado se pueda auditar contra el decreto que las fija, en
 * lugar de quedar escondidas en una lista de fechas escritas a mano.
 */

import { aISO, desdeISO, siguienteHabil, sumarHabiles, type FechaISO } from '../lib/fechas';

/* ── Periodicidad ─────────────────────────────────────────────────── */

export type Periodicidad =
  'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual';

export const PERIODICIDADES: Record<Periodicidad, { rotulo: string; meses: number }> = {
  mensual: { rotulo: 'Mensual', meses: 1 },
  bimestral: { rotulo: 'Bimestral', meses: 2 },
  trimestral: { rotulo: 'Trimestral', meses: 3 },
  cuatrimestral: { rotulo: 'Cuatrimestral', meses: 4 },
  semestral: { rotulo: 'Semestral', meses: 6 },
  anual: { rotulo: 'Anual', meses: 12 },
};

/* ── Reglas de vencimiento ────────────────────────────────────────── */

/**
 * · `diaFijo`    — día del mes; si cae en día no hábil se corre al siguiente
 *                  hábil, que es la regla general del art. 62 de la Ley 4 de
 *                  1913 y de la práctica administrativa.
 * · `diaHabil`   — enésimo día hábil del mes (p. ej. los aportes a seguridad
 *                  social del Decreto 1990 de 2016).
 * · `digitoNIT`  — calendario escalonado de la DIAN: a partir de un día hábil
 *                  base, cada último dígito del NIT vence un día hábil
 *                  después, en el orden 1, 2, … 9, 0.
 */
export type ReglaVencimiento =
  | { readonly tipo: 'diaFijo'; readonly dia: number }
  | { readonly tipo: 'diaHabil'; readonly ordinal: number }
  | { readonly tipo: 'digitoNIT'; readonly habilBase: number };

export interface Obligacion {
  readonly id: string;
  nombre: string;
  descripcion: string;
  /** Acto normativo que fija la obligación y su plazo. */
  norma: string;
  autoridad: string;
  periodicidad: Periodicidad;
  regla: ReglaVencimiento;
  /**
   * Mes en que empieza el primer periodo del año (1 a 12). Para la mensual
   * es siempre enero; para las demás marca el arranque del ciclo.
   */
  mesAncla: number;
  /** Meses entre el cierre del periodo y su vencimiento. */
  desfaseMeses: number;
  responsableId: string;
  activa: boolean;
}

/* ── Cálculo del día de vencimiento ───────────────────────────────── */

/** Orden en que la DIAN escalona los vencimientos: 1, 2, … 9 y por último 0. */
export function posicionDigito(digito: number): number {
  const d = ((digito % 10) + 10) % 10;
  return d === 0 ? 9 : d - 1;
}

/** Enésimo día hábil de un mes (`ordinal` empieza en 1). */
export function diaHabilDelMes(anio: number, mes: number, ordinal: number): FechaISO {
  if (ordinal < 1) throw new RangeError('El ordinal del día hábil empieza en 1.');

  // `siguienteHabil` devuelve la propia fecha cuando ya es hábil, así que
  // esto resuelve el primer día hábil del mes caiga donde caiga el día uno.
  const primero = siguienteHabil(aISO(new Date(anio, mes - 1, 1)));
  return ordinal === 1 ? primero : sumarHabiles(primero, ordinal - 1);
}

/**
 * Fecha de vencimiento de un periodo, dado el mes en que se vence.
 * `ultimoDigitoNIT` solo se usa cuando la regla es escalonada.
 */
export function fechaVencimiento(
  regla: ReglaVencimiento,
  anio: number,
  mes: number,
  ultimoDigitoNIT: number,
): FechaISO {
  switch (regla.tipo) {
    case 'diaFijo': {
      // Un día mayor que la duración del mes se ajusta al último día.
      const ultimo = new Date(anio, mes, 0).getDate();
      const dia = Math.min(Math.max(regla.dia, 1), ultimo);
      return siguienteHabil(aISO(new Date(anio, mes - 1, dia)));
    }
    case 'diaHabil':
      return diaHabilDelMes(anio, mes, regla.ordinal);
    case 'digitoNIT':
      return diaHabilDelMes(anio, mes, regla.habilBase + posicionDigito(ultimoDigitoNIT));
  }
}

/* ── Periodos y ocurrencias ───────────────────────────────────────── */

export interface Ocurrencia {
  readonly obligacionId: string;
  /** Etiqueta legible del periodo declarado, p. ej. «marzo-abril de 2026». */
  readonly periodo: string;
  /** Mes en que cierra el periodo (1 a 12) y su año. */
  readonly anioPeriodo: number;
  readonly mesCierre: number;
  readonly vencimiento: FechaISO;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

function nombreMes(mes: number): string {
  return MESES[(((mes - 1) % 12) + 12) % 12] ?? '';
}

/** Etiqueta del periodo que cierra en `mesCierre` con `duracion` meses. */
export function etiquetaPeriodo(anio: number, mesCierre: number, duracion: number): string {
  if (duracion === 1) return `${nombreMes(mesCierre)} de ${anio}`;
  if (duracion === 12) return `año ${anio}`;
  const mesInicio = mesCierre - duracion + 1;
  // Un periodo que arranca el año anterior conserva el año de cierre.
  const inicio = mesInicio <= 0 ? nombreMes(mesInicio + 12) : nombreMes(mesInicio);
  return `${inicio}-${nombreMes(mesCierre)} de ${anio}`;
}

/**
 * Ocurrencias de una obligación durante un año calendario, tomando como
 * referencia la fecha de vencimiento (no la de cierre del periodo).
 */
export function ocurrenciasDe(
  o: Obligacion,
  anio: number,
  ultimoDigitoNIT: number,
): readonly Ocurrencia[] {
  const duracion = PERIODICIDADES[o.periodicidad].meses;
  const desfase = Math.max(0, Math.trunc(o.desfaseMeses));

  // Mes en que cierra el primer periodo del ciclo (1 a 12).
  const primerCierre = o.mesAncla + duracion - 1;
  const ocurrencias: Ocurrencia[] = [];

  // Se examinan los cierres del año anterior y del propio año: con un
  // desfase de hasta doce meses, ambos pueden vencer dentro de `anio`.
  for (const anioCierre of [anio - 1, anio]) {
    for (let mesCierre = 1; mesCierre <= 12; mesCierre++) {
      // ¿Este mes cierra un periodo del ciclo?
      const distancia = mesCierre - primerCierre;
      if (((distancia % duracion) + duracion) % duracion !== 0) continue;

      // El vencimiento cae `desfase` meses después del cierre.
      const absoluto = mesCierre + desfase;
      const anioVenc = anioCierre + Math.floor((absoluto - 1) / 12);
      const mesVenc = ((absoluto - 1) % 12) + 1;
      if (anioVenc !== anio) continue;

      ocurrencias.push({
        obligacionId: o.id,
        periodo: etiquetaPeriodo(anioCierre, mesCierre, duracion),
        anioPeriodo: anioCierre,
        mesCierre,
        vencimiento: fechaVencimiento(o.regla, anioVenc, mesVenc, ultimoDigitoNIT),
      });
    }
  }

  return ocurrencias.sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
}

/** Ocurrencias de todas las obligaciones activas de un año, ya ordenadas. */
export function calendarioAnual(
  obligaciones: readonly Obligacion[],
  anio: number,
  ultimoDigitoNIT: number,
): readonly Ocurrencia[] {
  return obligaciones
    .filter((o) => o.activa)
    .flatMap((o) => ocurrenciasDe(o, anio, ultimoDigitoNIT))
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
}

/**
 * Ocurrencias dentro de un rango de fechas, inclusive en ambos extremos.
 * Es genérica para no perder los campos que la interfaz añade a cada
 * ocurrencia, como el estado del semáforo.
 */
export function enRango<T extends Ocurrencia>(
  ocurrencias: readonly T[],
  desde: FechaISO,
  hasta: FechaISO,
): readonly T[] {
  return ocurrencias.filter((o) => o.vencimiento >= desde && o.vencimiento <= hasta);
}

/** Agrupa las ocurrencias por mes de vencimiento, para pintar el calendario. */
export function porMes<T extends Ocurrencia>(
  ocurrencias: readonly T[],
): ReadonlyMap<number, readonly T[]> {
  const mapa = new Map<number, T[]>();
  for (const o of ocurrencias) {
    const mes = desdeISO(o.vencimiento).getMonth() + 1;
    const lista = mapa.get(mes) ?? [];
    lista.push(o);
    mapa.set(mes, lista);
  }
  return mapa;
}
