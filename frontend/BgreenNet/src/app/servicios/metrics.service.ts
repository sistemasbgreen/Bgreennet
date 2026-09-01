import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemMetrics {
  db: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  http: {
    count: number;
    totalTimeSecs: number;
  };
  nodered: {
    status: string;
    latencyMs: number;
  };
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = environment.apiUrl + '/api/metrics';

  constructor(private http: HttpClient) {}

  getCurrentMetrics(): Observable<SystemMetrics> {
    return this.http.get<SystemMetrics>(`${this.apiUrl}/current`);
  }
}
