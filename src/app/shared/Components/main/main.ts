import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../layout/footer/footer';
import { Nav } from '../../../layout/nav/nav';

@Component({
  selector: 'app-main',
  imports: [Nav , RouterOutlet, Footer],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {}
