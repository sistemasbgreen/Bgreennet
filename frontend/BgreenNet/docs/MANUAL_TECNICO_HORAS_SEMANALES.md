# Manual Técnico: Módulo de Horas del Mes y Metas Semanales (BgreenNet)

## 1. Descripción General
El módulo de **Horas del Mes** en el menú desplegable de usuario (`user-dropdown`) de BgreenNet calcula y visualiza el cumplimiento de la jornada laboral legal colombiana (Ley 2101 de 2021: 42 horas semanales a partir de julio de 2026). La meta semanal se prorratea dinámicamente de lunes a viernes descontando sábados, domingos y los días festivos de Colombia.

---

## 2. Variables de Entorno y Configuración
Archivo: `Frontend/BgreenNet/src/environments/environment.ts`

| Variable | Tipo | Valor Predeterminado | Descripción |
|---|---|---|---|
| `horasMetaSemana` | `number` | `42` | Meta legal semanal en horas (Colombia Ley 2101). |
| `horaLimiteEntrada` | `string` | `'07:30'` | Hora límite de ingreso ordinario (gabela de 5 min: hasta 07:35 AM). |
| `horaMinimaSalida` | `string` | `'17:30'` | Hora mínima de salida ordinaria (gabela de 10 min: hasta 05:40 PM). |

---

## 3. Modelo Matemático y Prorrateo de Metas
1. **Minutos estándar por día hábil:**
   $$\text{minutosMetaDia} = \frac{\text{HORAS\_META\_SEMANA} \times 60}{5} = \frac{42 \times 60}{5} = 504\text{ minutos} = 8\text{h } 24\text{m}$$

2. **Días hábiles por semana:**
   Se consideran únicamente los días de lunes a viernes que pertenecen al mes en curso y no son festivos:
   $$\text{diasHabiles} = \sum_{d \in \{\text{Lun, Mar, Mié, Jue, Vie}\} \cap \text{Mes}} [d \notin \text{FESTIVOS}]$$

3. **Meta semanal prorrateada:**
   $$\text{metaMinutosSemana} = \text{diasHabiles} \times 504\text{ min}$$
   - *Ejemplo semana con festivo (12-octubre Día de la Raza):*
     4 días hábiles $\times 504\text{ min} = 2016\text{ minutos} = \mathbf{33\text{h } 36\text{m}}$.
   - *Ejemplo semana completa:*
     5 días hábiles $\times 504\text{ min} = 2520\text{ minutos} = \mathbf{42\text{h } 00\text{m}}$.

4. **Totales del mes:**
   $$\text{totalMinutosMes} = \sum \text{minutosTotalesSemana}$$
   $$\text{metaMinutosMes} = \sum \text{metaMinutosSemana}$$
   *Garantía de coherencia:* Los totales del encabezado coinciden exactamente con la suma de las filas semanales.

---

## 4. Estructuras de Datos (TypeScript)
Archivo: `Frontend/BgreenNet/src/app/models/presentismo.ts`

```typescript
export interface DiaMiniBarra {
  diaNumero: number;
  diaNombre: string; // 'L', 'M', 'X', 'J', 'V'
  fechaKey: string; // YYYY-MM-DD
  fechaDate: Date;
  horasTexto: string; // "8h 24m"
  minutosTotales: number;
  porcentajeAltura: number; // 0 a 100%
  estadoColor: 'puntual' | 'tarde' | 'sede_hoy' | 'vacio' | 'festivo';
  tooltipTexto: string;
  esHoy: boolean;
  esFestivo: boolean;
  primeraEntrada?: string | null;
  ultimaSalida?: string | null;
}

export interface ResumenSemanaMes {
  numeroSemana: number;
  nombreSemana: string;
  rangoTexto: string;
  diasHabiles: number;
  diasHabilesTexto: string;
  minutosTotales: number;
  horasTexto: string;
  metaMinutos: number;
  metaTexto: string;
  porcentajeProgreso: number;
  diferenciaMinutos: number;
  diferenciaTexto: string;
  esPositiva: boolean;
  esSemanaActual: boolean;
  esFutura: boolean;
  dias: ResumenDiaPresentismo[];
  miniBarras: DiaMiniBarra[];
}

export interface ResumenMesMetas {
  totalHorasMesTexto: string;
  metaMesTexto: string;
  totalMinutosMes: number;
  metaMinutosMes: number;
  porcentajeMes: number;
  porcentajePuntualidad: number;
  llegadasTardeCount: number;
  totalEntradasRegistradas: number;
}
```

---

## 5. Actualización en Vivo (Live Tick)
- Cuando el colaborador se encuentra actualmente en sede (`estadoHoy === 'PRESENTE'`), cada 60 segundos (`startClock()`) se recalcula el tiempo transcurrido desde su primera entrada.
- Al actualizarse el día en curso, se recalculan inmediatamente los totales de la semana actual y del mes, proporcionando retroalimentación en tiempo real.
