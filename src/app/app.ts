import { Component, inject } from '@angular/core';
import { Theme } from './theme';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { LoadingService } from './core/Services/loading-service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly loading = inject(LoadingService);

  constructor() {
    // loadTheme يُشغَّل هنا مرة واحدة فقط
    inject(Theme).loadTheme();
  }
}