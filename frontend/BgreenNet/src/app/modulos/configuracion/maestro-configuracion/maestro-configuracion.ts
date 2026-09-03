import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { ConfiguracionSeguridadService, ConfiguracionSeguridad, PropiedadesServidor } from '../../../servicios/configuracionSeguridadService';
import { ListasService } from '../../../servicios/listasServices';
import { ImagenLogin } from '../../../models/imagen-login';
import { AuthService } from '../../../auth/authservices';
import { UsuarioService } from '../../../servicios/usuarioservices';
import { MetricsService, SystemMetrics } from '../../../servicios/metrics.service';
import Swal from 'sweetalert2';

Chart.register(...registerables);

@Component({
  selector: 'app-maestro-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgChartsModule],
  templateUrl: './maestro-configuracion.html',
  styleUrl: './maestro-configuracion.css',
})
export class MaestroConfiguracion implements OnInit, OnDestroy {
  activeTab: 'seguridad' | 'servidor' | 'imagenes' = 'seguridad';

  // Configuración de Servidor & application.properties
  propiedadesServidor: PropiedadesServidor | null = null;
  loadingPropiedades = false;
  copiadoReciente: string = '';

  // Configuración de Seguridad
  configForm: FormGroup;
  loading = false;

  // Gestión de Imágenes
  imagenes: ImagenLogin[] = [];
  loadingImagenes = false;
  nuevaImagenUrl: string = '';
  nuevaImagenNombre: string = '';
  filtroBusqueda: string = '';

  // Gráficas de Tráfico
  private metricsInterval: any;
  maxDataPoints = 30; // Mostrar últimos 30 puntos (ej. 30 * 5s = 2.5 min)
  
  dbChartData: ChartData<'line'> = { labels: [], datasets: [] };
  httpChartData: ChartData<'line'> = { labels: [], datasets: [] };
  nodeRedChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  commonChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 0, maxTicksLimit: 6 }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 10 }, color: '#94a3b8', padding: 8 },
        border: { display: false }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.90)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4
      }
    }
  };

  private dbHistory: { active: number[], idle: number[], total: number[] } = { active: [], idle: [], total: [] };
  private httpHistory: { count: number[] } = { count: [] };
  private nodeRedHistory: { latency: number[] } = { latency: [] };
  private timeLabels: string[] = [];
  private lastHttpCount: number = -1;

  constructor(
    private fb: FormBuilder,
    private configService: ConfiguracionSeguridadService,
    private listasService: ListasService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private metricsService: MetricsService,
    private cdr: ChangeDetectorRef
  ) {
    this.configForm = this.fb.group({
      expiracionDias: [90, [Validators.required]],
      intentosInvalidos: [5, [Validators.required]],
      minCaracteres: [8, [Validators.required, Validators.min(4), Validators.max(20)]],
      requiereLetras: [true],
      requiereNumeros: [true],
      requiereEspeciales: [true],
      companyIdLogistico: [localStorage.getItem('LOGISTICO_COMPANY_ID') || '900715610']
    });
    this.initChartData();
  }

  ngOnInit(): void {
    this.loadPropiedadesServidor();
    this.loadConfig();
    this.loadImagenes();
  }

  ngOnDestroy(): void {
    this.stopMetricsPolling();
  }

  cambiarTab(tab: 'seguridad' | 'servidor' | 'imagenes'): void {
    this.activeTab = tab;
    if (tab === 'servidor') {
      if (!this.propiedadesServidor) {
        this.loadPropiedadesServidor();
      }
      this.startMetricsPolling();
    } else {
      this.stopMetricsPolling();
    }
  }

  // --- TRÁFICO Y MÉTRICAS ---

  private initChartData(): void {
    const pointConfig = { pointRadius: 2, pointHoverRadius: 5, pointBorderWidth: 2 };

    this.dbChartData = {
      labels: this.timeLabels,
      datasets: [
        { label: 'Activas', data: this.dbHistory.active, borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, ...pointConfig, pointBackgroundColor: '#e74c3c' },
        { label: 'Inactivas', data: this.dbHistory.idle, borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, ...pointConfig, pointBackgroundColor: '#3498db' },
        { label: 'Total', data: this.dbHistory.total, borderColor: '#94a3b8', backgroundColor: 'transparent', fill: false, borderDash: [6, 3], tension: 0, borderWidth: 1.5, pointRadius: 0 }
      ]
    };

    this.httpChartData = {
      labels: this.timeLabels,
      datasets: [
        { label: 'Peticiones / intervalo', data: this.httpHistory.count, borderColor: '#15803d', backgroundColor: 'rgba(21,128,61,0.10)', fill: true, tension: 0.4, borderWidth: 2.5, ...pointConfig, pointBackgroundColor: '#15803d' }
      ]
    };

    this.nodeRedChartData = {
      labels: this.timeLabels,
      datasets: [
        { label: 'Latencia (ms)', data: this.nodeRedHistory.latency, borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.10)', fill: true, tension: 0.4, borderWidth: 2.5, ...pointConfig, pointBackgroundColor: '#d97706' }
      ]
    };
  }

  private startMetricsPolling(): void {
    this.stopMetricsPolling(); // Ensure no duplicates
    this.fetchMetrics(); // Fetch immediately
    this.metricsInterval = setInterval(() => {
      this.fetchMetrics();
    }, 5000); // 5 segundos
  }

  private stopMetricsPolling(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private fetchMetrics(): void {
    this.metricsService.getCurrentMetrics().subscribe({
      next: (data) => {
        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        this.timeLabels.push(timeLabel);
        
        this.dbHistory.active.push(data.db.active);
        this.dbHistory.idle.push(data.db.idle);
        this.dbHistory.total.push(data.db.total);

        // HTTP is a cumulative counter, we need to calculate the delta
        if (this.lastHttpCount === -1) {
          this.httpHistory.count.push(0);
        } else {
          this.httpHistory.count.push(Math.max(0, data.http.count - this.lastHttpCount));
        }
        this.lastHttpCount = data.http.count;

        this.nodeRedHistory.latency.push(data.nodered.latencyMs);

        // Trim to max data points
        if (this.timeLabels.length > this.maxDataPoints) {
          this.timeLabels.shift();
          this.dbHistory.active.shift();
          this.dbHistory.idle.shift();
          this.dbHistory.total.shift();
          this.httpHistory.count.shift();
          this.nodeRedHistory.latency.shift();
        }

        // Trigger chart update
        this.dbChartData = { ...this.dbChartData };
        this.httpChartData = { ...this.httpChartData };
        this.nodeRedChartData = { ...this.nodeRedChartData };
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching metrics', err);
      }
    });
  }

  // --- GESTIÓN DE PROPIEDADES DEL SERVIDOR (application.properties) ---

  loadPropiedadesServidor(): void {
    this.loadingPropiedades = true;
    this.configService.getPropiedadesServidor().subscribe({
      next: (props) => {
        this.propiedadesServidor = props;
        this.loadingPropiedades = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar propiedades del servidor', err);
        this.loadingPropiedades = false;
        this.cdr.detectChanges();
      }
    });
  }

  copiarAlPortapapeles(texto: string, etiqueta: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.copiadoReciente = etiqueta;
      setTimeout(() => {
        if (this.copiadoReciente === etiqueta) {
          this.copiadoReciente = '';
          this.cdr.detectChanges();
        }
      }, 2000);
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Error al copiar al portapapeles', err);
    });
  }

  loadConfig(): void {
    this.loading = true;
    const savedCompany = localStorage.getItem('LOGISTICO_COMPANY_ID') || '900715610';
    this.configService.getConfiguracion().subscribe({
      next: (config) => {
        this.configForm.patchValue({ ...config, companyIdLogistico: savedCompany });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar configuración', err);
        this.configForm.patchValue({ companyIdLogistico: savedCompany });
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la configuración de seguridad', 'error');
      }
    });
  }

  saveConfig(): void {
    if (this.configForm.invalid) return;
    
    if (!this.atLeastOneRequirement) {
      Swal.fire('Atención', 'Debes seleccionar al menos un requisito para la contraseña (Letras, Números o Especiales).', 'warning');
      return;
    }

    if (this.configForm.value.companyIdLogistico) {
      localStorage.setItem('LOGISTICO_COMPANY_ID', String(this.configForm.value.companyIdLogistico).trim());
    }

    this.loading = true;
    const config: ConfiguracionSeguridad = this.configForm.value;

    this.configService.updateConfiguracion(config).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('¡Guardado!', 'Configuración de seguridad y módulos actualizada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al actualizar configuración', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
      }
    });
  }

  incrementMin(): void {
    const current = this.configForm.get('minCaracteres')?.value ?? 8;
    if (current < 20) {
      this.configForm.get('minCaracteres')?.setValue(current + 1);
    }
  }

  decrementMin(): void {
    const current = this.configForm.get('minCaracteres')?.value ?? 8;
    if (current > 4) {
      this.configForm.get('minCaracteres')?.setValue(current - 1);
    }
  }

  // --- GESTIÓN DE IMÁGENES ---

  loadImagenes(): void {
    this.loadingImagenes = true;
    this.listasService.getAllImagenesLogin().subscribe({
      next: (imgs) => {
        this.imagenes = imgs;
        this.loadingImagenes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar imágenes', err);
        this.loadingImagenes = false;
      }
    });
  }

  agregarImagen(): void {
    if (!this.nuevaImagenUrl || !this.nuevaImagenUrl.trim()) return;

    const currentUser = this.authService.getCurrentUser();
    const nombreCompleto = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema';
    
    const nuevaImg: ImagenLogin = {
      url: this.nuevaImagenUrl.trim(),
      nombre: this.nuevaImagenNombre.trim(),
      activo: 1,
      usuarioCreacion: nombreCompleto
    };

    this.loadingImagenes = true;
    this.listasService.saveImagenLogin(nuevaImg).subscribe({
      next: () => {
        this.nuevaImagenUrl = '';
        this.nuevaImagenNombre = '';
        this.loadImagenes();
        Swal.fire('¡Añadida!', 'La imagen ha sido agregada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al agregar imagen', err);
        this.loadingImagenes = false;
        Swal.fire('Error', 'No se pudo agregar la imagen.', 'error');
      }
    });
  }

  onToggleImagen(event: Event, imagen: ImagenLogin): void {
    event.preventDefault(); // Evitar que el navegador cambie el checkbox visualmente

    const imagenesActivas = this.imagenes.filter(img => img.activo === 1);
    
    // Si la imagen está activa y es la única activa, no permitir desactivarla
    if (imagen.activo === 1 && imagenesActivas.length <= 1) {
      Swal.fire('Atención', 'Debe haber al menos una imagen activa para el fondo del login.', 'warning');
      return;
    }

    imagen.activo = imagen.activo === 1 ? 0 : 1;
    this.listasService.saveImagenLogin(imagen).subscribe({
      next: () => {
        this.loadImagenes();
      },
      error: (err) => {
        console.error('Error al actualizar imagen', err);
        imagen.activo = imagen.activo === 1 ? 0 : 1; // Revertir
        this.loadImagenes();
        Swal.fire('Error', 'No se pudo actualizar el estado de la imagen.', 'error');
      }
    });
  }


  eliminarImagen(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#006c2c',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const imagenAEliminar = this.imagenes.find(img => img.id === id);
        const imagenesActivas = this.imagenes.filter(img => img.activo === 1);

        if (imagenAEliminar && imagenAEliminar.activo === 1 && imagenesActivas.length <= 1) {
          Swal.fire('Atención', 'No puedes eliminar la única imagen activa. Activa otra imagen primero.', 'warning');
          return;
        }

        this.loadingImagenes = true;
        this.listasService.deleteImagenLogin(id).subscribe({
          next: () => {
            this.loadImagenes();
            Swal.fire('¡Eliminada!', 'La imagen ha sido eliminada.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar imagen', err);
            this.loadingImagenes = false;
            Swal.fire('Error', 'No se pudo eliminar la imagen.', 'error');
          }
        });
      }
    });
  }

  actualizarUrl(imagen: ImagenLogin, event: any): void {
    const nuevaUrl = event.target.value;
    if (nuevaUrl && nuevaUrl !== imagen.url) {
      imagen.url = nuevaUrl;
      this.listasService.saveImagenLogin(imagen).subscribe({
        next: () => {
          Swal.fire({
            title: 'URL Actualizada',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al actualizar URL', err);
          this.loadImagenes(); // Recargar para revertir
          Swal.fire('Error', 'No se pudo actualizar la URL.', 'error');
        }
      });
    }
  }

  actualizarNombre(imagen: ImagenLogin, event: any): void {
    const nuevoNombre = event.target.value;
    if (nuevoNombre !== imagen.nombre) {
      imagen.nombre = nuevoNombre;
      this.listasService.saveImagenLogin(imagen).subscribe({
        next: () => {
          Swal.fire({
            title: 'Nombre Actualizado',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error al actualizar nombre', err);
          this.loadImagenes(); // Recargar para revertir
          Swal.fire('Error', 'No se pudo actualizar el nombre.', 'error');
        }
      });
    }
  }

  get filteredImagenes(): ImagenLogin[] {
    if (!this.filtroBusqueda || !this.filtroBusqueda.trim()) {
      return this.imagenes;
    }
    const search = this.filtroBusqueda.toLowerCase().trim();
    return this.imagenes.filter(img => 
      (img.nombre && img.nombre.toLowerCase().includes(search)) || 
      (img.url && img.url.toLowerCase().includes(search))
    );
  }

  get atLeastOneRequirement(): boolean {
    return this.configForm.get('requiereLetras')?.value || 
           this.configForm.get('requiereNumeros')?.value || 
           this.configForm.get('requiereEspeciales')?.value;
  }

  forzarVencimiento(): void {
    Swal.fire({
      title: '¿Forzar vencimiento de claves?',
      html: '<p>Esta acción hará que <b>todos los usuarios activos</b> deban cambiar su contraseña en el próximo inicio de sesión.</p><p class="text-muted">Esta acción no se puede deshacer.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, forzar vencimiento',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.usuarioService.forzarVencimientoTodos().subscribe({
          next: () => {
            this.loading = false;
            Swal.fire({
              title: '¡Hecho!',
              text: 'Todas las contraseñas han sido marcadas como vencidas. Los usuarios deberán cambiarla al iniciar sesión.',
              icon: 'success',
              confirmButtonColor: '#006c2c'
            });
          },
          error: (err) => {
            this.loading = false;
            console.error('Error al forzar vencimiento:', err);
            Swal.fire('Error', 'No se pudo forzar el vencimiento de claves.', 'error');
          }
        });
      }
    });
  }
}
