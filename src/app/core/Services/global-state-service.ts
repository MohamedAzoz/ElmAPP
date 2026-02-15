import { Injectable, signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalStateService {
    private activeRequests = 0;
    isLoading = signal<boolean>(false);

    trackRequest<T>(obs$: Observable<T>): Observable<T> {
        this.activeRequests++;
        this.isLoading.set(true);

        return obs$.pipe(
            finalize(() => {
                this.activeRequests--;
                if (this.activeRequests === 0) {
                    this.isLoading.set(false);
                }
            })
        );
    }
}