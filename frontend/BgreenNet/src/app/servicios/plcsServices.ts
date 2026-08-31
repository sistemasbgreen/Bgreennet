import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VaporPLC, VaporDiario } from '../models/Modelos_CMI/VaporPLC';


@Injectable({
  providedIn: 'root'
})
export class plcsServices {

  private baseUrl = `${environment.apiUrl}/api/plc-db`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los registros crudos de vapor desde la base de datos PLC.
   * Los valores numéricos vienen en notación científica (ej: 9.32E-39)
   * por diferencias de codificación entre el PLC y SQL Server.
   */
  getVapor(startDate?: string, endDate?: string): Observable<VaporPLC[]> {
    let url = `${this.baseUrl}/vapor`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<VaporPLC[]>(url);
  }

  getEnergia(startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.baseUrl}/energia`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(url);
  }

  getAgua(startDate?: string, endDate?: string): Observable<any[]> {
    let url = `${this.baseUrl}/agua`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<any[]>(url);
  }

  getVaporAnual(year: string, endMonth?: string): Observable<any[]> {
    let url = `${this.baseUrl}/vapor/anual?year=${year}`;
    if (endMonth) {
      url += `&endMonth=${endMonth}`;
    }
    return this.http.get<any[]>(url);
  }

  getEnergiaAnual(year: string, endMonth?: string): Observable<any[]> {
    let url = `${this.baseUrl}/energia/anual?year=${year}`;
    if (endMonth) {
      url += `&endMonth=${endMonth}`;
    }
    return this.http.get<any[]>(url);
  }

  getAguaAnual(year: string, endMonth?: string): Observable<any[]> {
    let url = `${this.baseUrl}/agua/anual?year=${year}`;
    if (endMonth) {
      url += `&endMonth=${endMonth}`;
    }
    return this.http.get<any[]>(url);
  }

  getAguaMensual(year: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/agua/mensual?year=${year}`);
  }



  /**
   * Extrae el valor real del sensor desde la notación científica del PLC.
   * Ej: 9.325711345004874E-39 → 9.33
   */
  parsePlcValue(v: any): number {
    if (v === null || v === undefined || v === '') return 0;
    let str = String(v).toUpperCase().replace(',', '.');
    const parts = str.split('E');
    const num = Number(parts[0]);
    if (isNaN(num)) return 0;
    return Number(num.toFixed(4));
  }

  /**
   * Obtiene los datos de vapor agrupados y sumados por día.
   * Útil para comparar con producción diaria de B100.
   * @param anio Año a filtrar (ej: '2026')
   * @param mes  Mes a filtrar (ej: '06')
   */
  getVaporAgrupado(anio: string, mes: string): Observable<VaporDiario[]> {
    return this.getVapor().pipe(
      map(data => {
        const mapaFechas = new Map<string, VaporDiario>();

        data.forEach(row => {
          if (!row.FechaRegistro) return;

          const date = new Date(row.FechaRegistro);
          const rowYear = date.getUTCFullYear().toString();
          const rowMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');

          // Filtrar por año y mes
          if (rowYear !== anio || rowMonth !== mes) return;

          const fecha = date.toISOString().split('T')[0]; // YYYY-MM-DD

          const v1 = this.parsePlcValue(row['1100FTSG11']); // ISBL
          const v2 = this.parsePlcValue(row['550FT04']);    // Área 550
          const v3 = this.parsePlcValue(row['1100FTSG12']); // Total planta

          const existing = mapaFechas.get(fecha);
          if (existing) {
            existing.totalVapor     += v3;
            existing.isblDesagregado += (v1 - v2);
            existing.zona700yOtros  += (v3 - v1);
            existing.registros++;
          } else {
            mapaFechas.set(fecha, {
              fecha,
              totalVapor:      v3,
              isblDesagregado: v1 - v2,
              zona700yOtros:   v3 - v1,
              registros:       1
            });
          }
        });

        // Redondear y ordenar por fecha
        return [...mapaFechas.values()]
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .map(d => ({
            ...d,
            totalVapor:      Number(d.totalVapor.toFixed(2)),
            isblDesagregado: Number(d.isblDesagregado.toFixed(2)),
            zona700yOtros:   Number(d.zona700yOtros.toFixed(2))
          }));
      })
    );
  }

  /**
   * Suma total de vapor para un año completo (para KPI anual).
   */
  getVaporTotalAnio(anio: string): Observable<{ totalVapor: number }> {
    return this.http.get<any[]>(`${this.baseUrl}/vapor/anual?year=${anio}`).pipe(
      map(data => {
        let total = 0;
        data.forEach(row => {
          total += this.parsePlcValue(row['1100FTSG12']);
        });
        return { totalVapor: Number(total.toFixed(2)) };
      })
    );
  }

  /**
   * Diferencia max-min total de energía para un año completo (para KPI anual).
   */
  getEnergiaTotalAnio(anio: string, endMonth?: string): Observable<{ totalEnergia: number }> {
    let url = `${this.baseUrl}/energia/anual?year=${anio}`;
    if (endMonth) url += `&endMonth=${endMonth}`;
    return this.http.get<any>(url).pipe(
      // El backend ahora devuelve un objeto agregado { totalEnergia: X }
      map(res => {
        if (res && typeof res === 'object') {
          // Respuesta directa como objeto
          if (res.totalEnergia !== undefined && res.totalEnergia !== null) {
            return { totalEnergia: Number(Number(res.totalEnergia).toFixed(2)) };
          }
          // Respuesta como array con primer elemento
          if (Array.isArray(res) && res.length > 0) {
            const first = res[0];
            if (first.totalEnergia !== undefined && first.totalEnergia !== null) {
              return { totalEnergia: Number(Number(first.totalEnergia).toFixed(2)) };
            }
            // Fallback: si aún devuelve filas crudas (compatibilidad)
            let minCg = Number.MAX_VALUE;
            let maxCg = -Number.MAX_VALUE;
            res.forEach((row: any) => {
              const val = this.parsePlcValue(row['ENERGIA'] || row['energia']);
              if (val > 0) {
                if (val < minCg) minCg = val;
                if (val > maxCg) maxCg = val;
              }
            });
            const total = (minCg !== Number.MAX_VALUE && maxCg >= minCg) ? (maxCg - minCg) : 0;
            return { totalEnergia: Number(total.toFixed(2)) };
          }
        }
        return { totalEnergia: 0 };
      })
    );
  }

  getAguaTotalAnio(anio: string, endMonth?: string): Observable<{ totalAgua: number }> {
    let url = `${this.baseUrl}/agua/anual?year=${anio}`;
    if (endMonth) url += `&endMonth=${endMonth}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (res && typeof res === 'object') {
          if (res.totalAgua !== undefined && res.totalAgua !== null) {
            return { totalAgua: Number(Number(res.totalAgua).toFixed(2)) };
          }
          if (Array.isArray(res) && res.length > 0) {
            const first = res[0];
            if (first.totalAgua !== undefined && first.totalAgua !== null) {
              return { totalAgua: Number(Number(first.totalAgua).toFixed(2)) };
            }
          }
        }
        return { totalAgua: 0 };
      })
    );
  }
}
