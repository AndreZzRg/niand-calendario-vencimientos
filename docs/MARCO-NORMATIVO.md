# Marco normativo — Calendario de Vencimientos

> **Fecha de verificación: 17 de septiembre de 2026.**
> Este documento se revisa cada trimestre contra fuente oficial. Si usted lee esto
> después de diciembre de 2026, confirme la vigencia antes de usar cualquier resultado.

## 1. Normas que sustentan las reglas implementadas

| Norma | Qué aporta a esta herramienta | Verificada |
|---|---|---|
| **Ley 1581 de 2012 y Circular SIC 005 de 2017** | Actualización anual del RNBD. | 17 sep 2026 |
| **Resolución 0312 de 2019** | Autoevaluación anual de estándares mínimos del SG-SST. | 17 sep 2026 |
| **Ley 1010 de 2006** | Sesiones trimestrales del Comité de Convivencia Laboral. | 17 sep 2026 |
| **Decreto 1072 de 2015** | Plan anual de trabajo y capacitación en SST. | 17 sep 2026 |


## 2. Regla de trazabilidad normativa

Toda regla codificada en `src/domain/` cumple tres condiciones:

1. **Cita la norma en el propio código**, con número y artículo, en un comentario sobre
   la constante o la función.
2. **Tiene una prueba** en `*.test.ts` cuyo nombre describe el supuesto normativo, no el
   detalle de implementación.
3. **Aparece en este documento** con su fecha de verificación.

Si las tres no se cumplen, la regla no entra. Esto no es formalismo: una firma que vende
cumplimiento no puede sostener un cálculo cuyo origen nadie puede rastrear.

## 3. Lo que esta herramienta no afirma

- **No cuantifica sanciones.** El monto de una multa depende de la conducta, la
  reincidencia y el criterio de la autoridad. Se indica la autoridad competente y el
  rango legal citando la norma, nunca una cifra presentada como cálculo.
- **No emite concepto jurídico.** Los resultados son orientativos.
- **No afirma obligatoriedad donde no la hay.** Un documento CONPES o un lineamiento de
  MinTIC es política pública, no norma exigible a particulares. Un proyecto de ley en
  trámite no obliga.

## 4. Fuentes oficiales de verificación

| Fuente | Para qué | Dónde |
|---|---|---|
| Diario Oficial | Texto y vigencia de leyes y decretos | <https://www.imprenta.gov.co> |
| Ministerio del Trabajo | Circulares, resoluciones y conceptos | <https://www.mintrabajo.gov.co> |
| Superintendencia de Industria y Comercio | Doctrina y RNBD | <https://www.sic.gov.co> |
| Corte Constitucional | Jurisprudencia | <https://www.corteconstitucional.gov.co> |
| Función Pública — SUIN-Juriscol | Normativa consolidada | <https://www.suin-juriscol.gov.co> |
| Banco de la República | TRM | <https://www.banrep.gov.co> |

## 5. Procedimiento de actualización

Cuando una norma cambia:

1. Se actualiza la constante o la regla en `src/domain/`, con la cita nueva.
2. Se ajusta o agrega la prueba que demuestra el nuevo comportamiento.
3. Se registra en este documento con la fecha de verificación.
4. Se anota en [`CHANGELOG.md`](../CHANGELOG.md) bajo el encabezado **Normativo**.
5. Se publica una versión menor, o mayor si el resultado de un cálculo existente cambia.

## 6. Descargo

Este documento es material de referencia interna y **no constituye asesoría jurídica**.
Véase [`DESCARGO.md`](../DESCARGO.md).
