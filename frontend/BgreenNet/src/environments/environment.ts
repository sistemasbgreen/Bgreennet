export const environment = {

production: true,

apiUrl: 'http://localhost:8081' // URL local host backend Spring Boot
//apiUrl: 'http://172.30.72.200' // URL de QA
// apiUrl: 'http://45.183.247.77:8060' // URL de Preprod
//apiUrl: 'https://bgreennet.bgreen.com.co'// URL PROD

// Jornada laboral legal en Colombia (Ley 2101 de 2021: 42 horas semanales a partir de julio de 2026)
,
horasMetaSemana: 42,
horaLimiteEntrada: '07:30',
horaMinimaSalida: '17:30'

};
