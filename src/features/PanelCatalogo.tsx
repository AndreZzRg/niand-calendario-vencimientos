/**
 * Módulo «Catálogo de obligaciones»: alta, edición y baja de las reglas de
 * recurrencia. Lo que se guarda es la regla, no la fecha: al cambiar el año
 * o el dígito del NIT, todo el calendario se recalcula solo.
 */
import { useState } from 'react';
import { ListPlus, Trash2 } from 'lucide-react';

import {
  Boton,
  Campo,
  Entrada,
  Insignia,
  Interruptor,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import {
  PERIODICIDADES,
  ocurrenciasDe,
  type Obligacion,
  type Periodicidad,
  type ReglaVencimiento,
} from '../domain/obligaciones';
import { exportarCSV } from '../lib/exportar';
import { fechaCorta } from '../lib/formato';
import { nuevoId, useEstado } from '../store';
import { BarraConfiguracion } from './Configuracion';

type TipoRegla = ReglaVencimiento['tipo'];

const ROTULO_REGLA: Record<TipoRegla, string> = {
  diaFijo: 'Día fijo del mes',
  diaHabil: 'Día hábil del mes',
  digitoNIT: 'Escalonada por dígito del NIT',
};

/** Descripción legible de una regla, para la tabla. */
export function describirRegla(r: ReglaVencimiento): string {
  switch (r.tipo) {
    case 'diaFijo':
      return `Día ${r.dia} (se corre al siguiente hábil)`;
    case 'diaHabil':
      return `${r.ordinal}.º día hábil`;
    case 'digitoNIT':
      return `Desde el ${r.habilBase}.º día hábil, escalonada`;
  }
}

const EN_BLANCO = {
  nombre: '',
  descripcion: '',
  norma: '',
  autoridad: '',
  periodicidad: 'mensual' as Periodicidad,
  tipoRegla: 'diaFijo' as TipoRegla,
  dia: 15,
  ordinal: 5,
  habilBase: 7,
  mesAncla: 1,
  desfaseMeses: 1,
  responsableId: '',
};

export function PanelCatalogo() {
  const {
    config,
    obligaciones,
    responsables,
    agregarObligacion,
    editarObligacion,
    borrarObligacion,
  } = useEstado();
  const [b, setB] = useState(EN_BLANCO);

  function reglaDe(borrador: typeof EN_BLANCO): ReglaVencimiento {
    switch (borrador.tipoRegla) {
      case 'diaFijo':
        return { tipo: 'diaFijo', dia: borrador.dia };
      case 'diaHabil':
        return { tipo: 'diaHabil', ordinal: borrador.ordinal };
      case 'digitoNIT':
        return { tipo: 'digitoNIT', habilBase: borrador.habilBase };
    }
  }

  function guardar() {
    if (!b.nombre.trim()) return;
    const o: Obligacion = {
      id: nuevoId('obl'),
      nombre: b.nombre.trim(),
      descripcion: b.descripcion.trim(),
      norma: b.norma.trim(),
      autoridad: b.autoridad.trim(),
      periodicidad: b.periodicidad,
      regla: reglaDe(b),
      mesAncla: Math.min(Math.max(b.mesAncla, 1), 12),
      desfaseMeses: Math.max(0, b.desfaseMeses),
      responsableId: b.responsableId || (responsables[0]?.id ?? ''),
      activa: true,
    };
    agregarObligacion(o);
    setB(EN_BLANCO);
  }

  function exportar() {
    exportarCSV(
      [
        ['Obligación', 'Autoridad', 'Norma', 'Periodicidad', 'Regla', 'Responsable', 'Activa'],
        ...obligaciones.map((o) => [
          o.nombre,
          o.autoridad,
          o.norma,
          PERIODICIDADES[o.periodicidad].rotulo,
          describirRegla(o.regla),
          responsables.find((r) => r.id === o.responsableId)?.nombre ?? '',
          o.activa ? 'Sí' : 'No',
        ]),
      ],
      'catalogo',
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <Tarjeta
        titulo="Nueva obligación"
        descripcion="Defina la recurrencia y la regla de vencimiento; las fechas se derivan solas."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Nombre" requerido>
            {(id) => (
              <Entrada
                id={id}
                value={b.nombre}
                onChange={(e) => setB({ ...b, nombre: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Autoridad ante la que se cumple">
            {(id) => (
              <Entrada
                id={id}
                placeholder="DIAN, municipio, junta directiva…"
                value={b.autoridad}
                onChange={(e) => setB({ ...b, autoridad: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Norma que la fija">
            {(id) => (
              <Entrada
                id={id}
                value={b.norma}
                onChange={(e) => setB({ ...b, norma: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Periodicidad">
            {(id) => (
              <Seleccion
                id={id}
                value={b.periodicidad}
                onChange={(e) => setB({ ...b, periodicidad: e.target.value as Periodicidad })}
              >
                {(Object.keys(PERIODICIDADES) as Periodicidad[]).map((p) => (
                  <option key={p} value={p}>
                    {PERIODICIDADES[p].rotulo}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Regla de vencimiento">
            {(id) => (
              <Seleccion
                id={id}
                value={b.tipoRegla}
                onChange={(e) => setB({ ...b, tipoRegla: e.target.value as TipoRegla })}
              >
                {(Object.keys(ROTULO_REGLA) as TipoRegla[]).map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_REGLA[t]}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          {b.tipoRegla === 'diaFijo' && (
            <Campo etiqueta="Día del mes">
              {(id) => (
                <Entrada
                  id={id}
                  type="number"
                  min={1}
                  max={31}
                  value={b.dia}
                  onChange={(e) => setB({ ...b, dia: Number(e.target.value) })}
                />
              )}
            </Campo>
          )}

          {b.tipoRegla === 'diaHabil' && (
            <Campo etiqueta="Ordinal del día hábil">
              {(id) => (
                <Entrada
                  id={id}
                  type="number"
                  min={1}
                  max={20}
                  value={b.ordinal}
                  onChange={(e) => setB({ ...b, ordinal: Number(e.target.value) })}
                />
              )}
            </Campo>
          )}

          {b.tipoRegla === 'digitoNIT' && (
            <Campo
              etiqueta="Día hábil base"
              ayuda="El dígito 1 vence ese día; el 0, nueve después."
            >
              {(id) => (
                <Entrada
                  id={id}
                  type="number"
                  min={1}
                  max={20}
                  value={b.habilBase}
                  onChange={(e) => setB({ ...b, habilBase: Number(e.target.value) })}
                />
              )}
            </Campo>
          )}

          <Campo etiqueta="Mes de arranque del ciclo" ayuda="1 = enero.">
            {(id) => (
              <Entrada
                id={id}
                type="number"
                min={1}
                max={12}
                value={b.mesAncla}
                onChange={(e) => setB({ ...b, mesAncla: Number(e.target.value) })}
              />
            )}
          </Campo>

          <Campo etiqueta="Meses entre cierre y vencimiento">
            {(id) => (
              <Entrada
                id={id}
                type="number"
                min={0}
                max={12}
                value={b.desfaseMeses}
                onChange={(e) => setB({ ...b, desfaseMeses: Number(e.target.value) })}
              />
            )}
          </Campo>

          <Campo etiqueta="Responsable">
            {(id) => (
              <Seleccion
                id={id}
                value={b.responsableId}
                onChange={(e) => setB({ ...b, responsableId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>
        </div>

        <Boton className="mt-4" onClick={guardar} disabled={!b.nombre.trim()}>
          <ListPlus size={16} /> Agregar obligación
        </Boton>
      </Tarjeta>

      <Tarjeta
        titulo={`Catálogo (${obligaciones.length})`}
        descripcion={`Próximo vencimiento calculado para ${config.anio} con último dígito ${config.ultimoDigito}.`}
        acciones={
          obligaciones.length > 0 && (
            <Boton variante="secundario" tamano="sm" onClick={exportar}>
              Exportar CSV
            </Boton>
          )
        }
      >
        {obligaciones.length === 0 ? (
          <Vacio titulo="El catálogo está vacío">
            Agregue una obligación para empezar a construir el calendario.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Obligación</Th>
                <Th>Periodicidad</Th>
                <Th>Regla</Th>
                <Th>Responsable</Th>
                <Th>Primer vencimiento</Th>
                <Th numerico>Activa</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {obligaciones.map((o) => {
                const oc = ocurrenciasDe(o, config.anio, config.ultimoDigito);
                return (
                  <tr key={o.id}>
                    <Td>
                      <span className="font-medium">{o.nombre}</span>
                      <span className="block text-xs text-texto-3">
                        {o.autoridad}
                        {o.norma && ` · ${o.norma}`}
                      </span>
                    </Td>
                    <Td>
                      <Insignia tono="marca">{PERIODICIDADES[o.periodicidad].rotulo}</Insignia>
                    </Td>
                    <Td className="text-xs">{describirRegla(o.regla)}</Td>
                    <Td>{responsables.find((r) => r.id === o.responsableId)?.nombre ?? '—'}</Td>
                    <Td className="font-mono text-xs">
                      {oc[0] ? fechaCorta(oc[0].vencimiento) : '—'}
                      <span className="block font-sans text-texto-3">{oc.length} al año</span>
                    </Td>
                    <Td numerico>
                      <Interruptor
                        activo={o.activa}
                        onChange={(v) => editarObligacion(o.id, { activa: v })}
                        etiqueta={`Activar ${o.nombre}`}
                      />
                    </Td>
                    <Td>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label={`Eliminar ${o.nombre}`}
                        onClick={() => borrarObligacion(o.id)}
                      >
                        <Trash2 size={14} />
                      </Boton>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
