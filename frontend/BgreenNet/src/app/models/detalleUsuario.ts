
export interface DetalleUsuario {
  idDetalleUsuario?: number;
  identificacion: string;
  nombre: string;
  apellido: string;
  razonSocial?: string;
  correo: string;
  celular: string;
  direccion: string;
  cargo: string;
  estado: boolean;
  idEmpresa: number;
  idTipoIdentificacion: number;
}