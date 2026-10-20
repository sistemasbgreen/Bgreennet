# Diccionario de Datos: Módulo de Presentismo y Metas Semanales

## 1. Entidad: `DiaMiniBarra`
Representa una de las 5 mini barras de visualización diaria (lunes a viernes) dentro de cada semana del mes.

| Campo | Tipo | Requerido | Descripción | Ejemplo / Valores permitidos |
|---|---|---|---|---|
| `diaNumero` | `number` | Sí | Número de día del mes (1 a 31). | `12` |
| `diaNombre` | `string` | Sí | Letra representativa del día de la semana. | `'L'`, `'M'`, `'X'`, `'J'`, `'V'` |
| `fechaKey` | `string` | Sí | Clave de fecha en formato ISO estándar. | `'2026-10-12'` |
| `fechaDate` | `Date` | Sí | Objeto Date correspondiente al día. | `Date` |
| `horasTexto` | `string` | Sí | Cadena legible con horas y minutos laborados. | `'8h 24m'` |
| `minutosTotales` | `number` | Sí | Minutos totales laborados en la jornada. | `504` |
| `porcentajeAltura` | `number` | Sí | Porcentaje de altura de la barra (relativo a 504 min). | `100` |
| `estadoColor` | `string` | Sí | Estado y color visual de la barra. | `'puntual'` \| `'tarde'` \| `'sede_hoy'` \| `'vacio'` \| `'festivo'` |
| `tooltipTexto` | `string` | Sí | Texto formateado para el tooltip interactivo en hover. | `'Lun 12 Oct · Festivo nacional'` |
| `esHoy` | `boolean` | Sí | Indica si la fecha corresponde al día de hoy. | `true` \| `false` |
| `esFestivo` | `boolean` | Sí | Indica si es festivo oficial en Colombia. | `true` \| `false` |
| `primeraEntrada` | `string?` | No | Hora formateada del primer ingreso del día. | `'07:22 AM'` |
| `ultimaSalida` | `string?` | No | Hora formateada de la última salida del día. | `'05:35 PM'` |

---

## 2. Entidad: `ResumenSemanaMes`
Representa el resumen consolidado de una semana laboral (lunes a viernes).

| Campo | Tipo | Requerido | Descripción | Ejemplo / Valores permitidos |
|---|---|---|---|---|
| `numeroSemana` | `number` | Sí | Índice secuencial de la semana en el mes. | `1`, `2`, `3`, `4`, `5` |
| `nombreSemana` | `string` | Sí | Etiqueta de la semana. | `'Semana 2'` |
| `rangoTexto` | `string` | Sí | Rango de fechas comprendido en el mes. | `'05 - 09 Oct'` |
| `diasHabiles` | `number` | Sí | Conteo de días hábiles (L-V descontando festivos). | `4` |
| `diasHabilesTexto` | `string` | Sí | Texto amigable de días hábiles. | `'4 días hábiles'` |
| `minutosTotales` | `number` | Sí | Sumatoria de minutos trabajados en la semana. | `2016` |
| `horasTexto` | `string` | Sí | Formato legible de horas laboradas. | `'33h 36m'` |
| `metaMinutos` | `number` | Sí | Meta en minutos (`diasHabiles * 504 min`). | `2016` |
| `metaTexto` | `string` | Sí | Formato legible de la meta semanal. | `'33h 36m'` |
| `porcentajeProgreso`| `number` | Sí | Porcentaje de cumplimiento semanal (0 a 100%). | `100` |
| `diferenciaMinutos` | `number` | Sí | Diferencia frente a la meta (`minutosTotales - metaMinutos`). | `80` (minutos) |
| `diferenciaTexto` | `string` | Sí | Diferencia formateada con signo. | `'+1h 20m'`, `'−0h 55m'` |
| `esPositiva` | `boolean` | Sí | Bandera que indica si la diferencia es $\ge 0$. | `true` \| `false` |
| `esSemanaActual` | `boolean` | Sí | Bandera de semana actual (resalta con badge 'Actual'). | `true` \| `false` |
| `esFutura` | `boolean` | Sí | Bandera de semana futura (atenúa y muestra solo meta).| `true` \| `false` |
| `dias` | `Array` | Sí | Lista de días procesados en la semana. | `ResumenDiaPresentismo[]` |
| `miniBarras` | `Array` | Sí | 5 mini barras de visualización diaria (L a V). | `DiaMiniBarra[]` |

---

## 3. Entidad: `ResumenMesMetas`
Consolidado mensual expuesto en el encabezado de la tarjeta.

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| `totalHorasMesTexto` | `string` | Sí | Total de horas laboradas en el mes. | `'69h 21m'` |
| `metaMesTexto` | `string` | Sí | Suma de las metas de todas las semanas del mes. | `'92h 24m'` |
| `totalMinutosMes` | `number` | Sí | Total de minutos laborados en el mes. | `4161` |
| `metaMinutosMes` | `number` | Sí | Total de minutos de la meta mensual. | `5544` |
| `porcentajeMes` | `number` | Sí | Porcentaje de cumplimiento del mes (0 a 100%). | `75` |
| `porcentajePuntualidad` | `number` | Sí | Porcentaje de ingresos puntuales sobre el total registrado. | `95` |
| `llegadasTardeCount` | `number` | Sí | Cantidad total de ingresos tarde en el mes. | `1` |
| `totalEntradasRegistradas`| `number` | Sí | Total de días con ingreso registrado. | `14` |
