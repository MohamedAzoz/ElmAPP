/**
 * نماذج البيانات لنظام حفظ الروابط الآمنة
 */

/** أنواع مصادر الروابط */
export enum LinkSourceType {
  external = 'external',
  pdf = 'pdf',
  youtube = 'youtube',
  gdrive = 'gdrive',
}

/** حالات أمان الرابط */
// export type LinkStatus = 'safe' | 'suspicious' | 'pending' | 'error';
export enum LinkStatus {
  safe = 'safe',
  suspicious = 'suspicious',
  pending = 'pending',
  error = 'error',
}

/** نموذج الرابط المحفوظ */
export interface SavedLink {
  /** معرف فريد UUID */
  id: string;
  /** عنوان الرابط (اسم مستعار) */
  title: string;
  /** الرابط الفعلي */
  url: string;
  /** نوع المصدر */
  sourceType: LinkSourceType;
  /** حالة الأمان */
  status: LinkStatus;
  /** تاريخ آخر فحص أمني */
  checkedAt: number;
  /** تاريخ الإنشاء */
  createdAt: number;
  /** معرف الملف في Google Drive (اختياري) */
  driveFileId?: string;
}

/** خيارات dropdown لنوع المصدر */
export const SOURCE_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: LinkSourceType;
  icon: string;
}> = [
  { label: 'موقع خارجي', value: LinkSourceType.external, icon: 'pi pi-globe' },
  { label: 'ملف PDF', value: LinkSourceType.pdf, icon: 'pi pi-file-pdf' },
  { label: 'رابط يوتيوب', value: LinkSourceType.youtube, icon: 'pi pi-youtube' },
  { label: 'جوجل درايف', value: LinkSourceType.gdrive, icon: 'pi pi-google' },
] as const;

/** خريطة حالات الأمان مع الألوان والأيقونات */
export const STATUS_CONFIG: Readonly<
  Record<LinkStatus, { label: string; severity: string; icon: string }>
> = {
  safe: { label: 'آمن', severity: 'success', icon: 'pi pi-check-circle' },
  suspicious: { label: 'مشبوه', severity: 'warn', icon: 'pi pi-exclamation-triangle' },
  pending: { label: 'قيد التحقق', severity: 'info', icon: 'pi pi-spin pi-spinner' },
  error: { label: 'خطأ في الفحص', severity: 'danger', icon: 'pi pi-times-circle' },
} as const;

/** إنشاء معرف فريد */
export function generateLinkId(): string {
  return crypto.randomUUID();
}
