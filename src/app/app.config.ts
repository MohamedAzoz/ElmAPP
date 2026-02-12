import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './core/Interceptors/loading-interceptor';
import { httpErrorInterceptor } from './core/Errors/Interceptors/http-error-interceptor';
import { GlobalErrorHandler } from './core/Errors/global-error-handler';
import { MessageService } from 'primeng/api';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './core/Auth/Interceptors/auth-interceptor';
import { API_BASE_URL } from './core/api/clients';
import { definePreset } from '@primeuix/themes';
const MyCustomPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
  },
});
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    importProvidersFrom(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyCustomPreset,
        options: {
          darkModeSelector: '.dark', // كلاس تفعيل الوضع الليلي
          // cssLayer: {
          //     name: 'primeng',
          //     order: 'tailwind-base, primeng, tailwind-utilities'
          // }
        },
      },
    }),
    MessageService,
    { provide: API_BASE_URL, useValue: 'https://elm.runasp.net' },
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, authInterceptor, httpErrorInterceptor]),
    ),
  ],
};
