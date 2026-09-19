/**
 * Módulo «Calendario»: vista anual por meses, con el semáforo de proximidad
 * de cada vencimiento y el detalle de los festivos que desplazaron la fecha.
 */
import { Insignia, Llamado, Semaforo, Tarjeta, Vacio } from '../brand/ui';
import { PERIODICIDADES, porMes } from '../domain/obligaciones';
import { fechaConDia, fechaCorta } from '../lib/formato';
import { desdeISO, festivosDe, nombreFestivo } from '../lib/fechas';
import { useEstado } from '../store';
import { BarraConfiguracion, ROTULO_ESTADO, TONO_ESTADO, useCalendario } from './Configuracion';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export function PanelCalendario() {
  const { config, obligaciones, responsables } = useEstado();
  const { ocurrencias } = useCalendario();
  const agrupado = porMes(ocurrencias);

  const festivos = [...festivosDe(config.anio).entries()].sort(([a], [b]) => a.localeCompare(b));

  const nombreDe = (id: string) => obligaciones.find((o) => o.id === id)?.nombre ?? 'Obligación';

  if (ocurrencias.length === 0) {
    return (
      <div className="space-y-6">
        <BarraConfiguracion />
        <Vacio titulo="No hay obligaciones activas">
          Active alguna obligación en el catálogo para ver el calendario del año.
        </Vacio>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <Llamado tono="info">
        <p>
          Calendario {config.anio} de <strong>{config.razonSocial}</strong> · último dígito del NIT{' '}
          <strong>{config.ultimoDigito}</strong> · {ocurrencias.length} vencimientos.
        </p>
      </Llamado>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MESES.map((rotulo, indice) => {
          const mes = indice + 1;
          const delMes = agrupado.get(mes) ?? [];

          return (
            <Tarjeta key={rotulo} titulo={rotulo} descripcion={`${delMes.length} vencimiento(s)`}>
              {delMes.length === 0 ? (
                <p className="text-sm text-texto-3">Sin vencimientos.</p>
              ) : (
                <ul className="space-y-3">
                  {delMes.map((o) => (
                    <li key={`${o.obligacionId}-${o.periodo}`} className="flex gap-3">
                      <Semaforo tono={TONO_ESTADO[o.estado]} titulo={ROTULO_ESTADO[o.estado]} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{nombreDe(o.obligacionId)}</p>
                        <p className="text-xs text-texto-3">
                          {fechaConDia(o.vencimiento)} · {o.periodo}
                        </p>
                        <p className="text-xs text-texto-3">
                          {responsables.find(
                            (r) =>
                              r.id ===
                              obligaciones.find((x) => x.id === o.obligacionId)?.responsableId,
                          )?.nombre ?? 'Sin asignar'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta
        titulo={`Festivos nacionales de ${config.anio}`}
        descripcion="Ley 51 de 1983: solo algunos conservan su fecha; los demás se trasladan al lunes siguiente."
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {festivos.map(([iso, nombre]) => (
            <li key={iso} className="flex items-center gap-2 text-sm">
              <Insignia tono="neutro">{fechaCorta(iso)}</Insignia>
              <span className="min-w-0 truncate">{nombre}</span>
              {desdeISO(iso).getDay() === 1 && nombreFestivo(iso) && (
                <span className="text-xs text-texto-3">(lunes)</span>
              )}
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta
        titulo="Distribución por periodicidad"
        descripcion="Cuántos vencimientos aporta cada ritmo de cumplimiento."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {Object.entries(PERIODICIDADES).map(([clave, { rotulo }]) => {
            const cuantas = ocurrencias.filter(
              (o) => obligaciones.find((x) => x.id === o.obligacionId)?.periodicidad === clave,
            ).length;
            return (
              <li
                key={clave}
                className="flex items-center justify-between rounded-xl border border-borde bg-superficie-3 px-4 py-2 text-sm"
              >
                <span>{rotulo}</span>
                <span className="cifra font-semibold">{cuantas}</span>
              </li>
            );
          })}
        </ul>
      </Tarjeta>
    </div>
  );
}
