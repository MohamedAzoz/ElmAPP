import { Injectable, Signal, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';
import { NotificationDto } from '../../../core/api/clients';

@Injectable({
    providedIn: 'root',
})
export class SignalNotificationService {
    private hubConnection: signalR.HubConnection | null = null;

    // ✅ استخدم wrapper object عشان كل إشعار يكون reference جديد
    private notificationSubject = signal<{ data: NotificationDto; timestamp: number } | null>(null);

    constructor(private identity: IdentitySignals) {}

    public async startConnection(): Promise<void> {
        const token = this.identity.token;

        if (!token) {
            console.warn('SignalR: No token found, connection aborted.');
            return;
        }

        // ✅ لو متصل بالفعل، ارجع
        if (
            this.hubConnection &&
            (this.hubConnection.state === signalR.HubConnectionState.Connected ||
                this.hubConnection.state === signalR.HubConnectionState.Connecting ||
                this.hubConnection.state === signalR.HubConnectionState.Reconnecting)
        ) {
            return;
        }

        // ✅ لو فيه اتصال قديم في حالة Disconnected، نظفه الأول
        if (this.hubConnection) {
            this.hubConnection.off('ReceiveNotification');
            this.hubConnection = null;
        }

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${environment.apiUrl}notificationHub`, {
                accessTokenFactory: () => {
                    return this.identity.token || '';
                },
                // ✅ لا تحدد transport عشان يعمل fallback تلقائي
                // ✅ withCredentials لو محتاج cookies
                withCredentials: false,
            })
            .withAutomaticReconnect({
                // ✅ Retry strategy مخصصة
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // حاول بعد 0, 2, 5, 10, 30 ثانية ثم كل 60 ثانية
                    const delays = [0, 2000, 5000, 10000, 30000];
                    return delays[retryContext.previousRetryCount] ?? 60000;
                },
            })
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // ✅ سجل الـ event handlers قبل الـ start
        this.registerEventHandlers();
        this.registerNotificationListener();

        try {
            await this.hubConnection.start();
            console.log('✅ SignalR Connected');
        } catch (err) {
            console.error('❌ SignalR Connection Error:', err);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    private registerEventHandlers(): void {
        if (!this.hubConnection) return;

        this.hubConnection.onreconnecting((error) => {
            console.warn('⚠️ SignalR Reconnecting...', error);
        });

        this.hubConnection.onreconnected((connectionId) => {
            console.log('✅ SignalR Reconnected. Connection ID:', connectionId);
        });

        this.hubConnection.onclose((error) => {
            console.error('❌ SignalR Connection Closed:', error);
            // ✅ حاول تعيد الاتصال بعد 10 ثواني
            setTimeout(() => this.startConnection(), 10000);
        });
    }

    private registerNotificationListener(): void {
        if (!this.hubConnection) return;

        this.hubConnection.off('ReceiveNotification');

        this.hubConnection.on('ReceiveNotification', (notificationDto: NotificationDto) => {
            console.log('🔔 New Notification:', notificationDto);
            // ✅ كل إشعار يكون object جديد بـ timestamp فريد
            this.notificationSubject.set({
                data: notificationDto,
                timestamp: Date.now(),
            });
        });
    }

    public getNotifications(): Signal<{ data: NotificationDto; timestamp: number } | null> {
        return this.notificationSubject.asReadonly();
    }

    public async stopConnection(): Promise<void> {
        if (this.hubConnection) {
            this.hubConnection.off('ReceiveNotification');
            try {
                await this.hubConnection.stop();
                console.log('✅ SignalR Disconnected');
            } catch (err) {
                console.error('❌ Error stopping SignalR:', err);
            }
            this.hubConnection = null;
        }
    }
}