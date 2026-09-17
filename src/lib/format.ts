/** أدوات تنسيق عربية مشتركة (أرقام، أسعار، تواريخ، أحرف أولى) */

/**
 * فاصل آلاف غير قابل للكسر (NBSP).
 * المسافة العادية داخل الأرقام تُقلَب في الواجهة العربية فلا يظهر
 * «24 000» بل «000 24» — هذا الفاصل يبقي الأرقام كتلة واحدة باتجاه لاتيني.
 */
export const NUMBER_GROUP_SEPARATOR = "\u00A0";

export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NUMBER_GROUP_SEPARATOR);
}

export function formatDZD(value: number): string {
  return `${formatNumber(value)} دج`;
}

export function formatRating(value: number): string {
  if (!value) return "—";
  return value.toFixed(1);
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ar-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ts));
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat("ar-DZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.round(days / 30);
  if (months < 12) return `قبل ${months} شهر`;
  return `قبل ${Math.round(months / 12)} سنة`;
}

/** الأحرف الأولى من الاسم — تُستعمل في الصورة البديلة */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0)).join("");
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) {
    const sep = NUMBER_GROUP_SEPARATOR;
    return `${digits.slice(0, 4)}${sep}${digits.slice(4, 6)}${sep}${digits.slice(
      6,
      8,
    )}${sep}${digits.slice(8)}`;
  }
  return phone;
}

/** صياغة عدد التقييمات بالعربية */
export function reviewCountLabel(count: number): string {
  if (count === 0) return "لا توجد تقييمات";
  if (count === 1) return "تقييم واحد";
  if (count === 2) return "تقييمان";
  if (count <= 10) return `${count} تقييمات`;
  return `${formatNumber(count)} تقييماً`;
}

export const STORAGE_KEY_ARTISAN = "dalil.artisanId";
export const STORAGE_KEY_PHONE = "dalil.artisanPhone";
