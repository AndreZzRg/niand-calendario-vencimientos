/**
 * Generación de calendarios iCalendar (RFC 5545).
 *
 * El formato es estricto en tres puntos que suelen romper los importadores
 * de Google Calendar y Outlook, y que aquí se respetan explícitamente:
 *
 *  · Las líneas terminan en CRLF y no pueden exceder 75 octetos: las más
 *    largas se pliegan continuándolas con un espacio (RFC 5545, §3.1).
 *  · En los valores de texto hay que escapar `\`, `;`, `,` y los saltos de
 *    línea (§3.3.11).
 *  · Un evento de día completo usa `VALUE=DATE` y su `DTEND` es exclusivo,
 *    es decir, el día siguiente (§3.6.1).
 */

import { sumarDias, type FechaISO } from '../lib/fechas';

export interface EventoICS {
  /** Identificador único y estable del evento. */
  readonly uid: string;
  readonly fecha: FechaISO;
  readonly titulo: string;
  readonly descripcion: string;
  /** Días de antelación del recordatorio. Cero o negativo lo omite. */
  readonly recordatorioDias: number;
}

/** Escapa un valor de texto conforme al §3.3.11. */
export function escaparTexto(valor: string): string {
  return valor
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Pliega una línea a 75 octetos. El corte se hace contando bytes UTF-8, no
 * caracteres: una tilde ocupa dos octetos y partir por caracteres produciría
 * líneas inválidas en un calendario con texto en español.
 */
export function plegarLinea(linea: string): string {
  const codificador = new TextEncoder();
  if (codificador.encode(linea).length <= 75) return linea;

  const partes: string[] = [];
  let actual = '';
  let octetos = 0;
  // La primera línea admite 75 octetos; las continuaciones, 74 más el espacio.
  let limite = 75;

  for (const caracter of linea) {
    const ancho = codificador.encode(caracter).length;
    if (octetos + ancho > limite) {
      partes.push(actual);
      actual = '';
      octetos = 0;
      limite = 74;
    }
    actual += caracter;
    octetos += ancho;
  }
  if (actual) partes.push(actual);

  return partes.join('\r\n ');
}

/** `AAAAMMDD`, que es la forma de una fecha sin hora en iCalendar. */
function fechaICS(iso: FechaISO): string {
  return iso.replace(/-/g, '');
}

/** Marca de tiempo UTC `AAAAMMDDTHHMMSSZ`. */
export function selloUTC(momento: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${momento.getUTCFullYear()}${p(momento.getUTCMonth() + 1)}${p(momento.getUTCDate())}` +
    `T${p(momento.getUTCHours())}${p(momento.getUTCMinutes())}${p(momento.getUTCSeconds())}Z`
  );
}

/**
 * Construye el calendario completo. `ahora` se recibe como parámetro para
 * que la salida sea determinista y se pueda comparar en una prueba.
 */
export function construirICS(
  eventos: readonly EventoICS[],
  opciones: { readonly nombre: string; readonly ahora?: Date } = { nombre: 'Vencimientos' },
): string {
  const ahora = opciones.ahora ?? new Date();
  const sello = selloUTC(ahora);

  const lineas: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NiAnd Labs//Calendario de Vencimientos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaparTexto(opciones.nombre)}`,
    'X-WR-TIMEZONE:America/Bogota',
  ];

  for (const e of eventos) {
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${fechaICS(e.fecha)}`,
      // DTEND es exclusivo: un evento de un día termina al día siguiente.
      `DTEND;VALUE=DATE:${fechaICS(sumarDias(e.fecha, 1))}`,
      `SUMMARY:${escaparTexto(e.titulo)}`,
      `DESCRIPTION:${escaparTexto(e.descripcion)}`,
      'TRANSP:TRANSPARENT',
    );

    if (e.recordatorioDias > 0) {
      lineas.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `TRIGGER:-P${Math.trunc(e.recordatorioDias)}D`,
        `DESCRIPTION:${escaparTexto(`Recordatorio: ${e.titulo}`)}`,
        'END:VALARM',
      );
    }

    lineas.push('END:VEVENT');
  }

  lineas.push('END:VCALENDAR');

  return lineas.map(plegarLinea).join('\r\n') + '\r\n';
}
