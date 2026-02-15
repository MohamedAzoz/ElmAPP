import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../layout/footer/footer';
import { Nav } from '../../../layout/nav/nav';
import { LockUi } from '../lock-ui/lock-ui';
import { RateLimitService } from '../../../core/Services/rate-limit-service';
import { DirectionService } from '../../../core/Services/direction';

@Component({
  selector: 'app-main',
  imports: [Nav, RouterOutlet, Footer, LockUi],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  rateLimitService = inject(RateLimitService);
  dir = inject(DirectionService);
}
