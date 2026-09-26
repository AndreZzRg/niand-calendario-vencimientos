import { useState, type JSX } from 'react';

import { Portada } from './brand/Portada';
import { APP, MODULOS, Shell, type ModuloId, type Vista } from './brand/Shell';
import { PanelCalendario } from './features/PanelCalendario';
import { PanelCatalogo } from './features/PanelCatalogo';
import { PanelExportacion } from './features/PanelExportacion';
import { PanelProximos } from './features/PanelProximos';
import { PanelResponsables } from './features/PanelResponsables';

const PANELES: Record<ModuloId, () => JSX.Element> = {
  'catalogo-de-obligaciones': PanelCatalogo,
  calendario: PanelCalendario,
  'proximos-vencimientos': PanelProximos,
  'exportacion-ics': PanelExportacion,
  responsables: PanelResponsables,
};

export default function App() {
  // Se abre en la portada: quien llega ve primero de qué se compone la
  // herramienta, en vez de caer dentro del primer módulo sin contexto.
  const [vista, setVista] = useState<Vista>('portada');
  const Panel = vista === 'portada' ? null : PANELES[vista];

  return (
    <Shell vista={vista} onVista={setVista}>
      {Panel ? (
        <Panel />
      ) : (
        <Portada
          titulo={APP.nombre}
          descripcion={APP.resumen}
          modulos={MODULOS}
          onAbrir={(id) => setVista(id as ModuloId)}
        />
      )}
    </Shell>
  );
}
