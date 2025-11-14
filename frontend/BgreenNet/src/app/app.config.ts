import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { JwtInterceptor } from './guard/jwt.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
 provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),

    {
      provide: 'HTTP_INTERCEPTORS',
      useClass: JwtInterceptor,
      multi: true
    }
  ]

};
