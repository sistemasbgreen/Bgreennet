import { NgFor, NgForOf, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../../models/usuario';
import { DetalleUsuario } from '../../../models/detalleUsuario';
import { AuthService } from '../../../auth/authservices';
import { UsuarioService } from '../../../servicios/usuarioservices';
import { NavigationEnd, Router } from "@angular/router";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Perfil } from '../../../models/perfil';
import { Empresa } from '../../../models/empresa';
import { Cargo } from '../../../models/cargo';
import { Area } from '../../../models/area';
import { TiposIdentificacion } from '../../../models/tiposIdentificacion';
import { ListasService } from '../../../servicios/listasServices';
import { CrearUsuario } from '../../../models/CrearUsuario';

@Component({
  selector: 'app-usuarios',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {

  usuarioForm: FormGroup;
  usuarios: Usuario[] = [];
  perfiles: Perfil[] = [];
  empresas: Empresa[] = [];
  cargos: Cargo[] = [];
  areas: Area[] = [];
  tiposIdentificacion: TiposIdentificacion[] = [];

  showModal = false;
  isEditMode = false;
  usuarioIdEditar: number | null = null;


  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private listasServices: ListasService,
    private router: Router
  ) {
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      id_area_fk: ['', Validators.required],
      id_perfil_fk: [, Validators.required],
      identificacion: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      razon_social: [''],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      fechaNacimiento: ['', Validators.required],
      id_cargo_fk: [, Validators.required],
      id_empresa_fk: [, Validators.required],
      id_TipoIdentificacion: [1, Validators.required],
      estado: [true]
    });


  }
 ngOnInit(): void {
    this.cargarUsuarios();
    this.CargarPerfil();
    this.CargarEmpresa();
    this.CargarCargo();
    this.CargarArea();
    this.CargarTipoidenrificacion();
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarPerfil(): void {
    this.listasServices.obtenerPerfiles().subscribe({
      next: (data) => {
        this.perfiles = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarEmpresa(): void {
    this.listasServices.obtenerEmpresas().subscribe({
      next: (data) => {
        this.empresas = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarCargo(): void {
    this.listasServices.obtenerCargos().subscribe({
      next: (data) => {
        this.cargos = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarArea(): void {
    this.listasServices.obtenerAreas().subscribe({
      next: (data) => {

        this.areas = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  CargarTipoidenrificacion(): void {
    this.listasServices.obtenerIdentificacion().subscribe({
      next: (data) => {

        this.tiposIdentificacion = data;
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  openCrearModal(): void {
    this.isEditMode = false;
    this.usuarioIdEditar = null;
    this.usuarioForm.reset({
      estado: true,
      id_perfil_fk: 1,
      id_empresa_fk: 1,
      id_TipoIdentificacion: 1,
      id_cargo_fk: 1
    });
    this.showModal = true;
  }

  abrirEditarModal(usuario: Usuario): void {
    this.isEditMode = true;
    this.usuarioIdEditar = usuario.idUsuario!;

    this.usuarioForm.patchValue({
      usuario: usuario.usuario,
      contrasena: '', // No mostramos la contraseña por seguridad
      id_area_fk: usuario.id_area_fk,
      id_perfil_fk: usuario.id_perfil_fk,
      id_empresa_fk: usuario.id_empresa_fk,
      razon_social: usuario.razon_social || '',
      identificacion: usuario.identificacion,
      id_TipoIdentificacion: usuario.id_tipoidentificacion_fk,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      celular: usuario.celular,
      fechaNacimiento: usuario.fechaNacimiento,
      id_cargo_fk: usuario.id_cargo_fk,    
      estado: usuario.estado
    });

    // Hacer contraseña opcional en edición
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();

    this.showModal = true;
  }

onSubmit(): void {
  if (this.usuarioForm.invalid) {
    this.usuarioForm.markAllAsTouched();
    return;
  }

  // Convertimos los valores que vienen como string → number
  const usuario = {
    ...this.usuarioForm.value,
    id_area_fk: Number(this.usuarioForm.value.id_area_fk),
    id_cargo_fk: Number(this.usuarioForm.value.id_cargo_fk),
    id_empresa_fk: Number(this.usuarioForm.value.id_empresa_fk),
    id_perfil_fk: Number(this.usuarioForm.value.id_perfil_fk),
    id_TipoIdentificacion: Number(this.usuarioForm.value.id_TipoIdentificacion)
  };

  console.log("Datos listos para enviar:", usuario);

  // ====== EDITAR ======
  if (this.isEditMode && this.usuarioIdEditar) {
    this.usuarioService.actualizarUsuario(this.usuarioIdEditar, usuario).subscribe({
      next: (response) => {
        console.log('Usuario actualizado:', response);
        alert('Usuario actualizado exitosamente');
        this.cargarUsuarios();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        alert('Error al actualizar el usuario. Intenta nuevamente.');
      }
    });

    return;
  }

  // ====== CREAR ======
  this.usuarioService.createUsuario(usuario).subscribe({
    next: (response) => {
      console.log('Usuario creado:', response);
      alert('Usuario creado exitosamente');
      this.cargarUsuarios();
      this.cerrarModal();
    },
    error: (err) => {
      console.error('Error al crear usuario:', err);
      console.log('Respuesta de error del backend:', err.error);
      alert('Error al crear el usuario. Verifica los datos e intenta nuevamente.');
    }
  });

}


  eliminar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          alert('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (err: any) => {
          console.error('Error al eliminar', err);
          alert('Error al eliminar el usuario.');
        }
      });
    }
  }

  cerrarModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.usuarioIdEditar = null;
    this.usuarioForm.reset();

    // Restaurar validación de contraseña
    this.usuarioForm.get('contrasena')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
  }


  // Helper para validación en plantilla
  get f() {
    return this.usuarioForm.controls;
  }
}