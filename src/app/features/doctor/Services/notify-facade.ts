import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    MarkAllNotificationsAsReadCommand,
    NotificationDto,
    NotificationsClient,
} from '../../../core/api/clients';

@Injectable({
    providedIn: 'root',
})
export class NotifyFacade {
    private notifyService = inject(NotificationsClient);
    private destroyRef = inject(DestroyRef);

    notifications = signal<NotificationDto[]>([]);
    unreadCount = signal<number>(0);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    getNotifications(userId: string) {
        this.loading.set(true);
        this.error.set(null);

        this.notifyService
            .userNotifications(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.notifications.set(res.data || []);
                    this.getUnreadCount(userId);
                },
                error: (err) => {
                    this.loading.set(false);
                    this.error.set('فشل في جلب الإشعارات');
                    console.error('Error fetching notifications:', err);
                },
                complete: () => this.loading.set(false),
            });
    }

    // ✅ markAsRead ترجع Observable عشان الـ Component يعمل subscribe
    markAsRead(notificationId: number) {
        return this.notifyService.markAsRead(notificationId);
    }

    markAllAsRead(command: MarkAllNotificationsAsReadCommand) {
        return this.notifyService.markAllAsRead(command);
    }

    deleteNotification(notificationId: number) {
        return this.notifyService.delete(notificationId);
    }

    getUnreadCount(userId: string) {
        this.notifyService
            .unreadCount(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.unreadCount.set(res.data || 0);
                },
                error: (err) => {
                    console.error('Error fetching unread count:', err);
                },
            });
    }
}