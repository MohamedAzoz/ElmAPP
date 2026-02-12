import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IdentitySignals } from '../../core/Auth/services/identity-signals';
import { AuthFacade } from '../../core/Auth/services/auth-facade';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { PermissionFacade } from '../../core/Auth/services/permission-facade';
import { ILink } from '../ilink';

@Component({
  selector: 'app-nav',
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  public identity = inject(IdentitySignals);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private permissionFacade = inject(PermissionFacade);

  sidebarVisible = signal(false);

  private allLinks: ILink[] = [
    {
      label: 'إدارة الكليات',
      icon: 'pi pi-building',
      permission: 'Colleges',
      command: () => this.navigateTo('/main/admin/colleges'),
    },
    {
      label: 'إدارة المواد',
      icon: 'pi pi-book',
      permission: 'Subjects',
      command: () => this.navigateTo('/main/admin/subjects'),
    },
    {
      label: 'ادارة الدكاترة',
      icon: 'pi pi-users',
      permission: 'Doctors',
      command: () => this.navigateTo('/main/admin/management'),
    },
    {
      label: 'ادارة الطلاب',
      icon: 'pi pi-users',
      permission: 'Leaders',
      command: () => this.navigateTo('/main/admin/management/leaders'),
    },
    {
      label: 'الادوار',
      icon: 'pi pi-shield',
      permission: 'Roles',
      command: () => this.navigateTo('/main/admin/management/roles'),
    },
    {
      label: 'المواد (دكتور)',
      icon: 'pi pi-check-circle',
      permission: 'RateFiles',
      command: () => this.navigateTo('/main/doctor/subjects'),
    },
    {
      label: 'الإشعارات',
      icon: 'pi pi-bell',
      permission: 'Notifications',
      command: () => this.navigateTo('/main/doctor/notifications'),
    },
    {
      label: 'موادي (ليدر)',
      icon: 'pi pi-briefcase',
      permission: 'QuestionBanks',
      command: () => this.navigateTo('/main/leader/my-subjects'),
    },
  ];

  filteredLinks = computed(() => {
    return this.allLinks.filter((link) => this.can(link.permission!));
  });

  isLoggedIn = computed(() => this.identity.isAuthenticated);

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

  private navigateTo(path: string) {
    this.router.navigate([path]);
    this.sidebarVisible.set(false);
  }

  logout() {
    this.authFacade.logout();
    this.router.navigate(['/main/login']);
  }
}
