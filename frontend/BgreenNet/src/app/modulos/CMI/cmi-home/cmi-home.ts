import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { MetanolResponse } from '../../../models/Modelos_CMI/ProductoResponse';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest ';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Router } from '@angular/router';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-cmi-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './cmi-home.html',
  styleUrl: './cmi-home.css'
})
export class CmiHome implements OnInit {

  
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  constructor(private router: Router) {}

  irAProductos() {
  this.router.navigate(['/cmi/productos']);
}
}