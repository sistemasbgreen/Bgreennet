export interface IaTool {
  nombre: string;
  descripcion: string;
  url: string;
  logo: string;
}

export interface IaCategory {
  categoria: string;
  icono: string;
  herramientas: IaTool[];
}

export const IA_CATEGORIES: IaCategory[] = [
  {
    categoria: 'Presentaciones',
    icono: 'bi-easel',
    herramientas: [
      {
        nombre: 'Gamma',
        descripcion: 'Crea presentaciones, documentos y páginas web con IA en minutos.',
        url: 'https://gamma.app/',
        logo: 'https://www.google.com/s2/favicons?domain=gamma.app&sz=128'
      },
      {
        nombre: 'Beautiful.ai',
        descripcion: 'Diseño inteligente de presentaciones automáticas y profesionales.',
        url: 'https://www.beautiful.ai/',
        logo: 'https://www.google.com/s2/favicons?domain=beautiful.ai&sz=128'
      }
    ]
  },
  {
    categoria: 'Texto y redacción',
    icono: 'bi-pencil-square',
    herramientas: [
      {
        nombre: 'ChatGPT',
        descripcion: 'Modelo conversacional de OpenAI para redactar, analizar y resolver problemas.',
        url: 'https://chatgpt.com/',
        logo: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128'
      },
      {
        nombre: 'Claude',
        descripcion: 'Asistente de IA avanzado de Anthropic para redacción y análisis.',
        url: 'https://claude.ai/',
        logo: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128'
      },
      {
        nombre: 'Gemini',
        descripcion: 'IA de Google para búsqueda, creatividad y generación de contenido.',
        url: 'https://gemini.google.com/',
        logo: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128'
      }
    ]
  },
  {
    categoria: 'Imágenes',
    icono: 'bi-image',
    herramientas: [
      {
        nombre: 'Midjourney',
        descripcion: 'Generador de imágenes fotorrealistas y artísticas de alta calidad.',
        url: 'https://www.midjourney.com/',
        logo: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=128'
      },
      {
        nombre: 'DALL·E',
        descripcion: 'Sistema de OpenAI para crear imágenes originales a partir de texto.',
        url: 'https://openai.com/dall-e-3',
        logo: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128'
      },
      {
        nombre: 'Ideogram',
        descripcion: 'Generador de imágenes especializado en renderizado preciso de texto.',
        url: 'https://ideogram.ai/',
        logo: 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=128'
      }
    ]
  },
  {
    categoria: 'Video',
    icono: 'bi-film',
    herramientas: [
      {
        nombre: 'Runway',
        descripcion: 'Herramientas de IA generativa para edición y creación de video.',
        url: 'https://runwayml.com/',
        logo: 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=128'
      },
      {
        nombre: 'Pika',
        descripcion: 'Plataforma para generar y animar videos a partir de texto e imágenes.',
        url: 'https://pika.art/',
        logo: 'https://www.google.com/s2/favicons?domain=pika.art&sz=128'
      }
    ]
  },
  {
    categoria: 'Audio y voz',
    icono: 'bi-soundwave',
    herramientas: [
      {
        nombre: 'ElevenLabs',
        descripcion: 'Generación de voces sintéticas ultra realistas y clonación de voz.',
        url: 'https://elevenlabs.io/',
        logo: 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128'
      },
      {
        nombre: 'Suno',
        descripcion: 'Creación instantánea de música y canciones completas con voz.',
        url: 'https://suno.com/',
        logo: 'https://www.google.com/s2/favicons?domain=suno.com&sz=128'
      }
    ]
  },
  {
    categoria: 'Código y desarrollo',
    icono: 'bi-code-slash',
    herramientas: [
      {
        nombre: 'GitHub Copilot',
        descripcion: 'Asistente de programación basado en IA para autocompletar e idear código.',
        url: 'https://github.com/features/copilot',
        logo: 'https://www.google.com/s2/favicons?domain=github.com&sz=128'
      },
      {
        nombre: 'Cursor',
        descripcion: 'Editor de código potenciado con IA para refactorización y desarrollo.',
        url: 'https://www.cursor.com/',
        logo: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=128'
      },
      {
        nombre: 'Lovable',
        descripcion: 'Crea aplicaciones web full-stack escribiendo instrucciones en lenguaje natural.',
        url: 'https://lovable.dev/',
        logo: 'https://www.google.com/s2/favicons?domain=lovable.dev&sz=128'
      }
    ]
  },
  {
    categoria: 'Investigación y documentos',
    icono: 'bi-journal-bookmark',
    herramientas: [
      {
        nombre: 'Perplexity',
        descripcion: 'Motor de búsqueda con IA que responde preguntas citando fuentes confiables.',
        url: 'https://www.perplexity.ai/',
        logo: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128'
      },
      {
        nombre: 'NotebookLM',
        descripcion: 'Cuaderno de notas de Google con IA entrenado sobre tus propios documentos.',
        url: 'https://notebooklm.google.com/',
        logo: 'https://www.google.com/s2/favicons?domain=notebooklm.google.com&sz=128'
      }
    ]
  },
  {
    categoria: 'Diseño',
    icono: 'bi-palette',
    herramientas: [
      {
        nombre: 'Canva',
        descripcion: 'Plataforma de diseño gráfico con potentes funciones de IA integradas.',
        url: 'https://www.canva.com/',
        logo: 'https://www.google.com/s2/favicons?domain=canva.com&sz=128'
      }
    ]
  }
];
