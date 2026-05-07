export interface Usuario {
  idUsuario: number;
  usuario: string;
  apellido: string;
  contrasena: string;
  estado: number;
  ultimaConexion?: string; 
  descripcionPerfil: string;
  descripcionEmpresa : string;
  descripcionArea: string;
  nombre : string;
  correo : string;
  area: string; 
  id_area_fk: number ; 
  id_perfil_fk: number;
  identificacion: string;
  razon_social: string | null;
  celular: string;
  fechaNacimiento: string; // formato 'YYYY-MM-DD'
  id_cargo_fk: number ;
  id_empresa_fk: number;
  id_tipoidentificacion_fk: number;
  id_detalle_usuario: number;
  cargo: string;
}