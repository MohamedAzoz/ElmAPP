/**
 * نماذج البيانات لنظام حفظ الروابط الآمنة
 */

/** أنواع مصادر الروابط */
export type LinkSourceType = 'external' | 'pdf' | 'youtube' | 'gdrive';

/** حالات أمان الرابط */
export type LinkStatus = 'safe' | 'suspicious' | 'pending' | 'error';

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
export const SOURCE_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: LinkSourceType; icon: string }> = [
  { label: 'External Site', value: 'external', icon: 'pi pi-globe' },
  { label: 'PDF File', value: 'pdf', icon: 'pi pi-file-pdf' },
  { label: 'YouTube Link', value: 'youtube', icon: 'pi pi-youtube' },
  { label: 'Google Drive', value: 'gdrive', icon: 'pi pi-google' },
] as const;

/** خريطة حالات الأمان مع الألوان والأيقونات */
export const STATUS_CONFIG: Readonly<Record<LinkStatus, { label: string; severity: string; icon: string }>> = {
  safe: { label: 'Safe', severity: 'success', icon: 'pi pi-check-circle' },
  suspicious: { label: 'Suspicious', severity: 'warn', icon: 'pi pi-exclamation-triangle' },
  pending: { label: 'Pending', severity: 'info', icon: 'pi pi-spin pi-spinner' },
  error: { label: 'Error', severity: 'danger', icon: 'pi pi-times-circle' },
} as const;

/** إنشاء معرف فريد */
export function generateLinkId(): string {
  return crypto.randomUUID();
}
