# Registro de cambios

Todos los cambios relevantes de **Calendario de Vencimientos** se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Corregido

- **Node 20 no podía ejecutar la suite de pruebas.** La matriz de CI incluía
  Node 20, pero `jsdom 30` depende de `undici` y este de
  `worker_threads.markAsUncloneable`, disponible solo desde Node 22.10. En
  Node 20 ningún archivo de pruebas llegaba a arrancar y el paso «Pruebas con
  cobertura» fallaba. Se retira Node 20 de la matriz y se sube el mínimo
  declarado en `engines` a `>=22.10.0`, que es la versión que el entorno de
  pruebas exige de verdad; `.nvmrc` ya fijaba la 22.
- **La integración continua fallaba en todos sus pasos.** `package-lock.json` no
  estaba versionado, de modo que `npm ci` —primer paso de los flujos de CI, Pages
  y CodeQL— fallaba antes de ejecutar nada.
- **Faltaba la capa de aplicación.** `src/main.tsx` importaba `./App`, que no
  existía, junto con todo `src/domain/` y `src/features/`: la verificación de
  tipos y la construcción de producción fallaban.
- **Cobertura por debajo del umbral.** `src/lib/almacen.ts` y `src/lib/exportar.ts`
  no tenían pruebas y quedaban en 0 %, lo que arrastraba el total por debajo de los
  umbrales que aplica `npm run test:coverage` y hacía fallar ese paso aunque
  `vitest run` a secas pasara.

### Agregado

- `exportarICS` en `src/lib/exportar.ts`, con el tipo `text/calendar` que hace que
  Outlook y Google Calendar ofrezcan importar el archivo en vez de abrirlo como
  texto plano.
- Cobertura de pruebas de `src/lib`: validación por esquema y versión del
  almacenamiento, y escape CSV conforme al RFC 4180 en la exportación.

---

## [1.0.0] — 2026-09-17

Primera versión pública del laboratorio.

### Agregado

- Módulo **Catálogo de obligaciones**.
- Módulo **Calendario**.
- Módulo **Próximos vencimientos**.
- Módulo **Exportación .ics**.
- Módulo **Responsables**.
- Documentación completa en `docs/`: arquitectura, marco normativo, despliegue,
  guía de uso, decisiones de arquitectura y descargo de responsabilidad.
- Integración continua en tres versiones de Node (20, 22 y 24) con formato, análisis
  estático, verificación de tipos, pruebas con cobertura y construcción de producción.
- Despliegue automático en GitHub Pages desde `main`.
- Análisis de seguridad con CodeQL y actualización de dependencias con Dependabot.
- Sistema de diseño NiAnd Labs con modo claro y oscuro y contraste AA.

### Normativo

- Reglas derivadas de **Ley 1581 de 2012 y Circular SIC 005 de 2017**: Actualización anual del RNBD.
- Reglas derivadas de **Resolución 0312 de 2019**: Autoevaluación anual de estándares mínimos del SG-SST.
- Reglas derivadas de **Ley 1010 de 2006**: Sesiones trimestrales del Comité de Convivencia Laboral.
- Reglas derivadas de **Decreto 1072 de 2015**: Plan anual de trabajo y capacitación en SST.

> Verificación normativa: 17 de septiembre de 2026.

[No publicado]: https://github.com/AndreZzRg/niand-calendario-vencimientos/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndreZzRg/niand-calendario-vencimientos/releases/tag/v1.0.0
