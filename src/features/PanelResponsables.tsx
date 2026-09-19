/**
 * Módulo «Responsables»: quién responde por cada obligación y cuánta carga
 * tiene asignada. Un vencimiento sin responsable es un vencimiento que nadie
 * va a atender, así que la vista lo señala expresamente.
 */
import { useState } from 'react';
import { Trash2, TriangleAlert, UserPlus } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Llamado,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { exportarCSV } from '../lib/exportar';
import { fechaCorta } from '../lib/formato';
import { nuevoId, useEstado, type Responsable } from '../store';
import { BarraConfiguracion, ROTULO_ESTADO, TONO_ESTADO, useCalendario } from './Configuracion';

const EN_BLANCO = { nombre: '', cargo: '', correo: '' };

export function PanelResponsables() {
  const { obligaciones, responsables, agregarResponsable, borrarResponsable, editarObligacion } =
    useEstado();
  const { ocurrencias } = useCalendario();
  const [b, setB] = useState(EN_BLANCO);

  const sinAsignar = obligaciones.filter(
    (o) => !o.responsableId || !responsables.some((r) => r.id === o.responsableId),
  );

  /** Carga de trabajo: obligaciones y vencimientos anuales por responsable. */
  const carga = responsables.map((r) => {
    const suyas = obligaciones.filter((o) => o.responsableId === r.id);
    const vencimientos = ocurrencias.filter((oc) => suyas.some((o) => o.id === oc.obligacionId));
    return {
      responsable: r,
      obligaciones: suyas,
      vencimientos,
      urgentes: vencimientos.filter((v) => v.estado === 'vencido' || v.estado === 'critico'),
    };
  });

  function guardar() {
    if (!b.nombre.trim()) return;
    const r: Responsable = {
      id: nuevoId('res'),
      nombre: b.nombre.trim(),
      cargo: b.cargo.trim(),
      correo: b.correo.trim(),
    };
    agregarResponsable(r);
    setB(EN_BLANCO);
  }

  function exportar() {
    exportarCSV(
      [
        ['Responsable', 'Cargo', 'Correo', 'Obligaciones', 'Vencimientos al año', 'Urgentes'],
        ...carga.map((c) => [
          c.responsable.nombre,
          c.responsable.cargo,
          c.responsable.correo,
          c.obligaciones.length,
          c.vencimientos.length,
          c.urgentes.length,
        ]),
      ],
      'responsables',
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Responsables" valor={String(responsables.length)} tono="marca" />
        <Dato
          rotulo="Obligaciones asignadas"
          valor={String(obligaciones.length - sinAsignar.length)}
        />
        <Dato
          rotulo="Sin asignar"
          valor={String(sinAsignar.length)}
          tono={sinAsignar.length > 0 ? 'riesgo' : 'ok'}
        />
      </div>

      {sinAsignar.length > 0 && (
        <Llamado
          tono="riesgo"
          titulo="Hay obligaciones sin responsable"
          icono={<TriangleAlert size={18} />}
        >
          <p>
            {sinAsignar.map((o) => o.nombre).join(', ')}. Asígnelas abajo: un vencimiento sin dueño
            es un vencimiento que nadie va a atender.
          </p>
        </Llamado>
      )}

      <Tarjeta titulo="Nuevo responsable">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Nombre o área" requerido>
            {(id) => (
              <Entrada
                id={id}
                value={b.nombre}
                onChange={(e) => setB({ ...b, nombre: e.target.value })}
              />
            )}
          </Campo>
          <Campo etiqueta="Cargo">
            {(id) => (
              <Entrada
                id={id}
                value={b.cargo}
                onChange={(e) => setB({ ...b, cargo: e.target.value })}
              />
            )}
          </Campo>
          <Campo etiqueta="Correo">
            {(id) => (
              <Entrada
                id={id}
                type="email"
                value={b.correo}
                onChange={(e) => setB({ ...b, correo: e.target.value })}
              />
            )}
          </Campo>
        </div>
        <Boton className="mt-4" onClick={guardar} disabled={!b.nombre.trim()}>
          <UserPlus size={16} /> Agregar responsable
        </Boton>
      </Tarjeta>

      <Tarjeta
        titulo="Carga por responsable"
        descripcion="Obligaciones a cargo y vencimientos que generan en el año."
        acciones={
          responsables.length > 0 && (
            <Boton variante="secundario" tamano="sm" onClick={exportar}>
              Exportar CSV
            </Boton>
          )
        }
      >
        {responsables.length === 0 ? (
          <Vacio titulo="No hay responsables registrados">
            Agregue al menos uno para poder asignar las obligaciones.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Responsable</Th>
                <Th>Obligaciones a cargo</Th>
                <Th numerico>Vencimientos al año</Th>
                <Th numerico>Urgentes</Th>
                <Th>Próximo</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {carga.map((c) => {
                const proximo = c.vencimientos[0];
                return (
                  <tr key={c.responsable.id}>
                    <Td>
                      <span className="font-medium">{c.responsable.nombre}</span>
                      <span className="block text-xs text-texto-3">
                        {c.responsable.cargo}
                        {c.responsable.correo && ` · ${c.responsable.correo}`}
                      </span>
                    </Td>
                    <Td className="text-xs">
                      {c.obligaciones.length === 0
                        ? '—'
                        : c.obligaciones.map((o) => o.nombre).join(', ')}
                    </Td>
                    <Td numerico>{c.vencimientos.length}</Td>
                    <Td numerico>
                      {c.urgentes.length > 0 ? (
                        <Insignia tono="riesgo">{c.urgentes.length}</Insignia>
                      ) : (
                        <Insignia tono="ok">0</Insignia>
                      )}
                    </Td>
                    <Td>
                      {proximo ? (
                        <>
                          <span className="font-mono text-xs">
                            {fechaCorta(proximo.vencimiento)}
                          </span>
                          <Insignia tono={TONO_ESTADO[proximo.estado]} className="ml-2">
                            {ROTULO_ESTADO[proximo.estado]}
                          </Insignia>
                        </>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label={`Eliminar a ${c.responsable.nombre}`}
                        onClick={() => borrarResponsable(c.responsable.id)}
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

      <Tarjeta
        titulo="Asignación de obligaciones"
        descripcion="Cambie el responsable de cada obligación del catálogo."
      >
        {obligaciones.length === 0 ? (
          <Vacio titulo="El catálogo está vacío" />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Obligación</Th>
                <Th>Autoridad</Th>
                <Th>Responsable</Th>
              </tr>
            </thead>
            <tbody>
              {obligaciones.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <span className="font-medium">{o.nombre}</span>
                  </Td>
                  <Td>{o.autoridad || '—'}</Td>
                  <Td className="min-w-48">
                    <select
                      aria-label={`Responsable de ${o.nombre}`}
                      className="w-full rounded-xl border border-borde bg-superficie px-3 py-2 text-sm"
                      value={o.responsableId}
                      onChange={(e) => editarObligacion(o.id, { responsableId: e.target.value })}
                    >
                      <option value="">Sin asignar</option>
                      {responsables.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
