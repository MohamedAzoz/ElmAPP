import { Component, effect, inject, Signal, signal } from '@angular/core';
import { Theme } from './theme';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { NgxSpinnerModule } from 'ngx-spinner';
import { GlobalService } from './core/Services/global-service';
 
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, NgxSpinnerModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  constructor(public themeService: Theme, public globalService: GlobalService) {
    this.themeService.loadTheme();
    effect(()=>{
      const title = this.globalService.getTitle();
      document.title = title;
    })
  }
}
