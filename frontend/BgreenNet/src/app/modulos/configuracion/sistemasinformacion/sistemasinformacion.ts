import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { homeservices } from '../../../servicios/homeservices';
import { SistemaInformacion } from '../../../models/sistemasinformacion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { CrearSistema } from '../../../models/CrearSistema';

@Component({
  selector: 'app-sistemasinformacion',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './sistemasinformacion.html',
  styleUrl: './sistemasinformacion.css',
})
export class Sistemasinformacion {

  sistemaInformacionData: SistemaInformacion[] = [];
  mostrarModal = false;
  modoEdicion = false;
  sistemaForm: CrearSistema = this.getNuevoSistema();
  sistemaIdEnEdicion: number | null = null; // ← Nueva propiedad


  constructor(
    private router: Router,
    private homeservice: homeservices,

  ) { }

  ngOnInit(): void {
    this.sistemasinformacion();
  }

  sistemasinformacion(): void {
    this.homeservice.getAll().subscribe({
      next: (data) => {
        this.sistemaInformacionData = data;
        console.log(data)
      },
      error: (err) => console.error('Error al cargar sistemas de información', err)
    });

  }

 abrirModal(sistema?: SistemaInformacion): void {
  this.mostrarModal = true;
  
  if (sistema) {
    this.modoEdicion = true;
    this.sistemaIdEnEdicion = sistema.id; // ← Guarda el ID
    this.sistemaForm = {
      nombre: sistema.nombre,
      url: sistema.url,
      imagenUrl: sistema.imagenUrl,
      estado: sistema.estado
    };
  } else {
    this.modoEdicion = false;
    this.sistemaIdEnEdicion = null; // ← Resetea
    this.sistemaForm = this.getNuevoSistema();
  }
}

cerrarModal(): void {
  this.mostrarModal = false;
  this.sistemaForm = this.getNuevoSistema();
  this.modoEdicion = false;
  this.sistemaIdEnEdicion = null; // ← Importante
}

guardarSistema(): void {
  if (!this.sistemaForm.nombre || !this.sistemaForm.url || !this.sistemaForm.imagenUrl) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }

 if (this.modoEdicion) {
  if (this.sistemaIdEnEdicion === null) {
    alert('Error: ID no disponible para actualización');
    return;
  }

  this.homeservice.update(this.sistemaIdEnEdicion, this.sistemaForm).subscribe({ // ✅ Aquí corregido
    next: (resp) => {
      alert('Sistema actualizado correctamente');
      this.sistemasinformacion();
      this.cerrarModal();
    },
    error: (err) => {
      console.error('Error al actualizar sistema:', err);
      alert('Error al actualizar el sistema');
    }
  });
}else {
    this.homeservice.Crearsistemainformacion(this.sistemaForm).subscribe({
      next: (resp) => {
        alert('Sistema creado correctamente');
        this.sistemasinformacion();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al crear sistema:', err);
        alert('Error al crear el sistema');
      }
    });
  }
}

  eliminarSistema(id: number): void {
    if (confirm('¿Está seguro de eliminar este sistema?')) {
      // Aquí implementarías el método delete en tu servicio
      // this.homeservice.delete(id).subscribe(...)
      console.log('Eliminar sistema con id:', id);
      alert('Funcionalidad de eliminación pendiente');
    }
  }

  private getNuevoSistema(): CrearSistema {
    return {
      nombre: '',
      url: '',
      imagenUrl: '',
      estado: true // valor por defecto
    };
  }


}
