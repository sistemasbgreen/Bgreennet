import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScadaService } from '../../../servicios/scadaservices';

@Component({
  selector: 'app-variables-plc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './variables-plc.html',
  styleUrl: './variables-plc.css',
})
export class VariablesPlc implements OnInit {
  activeTab: 'variables' | 'unidades' | 'unidadesMedida' = 'variables';
  
  variables: any[] = [];
  unidades: any[] = [];
  unidadesMedida: any[] = [];
  
  searchTerm: string = '';
  loading: boolean = false;
  receptoresPlc: string = '';
  guardandoReceptores: boolean = false;

  // Formulario general
  showForm: boolean = false;
  isEditing: boolean = false;
  isSaving: boolean = false;

  // Modales y Dropdowns
  showSyncDropdown: boolean = false;
  showEmailModal: boolean = false;

  // Objetos para formularios
  formVariable: any = {
    tag: '',
    nombre: '',
    unidad: { nombre: '' },
    unit: { nombre: '' },
    metaMin: null,
    metaMax: null,
    notificar: false,
    activo: true,
    origenNodeRed: '',
    dbNodeRed: ''
  };

  formUnidad: any = {
    id: null,
    nombre: '',
    estado: 1
  };

  formUnidadMedida: any = {
    id: null,
    nombre: '',
    estado: 1
  };

  constructor(private scadaService: ScadaService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.scadaService.getVariablesConfig().subscribe({
      next: (data) => {
        this.variables = data;
        this.loading = false;
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error cargando variables:', err);
        this.loading = false;
        setTimeout(() => {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        });
      }
    });

    this.scadaService.getUnidades().subscribe(u => {
      this.unidades = u;
      setTimeout(() => this.cdr.detectChanges());
    });
    this.scadaService.getUnidadesMedida().subscribe(um => {
      this.unidadesMedida = um;
      setTimeout(() => this.cdr.detectChanges());
    });

    this.scadaService.getReceptoresPlc().subscribe({
      next: (res) => {
        this.receptoresPlc = res.destinatarios || '';
        setTimeout(() => this.cdr.detectChanges());
      },
      error: (err) => console.error('Error cargando receptores PLC:', err)
    });
  }

  get cantidadCorreos(): number {
    if (!this.receptoresPlc || !this.receptoresPlc.trim()) return 0;
    return this.receptoresPlc.split(',').filter(c => c.trim() !== '').length;
  }

  toggleSyncDropdown() {
    this.showSyncDropdown = !this.showSyncDropdown;
  }

  closeSyncDropdown() {
    this.showSyncDropdown = false;
  }

  abrirEmailModal() {
    this.showEmailModal = true;
  }

  cerrarEmailModal() {
    this.showEmailModal = false;
  }

  switchTab(tab: 'variables' | 'unidades' | 'unidadesMedida') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.cerrarForm();
    this.cdr.detectChanges();
  }

  getFilteredItems(): any[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (this.activeTab === 'variables') {
      if (!term) return this.variables;
      return this.variables.filter(v =>
        v.tag.toLowerCase().includes(term) ||
        v.nombre.toLowerCase().includes(term) ||
        (v.unidad && v.unidad.nombre.toLowerCase().includes(term)) ||
        (v.unit && v.unit.nombre.toLowerCase().includes(term))
      );
    } else if (this.activeTab === 'unidades') {
      if (!term) return this.unidades;
      return this.unidades.filter(u => u.nombre.toLowerCase().includes(term));
    } else {
      if (!term) return this.unidadesMedida;
      return this.unidadesMedida.filter(um => um.nombre.toLowerCase().includes(term));
    }
  }

  abrirCrear() {
    this.isEditing = false;
    this.showForm = true;
    if (this.activeTab === 'variables') {
      this.formVariable = {
        tag: '',
        nombre: '',
        unidad: { nombre: '' },
        unit: { nombre: '' },
        metaMin: null,
        metaMax: null,
        notificar: false,
        origenNodeRed: '',
        dbNodeRed: ''
      };
    } else if (this.activeTab === 'unidades') {
      this.formUnidad = { id: null, nombre: '', estado: 1 };
    } else {
      this.formUnidadMedida = { id: null, nombre: '', estado: 1 };
    }
    this.cdr.detectChanges();
  }

  abrirEditar(item: any) {
    this.isEditing = true;
    this.showForm = true;
    if (this.activeTab === 'variables') {
      this.formVariable = {
        tag: item.tag,
        nombre: item.nombre,
        unidad: { nombre: item.unidad ? item.unidad.nombre : '' },
        unit: { nombre: item.unit ? item.unit.nombre : '' },
        metaMin: item.metaMin,
        metaMax: item.metaMax,
        notificar: item.notificar,
        activo: item.activo !== false,
        origenNodeRed: item.origenNodeRed,
        dbNodeRed: item.dbNodeRed
      };
    } else if (this.activeTab === 'unidades') {
      this.formUnidad = {
        id: item.id,
        nombre: item.nombre,
        estado: item.estado
      };
    } else {
      this.formUnidadMedida = {
        id: item.id,
        nombre: item.nombre,
        estado: item.estado
      };
    }
    this.cdr.detectChanges();
  }

  toggleEstado(item: any, event: any) {
    const nuevoEstado = event.target.checked ? 1 : 0;
    this.loading = true;
    this.cdr.detectChanges();
    if (this.activeTab === 'unidades') {
      const u = { ...item, estado: nuevoEstado };
      this.scadaService.saveUnidad(u).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => {
          console.error(err);
          alert('Error al cambiar el estado.');
          this.cargarDatos();
        }
      });
    } else if (this.activeTab === 'unidadesMedida') {
      const um = { ...item, estado: nuevoEstado };
      this.scadaService.saveUnidadMedida(um).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => {
          console.error(err);
          alert('Error al cambiar el estado.');
          this.cargarDatos();
        }
      });
    }
  }

  toggleActivoVariable(variable: any) {
    const nuevoEstado = !(variable.activo !== false);
    const payload = {
      tag: variable.tag,
      nombre: variable.nombre,
      unidad: { nombre: variable.unidad ? variable.unidad.nombre : '' },
      unit: { nombre: variable.unit ? variable.unit.nombre : '' },
      metaMin: variable.metaMin,
      metaMax: variable.metaMax,
      notificar: variable.notificar,
      activo: nuevoEstado
    };
    this.scadaService.updateVariableConfig(payload).subscribe({
      next: () => {
        variable.activo = nuevoEstado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar visibilidad:', err);
        alert('Error al cambiar la visibilidad de la variable.');
      }
    });
  }

  cerrarForm() {
    this.showForm = false;
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  guardar() {
    this.isSaving = true;

    if (this.activeTab === 'variables') {
      if (!this.formVariable.tag || !this.formVariable.nombre || !this.formVariable.unidad.nombre) {
        alert('Por favor complete los campos obligatorios: Tag, Nombre y Unidad.');
        this.isSaving = false;
        return;
      }
      this.scadaService.updateVariableConfig(this.formVariable).subscribe({
        next: () => {
          this.isSaving = false;
          this.showForm = false;
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          alert('Error al guardar la variable.');
          this.isSaving = false;
        }
      });
    } else if (this.activeTab === 'unidades') {
      if (!this.formUnidad.nombre) {
        alert('El nombre es obligatorio.');
        this.isSaving = false;
        return;
      }
      this.scadaService.saveUnidad(this.formUnidad).subscribe({
        next: () => {
          this.isSaving = false;
          this.showForm = false;
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          alert('Error al guardar la unidad de planta.');
          this.isSaving = false;
        }
      });
    } else {
      if (!this.formUnidadMedida.nombre) {
        alert('El nombre es obligatorio.');
        this.isSaving = false;
        return;
      }
      this.scadaService.saveUnidadMedida(this.formUnidadMedida).subscribe({
        next: () => {
          this.isSaving = false;
          this.showForm = false;
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          alert('Error al guardar la unidad de medida.');
          this.isSaving = false;
        }
      });
    }
  }

  sincronizar() {
    if (confirm('¿Desea sincronizar las variables desde la Tabla_14? Se importarán nuevos tags y configuraciones.')) {
      this.loading = true;
      this.scadaService.syncVariables().subscribe({
        next: (res) => {
          alert(res.message);
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error sincronizando:', err);
          alert('Error al sincronizar variables.');
          this.loading = false;
        }
      });
    }
  }

  sincronizarNodeRed() {
    if (confirm('¿Desea sincronizar la configuración de DB y Origen leyendo directamente desde Node-RED?')) {
      this.loading = true;
      this.scadaService.syncNodeRed().subscribe({
        next: (res) => {
          alert(res.message);
          this.cargarDatos();
        },
        error: (err) => {
          console.error('Error sincronizando Node-RED:', err);
          alert('Error al sincronizar Node-RED. Asegúrate de que el servidor Spring Boot tiene alcance a la IP de Node-RED.');
          this.loading = false;
        }
      });
    }
  }

  guardarReceptores() {
    if (!this.receptoresPlc || !this.receptoresPlc.trim()) {
      alert('La lista de correos no puede estar vacía.');
      return;
    }
    this.guardandoReceptores = true;
    this.scadaService.saveReceptoresPlc(this.receptoresPlc).subscribe({
      next: (res) => {
        this.guardandoReceptores = false;
        alert(res.message);
        this.showEmailModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar receptores:', err);
        alert('Error al actualizar destinatarios.');
        this.guardandoReceptores = false;
        this.cdr.detectChanges();
      }
    });
  }
}
