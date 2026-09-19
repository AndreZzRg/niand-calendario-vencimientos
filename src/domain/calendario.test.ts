/**
 * Cada prueba nombra el supuesto normativo o de formato que verifica, no el
 * detalle de implementación. Si una regla cambia, la prueba que hay que
 * tocar se encuentra por el nombre.
 */
import { describe, expect, it } from 'vitest';

import {
  PERIODICIDADES,
  calendarioAnual,
  diaHabilDelMes,
  enRango,
  etiquetaPeriodo,
  fechaVencimiento,
  ocurrenciasDe,
  porMes,
  posicionDigito,
  type Obligacion,
} from './obligaciones';
import { construirICS, escaparTexto, plegarLinea, selloUTC, type EventoICS } from './ics';
import { esHabil, festivosDe } from '../lib/fechas';

/* ════════════════════════════════════════════════════════════════
   Escalonamiento por dígito del NIT
   ════════════════════════════════════════════════════════════════ */

describe('orden del calendario escalonado de la DIAN', () => {
  it('ordena los dígitos 1 a 9 y deja el 0 de último', () => {
    expect(posicionDigito(1)).toBe(0);
    expect(posicionDigito(5)).toBe(4);
    expect(posicionDigito(9)).toBe(8);
    expect(posicionDigito(0)).toBe(9);
  });

  it('normaliza dígitos fuera del rango', () => {
    expect(posicionDigito(10)).toBe(9);
    expect(posicionDigito(12)).toBe(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Días hábiles del mes
   ════════════════════════════════════════════════════════════════ */

describe('enésimo día hábil del mes', () => {
  it('devuelve siempre un día hábil', () => {
    for (let mes = 1; mes <= 12; mes++) {
      for (const ordinal of [1, 5, 10]) {
        expect(esHabil(diaHabilDelMes(2026, mes, ordinal))).toBe(true);
      }
    }
  });

  it('salta el fin de semana cuando el mes empieza en sábado', () => {
    // Agosto de 2026 empieza en sábado; el primer hábil es el lunes 3.
    expect(diaHabilDelMes(2026, 8, 1)).toBe('2026-08-03');
  });

  it('salta el festivo cuando el primer hábil coincide con uno', () => {
    // El 1 de enero es festivo y conserva su fecha (Ley 51 de 1983, art. 2).
    const primero = diaHabilDelMes(2026, 1, 1);
    expect(primero).not.toBe('2026-01-01');
    expect(esHabil(primero)).toBe(true);
  });

  it('avanza un día hábil por cada ordinal', () => {
    const uno = diaHabilDelMes(2026, 6, 1);
    const dos = diaHabilDelMes(2026, 6, 2);
    expect(dos > uno).toBe(true);
  });

  it('rechaza un ordinal menor que uno', () => {
    expect(() => diaHabilDelMes(2026, 1, 0)).toThrow(RangeError);
  });
});

/* ════════════════════════════════════════════════════════════════
   Reglas de vencimiento
   ════════════════════════════════════════════════════════════════ */

describe('reglas de vencimiento', () => {
  it('el día fijo se corre al siguiente hábil si cae en día no hábil', () => {
    const venc = fechaVencimiento({ tipo: 'diaFijo', dia: 20 }, 2026, 6, 1);
    expect(esHabil(venc)).toBe(true);
  });

  it('el día fijo se ajusta al último día de un mes corto', () => {
    const venc = fechaVencimiento({ tipo: 'diaFijo', dia: 31 }, 2026, 2, 1);
    // Febrero de 2026 tiene 28 días; el vencimiento no puede caer en el 31.
    expect(venc.startsWith('2026-0')).toBe(true);
    expect(Number(venc.slice(8, 10))).toBeLessThanOrEqual(28 + 3);
  });

  it('cada dígito del NIT vence un día hábil después que el anterior', () => {
    const regla = { tipo: 'digitoNIT', habilBase: 7 } as const;
    const uno = fechaVencimiento(regla, 2026, 3, 1);
    const dos = fechaVencimiento(regla, 2026, 3, 2);
    const cero = fechaVencimiento(regla, 2026, 3, 0);

    expect(dos > uno).toBe(true);
    // El cero es el último del escalonamiento.
    expect(cero > dos).toBe(true);
  });

  it('todos los vencimientos escalonados caen en día hábil', () => {
    for (let digito = 0; digito <= 9; digito++) {
      const venc = fechaVencimiento({ tipo: 'digitoNIT', habilBase: 7 }, 2026, 5, digito);
      expect(esHabil(venc)).toBe(true);
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   Periodos y ocurrencias
   ════════════════════════════════════════════════════════════════ */

const obligacion = (p: Partial<Obligacion> = {}): Obligacion => ({
  id: 'o1',
  nombre: 'Obligación de prueba',
  descripcion: '',
  norma: '',
  autoridad: '',
  periodicidad: 'mensual',
  regla: { tipo: 'diaFijo', dia: 15 },
  mesAncla: 1,
  desfaseMeses: 1,
  responsableId: 'r1',
  activa: true,
  ...p,
});

describe('etiqueta del periodo', () => {
  it('nombra el mes en la periodicidad mensual', () => {
    expect(etiquetaPeriodo(2026, 3, 1)).toBe('marzo de 2026');
  });

  it('nombra el rango en la bimestral', () => {
    expect(etiquetaPeriodo(2026, 4, 2)).toBe('marzo-abril de 2026');
  });

  it('nombra el año en la anual', () => {
    expect(etiquetaPeriodo(2026, 12, 12)).toBe('año 2026');
  });
});

describe('ocurrencias de una obligación', () => {
  it('la mensual produce doce vencimientos al año', () => {
    const oc = ocurrenciasDe(obligacion(), 2026, 7);
    expect(oc).toHaveLength(12);
  });

  it('la bimestral produce seis', () => {
    const oc = ocurrenciasDe(obligacion({ periodicidad: 'bimestral' }), 2026, 7);
    expect(oc).toHaveLength(6);
  });

  it('la trimestral produce cuatro y la anual una', () => {
    expect(ocurrenciasDe(obligacion({ periodicidad: 'trimestral' }), 2026, 7)).toHaveLength(4);
    expect(
      ocurrenciasDe(obligacion({ periodicidad: 'anual', desfaseMeses: 4 }), 2026, 7),
    ).toHaveLength(1);
  });

  it('todas las ocurrencias caen dentro del año pedido', () => {
    for (const oc of ocurrenciasDe(obligacion(), 2026, 7)) {
      expect(oc.vencimiento.startsWith('2026-')).toBe(true);
    }
  });

  it('quedan ordenadas por fecha de vencimiento', () => {
    const fechas = ocurrenciasDe(obligacion(), 2026, 7).map((o) => o.vencimiento);
    expect(fechas).toEqual([...fechas].sort());
  });

  it('el desfase corre el vencimiento al mes siguiente al cierre', () => {
    const oc = ocurrenciasDe(obligacion(), 2026, 7);

    // Con desfase de un mes, el primer vencimiento del año corresponde al
    // periodo de diciembre anterior, que se declara en enero.
    const primera = oc[0];
    expect(primera?.periodo).toBe('diciembre de 2025');
    expect(primera?.vencimiento.slice(5, 7)).toBe('01');

    // Y el periodo de enero se declara en febrero.
    const segunda = oc[1];
    expect(segunda?.periodo).toBe('enero de 2026');
    expect(segunda?.vencimiento.slice(5, 7)).toBe('02');
  });

  it('un desfase de cero hace vencer la obligación dentro del propio periodo', () => {
    const oc = ocurrenciasDe(obligacion({ desfaseMeses: 0 }), 2026, 7);
    const primera = oc[0];
    expect(primera?.periodo).toContain('enero');
    expect(primera?.vencimiento.slice(5, 7)).toBe('01');
  });

  it('no repite un mismo periodo', () => {
    const oc = ocurrenciasDe(obligacion(), 2026, 7);
    const claves = oc.map((o) => `${o.anioPeriodo}-${o.mesCierre}`);
    expect(new Set(claves).size).toBe(claves.length);
  });
});

describe('calendario anual', () => {
  const obligaciones = [
    obligacion({ id: 'a' }),
    obligacion({ id: 'b', periodicidad: 'bimestral' }),
    obligacion({ id: 'c', activa: false }),
  ];

  it('ignora las obligaciones inactivas', () => {
    const oc = calendarioAnual(obligaciones, 2026, 7);
    expect(oc.some((o) => o.obligacionId === 'c')).toBe(false);
    expect(oc).toHaveLength(18);
  });

  it('queda ordenado por vencimiento', () => {
    const fechas = calendarioAnual(obligaciones, 2026, 7).map((o) => o.vencimiento);
    expect(fechas).toEqual([...fechas].sort());
  });

  it('filtra por rango inclusive en ambos extremos', () => {
    const todas = calendarioAnual(obligaciones, 2026, 7);
    const primera = todas[0];
    if (!primera) throw new Error('Se esperaba al menos una ocurrencia.');

    const soloPrimera = enRango(todas, primera.vencimiento, primera.vencimiento);
    expect(soloPrimera.length).toBeGreaterThanOrEqual(1);
    expect(soloPrimera.every((o) => o.vencimiento === primera.vencimiento)).toBe(true);

    expect(enRango(todas, '2026-01-01', '2026-12-31')).toHaveLength(todas.length);
    expect(enRango(todas, '2027-01-01', '2027-12-31')).toHaveLength(0);
  });

  it('agrupa por mes de vencimiento', () => {
    const mapa = porMes(calendarioAnual(obligaciones, 2026, 7));
    const total = [...mapa.values()].reduce((s, l) => s + l.length, 0);
    expect(total).toBe(18);
    for (const mes of mapa.keys()) {
      expect(mes).toBeGreaterThanOrEqual(1);
      expect(mes).toBeLessThanOrEqual(12);
    }
  });

  it('cambiar el dígito del NIT mueve los vencimientos escalonados', () => {
    const escalonada = [obligacion({ regla: { tipo: 'digitoNIT', habilBase: 7 } })];
    const conUno = calendarioAnual(escalonada, 2026, 1).map((o) => o.vencimiento);
    const conCero = calendarioAnual(escalonada, 2026, 0).map((o) => o.vencimiento);
    expect(conUno).not.toEqual(conCero);
  });

  it('describe cada periodicidad con su número de meses', () => {
    expect(PERIODICIDADES.mensual.meses).toBe(1);
    expect(PERIODICIDADES.anual.meses).toBe(12);
    expect(Object.keys(PERIODICIDADES)).toHaveLength(6);
  });
});

/* ════════════════════════════════════════════════════════════════
   Festivos: control de que el calendario base es el colombiano
   ════════════════════════════════════════════════════════════════ */

describe('calendario de festivos', () => {
  it('reconoce los dieciocho festivos nacionales', () => {
    expect(festivosDe(2026).size).toBe(18);
  });
});

/* ════════════════════════════════════════════════════════════════
   iCalendar (RFC 5545)
   ════════════════════════════════════════════════════════════════ */

describe('escape de texto iCalendar (§3.3.11)', () => {
  it('escapa la contrabarra, el punto y coma y la coma', () => {
    expect(escaparTexto('a\\b')).toBe('a\\\\b');
    expect(escaparTexto('a;b')).toBe('a\\;b');
    expect(escaparTexto('a,b')).toBe('a\\,b');
  });

  it('convierte el salto de línea en la secuencia literal', () => {
    expect(escaparTexto('a\nb')).toBe('a\\nb');
    expect(escaparTexto('a\r\nb')).toBe('a\\nb');
  });

  it('deja intacto el texto sin caracteres reservados', () => {
    expect(escaparTexto('Declaración de renta')).toBe('Declaración de renta');
  });
});

describe('plegado de líneas (§3.1)', () => {
  it('no toca una línea corta', () => {
    expect(plegarLinea('SUMMARY:corto')).toBe('SUMMARY:corto');
  });

  it('pliega con CRLF más espacio y ninguna línea supera 75 octetos', () => {
    const larga = 'DESCRIPTION:' + 'a'.repeat(300);
    const plegada = plegarLinea(larga);

    expect(plegada).toContain('\r\n ');
    for (const linea of plegada.split('\r\n')) {
      expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    }
  });

  it('cuenta octetos y no caracteres al plegar texto con tildes', () => {
    const larga = 'DESCRIPTION:' + 'á'.repeat(200);
    for (const linea of plegarLinea(larga).split('\r\n')) {
      expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    }
  });

  it('el desplegado reconstruye el texto original', () => {
    const original = 'DESCRIPTION:' + 'á'.repeat(120);
    const reconstruido = plegarLinea(original).split('\r\n ').join('');
    expect(reconstruido).toBe(original);
  });
});

describe('construcción del calendario', () => {
  const eventos: EventoICS[] = [
    {
      uid: 'uno@niand',
      fecha: '2026-03-17',
      titulo: 'Declaración de retención en la fuente',
      descripcion: 'Periodo febrero de 2026; norma: art. 604 del ET.',
      recordatorioDias: 3,
    },
  ];
  const ics = construirICS(eventos, {
    nombre: 'Vencimientos',
    ahora: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)),
  });

  it('abre y cierra el componente VCALENDAR con la versión exigida', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:');
  });

  it('usa CRLF en todas las líneas', () => {
    const sinCRLF = ics.split('\r\n').filter((l) => l.includes('\n'));
    expect(sinCRLF).toHaveLength(0);
  });

  it('declara el evento como de día completo con DTEND exclusivo', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20260317');
    // El día siguiente: un evento de un solo día termina el 18.
    expect(ics).toContain('DTEND;VALUE=DATE:20260318');
  });

  it('incluye la alarma cuando se pide recordatorio', () => {
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-P3D');
    expect(ics).toContain('END:VALARM');
  });

  it('omite la alarma cuando el recordatorio es cero', () => {
    const sinAlarma = construirICS([{ ...eventos[0]!, recordatorioDias: 0 }], {
      nombre: 'x',
      ahora: new Date(Date.UTC(2026, 0, 1)),
    });
    expect(sinAlarma).not.toContain('BEGIN:VALARM');
  });

  it('escapa el punto y coma de la descripción', () => {
    expect(ics).toContain('\\;');
  });

  it('produce la misma salida para la misma marca de tiempo', () => {
    const otra = construirICS(eventos, {
      nombre: 'Vencimientos',
      ahora: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)),
    });
    expect(otra).toBe(ics);
  });

  it('genera un calendario válido aunque no haya eventos', () => {
    const vacio = construirICS([], { nombre: 'Vacío', ahora: new Date(Date.UTC(2026, 0, 1)) });
    expect(vacio).toContain('BEGIN:VCALENDAR');
    expect(vacio).not.toContain('BEGIN:VEVENT');
  });
});

describe('marca de tiempo UTC', () => {
  it('produce el formato AAAAMMDDTHHMMSSZ con ceros a la izquierda', () => {
    expect(selloUTC(new Date(Date.UTC(2026, 0, 5, 9, 7, 3)))).toBe('20260105T090703Z');
  });
});
