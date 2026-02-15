import { Component, inject, input } from '@angular/core';
import { RateLimitService, LockType } from '../../../core/Services/rate-limit-service';

@Component({
    selector: 'app-lock-ui',
    template: `
        @if (rateLimitService.isLocked(type())) {
            <div
                class="flex flex-col items-center justify-center text-center p-8 w-full"
            >
                <div
                    class="bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100"
                >
                    <i class="pi pi-lock text-4xl"></i>
                </div>

                <h2 class="text-2xl font-black text-text-main mb-2">
                    تم تقييد الطلبات مؤقتاً
                </h2>

                <p class="text-text-muted mb-8 leading-relaxed max-w-md mx-auto">
                    {{ rateLimitService.getMessage(type()) }}
                </p>

                <div
                    class="bg-text-dark text-white py-4 px-8 rounded-2xl inline-block shadow-xl"
                >
                    <span
                        class="block text-xs text-text-muted mb-1 uppercase tracking-widest"
                    >
                        يمكنك المحاولة بعد
                    </span>
                    <span class="text-3xl font-mono font-bold">
                        {{ rateLimitService.getTimer(type()) }}
                    </span>
                </div>

                <p class="mt-6 text-sm text-text-muted">
                    سيتم فتح الصفحة تلقائياً فور انتهاء الوقت
                </p>
            </div>
        }
    `,
})
export class LockUi {
    rateLimitService = inject(RateLimitService);

    // ✅ كل مكان يحدد نوع القفل اللي عايز يعرضه
    type = input<LockType>('global');
}