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
import { SupervisionAsistenciaService, SupervisorAsignadoResumen, GuardarSupervisionPayload, SupervisionAsistenciaItem } from '../../../servicios/supervision-asistencia.service';
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
  activeTab: 'seguridad' | 'servidor' | 'imagenes' | 'asistencia' = 'seguridad';

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
    private cdr: ChangeDetectorRef,
    private supervisionService: SupervisionAsistenciaService
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
    this.loadSupervisoresAsistencia();
    this.loadListasParaAsignacion();
  }

  ngOnDestroy(): void {
    this.stopMetricsPolling();
  }

  cambiarTab(tab: 'seguridad' | 'servidor' | 'imagenes' | 'asistencia'): void {
    this.activeTab = tab;
    if (tab === 'servidor') {
      if (!this.propiedadesServidor) {
        this.loadPropiedadesServidor();
      }
      this.startMetricsPolling();
    } else {
      this.stopMetricsPolling();
    }
    if (tab === 'asistencia') {
      this.loadSupervisoresAsistencia();
      this.loadListasParaAsignacion();
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


  // =========================================================
  // MÓDULO DE SUPERVISIÓN DE ASISTENCIA & HORARIOS
  // =========================================================
  supervisoresAsistencia: SupervisorAsignadoResumen[] = [];
  loadingSupervisores: boolean = false;
  filtroSupervisores: string = '';
  filtroTipoAlcance: string = 'TODOS';
  mostrarSeccionJerarquia: boolean = true;
  mostrarSeccionManual: boolean = true;
  modalSupervisionOpen: boolean = false;
  guardandoSupervision: boolean = false;

  usuariosParaSupervision: any[] = [];
  areasParaSupervision: any[] = [];

  supervisorSeleccionadoId: number | null = null;
  tipoAlcanceSeleccionado: 'GLOBAL' | 'AREA' | 'COLABORADOR' = 'AREA';
  areasSeleccionadasIds: number[] = [];
  colaboradoresSeleccionadosCedulas: string[] = [];
  puedeAprobarHorasExtraModal: boolean = true;
  activoSupervisionModal: boolean = true;
  observacionSupervisionModal: string = '';

  busquedaSupervisorModal: string = '';
  busquedaAreaModal: string = '';
  busquedaColaboradorModal: string = '';

  get totalSupervisores(): number {
    return this.supervisoresAsistencia.length;
  }

  get totalSupervisoresJerarquia(): number {
    return this.supervisoresPorJerarquia.length;
  }

  get totalAreasSupervisadas(): number {
    const s = new Set<string>();
    this.supervisoresAsistencia.forEach(sup => sup.areasNombres?.forEach(a => s.add(a)));
    this.supervisoresPorJerarquia.forEach(sup => sup.areasNombres?.forEach((a: string) => s.add(a)));
    return s.size;
  }

  get totalColaboradoresSupervisados(): number {
    const s = new Set<string>();
    this.supervisoresAsistencia.forEach(sup => sup.colaboradoresNombres?.forEach(c => s.add(c)));
    return s.size;
  }

  get totalSupervisoresGlobales(): number {
    const manualesGlobal = this.supervisoresAsistencia.filter(s => s.tipoAlcance === 'GLOBAL').length;
    const jerarquiaGlobal = this.supervisoresPorJerarquia.filter(s => s.tipoAlcance === 'GLOBAL').length;
    return manualesGlobal + jerarquiaGlobal;
  }

  // Mapa de Direcciones según tabla Direccion en BD
  private readonly direccionesMapBD: { [idDir: number]: string } = {
    1: 'Presidencia',
    2: 'Financiero',
    3: 'Planta',
    4: 'Comercial',
    5: 'SIG',
    6: 'Operaciones',
    7: 'Gestión Humana',
  };

  // Respaldo de mapeo id_area -> id_direccion_fk según tabla Area en BD
  private readonly areaToDireccionMapBD: { [idArea: number]: number } = {
    18: 1, 19: 1,                          // Presidencia, Control Interno -> Presidencia (1)
    3: 7,                                  // Gestión Humana -> Gestión Humana (7)
    2: 2, 4: 2, 8: 2, 10: 2, 11: 2,        // Tecnología, Planeación Financiera, Contabilidad, Tesorería, Administrativo -> Financiero (2)
    5: 3, 6: 3,                            // Mantenimiento, Producción -> Planta (3)
    7: 4, 9: 4, 13: 4, 16: 4,              // Abastecimiento, Logística, Compras, Almacén -> Comercial (4)
    12: 5, 14: 5, 15: 5, 17: 5,            // Hseq, Laboratorio, Sig, Documental -> SIG (5)
  };

  private normalizarTextoJerarquia(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private obtenerIdDireccionDeArea(idArea: number, nombreArea: string): number {
    // 1. Buscar en la lista real de áreas cargada desde BD (tiene idDireccionFk)
    if (this.areasParaSupervision && this.areasParaSupervision.length > 0) {
      const normNombre = this.normalizarTextoJerarquia(nombreArea);
      const areaBD = this.areasParaSupervision.find(a => {
        const aId = Number(a.idArea || a.id_area || 0);
        const aNom = this.normalizarTextoJerarquia(a.descripcionArea || a.nombre || a.area || '');
        return (idArea > 0 && aId === idArea) || (normNombre && aNom === normNombre);
      });
      if (areaBD) {
        const dirFk = Number(areaBD.idDireccionFk || areaBD.id_direccion_fk || (areaBD.direccion ? areaBD.direccion.idDireccion : 0));
        if (dirFk > 0) {
          return dirFk;
        }
      }
    }

    // 2. Respaldo por ID de área en mapa BD
    if (idArea > 0 && this.areaToDireccionMapBD[idArea]) {
      return this.areaToDireccionMapBD[idArea];
    }

    // 3. Respaldo por nombre de área
    const lowerArea = this.normalizarTextoJerarquia(nombreArea);
    if (lowerArea.includes('gestion humana') || lowerArea.includes('talento humano')) return 7;
    if (lowerArea.includes('presidencia') || lowerArea.includes('control interno')) return 1;
    if (lowerArea.includes('tecnolog') || lowerArea.includes('planeacion financiera') || lowerArea.includes('contabilid') || lowerArea.includes('tesorer') || lowerArea.includes('administrativ') || lowerArea.includes('sistemas')) return 2;
    if (lowerArea.includes('mantenimiento') || lowerArea.includes('produccion') || lowerArea.includes('planta')) return 3;
    if (lowerArea.includes('abastecimiento') || lowerArea.includes('logistica') || lowerArea.includes('compras') || lowerArea.includes('almacen') || lowerArea.includes('comercial')) return 4;
    if (lowerArea.includes('hseq') || lowerArea.includes('laboratorio') || lowerArea.includes('sig') || lowerArea.includes('documental')) return 5;
    if (lowerArea.includes('operacion') || lowerArea.includes('operaciones')) return 6;

    return 0;
  }

  private obtenerAreasAsociadasADireccion(idDir: number, idAreaPropia: number, areaPropiaNombre: string): { ids: number[]; nombres: string[] } {
    const ids: number[] = [];
    const nombres: string[] = [];

    if (idDir > 0 && this.areasParaSupervision && this.areasParaSupervision.length > 0) {
      for (const a of this.areasParaSupervision) {
        const aId = Number(a.idArea || a.id_area || 0);
        const aNom = (a.descripcionArea || a.nombre || a.area || '').trim();
        const aDir = this.obtenerIdDireccionDeArea(aId, aNom);
        if (aDir === idDir && aNom) {
          if (aId > 0 && !ids.includes(aId)) ids.push(aId);
          if (!nombres.includes(aNom)) nombres.push(aNom);
        }
      }
    }

    // Si aún no cargó areasParaSupervision, obtener desde los usuarios registrados que pertenezcan a esa misma Dirección
    if (nombres.length === 0 && idDir > 0 && this.usuariosParaSupervision && this.usuariosParaSupervision.length > 0) {
      for (const u of this.usuariosParaSupervision) {
        const uAreaId = Number(u.id_area_fk || u.Id_area_fk || u.idArea || 0);
        const uAreaNom = (u.descripcionArea || u.area || '').trim();
        const uDir = this.obtenerIdDireccionDeArea(uAreaId, uAreaNom);
        if (uDir === idDir && uAreaNom) {
          if (uAreaId > 0 && !ids.includes(uAreaId)) ids.push(uAreaId);
          if (!nombres.includes(uAreaNom)) nombres.push(uAreaNom);
        }
      }
    }

    // Garantizar que al menos esté el área propia del Director
    if (areaPropiaNombre && !nombres.includes(areaPropiaNombre)) {
      nombres.push(areaPropiaNombre);
    }
    if (idAreaPropia > 0 && !ids.includes(idAreaPropia)) {
      ids.push(idAreaPropia);
    }

    return {
      ids,
      nombres: nombres.sort((a, b) => a.localeCompare(b))
    };
  }

  /**
   * Construye la lista de líderes/supervisores que tienen acceso automático por Jerarquía:
   * - Nivel 1 (Presidencia / Admin): Acceso Global (todas las áreas).
   * - Nivel 2 (Dirección / Directores): Acceso SOLO a las áreas asociadas a su Dirección (NO todas).
   * - Nivel 3 (Coordinadores / Jefes): Acceso SOLO a su propia área.
   */
  get supervisoresPorJerarquia(): any[] {
    if (!this.usuariosParaSupervision || this.usuariosParaSupervision.length === 0) {
      return [];
    }

    const idsManuales = new Set<number>(
      (this.supervisoresAsistencia || []).map(s => Number(s.idSupervisor))
    );
    const cedulasManuales = new Set<string>(
      (this.supervisoresAsistencia || [])
        .map(s => String(s.cedulaSupervisor || '').trim())
        .filter(Boolean)
    );

    const resultado: any[] = [];

    for (const u of this.usuariosParaSupervision) {
      const estadoVal = u.estado !== undefined ? u.estado : u.activo;
      if (estadoVal !== undefined && estadoVal !== null && Number(estadoVal) !== 1 && estadoVal !== true) {
        continue;
      }

      const cargoId = Number(u.id_cargo_fk || u.Id_cargo_fk || u.idCargo || 0);
      const cargoDesc = this.normalizarTextoJerarquia(u.descripcionCargo || u.cargo || '');
      const userLogin = (u.usuario || '').toLowerCase().trim();
      const idAreaU = Number(u.id_area_fk || u.Id_area_fk || u.idArea || 0);
      const areaPropia = (u.descripcionArea || u.area || 'General').trim();
      const areaNorm = this.normalizarTextoJerarquia(areaPropia);

      // Clasificación estricta:
      // - Nivel 1 (Global): exclusivamente usuario 'admin' o cargos de Presidencia / Gerencia General / CEO
      // - Nivel 2 (Dirección): Directores (incluso si en BD su id_cargo_fk es 1 o 2) -> SOLO ven las áreas asociadas a su Dirección
      // - Nivel 3 (Coordinación / Jefatura): Coordinadores, Jefes, Líderes, Supervisores -> SOLO ven su propia área
      let nivel = 6;
      if (
        userLogin === 'admin' ||
        cargoDesc.includes('presidente') ||
        cargoDesc.includes('ceo') ||
        cargoDesc.includes('gerente general')
      ) {
        nivel = 1;
      } else if (
        cargoDesc.includes('director') ||
        cargoDesc.includes('direccion') ||
        cargoDesc.includes('gerente') ||
        cargoDesc.includes('vp')
      ) {
        nivel = 2;
      } else if (
        cargoDesc.includes('coordinador') ||
        cargoDesc.includes('jefe') ||
        cargoDesc.includes('lider') ||
        cargoDesc.includes('supervisor')
      ) {
        nivel = 3;
      } else if (
        cargoDesc.includes('analista') ||
        cargoDesc.includes('especialista') ||
        cargoDesc.includes('profesional') ||
        cargoDesc.includes('ingeniero') ||
        cargoDesc.includes('desarrollador')
      ) {
        nivel = 4;
      } else if (
        cargoDesc.includes('asistente') ||
        cargoDesc.includes('secretaria') ||
        cargoDesc.includes('practicante') ||
        cargoDesc.includes('aprendiz')
      ) {
        nivel = 5;
      } else if (
        cargoDesc.includes('auxiliar') ||
        cargoDesc.includes('operario') ||
        cargoDesc.includes('operativo') ||
        cargoDesc.includes('tecnico')
      ) {
        nivel = 6;
      } else if (cargoId === 1) {
        // Si id_cargo_fk es 1 y el área es Presidencia -> Nivel 1, de lo contrario es Dirección (Nivel 2)
        nivel = areaNorm === 'presidencia' ? 1 : 2;
      } else if (cargoId === 2) {
        nivel = 2;
      } else if (cargoId === 3) {
        nivel = 3;
      }

      if (nivel > 3) {
        continue;
      }

      const idU = Number(u.idUsuario || u.id_usuario || 0);
      const doc = String(u.identificacion || '').trim();
      const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.usuario || 'Administrador';
      const cargoNombre = (u.descripcionCargo || u.cargo || (nivel === 1 ? 'Presidencia / Administración' : nivel === 2 ? 'Director' : 'Coordinador')).trim();

      const idDir = this.obtenerIdDireccionDeArea(idAreaU, areaPropia);
      const nombreDireccion = this.direccionesMapBD[idDir] || areaPropia;

      let tipoAlcance: 'GLOBAL' | 'DIRECCION' | 'AREA' = 'AREA';
      let etiquetaNivel = 'Nivel 3 · Coordinación';
      let descripcionRegla = 'Supervisa únicamente los colaboradores de su propia área';
      let areasNombres: string[] = [areaPropia];
      let areasIds: number[] = idAreaU > 0 ? [idAreaU] : [];
      let puedeAprobarHorasExtra = false;

      if (nivel === 1) {
        tipoAlcance = 'GLOBAL';
        etiquetaNivel = 'Nivel 1 · Presidencia / Admin';
        descripcionRegla = 'Acceso global a todas las áreas de la compañía';
        areasNombres = (this.areasParaSupervision || [])
          .map(a => (a.descripcionArea || a.nombre || a.area || '').trim())
          .filter(Boolean);
        areasIds = (this.areasParaSupervision || [])
          .map(a => Number(a.idArea || a.id_area || 0))
          .filter(id => id > 0);
        puedeAprobarHorasExtra = true;
      } else if (nivel === 2) {
        tipoAlcance = 'DIRECCION';
        etiquetaNivel = `Nivel 2 · Dirección ${nombreDireccion}`;
        const asociadas = this.obtenerAreasAsociadasADireccion(idDir, idAreaU, areaPropia);
        areasNombres = asociadas.nombres;
        areasIds = asociadas.ids;
        descripcionRegla = `Dirección ${nombreDireccion}: supervisa únicamente sus ${areasNombres.length} área(s) asociada(s)`;
        puedeAprobarHorasExtra = true;
      } else {
        tipoAlcance = 'AREA';
        etiquetaNivel = 'Nivel 3 · Coordinación / Jefatura';
        descripcionRegla = 'Supervisa únicamente el equipo de su área asignada';
        areasNombres = [areaPropia];
        areasIds = idAreaU > 0 ? [idAreaU] : [];
        puedeAprobarHorasExtra = false;
      }

      const tieneReglaManual = (idU > 0 && idsManuales.has(idU)) || (Boolean(doc) && cedulasManuales.has(doc));

      resultado.push({
        usuarioRaw: u,
        idSupervisor: idU,
        usuarioLogin: u.usuario || '',
        cedulaSupervisor: doc || 'N/A',
        nombreSupervisor: nombreCompleto,
        cargoSupervisor: cargoNombre,
        areaSupervisor: areaPropia,
        nombreDireccion,
        nivelJerarquico: nivel,
        etiquetaNivel,
        tipoAlcance,
        descripcionRegla,
        areasNombres,
        areasIds,
        puedeAprobarHorasExtra,
        tieneReglaManual
      });
    }

    return resultado.sort((a, b) => {
      if (a.nivelJerarquico !== b.nivelJerarquico) {
        return a.nivelJerarquico - b.nivelJerarquico;
      }
      return a.nombreSupervisor.localeCompare(b.nombreSupervisor);
    });
  }

  get supervisoresJerarquiaFiltrados(): any[] {
    let list = this.supervisoresPorJerarquia;
    if (this.filtroTipoAlcance !== 'TODOS') {
      if (this.filtroTipoAlcance === 'GLOBAL') {
        list = list.filter(s => s.tipoAlcance === 'GLOBAL');
      } else if (this.filtroTipoAlcance === 'AREA') {
        list = list.filter(s => s.tipoAlcance === 'AREA' || s.tipoAlcance === 'DIRECCION');
      } else if (this.filtroTipoAlcance === 'COLABORADOR') {
        list = [];
      }
    }
    if (this.filtroSupervisores && this.filtroSupervisores.trim()) {
      const q = this.filtroSupervisores.trim().toLowerCase();
      list = list.filter(s =>
        (s.nombreSupervisor && s.nombreSupervisor.toLowerCase().includes(q)) ||
        (s.usuarioLogin && s.usuarioLogin.toLowerCase().includes(q)) ||
        (s.cedulaSupervisor && s.cedulaSupervisor.toLowerCase().includes(q)) ||
        (s.cargoSupervisor && s.cargoSupervisor.toLowerCase().includes(q)) ||
        (s.areaSupervisor && s.areaSupervisor.toLowerCase().includes(q)) ||
        (s.etiquetaNivel && s.etiquetaNivel.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get supervisoresFiltrados(): SupervisorAsignadoResumen[] {
    let list = this.supervisoresAsistencia;
    if (this.filtroTipoAlcance !== 'TODOS') {
      list = list.filter(s => s.tipoAlcance === this.filtroTipoAlcance);
    }
    if (this.filtroSupervisores && this.filtroSupervisores.trim()) {
      const q = this.filtroSupervisores.trim().toLowerCase();
      list = list.filter(s => 
        (s.nombreSupervisor && s.nombreSupervisor.toLowerCase().includes(q)) ||
        (s.cedulaSupervisor && s.cedulaSupervisor.toLowerCase().includes(q)) ||
        (s.cargoSupervisor && s.cargoSupervisor.toLowerCase().includes(q)) ||
        (s.areaSupervisor && s.areaSupervisor.toLowerCase().includes(q)) ||
        (s.areasNombres && s.areasNombres.some(a => a.toLowerCase().includes(q))) ||
        (s.colaboradoresNombres && s.colaboradoresNombres.some(c => c.toLowerCase().includes(c)))
      );
    }
    return list;
  }

  get usuariosSupervisorFiltrados(): any[] {
    if (!this.busquedaSupervisorModal || !this.busquedaSupervisorModal.trim()) {
      return this.usuariosParaSupervision;
    }
    const q = this.busquedaSupervisorModal.trim().toLowerCase();
    return this.usuariosParaSupervision.filter(u => {
      const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
      const doc = (u.identificacion || '').toString().toLowerCase();
      const user = (u.usuario || '').toLowerCase();
      const cargo = (u.descripcionCargo || u.cargo || '').toLowerCase();
      return nombreCompleto.includes(q) || doc.includes(q) || user.includes(q) || cargo.includes(q);
    });
  }

  get areasFiltradasModal(): any[] {
    if (!this.busquedaAreaModal || !this.busquedaAreaModal.trim()) {
      return this.areasParaSupervision;
    }
    const q = this.busquedaAreaModal.trim().toLowerCase();
    return this.areasParaSupervision.filter(a => {
      const nombre = (a.descripcionArea || a.nombre || a.area || '').toLowerCase();
      return nombre.includes(q);
    });
  }

  get colaboradoresFiltradosModal(): any[] {
    const q = (this.busquedaColaboradorModal || '').trim().toLowerCase();
    return this.usuariosParaSupervision.filter(u => {
      if (this.supervisorSeleccionadoId && u.idUsuario === this.supervisorSeleccionadoId) {
        return false;
      }
      if (!q) return true;
      const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
      const doc = (u.identificacion || '').toString().toLowerCase();
      const area = (u.descripcionArea || u.area || '').toLowerCase();
      return nombreCompleto.includes(q) || doc.includes(q) || area.includes(q);
    });
  }

  get supervisorSeleccionadoObj(): any {
    return this.usuariosParaSupervision.find(u => u.idUsuario === this.supervisorSeleccionadoId) || null;
  }

  loadSupervisoresAsistencia(): void {
    this.loadingSupervisores = true;
    this.supervisionService.listarSupervisores().subscribe({
      next: (data) => {
        this.supervisoresAsistencia = data || [];
        this.loadingSupervisores = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar supervisores de asistencia:', err);
        this.loadingSupervisores = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadListasParaAsignacion(): void {
    if (this.usuariosParaSupervision.length === 0) {
      this.usuarioService.listarUsuarios().subscribe({
        next: (data) => {
          const lista: any[] = [...(data || [])];
          // Garantizar que el usuario actual (ej. admin si no tiene fila en DetalleUsuario) también aparezca
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const currentId = Number(currentUser.id_usuario || (currentUser as any).idUsuario || 0);
            const currentLogin = (currentUser.usuario || '').toLowerCase().trim();
            const yaExiste = lista.some(u =>
              (currentId > 0 && Number(u.idUsuario || u.id_usuario) === currentId) ||
              (currentLogin && (u.usuario || '').toLowerCase().trim() === currentLogin)
            );
            if (!yaExiste) {
              lista.push({
                idUsuario: currentId || 999999,
                id_usuario: currentId || 999999,
                usuario: currentUser.usuario || 'admin',
                nombre: currentUser.nombre || currentUser.usuario || 'Administrador',
                apellido: currentUser.apellido || '',
                identificacion: String(currentUser.identificacion || 'ADMIN'),
                descripcionArea: currentUser.area_descripcion || 'Administración',
                descripcionCargo: currentUser.cargo_descripcion || 'Administrador General',
                descripcionPerfil: currentUser.perfil_descripcion || 'Administrador',
                id_area_fk: currentUser.id_area_fk || 1,
                id_cargo_fk: currentUser.id_cargo_fk || 1,
                estado: 1
              });
            }
          }

          this.usuariosParaSupervision = lista.sort((a: any, b: any) => 
            `${a.nombre || ''} ${a.apellido || ''}`.localeCompare(`${b.nombre || ''} ${b.apellido || ''}`)
          );
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando usuarios para supervisión:', err)
      });
    }

    if (this.areasParaSupervision.length === 0) {
      this.listasService.obtenerAreas().subscribe({
        next: (data) => {
          this.areasParaSupervision = (data || []).sort((a: any, b: any) => 
            (a.descripcionArea || a.nombre || '').localeCompare(b.descripcionArea || b.nombre || '')
          );
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando áreas para supervisión:', err)
      });
    }
  }

  abrirModalDesdeJerarquia(supJ: any): void {
    const existente = this.supervisoresAsistencia.find(s =>
      (supJ.idSupervisor && Number(s.idSupervisor) === Number(supJ.idSupervisor)) ||
      (supJ.cedulaSupervisor && supJ.cedulaSupervisor !== 'N/A' && s.cedulaSupervisor === supJ.cedulaSupervisor)
    );
    if (existente) {
      this.abrirModalEditarSupervision(existente);
      return;
    }

    this.loadListasParaAsignacion();
    this.supervisorSeleccionadoId = supJ.idSupervisor;
    this.tipoAlcanceSeleccionado = supJ.tipoAlcance === 'GLOBAL' ? 'GLOBAL' : 'AREA';
    this.areasSeleccionadasIds = Array.isArray(supJ.areasIds) ? [...supJ.areasIds] : [];
    this.colaboradoresSeleccionadosCedulas = [];
    this.puedeAprobarHorasExtraModal = supJ.puedeAprobarHorasExtra ?? true;
    this.activoSupervisionModal = true;
    this.observacionSupervisionModal = `Personalización de alcance sobre nivel jerárquico (${supJ.etiquetaNivel})`;
    this.busquedaSupervisorModal = '';
    this.busquedaAreaModal = '';
    this.busquedaColaboradorModal = '';
    this.modalSupervisionOpen = true;
  }

  abrirModalNuevaSupervision(): void {
    this.loadListasParaAsignacion();
    this.supervisorSeleccionadoId = null;
    this.tipoAlcanceSeleccionado = 'AREA';
    this.areasSeleccionadasIds = [];
    this.colaboradoresSeleccionadosCedulas = [];
    this.puedeAprobarHorasExtraModal = true;
    this.activoSupervisionModal = true;
    this.observacionSupervisionModal = '';
    this.busquedaSupervisorModal = '';
    this.busquedaAreaModal = '';
    this.busquedaColaboradorModal = '';
    this.modalSupervisionOpen = true;
  }

  abrirModalEditarSupervision(sup: SupervisorAsignadoResumen): void {
    this.loadListasParaAsignacion();
    this.supervisorSeleccionadoId = sup.idSupervisor;
    this.tipoAlcanceSeleccionado = (sup.tipoAlcance === 'MIXTO' ? 'AREA' : sup.tipoAlcance) as any;
    
    const areaIds: number[] = [];
    if (sup.reglas) {
      sup.reglas.forEach(r => {
        if (r.idArea && !areaIds.includes(r.idArea)) {
          areaIds.push(r.idArea);
        }
      });
    }
    this.areasSeleccionadasIds = areaIds;

    const colabCedulas: string[] = [];
    if (sup.reglas) {
      sup.reglas.forEach(r => {
        if (r.cedulaColaborador && !colabCedulas.includes(r.cedulaColaborador)) {
          colabCedulas.push(r.cedulaColaborador);
        }
      });
    }
    this.colaboradoresSeleccionadosCedulas = colabCedulas;

    this.puedeAprobarHorasExtraModal = sup.puedeAprobarHorasExtra ?? true;
    this.activoSupervisionModal = sup.activo ?? true;
    this.observacionSupervisionModal = sup.observacion || '';
    this.busquedaSupervisorModal = '';
    this.busquedaAreaModal = '';
    this.busquedaColaboradorModal = '';
    this.modalSupervisionOpen = true;
  }

  cerrarModalSupervision(): void {
    this.modalSupervisionOpen = false;
  }

  seleccionarSupervisor(u: any): void {
    this.supervisorSeleccionadoId = u.idUsuario;
  }

  toggleAreaModal(idArea: number): void {
    const idx = this.areasSeleccionadasIds.indexOf(idArea);
    if (idx >= 0) {
      this.areasSeleccionadasIds.splice(idx, 1);
    } else {
      this.areasSeleccionadasIds.push(idArea);
    }
  }

  isAreaModalSeleccionada(idArea: number): boolean {
    return this.areasSeleccionadasIds.includes(idArea);
  }

  seleccionarTodasAreasModal(): void {
    this.areasSeleccionadasIds = this.areasFiltradasModal.map(a => a.idArea || a.id_area);
  }

  limpiarAreasModal(): void {
    this.areasSeleccionadasIds = [];
  }

  toggleColaboradorModal(u: any): void {
    const doc = String(u.identificacion || '').trim();
    if (!doc) return;
    const idx = this.colaboradoresSeleccionadosCedulas.indexOf(doc);
    if (idx >= 0) {
      this.colaboradoresSeleccionadosCedulas.splice(idx, 1);
    } else {
      this.colaboradoresSeleccionadosCedulas.push(doc);
    }
  }

  isColaboradorModalSeleccionado(cedula: string): boolean {
    return this.colaboradoresSeleccionadosCedulas.includes(String(cedula || '').trim());
  }

  quitarColaboradorModal(cedula: string): void {
    const idx = this.colaboradoresSeleccionadosCedulas.indexOf(cedula);
    if (idx >= 0) {
      this.colaboradoresSeleccionadosCedulas.splice(idx, 1);
    }
  }

  seleccionarTodosColaboradoresModal(): void {
    const docs = this.colaboradoresFiltradosModal
      .map(u => String(u.identificacion || '').trim())
      .filter(d => !!d);
    this.colaboradoresSeleccionadosCedulas = Array.from(new Set([...this.colaboradoresSeleccionadosCedulas, ...docs]));
  }

  limpiarColaboradoresModal(): void {
    this.colaboradoresSeleccionadosCedulas = [];
  }

  getNombreColaboradorPorCedula(cedula: string): string {
    const u = this.usuariosParaSupervision.find(x => String(x.identificacion || '').trim() === String(cedula).trim());
    return u ? `${u.nombre} ${u.apellido}` : cedula;
  }

  getAreaColaboradorPorCedula(cedula: string): string {
    const u = this.usuariosParaSupervision.find(x => String(x.identificacion || '').trim() === String(cedula).trim());
    return u?.descripcionArea || u?.area || '';
  }

  guardarConfiguracionSupervision(): void {
    if (!this.supervisorSeleccionadoId) {
      Swal.fire('Atención', 'Por favor selecciona un colaborador como Supervisor.', 'warning');
      return;
    }

    const sup = this.supervisorSeleccionadoObj;
    if (!sup) {
      Swal.fire('Error', 'No se encontró la información del supervisor seleccionado.', 'error');
      return;
    }

    const tipo = this.tipoAlcanceSeleccionado;

    if (tipo === 'AREA' && this.areasSeleccionadasIds.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos una Área para este supervisor.', 'warning');
      return;
    }

    if (tipo === 'COLABORADOR' && this.colaboradoresSeleccionadosCedulas.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos un Colaborador para este supervisor.', 'warning');
      return;
    }

    const areasPayload = this.areasSeleccionadasIds.map(id => {
      const a = this.areasParaSupervision.find(x => (x.idArea || x.id_area) === id);
      return {
        idArea: id,
        nombreArea: a ? (a.descripcionArea || a.nombre || a.area || 'Área') : 'Área'
      };
    });

    const colaboradoresPayload = this.colaboradoresSeleccionadosCedulas.map(doc => {
      const u = this.usuariosParaSupervision.find(x => String(x.identificacion || '').trim() === doc);
      return {
        cedula: doc,
        nombre: u ? `${u.nombre} ${u.apellido}` : doc,
        idArea: u?.id_area_fk || u?.idArea || undefined,
        nombreArea: u?.descripcionArea || u?.area || undefined
      };
    });

    const payload: GuardarSupervisionPayload = {
      idSupervisor: sup.idUsuario,
      cedulaSupervisor: String(sup.identificacion || '').trim(),
      nombreSupervisor: `${sup.nombre} ${sup.apellido}`.trim(),
      tipoAlcance: tipo,
      areas: tipo === 'AREA' ? areasPayload : undefined,
      colaboradores: tipo === 'COLABORADOR' ? colaboradoresPayload : undefined,
      puedeAprobarHorasExtra: this.puedeAprobarHorasExtraModal,
      activo: this.activoSupervisionModal,
      observacion: this.observacionSupervisionModal
    };

    this.guardandoSupervision = true;
    this.supervisionService.guardarSupervision(payload).subscribe({
      next: () => {
        this.guardandoSupervision = false;
        this.cerrarModalSupervision();
        this.loadSupervisoresAsistencia();
        Swal.fire({
          title: '¡Guardado!',
          text: `La visibilidad de horarios para ${payload.nombreSupervisor} fue configurada con éxito.`,
          icon: 'success',
          confirmButtonColor: '#0a5c2e',
          timer: 2500
        });
      },
      error: (err) => {
        this.guardandoSupervision = false;
        console.error('Error al guardar configuración de supervisión:', err);
        Swal.fire('Error', 'No se pudo guardar la configuración de supervisión.', 'error');
      }
    });
  }

  toggleActivoSupervisor(sup: SupervisorAsignadoResumen, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const nuevoEstado = !sup.activo;
    this.supervisionService.toggleActivoSupervisor(sup.idSupervisor, nuevoEstado).subscribe({
      next: () => {
        sup.activo = nuevoEstado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado de supervisor:', err);
        Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
      }
    });
  }

  eliminarSupervisor(sup: SupervisorAsignadoResumen): void {
    Swal.fire({
      title: '¿Revocar supervisión?',
      html: `¿Estás seguro de revocar todos los permisos de supervisión de horarios de <strong>${sup.nombreSupervisor}</strong>?<br><small class="text-muted">El usuario volverá a tener únicamente los accesos predeterminados según su cargo.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, revocar permisos',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.supervisionService.eliminarPorSupervisor(sup.idSupervisor).subscribe({
          next: () => {
            this.loadSupervisoresAsistencia();
            Swal.fire({
              title: 'Revocado',
              text: 'Los permisos de supervisión han sido revocados.',
              icon: 'success',
              confirmButtonColor: '#0a5c2e',
              timer: 2000
            });
          },
          error: (err) => {
            console.error('Error al revocar supervisión:', err);
            Swal.fire('Error', 'No se pudo revocar la supervisión.', 'error');
          }
        });
      }
    });
  }

}
