import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
  provideAppInitializer,
  inject,
} from '@angular/core';
import {
  NoPreloading,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './core/Interceptors/loading-interceptor';
import { httpErrorInterceptor } from './core/Errors/Interceptors/http-error-interceptor';
import { GlobalErrorHandler } from './core/Errors/global-error-handler';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/Auth/Interceptors/auth-interceptor';
import { API_BASE_URL } from './core/api/clients';
import { definePreset } from '@primeuix/themes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';
import { dbConfig } from './core/AppContext/app.db-config';
import { SecureStorageService } from './core/Services/secure-storage.service';

import { Theme } from './theme';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

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
    provideRouter(routes, withPreloading(NoPreloading)),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: MyCustomPreset,
        options: {
          darkModeSelector: '.dark',
          // cssLayer: {
          //   name: 'primeng',
          //   order: 'tailwind-base, primeng, tailwind-utilities',
          // },
        },
      },
    }),
    provideCatbeeIndexedDB(dbConfig),
    provideAppInitializer(() => inject(SecureStorageService).init()),
    provideAppInitializer(() => inject(Theme).init()),

    MessageService,
    { provide: API_BASE_URL, useValue: 'https://elm.runasp.net' },
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
      provideMonacoEditor({
      baseUrl: 'assets/monaco',
      defaultOptions: {
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark'
      }
    }),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, authInterceptor, httpErrorInterceptor]),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
