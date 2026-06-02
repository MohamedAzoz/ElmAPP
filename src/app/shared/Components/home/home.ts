import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public identity = inject(IdentitySignals);
}
