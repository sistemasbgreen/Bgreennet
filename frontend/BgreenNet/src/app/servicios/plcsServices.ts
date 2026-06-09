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
  getVapor(): Observable<VaporPLC[]> {
    return this.http.get<VaporPLC[]>(`${this.baseUrl}/vapor`);
  }

  /**
   * Extrae el valor real del sensor desde la notación científica del PLC.
   * Ej: 9.325711345004874E-39 → 9.33
   */
  parsePlcValue(v: any): number {
    if (!v) return 0;
    const str = String(v).toUpperCase();
    const parts = str.split('E');
    return Number(Number(parts[0]).toFixed(4));
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
    return this.getVapor().pipe(
      map(data => {
        let total = 0;
        data.forEach(row => {
          if (!row.FechaRegistro) return;
          const year = new Date(row.FechaRegistro).getUTCFullYear().toString();
          if (year !== anio) return;
          total += this.parsePlcValue(row['1100FTSG12']);
        });
        return { totalVapor: Number(total.toFixed(2)) };
      })
    );
  }
}
