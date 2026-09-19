/**
 * Módulo «Exportación .ics»: genera un calendario iCalendar (RFC 5545) con
 * los vencimientos del año para importarlo en Google Calendar u Outlook.
 *
 * La vista previa muestra el archivo tal como se descarga, porque un .ics
 * mal formado falla en silencio al importarlo y conviene poder inspeccionarlo.
 */
import { useMemo, useState } from 'react';
import { CalendarArrowDown, Info } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Interruptor,
  Llamado,
  Seleccion,
  Tarjeta,
  Vacio,
} from '../brand/ui';
import { construirICS, type EventoICS } from '../domain/ics';
import { exportarICS } from '../lib/exportar';
import { fechaCorta } from '../lib/formato';
import { useEstado } from '../store';
import { BarraConfiguracion, useCalendario } from './Configuracion';

export function PanelExportacion() {
  const { config, setConfig, obligaciones, responsables } = useEstado();
  const { ocurrencias } = useCalendario();

  const [soloPendientes, setSoloPendientes] = useState(false);
  const [filtroResponsable, setFiltroResponsable] = useState('');

  const seleccionadas = ocurrencias
    .filter((o) => (soloPendientes ? o.vencimiento >= config.hoy : true))
    .filter((o) => {
      if (!filtroResponsable) return true;
      return obligaciones.find((x) => x.id === o.obligacionId)?.responsableId === filtroResponsable;
    });

  const eventos: EventoICS[] = useMemo(
    () =>
      seleccionadas.map((o) => {
        const ob = obligaciones.find((x) => x.id === o.obligacionId);
        const responsable = responsables.find((r) => r.id === ob?.responsableId);
        return {
          // El UID debe ser estable: si se reimporta, actualiza en vez de duplicar.
          uid: `${o.obligacionId}-${o.anioPeriodo}-${o.mesCierre}@niand-labs`,
          fecha: o.vencimiento,
          titulo: `${ob?.nombre ?? 'Obligación'} · ${o.periodo}`,
          descripcion: [
            ob?.descripcion,
            ob?.norma && `Norma: ${ob.norma}`,
            ob?.autoridad && `Autoridad: ${ob.autoridad}`,
            responsable && `Responsable: ${responsable.nombre}`,
            'Fecha orientativa: confirme el decreto anual de plazos.',
          ]
            .filter(Boolean)
            .join('\n'),
          recordatorioDias: config.recordatorioDias,
        };
      }),
    [seleccionadas, obligaciones, responsables, config.recordatorioDias],
  );

  const ics = useMemo(
    () => construirICS(eventos, { nombre: `Vencimientos ${config.anio} · ${config.razonSocial}` }),
    [eventos, config.anio, config.razonSocial],
  );

  const octetos = new TextEncoder().encode(ics).length;

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Eventos en el archivo" valor={String(eventos.length)} tono="marca" />
        <Dato
          rotulo="Recordatorio"
          valor={
            config.recordatorioDias > 0 ? `${config.recordatorioDias} días antes` : 'Sin alarma'
          }
        />
        <Dato rotulo="Tamaño" valor={`${(octetos / 1024).toFixed(1)} kB`} />
      </div>

      <Tarjeta
        titulo="Opciones de exportación"
        descripcion="El archivo usa eventos de día completo y UID estables para no duplicar al reimportar."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Días de recordatorio" ayuda="Cero desactiva la alarma.">
            {(id) => (
              <Entrada
                id={id}
                type="number"
                min={0}
                max={30}
                value={config.recordatorioDias}
                onChange={(e) => setConfig({ recordatorioDias: Number(e.target.value) })}
              />
            )}
          </Campo>

          <Campo etiqueta="Responsable">
            {(id) => (
              <Seleccion
                id={id}
                value={filtroResponsable}
                onChange={(e) => setFiltroResponsable(e.target.value)}
              >
                <option value="">Todos</option>
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <div className="flex items-end gap-3">
            <Interruptor
              activo={soloPendientes}
              onChange={setSoloPendientes}
              etiqueta="Exportar solo lo pendiente"
            />
            <span className="pb-2 text-sm">Solo desde {fechaCorta(config.hoy)}</span>
          </div>

          <div className="flex items-end">
            <Boton
              className="w-full"
              onClick={() => exportarICS(ics, `calendario-${config.anio}`)}
              disabled={eventos.length === 0}
            >
              <CalendarArrowDown size={16} /> Descargar .ics
            </Boton>
          </div>
        </div>
      </Tarjeta>

      <Llamado tono="info" icono={<Info size={18} />}>
        <p>
          Para importarlo: en Google Calendar, <em>Configuración → Importar y exportar</em>; en
          Outlook, <em>Archivo → Abrir y exportar → Importar</em>. Los eventos se crean como de día
          completo y marcados <span className="font-mono text-xs">TRANSP:TRANSPARENT</span>, de modo
          que no bloquean la disponibilidad en la agenda.
        </p>
      </Llamado>

      <Tarjeta
        titulo="Vista previa del archivo"
        descripcion="Exactamente lo que se descarga, con el plegado de líneas del RFC 5545."
      >
        {eventos.length === 0 ? (
          <Vacio titulo="No hay eventos que exportar">
            Active obligaciones en el catálogo o amplíe los filtros.
          </Vacio>
        ) : (
          <pre className="max-h-96 overflow-auto rounded-xl border border-borde bg-superficie-2 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {ics}
          </pre>
        )}
      </Tarjeta>
    </div>
  );
}
