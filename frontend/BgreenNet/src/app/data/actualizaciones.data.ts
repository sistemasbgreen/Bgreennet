export interface ActualizacionItem {
  id: number;
  numero: string;
  titulo: string;
  categoria: string;
  etiqueta: string;
  icono: string;
  resumen: string;
  descripcion: string;
  detalles: string[];
  imagen: string;
  imagenFallback: string;
  imagenes?: { label: string; url: string }[];
}

export const ACTUALIZACIONES_2027: ActualizacionItem[] = [
  {
    id: 1,
    numero: '01',
    titulo: 'Cambio de Credenciales y Recuperación',
    categoria: 'Seguridad',
    etiqueta: 'Seguridad & Autogestión',
    icono: 'bi-key-fill',
    resumen: 'Autogestión segura de contraseñas con verificación dinámica por correo.',
    descripcion: 'Ahora puedes recuperar y actualizar tus credenciales corporativas en cualquier momento mediante un flujo estructurado de seguridad:',
    detalles: [
      'Acceso directo desde el enlace "¿Olvidaste tu contraseña?" destacado en la pantalla de login.',
      'Ingreso de usuario o correo corporativo registrado.',
      'Generación y envío instantáneo de código de verificación OTP de 6 dígitos.',
      'Asignación directa de nueva clave sin depender de soporte técnico.'
    ],
    imagen: '/actualizaciones/login-recuperar.svg',
    imagenFallback: 'actualizaciones/login-recuperar.svg',
    imagenes: [
      { label: '1. Botón en Login', url: '/actualizaciones/login-recuperar.svg' },
      { label: '2. Modal de Recuperación', url: '/actualizaciones/credenciales.svg' }
    ]
  },
  {
    id: 2,
    numero: '02',
    titulo: 'Directorio de Herramientas de IA',
    categoria: 'Inteligencia Artificial',
    etiqueta: 'Inteligencia Artificial',
    icono: 'bi-stars',
    resumen: 'Acceso directo a las mejores herramientas de IA organizadas por áreas de trabajo.',
    descripcion: 'Integramos un centro de soluciones de Inteligencia Artificial accesible directamente desde la barra de navegación superior:',
    detalles: [
      'Acceso rápido desde el botón verde "IA" señalado en la cabecera.',
      'Catálogo categorizado: Presentaciones, Texto, Imágenes, Video, Audio, Código, Investigación y Diseño.',
      'Buscador integrado en tiempo real y enlaces directos a las plataformas oficiales.'
    ],
    imagen: '/actualizaciones/ia-acceso.svg',
    imagenFallback: 'actualizaciones/ia-acceso.svg',
    imagenes: [
      { label: '1. Botón en Header', url: '/actualizaciones/ia-acceso.svg' },
      { label: '2. Directorio de IA', url: '/actualizaciones/ia-tools.svg' }
    ]
  },
  {
    id: 3,
    numero: '03',
    titulo: 'Módulo de Perfil de Usuario',
    categoria: 'Mi Perfil',
    etiqueta: 'Experiencia & Gestión',
    icono: 'bi-person-badge-fill',
    resumen: 'Consulta y gestión integral de tus datos institucionales y de cuenta.',
    descripcion: 'Nuevo espacio dedicado para consultar tu perfil corporativo con un diseño moderno y estructurado:',
    detalles: [
      'Acceso directo desde el menú de usuario en la barra superior haciendo clic en "Ver Mi Perfil".',
      'Visualización clara de datos de Cuenta, Credenciales, Sistema y Estado.',
      'Actualiza tus datos.'
    ],
    imagen: '/actualizaciones/perfil-acceso.svg',
    imagenFallback: 'actualizaciones/perfil-acceso.svg',
    imagenes: [
      { label: '1. Menú de Acceso', url: '/actualizaciones/perfil-acceso.svg' },
      { label: '2. Vista de Perfil', url: '/actualizaciones/perfil.svg' }
    ]
  }
];
