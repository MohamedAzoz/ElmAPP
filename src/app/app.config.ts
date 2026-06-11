import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideAppInitializer,
  inject,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { NoPreloading, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  provideFirestore,
} from '@angular/fire/firestore';

import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { routes } from './app.routes';
import { environment } from '../environments/environment.development';
import { dbConfig } from './core/AppContext/app.db-config';
import { loadingInterceptor } from './core/Interceptors/loading-interceptor';
import { httpErrorInterceptor } from './core/Errors/Interceptors/http-error-interceptor';
import { authInterceptor } from './core/Auth/Interceptors/auth-interceptor';
import { GlobalErrorHandler } from './core/Errors/global-error-handler';
import { API_BASE_URL } from './core/api/clients';
import { SecureStorageService } from './core/Services/secure-storage.service';
import { Theme } from './theme';

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
    // ── 1. Firebase (أول حاجة — قبل أي provider تاني يعتمد عليها) ──
    provideFirebaseApp(() =>
      initializeApp(environment.firebaseConfig, {
        automaticDataCollectionEnabled: false,
      }),
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache(), // هنا يخبر Firebase المتصفح بفتح مخزن IndexedDB خاص به تلقائياً
      }),
    ),
    // provideFirestore(() => getFirestore()),

    // ── 2. Angular Core ────────────────────────────────────────────
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes, withPreloading(NoPreloading)),

    // ── 3. HTTP ────────────────────────────────────────────────────
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, authInterceptor, httpErrorInterceptor]),
    ),
    { provide: API_BASE_URL, useValue: 'https://elm.runasp.net' },

    // ── 4. App Initializers (بالترتيب — كل واحد يكمل قبل التالي) ──
    provideAppInitializer(() => inject(SecureStorageService).init()),
    provideAppInitializer(() => inject(Theme).init()),

    // ── 5. Storage ─────────────────────────────────────────────────
    provideCatbeeIndexedDB(dbConfig),

    // ── 6. UI ──────────────────────────────────────────────────────
    MessageService,
    providePrimeNG({
      theme: {
        preset: MyCustomPreset,
        options: { darkModeSelector: '.dark' },
      },
    }),
    provideMonacoEditor({
      baseUrl: 'assets/monaco',
      defaultOptions: {
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
      },
    }),

    // ── 7. Error Handling ──────────────────────────────────────────
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // ── 8. Service Worker ──────────────────────────────────────────
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
