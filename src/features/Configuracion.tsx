/**
 * Barra de configuración común a todos los módulos y derivaciones
 * compartidas. El año y el último dígito del NIT determinan todas las
 * fechas, así que están siempre a la vista en lugar de escondidos en un menú.
 */
import { useMemo, useState } from 'react';
import { Building2, ChevronDown, CircleAlert, RotateCcw, Settings2 } from 'lucide-react';

import { Boton, Campo, Entrada, Insignia, Llamado, Seleccion, cx, type Tono } from '../brand/ui';
import { calendarioAnual, type Ocurrencia } from '../domain/obligaciones';
import { estadoPlazo, habilesEntre, type EstadoPlazo } from '../lib/fechas';
import { useEstado } from '../store';

/** Color del semáforo de proximidad de un plazo. */
export const TONO_ESTADO: Record<EstadoPlazo, Tono> = {
  vencido: 'riesgo',
  critico: 'riesgo',
  proximo: 'alerta',
  holgado: 'ok',
};

export const ROTULO_ESTADO: Record<EstadoPlazo, string> = {
  vencido: 'Vencido',
  critico: 'Crítico',
  proximo: 'Próximo',
  holgado: 'Holgado',
};

export interface OcurrenciaConEstado extends Ocurrencia {
  readonly estado: EstadoPlazo;
  /** Días hábiles que faltan; negativo si ya venció. */
  readonly habilesRestantes: number;
}

/**
 * Calendario del año con el estado de cada vencimiento respecto de la fecha
 * de referencia. Se calcula en un único lugar para que los módulos no
 * puedan mostrar semáforos que se contradigan.
 */
export function useCalendario() {
  const { config, obligaciones } = useEstado();

  return useMemo(() => {
    const ocurrencias = calendarioAnual(obligaciones, config.anio, config.ultimoDigito);

    const conEstado: OcurrenciaConEstado[] = ocurrencias.map((o) => ({
      ...o,
      estado: estadoPlazo(o.vencimiento, config.hoy),
      habilesRestantes: habilesEntre(config.hoy, o.vencimiento),
    }));

    return {
      ocurrencias: conEstado,
      vencidos: conEstado.filter((o) => o.estado === 'vencido'),
      criticos: conEstado.filter((o) => o.estado === 'critico'),
      proximos: conEstado.filter((o) => o.estado === 'proximo'),
    };
  }, [obligaciones, config.anio, config.ultimoDigito, config.hoy]);
}

/**
 * Barra de contexto. Va plegada por omisión: estos parámetros se fijan una
 * vez, pero el resumen debe quedar siempre visible porque el año y el
 * último dígito del NIT determinan todas las fechas que se muestran.
 */
export function BarraConfiguracion() {
  const { config, setConfig, reiniciar } = useEstado();
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-borde bg-superficie shadow-ni-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-marca-tenue text-marca">
            <Building2 size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{config.razonSocial}</p>
            <p className="truncate text-xs text-texto-3">
              NIT {config.nit} · último dígito {config.ultimoDigito} · calendario {config.anio}
            </p>
          </div>

          <Insignia tono="alerta">
            <CircleAlert size={11} /> Plazos por confirmar
          </Insignia>

          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
          >
            <Settings2 size={14} /> Parámetros
            <ChevronDown
              size={14}
              className={cx('transition-transform', abierta && 'rotate-180')}
            />
          </Boton>
        </div>

        {abierta && (
          <div className="border-t border-borde bg-superficie-3 px-4 py-4">
            <Llamado
              tono="alerta"
              titulo="Los plazos se fijan cada año por decreto"
              icono={<CircleAlert size={18} />}
              className="mb-4"
            >
              <p>
                El escalonamiento por último dígito del NIT reproduce el patrón habitual del
                calendario tributario, pero el <strong>decreto anual de plazos</strong> puede
                moverlo. Confirme cada fecha contra el decreto vigente antes de comprometer una
                declaración.
              </p>
            </Llamado>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Campo etiqueta="Razón social">
                {(id) => (
                  <Entrada
                    id={id}
                    value={config.razonSocial}
                    onChange={(e) => setConfig({ razonSocial: e.target.value })}
                  />
                )}
              </Campo>

              <Campo etiqueta="NIT" ayuda="Sin dígito de verificación.">
                {(id) => (
                  <Entrada
                    id={id}
                    inputMode="numeric"
                    value={config.nit}
                    onChange={(e) => {
                      const nit = e.target.value.replace(/\D/g, '');
                      const ultimo = nit.slice(-1);
                      setConfig({
                        nit,
                        ...(ultimo ? { ultimoDigito: Number(ultimo) } : {}),
                      });
                    }}
                  />
                )}
              </Campo>

              <Campo etiqueta="Último dígito" ayuda="Se toma del NIT; puede ajustarlo.">
                {(id) => (
                  <Seleccion
                    id={id}
                    value={config.ultimoDigito}
                    onChange={(e) => setConfig({ ultimoDigito: Number(e.target.value) })}
                  >
                    {Array.from({ length: 10 }, (_, d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Seleccion>
                )}
              </Campo>

              <Campo etiqueta="Año del calendario">
                {(id) => (
                  <Entrada
                    id={id}
                    type="number"
                    min={2020}
                    max={2100}
                    value={config.anio}
                    onChange={(e) => setConfig({ anio: Number(e.target.value) })}
                  />
                )}
              </Campo>

              <Campo etiqueta="Fecha de referencia" ayuda="Determina el semáforo.">
                {(id) => (
                  <Entrada
                    id={id}
                    type="date"
                    value={config.hoy}
                    onChange={(e) => setConfig({ hoy: e.target.value })}
                  />
                )}
              </Campo>
            </div>

            <div className="mt-4 flex justify-end">
              <Boton variante="fantasma" tamano="sm" onClick={reiniciar}>
                <RotateCcw size={14} /> Reiniciar todo
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
