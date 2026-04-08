
export interface OpDocto {
  idTipoDocto:      string;
  consecDocto:      number;
  indEstado:        string;
  fechaTsCreacion:  string | null;
  fechaTsAprobacion:string | null;
  fechaTsAnulacion: string | null;
  fechaCumplida:    string | null;
  notas:            string | null;
  usuarioCumplido:  string | null;
}