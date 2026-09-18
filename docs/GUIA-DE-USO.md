# Guía de uso — Calendario de Vencimientos

Calendario de obligaciones periódicas de cumplimiento con reglas de recurrencia, cálculo en días hábiles sobre el calendario de festivos de Colombia, semáforo de proximidad y exportación a iCalendar (RFC 5545) para Google Calendar y Outlook.

## Antes de empezar

> [!IMPORTANT]
> Los resultados son **orientativos** y no constituyen concepto jurídico profesional.
> Verifique la vigencia de cada norma antes de tomar una decisión.

**Dónde quedan sus datos.** En el `localStorage` de su navegador, en su equipo. No hay
servidor. Si usa el modo incógnito o borra los datos del sitio, la información se pierde
sin recuperación. Use la exportación para conservar una copia.

**Qué necesita.** Un navegador actual (Chrome, Edge, Firefox o Safari en versiones de los
últimos dos años) con JavaScript habilitado.

## Recorrido por módulos

### 1. Catálogo de obligaciones

Módulo de la aplicación.

### 2. Calendario

Módulo de la aplicación.

### 3. Próximos vencimientos

Módulo de la aplicación.

### 4. Exportación .ics

Módulo de la aplicación.

### 5. Responsables

Módulo de la aplicación.

## Preguntas frecuentes

<details>
<summary><strong>¿Los datos se envían a algún servidor?</strong></summary>

No. La aplicación es estática y se ejecuta por completo en su navegador. Puede comprobarlo abriendo la pestaña Red de las herramientas del desarrollador.

</details>

<details>
<summary><strong>¿Puedo usarlo sin conexión?</strong></summary>

Sí, una vez cargada la página. La única dependencia externa son las tipografías de
Google Fonts, que se sustituyen por las del sistema si no están disponibles.

</details>

<details>
<summary><strong>¿Cómo conservo o traslado mi información?</strong></summary>

Use la exportación del módulo correspondiente para descargar un archivo JSON, y la
importación para restituirlo en otro equipo o navegador.

</details>

<details>
<summary><strong>¿El resultado sirve ante una inspección?</strong></summary>

Sirve como insumo y como evidencia de gestión, no como concepto jurídico. Lo que se
presente ante una autoridad debe estar revisado por un profesional habilitado.

</details>

<details>
<summary><strong>Encontré un cálculo o un plazo que creo equivocado.</strong></summary>

Abra una incidencia en
[https://github.com/AndreZzRg/niand-calendario-vencimientos/issues](https://github.com/AndreZzRg/niand-calendario-vencimientos/issues) indicando la norma y el artículo que
sustentan el resultado que usted espera. Las correcciones con sustento normativo tienen
prioridad sobre cualquier otra cosa en este repositorio.

</details>

## Accesibilidad

- Navegación completa por teclado: `Tab` para avanzar, `Shift+Tab` para retroceder,
  `Enter` o `Espacio` para activar.
- Enlace **Saltar al contenido** al comienzo de la página.
- Contraste AA verificado en modo claro y oscuro.
- Se respeta la preferencia del sistema de reducir el movimiento.

## Soporte

AndreZzRg · <andresrg1999@hotmail.com> · [Incidencias](https://github.com/AndreZzRg/niand-calendario-vencimientos/issues)
