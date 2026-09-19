/**
 * Estado de la aplicación. Persiste en `localStorage` bajo el prefijo del
 * repositorio; nada viaja a un servidor.
 *
 * El estado guarda **reglas**, no fechas: las ocurrencias se derivan del
 * dominio en cada render. Así, al cambiar el año o el último dígito del NIT
 * el calendario entero se recalcula y no quedan fechas viejas guardadas.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenZustand } from './lib/almacen';
import type { Obligacion } from './domain/obligaciones';

export interface Responsable {
  readonly id: string;
  nombre: string;
  cargo: string;
  correo: string;
}

export interface Configuracion {
  /** Fecha de referencia para el semáforo de proximidad. */
  hoy: string;
  anio: number;
  razonSocial: string;
  nit: string;
  /** Último dígito del NIT, sin el de verificación. */
  ultimoDigito: number;
  /** Días de antelación del recordatorio en el archivo .ics. */
  recordatorioDias: number;
}

export interface Estado {
  config: Configuracion;
  obligaciones: Obligacion[];
  responsables: Responsable[];

  setConfig: (p: Partial<Configuracion>) => void;

  agregarObligacion: (o: Obligacion) => void;
  editarObligacion: (id: string, p: Partial<Obligacion>) => void;
  borrarObligacion: (id: string) => void;

  agregarResponsable: (r: Responsable) => void;
  editarResponsable: (id: string, p: Partial<Responsable>) => void;
  borrarResponsable: (id: string) => void;

  reiniciar: () => void;
}

/** Identificador estable sin depender de `crypto.randomUUID`. */
export function nuevoId(prefijo = 'id'): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const RESPONSABLES: Responsable[] = [
  {
    id: 'res-contabilidad',
    nombre: 'Dirección de contabilidad',
    cargo: 'Contador público',
    correo: 'contabilidad@ejemplo.co',
  },
  {
    id: 'res-talento',
    nombre: 'Gestión de talento humano',
    cargo: 'Jefe de talento humano',
    correo: 'nomina@ejemplo.co',
  },
  {
    id: 'res-cumplimiento',
    nombre: 'Oficial de cumplimiento',
    cargo: 'Oficial de cumplimiento',
    correo: 'cumplimiento@ejemplo.co',
  },
];

/**
 * Catálogo de arranque con las obligaciones más comunes de una pyme.
 *
 * Los días base de las reglas escalonadas corresponden al patrón habitual
 * del calendario tributario, pero el decreto de plazos se expide cada año:
 * la interfaz advierte que deben confirmarse antes de usarlos en firme.
 */
const OBLIGACIONES: Obligacion[] = [
  {
    id: 'obl-retefuente',
    nombre: 'Declaración de retención en la fuente',
    descripcion:
      'Declaración y pago de las retenciones practicadas a título de renta, IVA y timbre en el mes anterior.',
    norma: 'Estatuto Tributario, arts. 376 y 604; decreto anual de plazos.',
    autoridad: 'DIAN',
    periodicidad: 'mensual',
    regla: { tipo: 'digitoNIT', habilBase: 7 },
    mesAncla: 1,
    desfaseMeses: 1,
    responsableId: 'res-contabilidad',
    activa: true,
  },
  {
    id: 'obl-iva-bimestral',
    nombre: 'Declaración bimestral de IVA',
    descripcion:
      'Declaración y pago del impuesto sobre las ventas del bimestre para los responsables del art. 600, num. 1.',
    norma: 'Estatuto Tributario, art. 600; decreto anual de plazos.',
    autoridad: 'DIAN',
    periodicidad: 'bimestral',
    regla: { tipo: 'digitoNIT', habilBase: 7 },
    mesAncla: 1,
    desfaseMeses: 1,
    responsableId: 'res-contabilidad',
    activa: true,
  },
  {
    id: 'obl-seguridad-social',
    nombre: 'Aportes a seguridad social y parafiscales',
    descripcion:
      'Pago de la planilla integrada de liquidación de aportes (PILA) del periodo anterior.',
    norma: 'Decreto 1990 de 2016; Decreto 1833 de 2016.',
    autoridad: 'Operador de información PILA',
    periodicidad: 'mensual',
    regla: { tipo: 'diaHabil', ordinal: 5 },
    mesAncla: 1,
    desfaseMeses: 1,
    responsableId: 'res-talento',
    activa: true,
  },
  {
    id: 'obl-renta',
    nombre: 'Declaración de renta y complementarios',
    descripcion:
      'Declaración anual del impuesto sobre la renta de personas jurídicas, con pago en dos cuotas.',
    norma: 'Estatuto Tributario, art. 591; decreto anual de plazos.',
    autoridad: 'DIAN',
    periodicidad: 'anual',
    regla: { tipo: 'digitoNIT', habilBase: 5 },
    mesAncla: 1,
    desfaseMeses: 4,
    responsableId: 'res-contabilidad',
    activa: true,
  },
  {
    id: 'obl-ica',
    nombre: 'Declaración de industria y comercio',
    descripcion:
      'Declaración y pago del ICA ante el municipio; la periodicidad y el plazo los fija el acuerdo municipal.',
    norma: 'Ley 14 de 1983; acuerdo municipal aplicable.',
    autoridad: 'Secretaría de Hacienda municipal',
    periodicidad: 'bimestral',
    regla: { tipo: 'diaFijo', dia: 20 },
    mesAncla: 1,
    desfaseMeses: 1,
    responsableId: 'res-contabilidad',
    activa: true,
  },
  {
    id: 'obl-exogena',
    nombre: 'Información exógena',
    descripcion:
      'Reporte anual de información en medios magnéticos correspondiente al año gravable anterior.',
    norma: 'Estatuto Tributario, arts. 631 y 633; resolución anual de la DIAN.',
    autoridad: 'DIAN',
    periodicidad: 'anual',
    regla: { tipo: 'digitoNIT', habilBase: 3 },
    mesAncla: 1,
    desfaseMeses: 4,
    responsableId: 'res-contabilidad',
    activa: true,
  },
  {
    id: 'obl-sagrilaft',
    nombre: 'Informe del oficial de cumplimiento',
    descripcion:
      'Presentación del informe periódico del oficial de cumplimiento a la junta directiva.',
    norma: 'Circular Básica Jurídica de la Superintendencia de Sociedades.',
    autoridad: 'Junta directiva',
    periodicidad: 'trimestral',
    regla: { tipo: 'diaFijo', dia: 15 },
    mesAncla: 1,
    desfaseMeses: 1,
    responsableId: 'res-cumplimiento',
    activa: true,
  },
  {
    id: 'obl-estados-financieros',
    nombre: 'Estados financieros de fin de ejercicio',
    descripcion: 'Preparación y aprobación de los estados financieros por el máximo órgano social.',
    norma: 'Código de Comercio, art. 446; Ley 222 de 1995, art. 34.',
    autoridad: 'Asamblea o junta de socios',
    periodicidad: 'anual',
    regla: { tipo: 'diaFijo', dia: 31 },
    mesAncla: 1,
    desfaseMeses: 3,
    responsableId: 'res-contabilidad',
    activa: true,
  },
];

const INICIAL = {
  config: {
    hoy: '2026-09-17',
    anio: 2026,
    razonSocial: 'Compañía de Laboratorio S.A.S.',
    nit: '901234567',
    ultimoDigito: 7,
    recordatorioDias: 3,
  } satisfies Configuracion,
  obligaciones: OBLIGACIONES,
  responsables: RESPONSABLES,
};

export const useEstado = create<Estado>()(
  persist(
    (set) => ({
      ...structuredClone(INICIAL),

      setConfig: (p) => set((s) => ({ config: { ...s.config, ...p } })),

      agregarObligacion: (o) => set((s) => ({ obligaciones: [...s.obligaciones, o] })),
      editarObligacion: (id, p) =>
        set((s) => ({
          obligaciones: s.obligaciones.map((o) => (o.id === id ? { ...o, ...p } : o)),
        })),
      borrarObligacion: (id) =>
        set((s) => ({ obligaciones: s.obligaciones.filter((o) => o.id !== id) })),

      agregarResponsable: (r) => set((s) => ({ responsables: [...s.responsables, r] })),
      editarResponsable: (id, p) =>
        set((s) => ({
          responsables: s.responsables.map((r) => (r.id === id ? { ...r, ...p } : r)),
        })),
      borrarResponsable: (id) =>
        set((s) => ({
          responsables: s.responsables.filter((r) => r.id !== id),
          // Las obligaciones del responsable eliminado quedan sin asignar.
          obligaciones: s.obligaciones.map((o) =>
            o.responsableId === id ? { ...o, responsableId: '' } : o,
          ),
        })),

      reiniciar: () => set(structuredClone(INICIAL)),
    }),
    {
      name: 'estado',
      version: 1,
      storage: createJSONStorage(() => almacenZustand),
      partialize: (s) => ({
        config: s.config,
        obligaciones: s.obligaciones,
        responsables: s.responsables,
      }),
    },
  ),
);
