// services/op-docto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable, timer, switchMap, share, tap } from 'rxjs';
import { OpDocto } from '../models/OordenesProduccion/OpDocto';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class OpDoctoService {
  
    private baseUrl = `${environment.apiUrl}/api/op-docto`;

  constructor(private http: HttpClient) {}


 getDocumentos(limit: number = 30): Observable<OpDocto[]> {
    return this.http.get<OpDocto[]>(`${this.baseUrl}?limit=${limit}`);
  }
}