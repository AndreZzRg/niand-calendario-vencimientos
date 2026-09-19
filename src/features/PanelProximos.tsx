/**
 * Módulo «Próximos vencimientos»: lo que hay que atender ahora, ordenado por
 * urgencia. El semáforo se mide en días hábiles, no calendario, porque es
 * el plazo real del que dispone quien tiene que preparar la declaración.
 */
import { useState } from 'react';
import { CalendarClock, TriangleAlert } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Insignia,
  Llamado,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { exportarCSV } from '../lib/exportar';
import { fechaConDia, fechaCorta, plural } from '../lib/formato';
import { useEstado } from '../store';
import {
  BarraConfiguracion,
  ROTULO_ESTADO,
  TONO_ESTADO,
  useCalendario,
  type OcurrenciaConEstado,
} from './Configuracion';

export function PanelProximos() {
  const { config, obligaciones, responsables } = useEstado();
  const { ocurrencias, vencidos, criticos, proximos } = useCalendario();
  const [filtroResponsable, setFiltroResponsable] = useState('');

  const obligacionDe = (id: string) => obligaciones.find((o) => o.id === id);

  /** Desde la fecha de referencia en adelante, más lo ya vencido y sin atender. */
  const pendientes = ocurrencias
    .filter((o) => o.estado !== 'holgado' || o.vencimiento >= config.hoy)
    .filter((o) => {
      if (!filtroResponsable) return true;
      return obligacionDe(o.obligacionId)?.responsableId === filtroResponsable;
    })
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));

  function exportar() {
    exportarCSV(
      [
        [
          'Vencimiento',
          'Obligación',
          'Periodo',
          'Autoridad',
          'Responsable',
          'Estado',
          'Días hábiles',
        ],
        ...pendientes.map((o) => {
          const ob = obligacionDe(o.obligacionId);
          return [
            o.vencimiento,
            ob?.nombre ?? '',
            o.periodo,
            ob?.autoridad ?? '',
            responsables.find((r) => r.id === ob?.responsableId)?.nombre ?? '',
            ROTULO_ESTADO[o.estado],
            o.habilesRestantes,
          ];
        }),
      ],
      'proximos-vencimientos',
    );
  }

  function fila(o: OcurrenciaConEstado) {
    const ob = obligacionDe(o.obligacionId);
    return (
      <tr key={`${o.obligacionId}-${o.periodo}`}>
        <Td>
          <span className="font-mono text-xs">{fechaCorta(o.vencimiento)}</span>
          <span className="block text-xs text-texto-3">{fechaConDia(o.vencimiento)}</span>
        </Td>
        <Td>
          <span className="font-medium">{ob?.nombre ?? 'Obligación'}</span>
          <span className="block text-xs text-texto-3">{o.periodo}</span>
        </Td>
        <Td>{ob?.autoridad ?? '—'}</Td>
        <Td>{responsables.find((r) => r.id === ob?.responsableId)?.nombre ?? 'Sin asignar'}</Td>
        <Td>
          <Insignia tono={TONO_ESTADO[o.estado]}>{ROTULO_ESTADO[o.estado]}</Insignia>
        </Td>
        <Td numerico className="font-medium">
          {o.habilesRestantes < 0
            ? `hace ${plural(Math.abs(o.habilesRestantes), 'día hábil', 'días hábiles')}`
            : plural(o.habilesRestantes, 'día hábil', 'días hábiles')}
        </Td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato rotulo="Vencidos" valor={String(vencidos.length)} tono="riesgo" />
        <Dato
          rotulo="Críticos"
          valor={String(criticos.length)}
          detalle="5 días hábiles o menos"
          tono="riesgo"
        />
        <Dato
          rotulo="Próximos"
          valor={String(proximos.length)}
          detalle="15 días hábiles o menos"
          tono="alerta"
        />
        <Dato rotulo="Total del año" valor={String(ocurrencias.length)} tono="marca" />
      </div>

      {vencidos.length > 0 && (
        <Llamado
          tono="riesgo"
          titulo={`Hay ${vencidos.length} vencimiento(s) que ya pasaron`}
          icono={<TriangleAlert size={18} />}
        >
          <p>
            Medidos contra la fecha de referencia ({fechaCorta(config.hoy)}). Un plazo vencido puede
            acarrear sanción por extemporaneidad e intereses de mora.
          </p>
        </Llamado>
      )}

      <Tarjeta
        titulo="Agenda de cumplimiento"
        descripcion={`Desde ${fechaCorta(config.hoy)} en adelante, más lo vencido.`}
        acciones={
          <>
            <div className="w-52">
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
            </div>
            {pendientes.length > 0 && (
              <Boton variante="secundario" tamano="sm" onClick={exportar}>
                Exportar CSV
              </Boton>
            )}
          </>
        }
      >
        {pendientes.length === 0 ? (
          <Vacio titulo="No queda nada pendiente" accion={<CalendarClock size={20} />}>
            No hay vencimientos por atender con los filtros actuales.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Vencimiento</Th>
                <Th>Obligación</Th>
                <Th>Autoridad</Th>
                <Th>Responsable</Th>
                <Th>Estado</Th>
                <Th numerico>Plazo</Th>
              </tr>
            </thead>
            <tbody>{pendientes.map(fila)}</tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
