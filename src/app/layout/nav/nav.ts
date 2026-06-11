import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { IdentitySignals } from '../../core/Auth/services/identity-signals';
import { AuthFacade } from '../../core/Auth/services/auth-facade';
import { Theme } from '../../theme';
import { Roles } from '../../core/Const/Roles';
import { ILink } from '../ilink';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, ButtonModule, MenuModule, AvatarModule],
  templateUrl: './nav.html',
  styleUrl:    './nav.css',
})
export class Nav {
  // ── Services ───────────────────────────────────────────────────────
  readonly identity   = inject(IdentitySignals);
  readonly theme      = inject(Theme);
  private readonly authFacade = inject(AuthFacade);
  private readonly router     = inject(Router);
  private readonly location   = inject(Location);

  // ── State ──────────────────────────────────────────────────────────
  readonly sidebarVisible = signal(false);
  readonly isOnline       = signal(navigator.onLine);

  // ✅ computed بدل effect — أنظف وأسرع
  readonly isLoggedIn = computed(() => this.identity.isAuthenticated);

  constructor() {
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  // ── Theme label للـ tooltip ────────────────────────────────────────
 // nav.ts — themeButtonLabel (لا تغيير مطلوب، صحيح مسبقاً)
themeButtonLabel = computed(() =>
  this.theme.isAutoMode()
    ? `وضع تلقائي — ${this.theme.currentTimeLabel()}`
    : this.theme.isDark() ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'
);

  // ── Navigation Links ───────────────────────────────────────────────
  private readonly allLinks: ILink[] = [
    { label: 'إدارة الكليات',   icon: 'pi pi-building',    role: Roles.SuperAdmin, command: () => '/main/admin/colleges' },
    { label: 'إدارة المواد',    icon: 'pi pi-book',         role: Roles.SuperAdmin, command: () => '/main/admin/subjects' },
    { label: 'إدارة الدكاترة',  icon: 'pi pi-users',        role: Roles.SuperAdmin, command: () => '/main/admin/management' },
    { label: 'إدارة الطلاب',    icon: 'pi pi-users',        role: Roles.SuperAdmin, command: () => '/main/admin/management/leaders' },
    { label: 'الإعدادات',       icon: 'pi pi-cog',          role: Roles.SuperAdmin, command: () => '/main/admin/settings' },
    { label: 'المواد',          icon: 'pi pi-check-circle', role: Roles.Doctor,     command: () => '/main/doctor/subjects' },
    { label: 'الإشعارات',       icon: 'pi pi-bell',         role: Roles.Doctor,     command: () => '/main/doctor/notifications' },
    { label: 'موادي',           icon: 'pi pi-briefcase',    role: Roles.Leader,     command: () => '/main/leader/my-subjects' },
  ];

  readonly filteredLinks = computed(() =>
    this.allLinks.filter((link) => this.can(link.role!))
  );

  readonly userItems: MenuItem[] = [
    {
      label:   'تغيير كلمة المرور',
      icon:    'pi pi-key',
      command: () => this.router.navigate(['/main/changePassword']),
    },
    { separator: true },
    {
      label:   'تسجيل الخروج',
      icon:    'pi pi-sign-out',
      command: () => this.logout(),
    },
  ];

  // ── Methods ────────────────────────────────────────────────────────
  can(role: string): boolean {
    return this.identity.roles === role;
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  goBack(): void {
    this.location.back();
    this.closeSidebar();
  }

  logout(): void {
    this.closeSidebar();
    this.authFacade.logout();
  }
}