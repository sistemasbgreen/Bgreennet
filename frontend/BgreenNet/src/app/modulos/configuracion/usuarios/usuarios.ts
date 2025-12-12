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
import { Perfilservices } from '../../../servicios/perfilservices';
import { AsignarPermiso } from '../../../models/asignarpermisos';

@Component({
  selector: 'app-usuarios',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})

export class Usuarios implements OnInit {

  usuarioForm: FormGroup;
  perfilForm: FormGroup;
  permisosXperfil: any;
  usuarios: Usuario[] = [];
  perfiles: Perfil[] = [];
  empresas: Empresa[] = [];
  cargos: Cargo[] = [];
  areas: Area[] = [];
  tiposIdentificacion: TiposIdentificacion[] = [];

  // Estados de los modales
  showModalUsuario = false;
  showModalPerfil = false;

  // Modos de edición
  isEditModeUsuario = false;
  isEditModePerfil = false;

  // IDs a editar
  usuarioIdEditar: number | null = null;
  perfilIdEditar: number | null = null;
  nombre_perfil: string = "";

  perfilIdSeleccionado: number | null = null;

  constructor(
    private fb: FormBuilder,
    private perf: FormBuilder,
    private usuarioService: UsuarioService,
    private listasServices: ListasService,
    private perfilservices: Perfilservices,
    private router: Router
  ) {
    this.usuarioForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(4)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      id_area_fk: ['', Validators.required],
      id_perfil_fk: ['', Validators.required],
      identificacion: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')]],
      razon_social: [''],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      fechaNacimiento: ['', Validators.required],
      id_cargo_fk: ['', Validators.required],
      id_empresa_fk: ['', Validators.required],
      id_tipoidentificacion_fk: [1, Validators.required],
      estado: [true]
    });

    this.perfilForm = this.perf.group({
      descripcionPerfil: ['', [Validators.required, Validators.minLength(4)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.CargarPerfil_Lista();
    this.CargarEmpresa();
    this.CargarCargo();
    this.CargarArea();
    this.CargarTipoidenrificacion();
  }

  // ======== CARGA DE DATOS ========
  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => console.error('Error al cargar usuarios', err)

    });
  }

  CargarPerfil_Lista(): void {
    this.listasServices.obtenerPerfiles().subscribe({
      next: (data) => this.perfiles = data,
      error: (err) => console.error('Error al cargar perfiles', err)
    });
  }

  CargarEmpresa(): void {
    this.listasServices.obtenerEmpresas().subscribe({
      next: (data) => this.empresas = data,
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  CargarCargo(): void {
    this.listasServices.obtenerCargos().subscribe({
      next: (data) => this.cargos = data,
      error: (err) => console.error('Error al cargar cargos', err)
    });
  }

  CargarArea(): void {
    this.listasServices.obtenerAreas().subscribe({
      next: (data) => this.areas = data,
      error: (err) => console.error('Error al cargar áreas', err)
    });
  }

  CargarTipoidenrificacion(): void {
    this.listasServices.obtenerIdentificacion().subscribe({
      next: (data) => this.tiposIdentificacion = data,
      error: (err) => console.error('Error al cargar tipos de identificación', err)
    });
  }

  // ======== MODAL USUARIOS ========
  openCrearModal(): void {
    this.isEditModeUsuario = false;
    this.usuarioIdEditar = null;
    this.usuarioForm.reset({
      estado: true,
      id_perfil_fk: 1,
      id_empresa_fk: 1,
      id_tipoidentificacion_fk: 1,
      id_cargo_fk: 1
    });
    this.showModalUsuario = true;
  }

  abrirEditarModal(usuario: Usuario): void {
    this.isEditModeUsuario = true;
    this.usuarioIdEditar = usuario.idUsuario!;

    this.usuarioForm.patchValue({
      usuario: usuario.usuario,
      contrasena: '',
      id_area_fk: usuario.id_area_fk,
      id_perfil_fk: usuario.id_perfil_fk,
      id_empresa_fk: usuario.id_empresa_fk,
      razon_social: usuario.razon_social || '',
      identificacion: usuario.identificacion,
      id_tipoidentificacion_fk: usuario.id_tipoidentificacion_fk,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      celular: usuario.celular,
      fechaNacimiento: usuario.fechaNacimiento,
      id_cargo_fk: usuario.id_cargo_fk,
      estado: usuario.estado
    });

    // Contraseña opcional en edición
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.showModalUsuario = true;
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          alert('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          alert('Error al eliminar el usuario.');
        }
      });
    }
  }

  // ======== MODAL PERFILES ========
  openCrearPerfilModal(): void {
    this.isEditModePerfil = false;
    this.perfilIdEditar = null;
    this.perfilForm.reset({ estado: true });
    this.showModalPerfil = true;
  }

  ModalEditarPerfil(perfil: Perfil): void {
    this.isEditModePerfil = true;
    this.perfilIdEditar = perfil.idPerfil!;
    this.perfilForm.patchValue({
      descripcionPerfil: perfil.descripcionPerfil,
      estado: perfil.estado
    });
    this.showModalPerfil = true;
  }

  // ======== CIERRE DE MODAL ========
  cerrarModal(tipo: 'usuario' | 'perfil'): void {
    if (tipo === 'usuario') {
      this.showModalUsuario = false;
      this.usuarioForm.reset();
      // Restaurar validación de contraseña
      this.usuarioForm.get('contrasena')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    } else {
      this.showModalPerfil = false;
      this.perfilForm.reset();
    }

    // Resetear estados
    this.isEditModeUsuario = false;
    this.isEditModePerfil = false;
    this.usuarioIdEditar = null;
    this.perfilIdEditar = null;
  }

  // ======== ENVÍO DE FORMULARIOS ========
  onSubmitUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }



    const usuario = {
      ...this.usuarioForm.value,
      id_area_fk: Number(this.usuarioForm.value.id_area_fk),
      id_cargo_fk: Number(this.usuarioForm.value.id_cargo_fk),
      id_empresa_fk: Number(this.usuarioForm.value.id_empresa_fk),
      id_perfil_fk: Number(this.usuarioForm.value.id_perfil_fk),
      id_tipoidentificacion_fk: Number(this.usuarioForm.value.id_tipoidentificacion_fk)
    };

    console.log(usuario)

    if (this.isEditModeUsuario && this.usuarioIdEditar) {
      this.usuarioService.actualizarUsuario(this.usuarioIdEditar, usuario).subscribe({
        next: () => {
          alert('Usuario actualizado exitosamente');
          this.cargarUsuarios();
          this.cerrarModal('usuario');
        },
        error: () => {
          alert('Error al actualizar el usuario.');
        }
      });
      return;
    }

    this.usuarioService.createUsuario(usuario).subscribe({
      next: () => {
        alert('Usuario creado exitosamente');
        this.cargarUsuarios();
        this.cerrarModal('usuario');
      },
      error: () => {
        alert('Error al crear el usuario.');
      }
    });
  }

  onSubmitPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const perfil = { ...this.perfilForm.value };

    console.log(perfil)

    if (this.isEditModePerfil && this.perfilIdEditar) {
      this.perfilservices.actualizarPerfil(this.perfilIdEditar, perfil).subscribe({
        next: () => {
          alert('Perfil actualizado exitosamente');
          this.CargarPerfil_Lista();
          this.cerrarModal('perfil');
        },
        error: () => {
          alert('Error al actualizar el perfil.');
        }
      });
      return;
    }

    this.perfilservices.crearPerfil(perfil).subscribe({
      next: () => {
        alert('Perfil creado exitosamente');
        this.CargarPerfil_Lista();
        this.cerrarModal('perfil');
      },
      error: () => {
        alert('Error al crear el perfil.');
      }
    });
  }

  verpermisos(id: any, name: any): void {
    this.nombre_perfil = name;
    this.perfilIdSeleccionado = id; // 👈 Guarda el ID aquí

    this.perfilservices.obtenerpermisos(id).subscribe({
      next: (data) => {
        this.permisosXperfil = data;
      },
      error: (err) => console.error('Error al cargar permisos:', err)
    });
  }


 togglePermiso(permiso: any): void {
  const idPerfil = this.perfilIdSeleccionado;
  if (!idPerfil) {
    console.error('No se ha seleccionado un perfil');
    return;
  }

  const dto: AsignarPermiso = {
    idPerfilFk: idPerfil,
    idSistemaFk: permiso.idSistema
  };

  // Guardar el estado actual para revertir en caso de fallo
  const estadoOriginal = permiso.tienePermiso;

  // Invertir visualmente (optimistic update)
  permiso.tienePermiso = !permiso.tienePermiso;

  const observable$ = permiso.tienePermiso
    ? this.perfilservices.asignarPermiso(dto)
    : this.perfilservices.eliminarPermiso(dto);

  observable$.subscribe({
    next: (exito: boolean) => {
      if (!exito) {
        // El backend respondió 200, pero lógicamente falló → revertir
        permiso.tienePermiso = estadoOriginal;
        alert('Operación rechazada por el servidor.');
      }
      // Si éxito === true, ya está actualizado en UI
    },
    error: (err) => {
      console.error('Error de red o servidor:', err);
      // Revertir siempre en caso de error de red
      permiso.tienePermiso = estadoOriginal;
      alert('No se pudo realizar la operación. Intente nuevamente.');
    }
  });
}

  // ======== HELPERS PARA VALIDACIÓN ========
  get f() {
    return this.usuarioForm.controls;
  }

  get pf() {
    return this.perfilForm.controls;
  }
}