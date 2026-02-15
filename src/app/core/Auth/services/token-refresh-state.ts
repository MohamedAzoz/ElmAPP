import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenRefreshState {
  isRefreshing = false;
  refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // ✅ Reset عند الـ logout
  reset(): void {
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);
  }
}
