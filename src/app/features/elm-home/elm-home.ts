import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
import { StudentAuthService } from '../../core/Services/student-auth.service';

@Component({
  selector: 'app-elm-home',
  imports: [CommonModule], // RouterLink],
  templateUrl: './elm-home.html',
  styleUrl: './elm-home.css',
})
export class ElmHome {
  public authService = inject(StudentAuthService);

  // loginWithGoogle() {
  //   this.authService.loginWithGoogle();
  // }
}
