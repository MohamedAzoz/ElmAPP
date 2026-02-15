import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-notfound',
  imports: [RouterLink],
  templateUrl: './notfound.html',
  styleUrl: './notfound.scss',
})
export class Notfound {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}
