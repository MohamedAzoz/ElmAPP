import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  breadcrumbs = signal<Breadcrumb[]>([]);

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const root = this.router.routerState.snapshot.root;
      const breadcrumbs: Breadcrumb[] = [];
      this.addBreadcrumb(root, [], breadcrumbs);
      this.breadcrumbs.set(breadcrumbs);
    });
  }

  private addBreadcrumb(
    route: ActivatedRouteSnapshot,
    parentUrl: string[],
    breadcrumbs: Breadcrumb[],
  ) {
    const routeUrl = parentUrl.concat(route.url.map((url) => url.path));

    // هنا نحدد مسميات الروابط بناءً على الجزء الموجود في الـ URL
    let label = '';
    const lastPath = route.url[route.url.length - 1]?.path;

    if (lastPath === 'colleges') label = 'الكليات';
    else if (lastPath === 'years') label = 'السنوات الدراسية';
    else if (lastPath === 'departments') label = 'الأقسام';
    else if (lastPath === 'curriulums') label = 'المناهج';
    else if (lastPath === 'QB') label = 'بنك الأسئلة';
    else if (lastPath === 'T') label = 'الاختبارات';
    else if (lastPath === 'result') label = 'النتيجة';

    if (label) {
      breadcrumbs.push({ label, url: '/' + routeUrl.join('/') });
    }

    if (route.firstChild) {
      this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
    }
  }
}
