import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

import { appConfig } from './app/app.config';
import { App } from './app/app';

// ✅ REGISTRAR LOCALE ESPAÑOL
registerLocaleData(localeEs);

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
}).catch((err) => console.error(err));
