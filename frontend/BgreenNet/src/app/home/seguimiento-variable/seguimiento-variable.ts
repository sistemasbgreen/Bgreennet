import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScadaService } from '../../servicios/scadaservices';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Sensor {
  tag: string;
  min: number | null;
  max: number | null;
  unit: string;
  name: string;
  notificar?: boolean;
}

interface SensorGroup {
  [key: string]: Sensor[];
}

@Component({
  selector: 'app-seguimiento-variable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento-variable.html',
  styleUrl: './seguimiento-variable.css',
})
export class SeguimientoVariable implements OnInit, OnDestroy {
  sensorGroups: SensorGroup = {};
  allUnits: string[] = [];
  private alertedTags: Set<string> = new Set();
  private isSoundPlaying = false;
  rawVariables: any[] = [];
  unidadesDisponibles: any[] = [];
  unidadesMedidaDisponibles: any[] = [];

  // Modal de gestión de variables
  showGestionModal = false;
  editingVariable: any = null;
  isSaving = false;

  selectedUnit = 'todas';
  searchTerm = '';
  isSidebarOpen = false;
  isNotificationPanelOpen = false;

  currentDate = '';
  selectedDate = '';
  lastUpdate = '';
  connectionStatus: 'online' | 'offline' = 'online';

  ultimoScada: any = null;
  loading = true;
  error = '';

  private pollIntervalId: any = null;
  private clockIntervalId: any = null;

  // Track raw database timestamps to avoid duplicates
  private rawTimestamps: Set<string> = new Set();
  private timestamps: string[] = [];
  private historyData: Map<string, number[]> = new Map();
  private chartInstances: Map<string, Chart> = new Map();

  // Active alerts list
  activeAlerts: Array<{
    tag: string;
    name: string;
    value: number;
    min: number | null;
    max: number | null;
    unit: string;
  }> = [];

  constructor(
    private scadaService: ScadaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.selectedDate = this.getLocalDateString(new Date());
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);

    this.cargarConfiguracionYDatos();
  }

  cargarConfiguracionYDatos() {
    this.loading = true;
    this.error = '';
    this.scadaService.getVariablesConfig().subscribe({
      next: (config) => {
        this.rawVariables = config;
        this.mapearVariables(config);
        this.cargarHistoricoHoy();
      },
      error: (err) => {
        console.error('Error cargando configuración:', err);
        this.error = 'No se pudo cargar la configuración de variables.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // Cargar listas auxiliares para edición
    this.scadaService.getUnidades().subscribe(unidades => this.unidadesDisponibles = unidades);
    this.scadaService.getUnidadesMedida().subscribe(um => this.unidadesMedidaDisponibles = um);
  }

  mapearVariables(config: any[]) {
    const groups: SensorGroup = {};
    config.forEach(v => {
      const uName = v.unidad ? v.unidad.nombre : 'General';
      if (!groups[uName]) {
        groups[uName] = [];
      }
      groups[uName].push({
        tag: v.tag,
        min: v.metaMin,
        max: v.metaMax,
        unit: v.unit ? v.unit.nombre : '',
        name: v.nombre,
        notificar: v.notificar
      });
    });
    this.sensorGroups = groups;
    this.allUnits = Object.keys(groups);
  }

  abrirGestionModal() {
    this.showGestionModal = true;
    this.editingVariable = null;
  }

  cerrarGestionModal() {
    this.showGestionModal = false;
    this.editingVariable = null;
  }

  iniciarEdicion(variable: any) {
    // Clonamos para evitar editar directamente en la lista antes de guardar
    this.editingVariable = {
      tag: variable.tag,
      nombre: variable.nombre,
      unidad: { nombre: variable.unidad ? variable.unidad.nombre : '' },
      unit: { nombre: variable.unit ? variable.unit.nombre : '' },
      metaMin: variable.metaMin,
      metaMax: variable.metaMax
    };
  }

  cancelarEdicion() {
    this.editingVariable = null;
  }

  guardarVariable() {
    if (!this.editingVariable.nombre || !this.editingVariable.unidad.nombre) {
      alert('Nombre y Unidad son obligatorios.');
      return;
    }

    this.isSaving = true;
    this.scadaService.updateVariableConfig(this.editingVariable).subscribe({
      next: () => {
        this.isSaving = false;
        this.editingVariable = null;
        // Recargar configuración y actualizar gráficos/gauges
        this.cargarConfiguracionYDatos();
      },
      error: (err) => {
        console.error('Error al guardar variable:', err);
        alert('Ocurrió un error al guardar la variable.');
        this.isSaving = false;
      }
    });
  }

  sincronizarVariables() {
    if (confirm('¿Desea sincronizar las variables desde la Tabla_14? Esto actualizará/añadirá nuevas variables.')) {
      this.loading = true;
      this.scadaService.syncVariables().subscribe({
        next: (res) => {
          alert(res.message);
          this.cargarConfiguracionYDatos();
        },
        error: (err) => {
          console.error('Error sincronizando:', err);
          alert('Error al sincronizar variables.');
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }


  ngOnDestroy() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);

    // Destroy all charts
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();
  }

  getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateClock() {
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.currentDate = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()} | ${this.formatTime(now)}`;
  }

  formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0];
  }

  onDateChange() {
    // Destroy all chart instances to avoid reusing destroyed canvases
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();
    this.cargarHistoricoHoy();
  }

  cargarHistoricoHoy() {
    this.loading = true;
    this.error = '';

    this.scadaService.getHoyScada(this.selectedDate).subscribe({
      next: (historico) => {
        // Clear previous cache
        this.rawTimestamps.clear();
        this.timestamps = [];
        this.historyData.clear();

        if (historico && historico.length > 0) {
          historico.forEach((record: any) => {
            const rawTime = record['timestamp'];
            if (rawTime && !this.rawTimestamps.has(rawTime)) {
              this.rawTimestamps.add(rawTime);
              const formattedTime = this.formatTime(new Date(rawTime));
              this.timestamps.push(formattedTime);

              Object.values(this.sensorGroups).flat().forEach(sensor => {
                if (!this.historyData.has(sensor.tag)) {
                  this.historyData.set(sensor.tag, []);
                }
                const hist = this.historyData.get(sensor.tag)!;
                // Read value using key search
                const val = this.getValorFromObj(record, sensor.tag);
                hist.push(val !== null ? val : 0);
              });
            }
          });

          // Set latest value from history if it is a past date
          const todayStr = this.getLocalDateString(new Date());
          const isToday = this.selectedDate === todayStr;
          if (!isToday) {
            this.ultimoScada = historico[historico.length - 1];
            const rawTime = this.ultimoScada['timestamp'];
            this.lastUpdate = rawTime ? new Date(rawTime).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');
            this.loading = false;
            this.updateAlerts();
            this.cdr.detectChanges();
            setTimeout(() => {
              this.renderChartsAndGauges();
            }, 50);
          }
        } else {
          // If past date has no history, clear graphs and gauges
          const todayStr = this.getLocalDateString(new Date());
          const isToday = this.selectedDate === todayStr;
          if (!isToday) {
            this.ultimoScada = null;
            this.loading = false;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.renderChartsAndGauges();
            }, 50);
          }
        }

        const todayStr = this.getLocalDateString(new Date());
        const isToday = this.selectedDate === todayStr;

        if (isToday) {
          // Fetch latest value immediately to set the gauge
          this.cargarDatos(false);

          // Start active polling every 2 seconds
          if (this.pollIntervalId) clearInterval(this.pollIntervalId);
          this.pollIntervalId = setInterval(() => {
            this.cargarDatos(true);
          }, 2000);
        } else {
          if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching SCADA history:', err);
        // Fallback to latest point if daily history endpoint fails
        const todayStr = this.getLocalDateString(new Date());
        const isToday = this.selectedDate === todayStr;
        if (isToday) {
          this.cargarDatos(false);
          if (this.pollIntervalId) clearInterval(this.pollIntervalId);
          this.pollIntervalId = setInterval(() => {
            this.cargarDatos(true);
          }, 2000);
        } else {
          this.loading = false;
          this.error = 'No se pudo leer el histórico de SCADA.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  cargarDatos(isPoll: boolean = false) {
    if (!isPoll) {
      this.loading = true;
      this.error = '';
    }

    this.scadaService.getUltimoScada().subscribe({
      next: (data) => {
        this.loading = false;
        if (!data) {
          this.connectionStatus = 'offline';
          return;
        }

        this.connectionStatus = 'online';
        this.ultimoScada = data;

        const rawTime = data['timestamp'];
        this.lastUpdate = rawTime ? new Date(rawTime).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');

        // Append to timeline only if it's a new database entry
        if (rawTime && !this.rawTimestamps.has(rawTime)) {
          this.rawTimestamps.add(rawTime);
          const formattedTime = this.formatTime(new Date(rawTime));
          this.timestamps.push(formattedTime);
          
          // Cap lists to keep chart performant (e.g. keep last 200 values for real-time scrolling)
          if (this.timestamps.length > 200) {
            this.timestamps.shift();
          }

          // Push values for all tags
          Object.values(this.sensorGroups).flat().forEach(sensor => {
            const val = this.getValor(sensor.tag);
            if (!this.historyData.has(sensor.tag)) {
              this.historyData.set(sensor.tag, []);
            }
            const hist = this.historyData.get(sensor.tag)!;
            hist.push(val !== null ? val : 0);
            if (hist.length > 200) {
              hist.shift();
            }
          });
        } else {
          // If it is a polling check and no new data came from the DB, skip expensive DOM updating and chart re-rendering
          if (isPoll) {
            return;
          }
        }

        this.updateAlerts();
        this.cdr.detectChanges();

        // Render/update charts after DOM updates
        setTimeout(() => {
          this.renderChartsAndGauges();
        }, 50);
      },
      error: (err) => {
        console.error('Error polling SCADA data:', err);
        this.connectionStatus = 'offline';
        this.loading = false;
        this.error = 'No se pudo leer el último registro del SCADA.';
        this.cdr.detectChanges();
      }
    });
  }

  getVisibleTags(): Sensor[] {
    if (this.selectedUnit === 'todas') {
      return Object.values(this.sensorGroups).flat();
    } else {
      return this.sensorGroups[this.selectedUnit] || [];
    }
  }

  getFilteredSensors(): Sensor[] {
    const sensors = this.getVisibleTags();
    let filtered = sensors;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = sensors.filter(s =>
        s.tag.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.unit.toLowerCase().includes(term)
      );
    }

    // Ordenar para colocar las variables en advertencia (rojo) al principio
    return [...filtered].sort((a, b) => {
      const valA = this.getValor(a.tag);
      const valB = this.getValor(b.tag);
      const statusA = this.getSensorStatus(valA, a.min, a.max);
      const statusB = this.getSensorStatus(valB, b.min, b.max);

      if (statusA === 'warning' && statusB !== 'warning') {
        return -1;
      }
      if (statusA !== 'warning' && statusB === 'warning') {
        return 1;
      }
      return 0; // Mantener orden si el estado es el mismo
    });
  }

  getValor(key: string): number | null {
    return this.getValorFromObj(this.ultimoScada, key);
  }

  getValorFromObj(obj: any, key: string): number | null {
    if (!obj) return null;
    
    // 1. Try exact key (e.g. "520PT062")
    let val = obj[key];
    if (val !== undefined && val !== null) return Number(val);
    
    // 2. Try bracketed key (e.g. "[520PT062]")
    val = obj[`[${key}]`];
    if (val !== undefined && val !== null) return Number(val);
    
    // 3. Try lowercase key
    val = obj[key.toLowerCase()];
    if (val !== undefined && val !== null) return Number(val);
    
    // 4. Try bracketed lowercase key
    val = obj[`[${key.toLowerCase()}]`];
    if (val !== undefined && val !== null) return Number(val);

    return null;
  }

  getSensorStatus(value: number | null, min: number | null, max: number | null): 'normal' | 'warning' {
    if (value === null) return 'normal';
    if (min !== null && value < min) return 'warning';
    if (max !== null && value > max) return 'warning';
    return 'normal';
  }

  selectUnit(unit: string) {
    this.selectedUnit = unit;
    // Destroy obsolete charts on unit change
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();
    this.cdr.detectChanges();
    
    // Trigger redraw
    setTimeout(() => {
      this.renderChartsAndGauges();
    }, 50);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleNotificationPanel() {
    this.isNotificationPanelOpen = !this.isNotificationPanelOpen;
  }

  playBeep(frequency: number, duration: number) {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, duration);
    } catch (e) {
      console.error('AudioContext failed:', e);
    }
  }

  speak(text: string) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Detener cualquier mensaje previo
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.toLowerCase().startsWith('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }
        utterance.rate = 0.95; // Velocidad ligeramente pausada para claridad
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Error in speech synthesis:', e);
      }
    }
  }

  getChartScale(minVal: any, maxVal: any): { min: number; max: number } {
    let scaleMin = 0;
    let scaleMax = 100;
    
    const min = (minVal !== null && minVal !== undefined && minVal !== '') ? Number(minVal) : null;
    const max = (maxVal !== null && maxVal !== undefined && maxVal !== '') ? Number(maxVal) : null;
    
    if (min != null && !isNaN(min) && max != null && !isNaN(max)) {
      scaleMin = min - (min * 0.10);
      scaleMax = max + (max * 0.10);
      
      if (min <= 5) {
        scaleMin = 0;
      }
      if (max <= 10) {
        scaleMax = Math.ceil(scaleMax + 1);
      }
    }
    return { min: scaleMin, max: scaleMax };
  }

  dispararAlertaEspecial(sensor: Sensor, valor: number, tipo: 'fuera' | 'dentro') {
    if (this.isSoundPlaying) {
      // Evitar la superposición de alarmas sonoras consecutivas
      return;
    }
    this.isSoundPlaying = true;

    const duration = tipo === 'fuera' ? 2000 : 350;

    if (tipo === 'fuera') {
      // Un solo pitido de 2 segundos
      this.playBeep(880, duration);
      
      // Anuncio de voz en español después de que termine el pitido
      setTimeout(() => {
        this.speak(`Variable ${sensor.name} fuera de los límites`);
        setTimeout(() => {
          this.isSoundPlaying = false;
        }, 3000); // Dar 3 segundos para terminar de hablar
      }, duration + 200);
    } else {
      // Un pitido medio agradable de restablecimiento (350ms)
      this.playBeep(520, duration);
      
      // Anuncio de voz en español después de que termine el pitido
      setTimeout(() => {
        this.speak(`Variable ${sensor.name} normalizada`);
        setTimeout(() => {
          this.isSoundPlaying = false;
        }, 2000); // Dar 2 segundos para terminar de hablar
      }, duration + 150);
    }

    // Obtener la imagen base64 del gráfico correspondiente
    const canvas = document.getElementById('chart_' + sensor.tag) as HTMLCanvasElement;
    const chartImage = canvas ? canvas.toDataURL('image/png') : null;

    // Llamar al backend para enviar el correo a los destinatarios configurados con el gráfico
    this.scadaService.sendAlertEmail(sensor.tag, valor, tipo, chartImage).subscribe({
      next: () => console.log(`[AlertaScada] Solicitud de correo con gráfico procesada para ${sensor.tag}`),
      error: (err) => console.error('[AlertaScada] Error en envío de correo para ' + sensor.tag, err)
    });
  }

  updateAlerts() {
    const alerts: typeof this.activeAlerts = [];
    Object.values(this.sensorGroups).flat().forEach(sensor => {
      const val = this.getValor(sensor.tag);
      if (val !== null) {
        const limitMin = (sensor.min !== null && sensor.min !== undefined && (sensor.min as any) !== '') ? Number(sensor.min) : null;
        const limitMax = (sensor.max !== null && sensor.max !== undefined && (sensor.max as any) !== '') ? Number(sensor.max) : null;
        const isOutOfLimits = (limitMin !== null && !isNaN(limitMin) && val < limitMin) || 
                              (limitMax !== null && !isNaN(limitMax) && val > limitMax);
        
        if (isOutOfLimits) {
          alerts.push({
            tag: sensor.tag,
            name: sensor.name,
            value: val,
            min: limitMin,
            max: limitMax,
            unit: sensor.unit
          });

          if (sensor.notificar) {
            if (!this.alertedTags.has(sensor.tag)) {
              this.alertedTags.add(sensor.tag);
              this.dispararAlertaEspecial(sensor, val, 'fuera');
            }
          }
        } else {
          if (sensor.notificar) {
            if (this.alertedTags.has(sensor.tag)) {
              this.alertedTags.delete(sensor.tag);
              this.dispararAlertaEspecial(sensor, val, 'dentro');
            }
          }
        }
      }
    });
    this.activeAlerts = alerts;
  }

  scrollToSensor(tag: string) {
    this.isNotificationPanelOpen = false;
    setTimeout(() => {
      const element = document.getElementById('card_' + tag);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlighted');
        setTimeout(() => {
          element.classList.remove('highlighted');
        }, 3000);
      }
    }, 100);
  }

  renderChartsAndGauges() {
    const visibleSensors = this.getFilteredSensors();
    
    // Destroy charts for sensors that are no longer visible to avoid memory leaks and background rendering
    const visibleTags = new Set(visibleSensors.map(s => s.tag));
    this.chartInstances.forEach((chart, tag) => {
      if (!visibleTags.has(tag)) {
        chart.destroy();
        this.chartInstances.delete(tag);
      }
    });

    visibleSensors.forEach(sensor => {
      // 1. Line Chart
      const chartCanvas = document.getElementById('chart_' + sensor.tag) as HTMLCanvasElement;
      if (chartCanvas) {
        const hist = this.historyData.get(sensor.tag) || [];
        const labels = this.timestamps.slice(0, hist.length);

        if (!this.chartInstances.has(sensor.tag)) {
          const color = '#198754';
          const ctx = chartCanvas.getContext('2d')!;

          const chartScale = this.getChartScale(sensor.min, sensor.max);

          const datasets: any[] = [
            {
              label: sensor.tag,
              data: hist,
              borderColor: color,
              backgroundColor: color + '15',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: hist.length <= 10 ? 3 : 0, // show dots only if few points exist
              pointHoverRadius: 5
            }
          ];

          if (sensor.min !== null) {
            datasets.push({
              label: 'Mínimo',
              data: Array(hist.length).fill(sensor.min),
              borderColor: '#dc3545',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false
            });
          }
          if (sensor.max !== null) {
            datasets.push({
              label: 'Máximo',
              data: Array(hist.length).fill(sensor.max),
              borderColor: '#dc3545',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false
            });
          }

          const chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              scales: {
                x: {
                  grid: { color: '#f1f3f5' },
                  ticks: { font: { size: 9 }, color: '#6c757d', maxTicksLimit: 5 }
                },
                y: {
                  min: chartScale.min,
                  max: chartScale.max,
                  grid: { color: '#f1f3f5' },
                  ticks: { font: { size: 9 }, color: '#6c757d' }
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: { padding: 8 }
              }
            }
          });
          this.chartInstances.set(sensor.tag, chart);
        } else {
          const chart = this.chartInstances.get(sensor.tag)!;
          chart.data.labels = labels;
          chart.data.datasets[0].data = hist;
          (chart.data.datasets[0] as any).pointRadius = hist.length <= 10 ? 3 : 0;

          const minDataset = chart.data.datasets.find(d => d.label === 'Mínimo');
          if (minDataset && sensor.min !== null) {
            minDataset.data = Array(hist.length).fill(sensor.min);
          }
          const maxDataset = chart.data.datasets.find(d => d.label === 'Máximo');
          if (maxDataset && sensor.max !== null) {
            maxDataset.data = Array(hist.length).fill(sensor.max);
          }

          const chartScale = this.getChartScale(sensor.min, sensor.max);
          if (chart.options.scales?.['y']) {
            chart.options.scales['y'].min = chartScale.min;
            chart.options.scales['y'].max = chartScale.max;
          }

          chart.update('none');
        }
      }

      // 2. Gauge Chart
      const gaugeCanvas = document.getElementById('gauge_' + sensor.tag) as HTMLCanvasElement;
      if (gaugeCanvas) {
        const val = this.getValor(sensor.tag);
        this.drawGauge(gaugeCanvas, val, sensor.min, sensor.max, sensor.tag);
      }
    });
  }

  drawGauge(canvas: HTMLCanvasElement, value: number | null, min: number | null, max: number | null, tag: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h - 15;
    const radius = Math.min(w, h * 2) / 2.8;
    const startAngle = Math.PI;
    const endAngle = 0;

    let gaugeMin = 0;
    let gaugeMax = 100;

    if (min != null && !isNaN(min) && max != null && !isNaN(max)) {
      const scale = this.getChartScale(min, max);
      gaugeMin = scale.min;
      gaugeMax = scale.max;
    } else if (max != null && !isNaN(max)) {
      gaugeMax = max + 15;
      if (min != null && !isNaN(min)) {
        gaugeMin = Math.max(0, min - 10);
      }
    } else if (min != null && !isNaN(min)) {
      gaugeMin = Math.max(0, min - 10);
      gaugeMax = gaugeMin + 20;
    } else if (value != null && !isNaN(value)) {
      gaugeMin = Math.max(0, value - 10);
      gaugeMax = value + 10;
    }

    const gaugeRange = gaugeMax - gaugeMin || 1;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 14;
    ctx.stroke();

    if (value === null || isNaN(value)) {
      ctx.fillStyle = '#6c757d';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('N/A', cx, cy - radius / 3);
      return;
    }

    // Active arc
    const normalized = Math.max(0, Math.min(1, (value - gaugeMin) / gaugeRange));
    const currentAngle = startAngle + Math.PI * normalized;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, currentAngle, false);
    ctx.strokeStyle = (min != null && max != null && (value < min || value > max)) ? '#dc3545' : '#198754';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#212529';
    ctx.fill();

    // Needle pointer
    const needleLength = radius - 5;
    const needleX = cx + needleLength * Math.cos(currentAngle);
    const needleY = cy + needleLength * Math.sin(currentAngle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Text value representation
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value.toFixed(1), cx, cy - radius / 2.5);

    // Limit indicator lines
    const drawLimitLine = (limitValue: number | null, color: string) => {
      if (limitValue === null || isNaN(limitValue)) return;
      const norm = (limitValue - gaugeMin) / gaugeRange;
      const angle = startAngle + Math.PI * norm;
      const x1 = cx + (radius - 10) * Math.cos(angle);
      const y1 = cy + (radius - 10) * Math.sin(angle);
      const x2 = cx + (radius + 15) * Math.cos(angle);
      const y2 = cy + (radius + 15) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw value text above/outermost of the line
      const tx = cx + (radius + 24) * Math.cos(angle);
      const ty = cy + (radius + 24) * Math.sin(angle);
      ctx.fillStyle = '#212529';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const formattedVal = limitValue % 1 === 0 ? limitValue.toString() : limitValue.toFixed(1);
      ctx.fillText(formattedVal, tx, ty);
    };

    drawLimitLine(min, '#dc3545');
    drawLimitLine(max, '#dc3545');
  }
}
