import { useState, type JSX } from 'react';

import { Shell, type ModuloId } from './brand/Shell';
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
  const [modulo, setModulo] = useState<ModuloId>('proximos-vencimientos');
  const Panel = PANELES[modulo];

  return (
    <Shell moduloActivo={modulo} onModulo={setModulo}>
      <Panel />
    </Shell>
  );
}
