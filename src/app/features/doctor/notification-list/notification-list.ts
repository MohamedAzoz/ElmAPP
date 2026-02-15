import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotifyFacade } from '../Services/notify-facade';
import { GlobalService } from '../../../core/Services/global-service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { SignalNotificationService } from '../Services/signal-notification';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-notification-list',
    imports: [
    CommonModule,
    DatePipe,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    ToastModule,
    SkeletonModule,
    MenuModule,
    RouterLink
],
    providers: [MessageService], // ✅ لازم تضيفه هنا أو في الـ Module
    templateUrl: './notification-list.html',
    styleUrl: './notification-list.scss',
})
export class NotificationList implements OnInit, OnDestroy {
    public notifyFacade = inject(NotifyFacade);
    private signalService = inject(SignalNotificationService);
    private global = inject(GlobalService);
    private messageService = inject(MessageService);
    private identity = inject(IdentitySignals);

    private userId = this.identity.userId;

    // ✅ متغير لتتبع آخر timestamp عشان نمنع التكرار
    private lastNotificationTimestamp = 0;

    constructor() {
        effect(() => {
            const wrapper = this.signalService.getNotifications()();
            if (wrapper && wrapper.timestamp > this.lastNotificationTimestamp) {
                this.lastNotificationTimestamp = wrapper.timestamp;
                const newNotification = wrapper.data;

                // ✅ تحقق إن الإشعار مش موجود أصلاً في القائمة
                const exists = this.notifyFacade
                    .notifications()
                    .some((n) => n.id === newNotification.id);

                if (!exists) {
                    this.notifyFacade.notifications.update((current) => [
                        newNotification,
                        ...current,
                    ]);
                    this.notifyFacade.unreadCount.update((count) => count + 1);

                    this.messageService.add({
                        severity: 'info',
                        summary: 'إشعار جديد',
                        detail: newNotification.title,
                        life: 4000, // ✅ 700ms كان قصير جداً
                    });
                }
            }
        });
    }

    ngOnInit() {
        this.global.setTitle('الإشعارات');

        if (this.userId) {
            // ✅ شغل SignalR الأول وبعدين جيب البيانات
            this.signalService.startConnection().then(() => {
                this.notifyFacade.getNotifications(this.userId);
            });
        } else {
            console.warn('⚠️ No userId found, notifications will not load.');
        }
    }

    ngOnDestroy() {
        this.signalService.stopConnection();
        this.messageService.clear();
    }

    markAllAsRead() {
        if (this.notifyFacade.unreadCount() === 0) return;

        const command = { userId: this.userId };
        this.notifyFacade.markAllAsRead(command).subscribe({
            next: () => {
                this.notifyFacade.notifications.update((list) =>
                    list.map((n) => ({ ...n, isRead: true })),
                );
                this.notifyFacade.unreadCount.set(0);
                this.messageService.add({
                    severity: 'success',
                    summary: 'تم',
                    detail: 'تم قراءة جميع الإشعارات',
                });
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'حدث خطأ أثناء العملية',
                }),
        });
    }

    markAsRead(id: number, event: Event) {
        event.stopPropagation();
        this.notifyFacade.markAsRead(id).subscribe({
            next: () => {
                this.notifyFacade.notifications.update((list) =>
                    list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
                );
                this.notifyFacade.unreadCount.update((c) => (c > 0 ? c - 1 : 0));
            },
            // ✅ أضف error handling
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'فشل في تحديد الإشعار كمقروء',
                }),
        });
    }

    deleteNotification(id: number, event: Event) {
        event.stopPropagation();

        // ✅ تحقق إن الإشعار كان غير مقروء عشان تنقص العداد
        const notification = this.notifyFacade.notifications().find((n) => n.id === id);

        this.notifyFacade.deleteNotification(id).subscribe({
            next: () => {
                this.notifyFacade.notifications.update((list) => list.filter((n) => n.id !== id));

                // ✅ نقص العداد لو الإشعار كان غير مقروء
                if (notification && !notification.isRead) {
                    this.notifyFacade.unreadCount.update((c) => (c > 0 ? c - 1 : 0));
                }

                this.messageService.add({
                    severity: 'warn',
                    summary: 'حذف',
                    detail: 'تم حذف الإشعار',
                });
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'فشل في حذف الإشعار',
                }),
        });
    }
}