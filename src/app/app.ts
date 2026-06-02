import { Component } from '@angular/core';
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
  constructor(public themeService: Theme , public loadingService :LoadingService) {
    this.themeService.loadTheme();
  }
}
