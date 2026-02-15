import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { LocalStorage } from './local-storage';

export type LockType = 'global' | 'login' | 'test';

interface LockState {
    endTime: number;
    message: string;
    seconds: number;
}

// ✅ مفاتيح الـ localStorage لكل نوع
const STORAGE_KEYS: Record<LockType, { endTime: string; message: string }> = {
    global: {
        endTime: 'rate_limit_global_end',
        message: 'rate_limit_global_msg',
    },
    login: {
        endTime: 'rate_limit_login_end',
        message: 'rate_limit_login_msg',
    },
    test: {
        endTime: 'rate_limit_test_end',
        message: 'rate_limit_test_msg',
    },
};

@Injectable({ providedIn: 'root' })
export class RateLimitService implements OnDestroy {
    private storage = inject(LocalStorage);

    // ✅ كل نوع lock له state مستقل تماماً
    private globalState = signal<LockState | null>(null);
    private loginState = signal<LockState | null>(null);
    private testState = signal<LockState | null>(null);

    // ✅ كل نوع lock له timer مستقل
    private timers: Record<LockType, ReturnType<typeof setInterval> | null> = {
        global: null,
        login: null,
        test: null,
    };

    // ═══════════════════════════════════════
    //  Computed Signals للـ Components
    // ═══════════════════════════════════════

    isGlobalLocked = computed(() => this.globalState() !== null);
    isLoginLocked = computed(() => this.loginState() !== null);
    isTestLocked = computed(() => this.testState() !== null);

    globalMessage = computed(() => this.globalState()?.message ?? '');
    loginMessage = computed(() => this.loginState()?.message ?? '');
    testMessage = computed(() => this.testState()?.message ?? '');

    globalTimer = computed(() => this.formatTime(this.globalState()?.seconds ?? 0));
    loginTimer = computed(() => this.formatTime(this.loginState()?.seconds ?? 0));
    testTimer = computed(() => this.formatTime(this.testState()?.seconds ?? 0));

    // ✅ هل فيه أي نوع lock نشط؟
    isAnyLocked = computed(
        () => this.isGlobalLocked() || this.isLoginLocked() || this.isTestLocked(),
    );

    constructor() {
        // ✅ استعادة كل الـ locks من الـ localStorage عند بدء التطبيق
        this.restoreLock('global');
        this.restoreLock('login');
        this.restoreLock('test');
    }

    ngOnDestroy(): void {
        // ✅ نظف كل الـ timers
        this.clearTimer('global');
        this.clearTimer('login');
        this.clearTimer('test');
    }

    // ═══════════════════════════════════════
    //  Public Methods
    // ═══════════════════════════════════════

    startLock(seconds: number, message: string, type: LockType): void {
        // ✅ وقف أي timer قديم لنفس النوع
        this.clearTimer(type);

        const endTime = Date.now() + seconds * 1000;

        // ✅ حفظ في localStorage
        const keys = STORAGE_KEYS[type];
        this.storage.set(keys.endTime, endTime.toString());
        this.storage.set(keys.message, message);

        // ✅ تحديث الـ State
        this.updateState(type, { endTime, message, seconds });

        // ✅ بدء العد التنازلي
        this.startTimer(type);
    }

    clearLock(type: LockType): void {
        this.clearTimer(type);
        this.updateState(type, null);

        const keys = STORAGE_KEYS[type];
        this.storage.remove(keys.endTime);
        this.storage.remove(keys.message);
    }

    /**
     * تحقق هل نوع معين مقفول - للاستخدام في الـ Guards أو الـ Components
     */
    isLocked(type: LockType): boolean {
        switch (type) {
            case 'global':
                return this.isGlobalLocked();
            case 'login':
                return this.isLoginLocked();
            case 'test':
                return this.isTestLocked();
        }
    }

    getMessage(type: LockType): string {
        switch (type) {
            case 'global':
                return this.globalMessage();
            case 'login':
                return this.loginMessage();
            case 'test':
                return this.testMessage();
        }
    }

    getTimer(type: LockType): string {
        switch (type) {
            case 'global':
                return this.globalTimer();
            case 'login':
                return this.loginTimer();
            case 'test':
                return this.testTimer();
        }
    }

    // ═══════════════════════════════════════
    //  Private Methods
    // ═══════════════════════════════════════

    private updateState(type: LockType, state: LockState | null): void {
        switch (type) {
            case 'global':
                this.globalState.set(state);
                break;
            case 'login':
                this.loginState.set(state);
                break;
            case 'test':
                this.testState.set(state);
                break;
        }
    }

    private getState(type: LockType): LockState | null {
        switch (type) {
            case 'global':
                return this.globalState();
            case 'login':
                return this.loginState();
            case 'test':
                return this.testState();
        }
    }

    private startTimer(type: LockType): void {
        this.timers[type] = setInterval(() => {
            const current = this.getState(type);
            if (!current || current.seconds <= 1) {
                this.clearLock(type);
                return;
            }

            // ✅ تحديث الثواني فقط - بدون لمس الـ message أو الـ endTime
            this.updateState(type, {
                ...current,
                seconds: current.seconds - 1,
            });
        }, 1000);
    }

    private clearTimer(type: LockType): void {
        if (this.timers[type]) {
            clearInterval(this.timers[type]!);
            this.timers[type] = null;
        }
    }

    /**
     * استعادة الـ Lock من الـ localStorage
     * (لو المستخدم عمل refresh للصفحة)
     */
    private restoreLock(type: LockType): void {
        const keys = STORAGE_KEYS[type];
        const endTimeStr = this.storage.get(keys.endTime);

        if (!endTimeStr) return;

        const endTime = parseInt(endTimeStr, 10);
        const now = Date.now();
        const remainingMs = endTime - now;

        if (remainingMs > 0) {
            const seconds = Math.ceil(remainingMs / 1000);
            const message = this.storage.get(keys.message) || 'تم تقييد الطلبات مؤقتاً';

            this.updateState(type, { endTime, message, seconds });
            this.startTimer(type);
        } else {
            // ✅ انتهى الوقت - نظف
            this.storage.remove(keys.endTime);
            this.storage.remove(keys.message);
        }
    }

    private formatTime(totalSeconds: number): string {
        const mins = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }
}