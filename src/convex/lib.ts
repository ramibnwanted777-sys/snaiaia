import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { planById, resolveCoords, SPECIALTIES, WILAYA_NAMES } from "./data";

type Ctx = QueryCtx | MutationCtx;

export const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** أرقام الهاتف الجزائرية: نقبل الصيغ المحلية والدولية ونوحّدها إلى 0XXXXXXXXX */
export function normalizePhone(raw: string): string {
  const trimmed = raw.replace(/[^\d+]/g, "");
  if (trimmed.startsWith("+213")) return `0${trimmed.slice(4)}`;
  if (trimmed.startsWith("00213")) return `0${trimmed.slice(5)}`;
  if (trimmed.startsWith("213") && trimmed.length >= 12) return `0${trimmed.slice(3)}`;
  return trimmed;
}

export function isValidPhone(raw: string): boolean {
  return /^0[5-7]\d{8}$/.test(normalizePhone(raw));
}

export function assertValidRegistration(input: {
  fullName: string;
  phone: string;
  specialty: string;
  wilaya: string;
  commune: string;
}) {
  if (input.fullName.trim().length < 3) {
    throw new Error("الاسم الكامل مطلوب (3 أحرف على الأقل).");
  }
  if (!isValidPhone(input.phone)) {
    throw new Error("رقم هاتف جزائري غير صحيح (مثال: 0551234567).");
  }
  if (!SPECIALTIES.includes(input.specialty as (typeof SPECIALTIES)[number])) {
    throw new Error("التخصص المختار غير معروف.");
  }
  if (!WILAYA_NAMES.includes(input.wilaya)) {
    throw new Error("الولاية المختارة غير معروفة.");
  }
  if (input.commune.trim().length < 2) {
    throw new Error("الحي أو البلدية مطلوبة.");
  }
}

export function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function subscriptionIsActive(artisan: Doc<"artisans">, now = Date.now()) {
  return (
    artisan.subscriptionStatus === "active" &&
    typeof artisan.subscriptionExpiresAt === "number" &&
    artisan.subscriptionExpiresAt > now
  );
}

/** التحقق مما إذا كان الحرفي موقوفاً يدوياً أو تلقائياً فور انتهاء مدة الباقة */
export function isArtisanSuspendedOrExpired(artisan: Doc<"artisans">, now = Date.now()) {
  if (artisan.suspended) return true;
  if (artisan.autoSuspended) return true;
  if (artisan.subscriptionStatus === "expired") return true;
  // توقيف تلقائي فور انتهاء مدة الباقة
  if (typeof artisan.subscriptionExpiresAt === "number" && artisan.subscriptionExpiresAt <= now) {
    return true;
  }
  return false;
}

/** الباقة المميزة أو السنوية: تمنح الترتيب الأول والشارة */
export function isPremium(artisan: Doc<"artisans">, now = Date.now()) {
  return subscriptionIsActive(artisan, now) && planById(artisan.planId)?.premium === true;
}

export function ratingOf(artisan: Doc<"artisans">) {
  return artisan.ratingCount > 0 ? artisan.ratingSum / artisan.ratingCount : 0;
}

export async function storageUrl(ctx: Ctx, id?: Id<"_storage"> | null) {
  if (!id) return null;
  return await ctx.storage.getUrl(id);
}

/** بطاقة مختصرة تُعرض في نتائج البحث */
export async function buildCard(ctx: Ctx, artisan: Doc<"artisans">, now = Date.now()) {
  const plan = planById(artisan.planId);
  const active = subscriptionIsActive(artisan, now);
  return {
    _id: artisan._id,
    fullName: artisan.fullName,
    specialty: artisan.specialty,
    wilaya: artisan.wilaya,
    commune: artisan.commune,
    phone: artisan.phone,
    bio: artisan.bio ?? null,
    photoUrl: await storageUrl(ctx, artisan.photoId),
    rating: ratingOf(artisan),
    ratingCount: artisan.ratingCount,
    isPremium: active && plan?.premium === true,
    planName: active && plan ? plan.name : null,
    worksCount: artisan.works?.length ?? 0,
    lat: resolveCoords(artisan.wilaya, artisan.lat, artisan.lng)[0],
    lng: resolveCoords(artisan.wilaya, artisan.lat, artisan.lng)[1],
    hasExactLocation:
      typeof artisan.lat === "number" && typeof artisan.lng === "number",
    createdAt: artisan.createdAt,
  };
}

/** ترتيب النتائج: المميزون أولاً، ثم الأعلى تقييماً، ثم الأكثر عدداً للتقييمات */
export function sortCards<T extends { isPremium: boolean; rating: number; ratingCount: number; createdAt: number }>(
  cards: T[],
): T[] {
  return cards.sort(
    (a, b) =>
      Number(b.isPremium) - Number(a.isPremium) ||
      b.rating - a.rating ||
      b.ratingCount - a.ratingCount ||
      b.createdAt - a.createdAt,
  );
}

/** إعادة حساب مجاميع التقييمات المخزّنة على ملف الحرفي */
export async function recomputeRating(ctx: MutationCtx, artisanId: Id<"artisans">) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_artisan", (q) => q.eq("artisanId", artisanId))
    .collect();
  const visible = reviews.filter((r) => !r.hidden);
  await ctx.db.patch(artisanId, {
    ratingSum: visible.reduce((sum, r) => sum + r.rating, 0),
    ratingCount: visible.length,
  });
}

/**
 * لا يُسمح بإجراءات الإدارة إلا بجلسة إدارة صالحة
 * (رمز يأتي من تسجيل الدخول باسم المستخدم وكلمة المرور).
 */
export async function requireAdmin(ctx: Ctx, token?: string) {
  if (!token) throw new Error("جلسة الإدارة غير صالحة، سجّل الدخول من جديد.");
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("انتهت جلسة الإدارة، سجّل الدخول من جديد.");
  }
  return session;
}

