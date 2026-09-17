import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { artisanStatusValidator, requestStatusValidator } from "./schema";
import { planById } from "./data";
import {
  recomputeRating,
  requireAdmin,
  storageUrl,
  subscriptionIsActive,
  THIRTY_DAYS,
} from "./lib";

/* -------------------------------------------------------------------------- */
/*  جلسة الإدارة                                                              */
/* -------------------------------------------------------------------------- */

/**
 * حالة حساب الإدارة: هل أُنشئ؟ ما بريده؟ وهل ما زال بكلمة مرور مُعاد تعيينها
 * (تُستعمل لشاشة الدخول وتنبيه تغيير كلمة المرور).
 */
export const authStatus = query({
  args: {},
  handler: async (ctx) => {
    const record = await ctx.db.query("adminAuth").first();
    return {
      configured: Boolean(record),
      username: record?.username ?? null,
      mustChangePassword: record?.mustChangePassword === true,
    };
  },
});

/** التحقق من صلاحية رمز الجلسة المخزّن في المتصفح */
export const session = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!record || record.expiresAt < Date.now()) {
      return { valid: false, username: null };
    }
    return { valid: true, username: record.username };
  },
});

/* -------------------------------------------------------------------------- */
/*  نظرة عامة                                                                 */
/* -------------------------------------------------------------------------- */

export const overview = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const artisans = await ctx.db.query("artisans").collect();
    const requests = await ctx.db.query("subscriptionRequests").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    const confirmed = requests.filter((r) => r.status === "approved");

    return {
      pendingApplications: artisans.filter((a) => a.status === "pending").length,
      approvedArtisans: artisans.filter((a) => a.status === "approved").length,
      pendingReceipts: requests.filter((r) => r.status === "pending").length,
      activeSubscriptions: artisans.filter((a) => subscriptionIsActive(a, now)).length,
      visibleReviews: reviews.filter((r) => !r.hidden).length,
      hiddenReviews: reviews.filter((r) => r.hidden).length,
      confirmedRevenueDZD: confirmed.reduce((sum, r) => sum + r.amountDZD, 0),
      totalUsers: users.length,
      bannedUsers: users.filter((u) => u.isBanned === true).length,
    };
  },
});

/* -------------------------------------------------------------------------- */
/*  1) مراجعة طلبات التسجيل                                                    */
/* -------------------------------------------------------------------------- */

export const applications = query({
  args: { adminToken: v.string(), status: v.optional(artisanStatusValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const artisans = await ctx.db.query("artisans").collect();
    const filtered = args.status ? artisans.filter((a) => a.status === args.status) : artisans;
    const now = Date.now();

    return await Promise.all(
      filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (a) => ({
          _id: a._id,
          fullName: a.fullName,
          phone: a.phone,
          specialty: a.specialty,
          wilaya: a.wilaya,
          commune: a.commune,
          bio: a.bio ?? null,
          yearsExperience: a.yearsExperience ?? null,
          photoUrl: await storageUrl(ctx, a.photoId),
          works: await Promise.all(
            (a.works ?? []).map(async (w) => ({
              caption: w.caption ?? null,
              beforeUrl: await storageUrl(ctx, w.beforeId),
              afterUrl: await storageUrl(ctx, w.afterId),
            })),
          ),
          status: a.status,
          rejectionReason: a.rejectionReason ?? null,
          suspended: a.suspended === true,
          applicationCode: a.applicationCode,
          planId: a.planId ?? null,
          planName: planById(a.planId)?.name ?? null,
          subscriptionStatus: a.subscriptionStatus,
          isActive: subscriptionIsActive(a, now),
          subscriptionExpiresAt: a.subscriptionExpiresAt ?? null,
          rating: a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0,
          ratingCount: a.ratingCount,
          lat: typeof a.lat === "number" ? a.lat : null,
          lng: typeof a.lng === "number" ? a.lng : null,
          createdAt: a.createdAt,
        })),
    );
  },
});

export const setApplicationStatus = mutation({
  args: {
    adminToken: v.string(),
    artisanId: v.id("artisans"),
    status: artisanStatusValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    if (args.status === "rejected" && !args.reason?.trim()) {
      throw new Error("سبب الرفض مطلوب ليظهر للحرفي.");
    }
    await ctx.db.patch(args.artisanId, {
      status: args.status,
      rejectionReason: args.status === "rejected" ? args.reason?.trim() : undefined,
    });
  },
});

export const setSuspended = mutation({
  args: {
    adminToken: v.string(),
    artisanId: v.id("artisans"),
    suspended: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.artisanId, {
      suspended: args.suspended,
      suspensionReason: args.suspended ? (args.reason?.trim() || "مخالفة بنود وقوانين الاستخدام") : undefined,
    });
  },
});

export const updateArtisan = mutation({
  args: {
    adminToken: v.string(),
    artisanId: v.id("artisans"),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    specialty: v.optional(v.string()),
    wilaya: v.optional(v.string()),
    commune: v.optional(v.string()),
    bio: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
    /** إحداثيات موقع العمل — لتثبيت الحرفي على الخريطة بدقة */
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const patch: Record<string, unknown> = {};
    if (args.fullName !== undefined) patch.fullName = args.fullName.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.specialty !== undefined) patch.specialty = args.specialty.trim();
    if (args.wilaya !== undefined) patch.wilaya = args.wilaya.trim();
    if (args.commune !== undefined) patch.commune = args.commune.trim();
    if (args.bio !== undefined) patch.bio = args.bio.trim();
    if (args.yearsExperience !== undefined) patch.yearsExperience = args.yearsExperience;
    if (args.lat !== undefined) patch.lat = args.lat;
    if (args.lng !== undefined) patch.lng = args.lng;
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(args.artisanId, patch);
  },
});

export const deleteArtisan = mutation({
  args: { adminToken: v.string(), artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId))
      .collect();
    for (const review of reviews) await ctx.db.delete(review._id);

    const requests = await ctx.db
      .query("subscriptionRequests")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId))
      .collect();
    for (const request of requests) await ctx.db.delete(request._id);

    await ctx.db.delete(args.artisanId);
  },
});

/* -------------------------------------------------------------------------- */
/*  2) تأكيد إيصالات الدفع CCP                                                 */
/* -------------------------------------------------------------------------- */

export const receipts = query({
  args: { adminToken: v.string(), status: v.optional(requestStatusValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const requests = await ctx.db.query("subscriptionRequests").collect();
    const filtered = args.status ? requests.filter((r) => r.status === args.status) : requests;

    return await Promise.all(
      filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (r) => {
          const artisan = await ctx.db.get(r.artisanId);
          return {
            _id: r._id,
            artisanId: r.artisanId,
            artisanName: artisan?.fullName ?? "—",
            artisanPhone: artisan?.phone ?? "—",
            artisanStatus: artisan?.status ?? "pending",
            location: artisan ? `${artisan.commune}، ${artisan.wilaya}` : "—",
            planId: r.planId,
            planName: planById(r.planId)?.name ?? r.planId,
            amountDZD: r.amountDZD,
            payerName: r.payerName,
            ccpReference: r.ccpReference,
            paidAt: r.paidAt ?? null,
            note: r.note ?? null,
            receiptUrl: await storageUrl(ctx, r.receiptId),
            status: r.status,
            reviewerNote: r.reviewerNote ?? null,
            createdAt: r.createdAt,
            reviewedAt: r.reviewedAt ?? null,
          };
        }),
    );
  },
});

export const reviewReceipt = mutation({
  args: {
    adminToken: v.string(),
    requestId: v.id("subscriptionRequests"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.adminToken);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("الطلب غير موجود.");
    if (request.status !== "pending") throw new Error("تمت معالجة هذا الطلب مسبقاً.");

    const artisan = await ctx.db.get(request.artisanId);
    if (!artisan) throw new Error("ملف الحرفي غير موجود.");

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.approve ? "approved" : "rejected",
      reviewerName: admin.username,
      reviewerNote: args.note?.trim() || undefined,
      reviewedAt: now,
    });

    if (args.approve) {
      const plan = planById(request.planId);
      const months = plan?.months ?? 1;
      await ctx.db.patch(request.artisanId, {
        planId: request.planId,
        subscriptionStatus: "active",
        subscriptionStartedAt: now,
        subscriptionExpiresAt: now + months * THIRTY_DAYS,
        // تأكيد الدفع يعني اعتماد الملف أيضاً إن لم يُعتمد بعد
        status: artisan.status === "pending" ? "approved" : artisan.status,
      });
      return { activatedUntil: now + months * THIRTY_DAYS };
    }

    const stillActive = subscriptionIsActive(artisan, now);
    await ctx.db.patch(request.artisanId, {
      subscriptionStatus: stillActive ? "active" : "none",
      planId: stillActive ? artisan.planId : undefined,
    });
    return { activatedUntil: null };
  },
});

/* -------------------------------------------------------------------------- */
/*  3) إدارة التقييمات                                                        */
/* -------------------------------------------------------------------------- */

export const reviews = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const all = await ctx.db.query("reviews").collect();
    return await Promise.all(
      all
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (r) => {
          const artisan = await ctx.db.get(r.artisanId);
          return {
            _id: r._id,
            artisanId: r.artisanId,
            artisanName: artisan?.fullName ?? "—",
            customerName: r.customerName,
            customerPhone: r.customerPhone ?? null,
            rating: r.rating,
            comment: r.comment ?? null,
            beforeUrl: await storageUrl(ctx, r.beforeId),
            afterUrl: await storageUrl(ctx, r.afterId),
            hidden: r.hidden,
            createdAt: r.createdAt,
          };
        }),
    );
  },
});

export const setReviewHidden = mutation({
  args: { adminToken: v.string(), reviewId: v.id("reviews"), hidden: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("التقييم غير موجود.");
    await ctx.db.patch(args.reviewId, { hidden: args.hidden });
    await recomputeRating(ctx, review.artisanId);
  },
});

export const deleteReview = mutation({
  args: { adminToken: v.string(), reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const review = await ctx.db.get(args.reviewId);
    if (!review) return;
    await ctx.db.delete(args.reviewId);
    await recomputeRating(ctx, review.artisanId);
  },
});

/* -------------------------------------------------------------------------- */
/*  4) إدارة حسابات المستخدمين (زبائن وحرفيين)                                */
/* -------------------------------------------------------------------------- */

export const usersList = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const users = await ctx.db.query("users").collect();
    const artisans = await ctx.db.query("artisans").collect();
    const reviews = await ctx.db.query("reviews").collect();

    return users.map((u) => {
      const linkedArtisan = artisans.find((a) => a.userId === u._id);
      const userReviews = reviews.filter((r) => r.userId === u._id);

      return {
        _id: u._id,
        name: u.name ?? (linkedArtisan ? linkedArtisan.fullName : "بدون اسم"),
        email: u.email ?? "—",
        accountType: u.accountType ?? (linkedArtisan ? "artisan" : "customer"),
        isBanned: u.isBanned === true,
        banReason: u.banReason ?? null,
        bannedAt: u.bannedAt ?? null,
        linkedArtisanId: linkedArtisan?._id ?? null,
        linkedArtisanName: linkedArtisan?.fullName ?? null,
        linkedArtisanPhone: linkedArtisan?.phone ?? null,
        reviewsCount: userReviews.length,
        createdAt: (u as unknown as { _creationTime?: number })._creationTime ?? Date.now(),
      };
    }).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const setUserBanned = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    banned: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود.");

    await ctx.db.patch(args.userId, {
      isBanned: args.banned,
      banReason: args.banned ? (args.reason?.trim() || "مخالفة بنود وقوانين الاستخدام") : undefined,
      bannedAt: args.banned ? Date.now() : undefined,
    });

    // إذا كان مرتبطاً بملف حرفي، يتم توقيف ملف الحرفي أيضاً تلقائياً لمنع ظهوره
    const linkedArtisans = await ctx.db
      .query("artisans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const a of linkedArtisans) {
      await ctx.db.patch(a._id, {
        suspended: args.banned,
        suspensionReason: args.banned
          ? (args.reason?.trim() || "تم توقيف الحساب المرتبط لمخالفة القوانين")
          : undefined,
      });
    }
  },
});

export const deleteUserAccount = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // حذف المفضلة
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const f of favs) {
      await ctx.db.delete(f._id);
    }

    // إيقاف وفك ارتباط أي ملف حرفي مرتبط
    const linkedArtisans = await ctx.db
      .query("artisans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const a of linkedArtisans) {
      await ctx.db.patch(a._id, {
        userId: undefined,
        suspended: true,
        suspensionReason: "تم غلق وحذف الحساب المرتبط من قبل الإدارة لمخالفة القوانين",
      });
    }

    // حذف الحساب نهائياً
    await ctx.db.delete(args.userId);
  },
});

