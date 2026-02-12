import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DirectionService } from '../../core/Services/direction';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  dirService = inject(DirectionService);

  date = new Date();
}
