import { Component, computed, effect, inject, Renderer2, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLinkActive } from '@angular/router';
import { IdentitySignals } from '../../core/Auth/services/identity-signals';
import { AuthFacade } from '../../core/Auth/services/auth-facade';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { PermissionFacade } from '../../core/Auth/services/permission-facade';
import { ILink } from '../ilink';
import { Theme } from '../../theme';
import { Location } from '@angular/common';

@Component({
  selector: 'app-nav',
  imports: [CommonModule, RouterModule, RouterLinkActive, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  public identity = inject(IdentitySignals);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private permissionFacade = inject(PermissionFacade);
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
      permission: 'Colleges',
      command: () => '/main/admin/colleges',
    },
    {
      label: 'إدارة المواد',
      icon: 'pi pi-book',
      permission: 'Subjects',
      command: () => '/main/admin/subjects',
    },
    {
      label: 'ادارة الدكاترة',
      icon: 'pi pi-users',
      permission: 'Doctors',
      command: () => '/main/admin/management',
    },
    {
      label: 'ادارة الطلاب',
      icon: 'pi pi-users',
      permission: 'Leaders',
      command: () => '/main/admin/management/leaders',
    },
    {
      label: 'ادارة الصلاحيات',
      icon: 'pi pi-users',
      permission: 'Permissions',
      command: () => '/main/admin/management/permissions',
    },
    {
      label: 'الادوار',
      icon: 'pi pi-shield',
      permission: 'Roles',
      command: () => '/main/admin/management/roles',
    },
    {
      label: 'المواد',
      icon: 'pi pi-check-circle',
      permission: 'RateFiles',
      command: () => '/main/doctor/subjects',
    },
    {
      label: 'الإشعارات',
      icon: 'pi pi-bell',
      permission: 'Notifications',
      command: () => '/main/doctor/notifications',
    },
    {
      label: 'موادي',
      icon: 'pi pi-briefcase',
      permission: 'QuestionBanks',
      command: () => '/main/leader/my-subjects',
    },
  ];

  filteredLinks = computed(() => {
    return this.allLinks.filter((link) => this.can(link.permission!));
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

  can(permission: string): boolean {
    return this.permissionFacade.hasPermission(permission);
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
