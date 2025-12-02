export interface  CrearUsuario {
  idUsuario: number;
  usuario: string;
  apellido: string;
  contrasena: string;
  estado: number;
  ultimaConexion?: string; 
  descripcionPerfil: string;
  descripcionArea: string;
  nombre : string;
  correo : string;
  id_area_fk: number ;
  id_perfil_fk: number;
  identificacion: string;
  razon_social: string | null;
  celular: string;
  fechaNacimiento: string; // formato 'YYYY-MM-DD'
  cargo: number;
  id_empresa_fk: number;
  id_tipoidentificacion_fk: number;
  id_cargo_fk: number ;

}