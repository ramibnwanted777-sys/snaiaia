import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { PAYMENT_NOTE, planById, resolveCoords, SPECIALTIES, WILAYAS } from "./data";
import {
  assertValidRegistration,
  buildCard,
  isArtisanSuspendedOrExpired,
  isPremium,
  normalizePhone,
  randomCode,
  ratingOf,
  sortCards,
  storageUrl,
  subscriptionIsActive,
} from "./lib";
import { workValidator } from "./schema";

/* -------------------------------------------------------------------------- */
/*  إحصائيات عامة (تظهر في الصفحة الرئيسية)                                    */
/* -------------------------------------------------------------------------- */

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const artisans = await ctx.db
      .query("artisans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const reviews = await ctx.db.query("reviews").withIndex("by_hidden", (q) => q.eq("hidden", false)).collect();

    const now = Date.now();
    return {
      artisans: artisans.filter((a) => !isArtisanSuspendedOrExpired(a, now)).length,
      wilayas: new Set(artisans.map((a) => a.wilaya)).size,
      reviews: reviews.length,
      specialties: SPECIALTIES.length,
    };
  },
});

/* -------------------------------------------------------------------------- */
/*  البحث للزبون (بدون تسجيل دخول)                                             */
/* -------------------------------------------------------------------------- */

export const search = query({
  args: {
    specialty: v.optional(v.string()),
    wilaya: v.optional(v.string()),
    commune: v.optional(v.string()),
    q: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const approved = await ctx.db
      .query("artisans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const term = args.q?.trim().toLowerCase() ?? "";
    const commune = args.commune?.trim().toLowerCase() ?? "";
    const now = Date.now();

    const filtered = approved.filter((a) => {
      if (isArtisanSuspendedOrExpired(a, now)) return false;
      if (args.specialty && a.specialty !== args.specialty) return false;
      if (args.wilaya && a.wilaya !== args.wilaya) return false;
      if (commune && !a.commune.toLowerCase().includes(commune)) return false;
      if (term) {
        const haystack = `${a.fullName} ${a.specialty} ${a.wilaya} ${a.commune} ${a.bio ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    const cards = await Promise.all(filtered.map((a) => buildCard(ctx, a, now)));
    const sorted = sortCards(cards);
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/* -------------------------------------------------------------------------- */
/*  ملف الحرفي العام                                                           */
/* -------------------------------------------------------------------------- */

export const profile = query({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const artisan = await ctx.db.get(args.artisanId);
    const now = Date.now();
    if (!artisan || artisan.status !== "approved" || isArtisanSuspendedOrExpired(artisan, now)) return null;

    const plan = planById(artisan.planId);
    const works = await Promise.all(
      (artisan.works ?? []).map(async (work) => ({
        caption: work.caption ?? null,
        beforeUrl: await storageUrl(ctx, work.beforeId),
        afterUrl: await storageUrl(ctx, work.afterId),
      })),
    );

    return {
      _id: artisan._id,
      fullName: artisan.fullName,
      specialty: artisan.specialty,
      wilaya: artisan.wilaya,
      commune: artisan.commune,
      phone: artisan.phone,
      bio: artisan.bio ?? null,
      yearsExperience: artisan.yearsExperience ?? null,
      photoUrl: await storageUrl(ctx, artisan.photoId),
      works,
      rating: ratingOf(artisan),
      ratingCount: artisan.ratingCount,
      isPremium: isPremium(artisan, now),
      planName: subscriptionIsActive(artisan, now) && plan ? plan.name : null,
      lat: resolveCoords(artisan.wilaya, artisan.lat, artisan.lng)[0],
      lng: resolveCoords(artisan.wilaya, artisan.lat, artisan.lng)[1],
      memberSince: artisan.createdAt,
    };
  },
});

/* -------------------------------------------------------------------------- */
/*  نقاط الخريطة: الحرفيون المعتمدون مع إحداثياتهم                             */
/* -------------------------------------------------------------------------- */

export const mapPoints = query({
  args: {
    specialty: v.optional(v.string()),
    wilaya: v.optional(v.string()),
    commune: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approved = await ctx.db
      .query("artisans")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const term = args.q?.trim().toLowerCase() ?? "";
    const commune = args.commune?.trim().toLowerCase() ?? "";
    const now = Date.now();

    return approved
      .filter((a) => {
        if (isArtisanSuspendedOrExpired(a, now)) return false;
        if (args.specialty && a.specialty !== args.specialty) return false;
        if (args.wilaya && a.wilaya !== args.wilaya) return false;
        if (commune && !a.commune.toLowerCase().includes(commune)) return false;
        if (term) {
          const haystack =
            `${a.fullName} ${a.specialty} ${a.wilaya} ${a.commune} ${a.bio ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .map((a) => {
        const [lat, lng] = resolveCoords(a.wilaya, a.lat, a.lng);
        return {
          _id: a._id,
          fullName: a.fullName,
          specialty: a.specialty,
          wilaya: a.wilaya,
          commune: a.commune,
          phone: a.phone,
          rating: ratingOf(a),
          ratingCount: a.ratingCount,
          isPremium: isPremium(a, now),
          lat,
          lng,
        };
      });
  },
});

/* -------------------------------------------------------------------------- */
/*  تسجيل حرفي جديد                                                            */
/* -------------------------------------------------------------------------- */

export const register = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    specialty: v.string(),
    wilaya: v.string(),
    commune: v.string(),
    bio: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
    photoId: v.optional(v.id("_storage")),
    works: v.optional(v.array(workValidator)),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertValidRegistration(args);
    const phone = normalizePhone(args.phone);
    // إن كان الحرفي مسجّل الدخول، يُربط الملف بحسابه تلقائياً
    const userId = (await getAuthUserId(ctx)) ?? undefined;

    const existing = await ctx.db
      .query("artisans")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (existing) {
      throw new Error(
        "رقم الهاتف مسجّل مسبقاً. استعمل صفحة «حالتي» لمتابعة ملفك أو تجديد اشتراكك.",
      );
    }

    const artisanId = await ctx.db.insert("artisans", {
      fullName: args.fullName.trim(),
      phone,
      specialty: args.specialty,
      wilaya: args.wilaya,
      commune: args.commune.trim(),
      bio: args.bio?.trim() || undefined,
      yearsExperience: args.yearsExperience,
      photoId: args.photoId,
      works: args.works ?? [],
      lat: args.lat,
      lng: args.lng,
      status: "pending",
      planId: undefined,
      subscriptionStatus: "none",
      ratingSum: 0,
      ratingCount: 0,
      applicationCode: randomCode(),
      userId,
      createdAt: Date.now(),
    });

    return { artisanId, applicationCode: (await ctx.db.get(artisanId))!.applicationCode };
  },
});

/* -------------------------------------------------------------------------- */
/*  طلب تفعيل الاشتراك بعد تحويل CCP                                           */
/* -------------------------------------------------------------------------- */

export const submitSubscription = mutation({
  args: {
    artisanId: v.id("artisans"),
    planId: v.string(),
    payerName: v.string(),
    ccpReference: v.string(),
    paidAt: v.optional(v.string()),
    receiptId: v.optional(v.id("_storage")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const artisan = await ctx.db.get(args.artisanId);
    if (!artisan) throw new Error("ملف الحرفي غير موجود.");

    const plan = planById(args.planId);
    if (!plan) throw new Error("الباقة المختارة غير معروفة.");
    if (args.payerName.trim().length < 3) throw new Error("اسم الدافع مطلوب.");
    if (args.ccpReference.trim().length < 3) {
      throw new Error("رقم الوصل أو مرجع التحويل مطلوب.");
    }

    const pending = await ctx.db
      .query("subscriptionRequests")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId))
      .collect();
    if (pending.some((r) => r.status === "pending")) {
      throw new Error("لديك طلب قيد المراجعة بالفعل. انتظر تأكيد الإدارة.");
    }

    const requestId = await ctx.db.insert("subscriptionRequests", {
      artisanId: args.artisanId,
      planId: plan.id,
      amountDZD: plan.priceDZD,
      payerName: args.payerName.trim(),
      ccpReference: args.ccpReference.trim(),
      paidAt: args.paidAt?.trim() || undefined,
      receiptId: args.receiptId,
      note: args.note?.trim() || undefined,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.artisanId, {
      planId: plan.id,
      subscriptionStatus: "pending",
    });

    return { requestId, note: PAYMENT_NOTE };
  },
});

/* -------------------------------------------------------------------------- */
/*  متابعة الحرفي لملفه (بالهاتف أو بالمعرّف)                                  */
/* -------------------------------------------------------------------------- */

async function workspacePayload(ctx: QueryCtx, artisan: Doc<"artisans">) {
  const now = Date.now();
  const plan = planById(artisan.planId);

  const requests = await ctx.db
    .query("subscriptionRequests")
    .withIndex("by_artisan", (q) => q.eq("artisanId", artisan._id))
    .collect();

  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_artisan", (q) => q.eq("artisanId", artisan._id))
    .collect();

  return {
    artisan: {
      _id: artisan._id,
      fullName: artisan.fullName,
      phone: artisan.phone,
      specialty: artisan.specialty,
      wilaya: artisan.wilaya,
      commune: artisan.commune,
      bio: artisan.bio ?? null,
      yearsExperience: artisan.yearsExperience ?? null,
      photoUrl: await storageUrl(ctx, artisan.photoId),
      status: artisan.status,
      rejectionReason: artisan.rejectionReason ?? null,
      suspended: artisan.suspended === true,
      autoSuspended: isArtisanSuspendedOrExpired(artisan, now) && !artisan.suspended,
      isExpired: typeof artisan.subscriptionExpiresAt === "number" && artisan.subscriptionExpiresAt <= now,
      applicationCode: artisan.applicationCode,
      planId: artisan.planId ?? null,
      planName: plan?.name ?? null,
      subscriptionStatus: (typeof artisan.subscriptionExpiresAt === "number" && artisan.subscriptionExpiresAt <= now) ? "expired" : artisan.subscriptionStatus,
      isActive: subscriptionIsActive(artisan, now),
      subscriptionStartedAt: artisan.subscriptionStartedAt ?? null,
      subscriptionExpiresAt: artisan.subscriptionExpiresAt ?? null,
      rating: ratingOf(artisan),
      ratingCount: artisan.ratingCount,
      createdAt: artisan.createdAt,
    },
    requests: requests
      .map((r) => ({
        _id: r._id,
        planId: r.planId,
        planName: planById(r.planId)?.name ?? r.planId,
        amountDZD: r.amountDZD,
        payerName: r.payerName,
        ccpReference: r.ccpReference,
        status: r.status,
        reviewerNote: r.reviewerNote ?? null,
        hasReceipt: Boolean(r.receiptId),
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt ?? null,
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
    stats: {
      reviews: reviews.filter((r) => !r.hidden).length,
      pendingReviews: reviews.filter((r) => r.hidden).length,
    },
  };
}

/** ملف الحرفي المرتبط بحساب مسجّل الدخول (صفحة «حساب الحرفي») */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const artisan = await ctx.db
      .query("artisans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!artisan) return null;
    return await workspacePayload(ctx, artisan);
  },
});

/** ربط ملف حرفي مسجّل مسبقاً بحساب الحرفي (يتطلب رقم الهاتف ورمز المتابعة) */
export const linkProfile = mutation({
  args: { phone: v.string(), applicationCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("سجّل الدخول أولاً لربط ملفك.");

    const phone = normalizePhone(args.phone);
    const artisan = await ctx.db
      .query("artisans")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!artisan) {
      throw new Error("لا يوجد ملف حرفي بهذا الرقم. تأكد من الرقم أو سجّل ملفاً جديداً.");
    }
    if (artisan.applicationCode.toUpperCase() !== args.applicationCode.trim().toUpperCase()) {
      throw new Error("رمز المتابعة غير صحيح.");
    }
    if (artisan.userId && artisan.userId !== userId) {
      throw new Error("هذا الملف مرتبط بحساب آخر بالفعل. تواصل مع الإدارة.");
    }

    await ctx.db.patch(artisan._id, { userId });
    return { artisanId: artisan._id };
  },
});

/** السماح للحرفي بتعديل ملفه الشخصي */
export const selfUpdate = mutation({
  args: {
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    specialty: v.optional(v.string()),
    wilaya: v.optional(v.string()),
    commune: v.optional(v.string()),
    bio: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("سجّل الدخول أولاً.");

    const artisan = await ctx.db
      .query("artisans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!artisan) throw new Error("لا يوجد ملف حرفي مرتبط بحسابك.");

    const patch: Record<string, unknown> = {};
    if (args.fullName !== undefined) patch.fullName = args.fullName.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.specialty !== undefined) patch.specialty = args.specialty.trim();
    if (args.wilaya !== undefined) patch.wilaya = args.wilaya.trim();
    if (args.commune !== undefined) patch.commune = args.commune.trim();
    if (args.bio !== undefined) patch.bio = args.bio.trim();
    if (args.yearsExperience !== undefined) patch.yearsExperience = args.yearsExperience;
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(artisan._id, patch);
  },
});

export const statusByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    if (phone.length < 6) return null;
    const artisan = await ctx.db
      .query("artisans")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (!artisan) return null;
    return await workspacePayload(ctx, artisan);
  },
});

export const workspace = query({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const artisan = await ctx.db.get(args.artisanId);
    if (!artisan) return null;
    return await workspacePayload(ctx, artisan);
  },
});

/* -------------------------------------------------------------------------- */
/*  قوائم مرجعية للاستمارات                                                    */
/* -------------------------------------------------------------------------- */

export const reference = query({
  args: {},
  handler: async () => ({
    specialties: [...SPECIALTIES],
    wilayas: WILAYAS.map((w) => ({ name: w.name, code: w.code, communes: w.communes })),
  }),
});
