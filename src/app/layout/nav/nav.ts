import { Component, computed, effect, inject, Renderer2, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLinkActive } from '@angular/router';
import { IdentitySignals } from '../../core/Auth/services/identity-signals';
import { AuthFacade } from '../../core/Auth/services/auth-facade';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { ILink } from '../ilink';
import { Theme } from '../../theme';
import { Location } from '@angular/common';
import { Roles } from '../../core/Const/Roles';

@Component({
  selector: 'app-nav',
  imports: [CommonModule, RouterModule, RouterLinkActive, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  public identity = inject(IdentitySignals);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private location = inject(Location);

  public themeService = inject(Theme);

  sidebarVisible = signal(false);

  isLoggedIn = signal(false);
  constructor() {
    effect(() => {
      this.isLoggedIn.set(this.identity.isAuthenticated);
    });
  }

  private allLinks: ILink[] = [
    {
      label: 'إدارة الكليات',
      icon: 'pi pi-building',
      role: Roles.SuperAdmin,
      command: () => '/main/admin/colleges',
    },
    {
      label: 'إدارة المواد',
      icon: 'pi pi-book',
      role: Roles.SuperAdmin,
      command: () => '/main/admin/subjects',
    },
    {
      label: 'ادارة الدكاترة',
      icon: 'pi pi-users',
      role: Roles.SuperAdmin,
      command: () => '/main/admin/management',
    },
    {
      label: 'ادارة الطلاب',
      icon: 'pi pi-users',
      role: Roles.SuperAdmin,
      command: () => '/main/admin/management/leaders',
    },
    {
      label: 'الاعدادات',
      icon: 'pi pi-cog',
      role: Roles.SuperAdmin,
      command: () => '/main/admin/settings',
    },
    {
      label: 'المواد',
      icon: 'pi pi-check-circle',
      role: Roles.Doctor,
      command: () => '/main/doctor/subjects',
    },
    {
      label: 'الإشعارات',
      icon: 'pi pi-bell',
      role: Roles.Doctor,
      command: () => '/main/doctor/notifications',
    },
    {
      label: 'موادي',
      icon: 'pi pi-briefcase',
      role: Roles.Leader,
      command: () => '/main/leader/my-subjects',
    },
  ];

  filteredLinks = computed(() => {
    return this.allLinks.filter((link) => this.can(link.role!));
  });

  userItems: MenuItem[] = [
    {
      label: 'تغيير كلمة المرور',
      icon: 'pi pi-key',
      command: () => this.router.navigate(['/main/changePassword']),
    },
    { separator: true },
    { label: 'تسجيل الخروج', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  can(role: string): boolean {
    return this.identity.roles === role;
  }

  goBack() {
    this.location.back();
    this.sidebarVisible.set(false);
  }

  logout() {
    this.authFacade.logout();
    window.location.reload();
    this.router.navigate(['/main/login']);
  }
}
