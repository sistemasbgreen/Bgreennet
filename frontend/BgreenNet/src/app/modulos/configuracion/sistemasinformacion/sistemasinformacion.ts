import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { homeservices } from '../../../servicios/homeservices';
import { SistemaInformacion } from '../../../models/sistemasinformacion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';

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
  sistemaForm: SistemaInformacion = this.getNuevoSistema();

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
      // Modo edición
      this.modoEdicion = true;
      this.sistemaForm = { ...sistema }; // Copia el objeto
    } else {
      // Modo creación
      this.modoEdicion = false;
      this.sistemaForm = this.getNuevoSistema();
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.sistemaForm = this.getNuevoSistema();
    this.modoEdicion = false;
  }

  guardarSistema(): void {
    // Validación básica
    if (!this.sistemaForm.nombre || !this.sistemaForm.url || !this.sistemaForm.imagenUrl) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (this.modoEdicion) {
      // Actualizar sistema existente
      this.homeservice.update(this.sistemaForm.id, this.sistemaForm).subscribe({
        next: (resp) => {
          alert('Sistema actualizado correctamente');
          this.sistemasinformacion(); // Recarga la tabla
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al actualizar sistema:', err);
          alert('Error al actualizar el sistema');
        }
      });
    } else {
      // Crear nuevo sistema
      this.homeservice.create(this.sistemaForm).subscribe({
        next: (resp) => {
          console.log(this.sistemaForm)
          alert('Sistema creado correctamente');
          this.sistemasinformacion(); // Recarga la tabla
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

  private getNuevoSistema(): SistemaInformacion {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      url: '',
      imagenUrl: '',
      activo: true
    };
  }



}
