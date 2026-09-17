import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizePhone, recomputeRating, storageUrl } from "./lib";

/* -------------------------------------------------------------------------- */
/*  تقييمات الزبائن                                                           */
/* -------------------------------------------------------------------------- */

export const listByArtisan = query({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId))
      .collect();

    const visible = reviews
      .filter((r) => !r.hidden)
      .sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      visible.map(async (r) => ({
        _id: r._id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment ?? null,
        beforeUrl: await storageUrl(ctx, r.beforeId),
        afterUrl: await storageUrl(ctx, r.afterId),
        createdAt: r.createdAt,
      })),
    );
  },
});

export const create = mutation({
  args: {
    artisanId: v.id("artisans"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    rating: v.number(),
    comment: v.optional(v.string()),
    beforeId: v.optional(v.id("_storage")),
    afterId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const artisan = await ctx.db.get(args.artisanId);
    if (!artisan || artisan.status !== "approved") {
      throw new Error("ملف الحرفي غير متاح للتقييم.");
    }
    if (args.customerName.trim().length < 2) throw new Error("الاسم مطلوب.");
    if (args.rating < 1 || args.rating > 5) throw new Error("التقييم يجب أن يكون بين 1 و 5 نجوم.");

    const comment = args.comment?.trim() ?? "";
    if (comment.length > 600) throw new Error("التعليق طويل جداً (600 حرف كحد أقصى).");

    const userId = (await getAuthUserId(ctx)) ?? undefined;

    const reviewId = await ctx.db.insert("reviews", {
      artisanId: args.artisanId,
      userId,
      customerName: args.customerName.trim(),
      customerPhone: args.customerPhone ? normalizePhone(args.customerPhone) : undefined,
      rating: Math.round(args.rating),
      comment: comment || undefined,
      beforeId: args.beforeId,
      afterId: args.afterId,
      hidden: false,
      createdAt: Date.now(),
    });

    await recomputeRating(ctx, args.artisanId);
    return reviewId;
  },
});

/** تقييمات الزبون المسجّل في حسابه */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const sorted = rows.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      sorted.map(async (review) => {
        const artisan = await ctx.db.get(review.artisanId);
        return {
          _id: review._id,
          artisanId: review.artisanId,
          artisanName: artisan?.fullName ?? "—",
          specialty: artisan?.specialty ?? "",
          location: artisan ? `${artisan.commune}، ${artisan.wilaya}` : "",
          artisanPublished: Boolean(
            artisan && artisan.status === "approved" && !artisan.suspended,
          ),
          rating: review.rating,
          comment: review.comment ?? null,
          hidden: review.hidden,
          createdAt: review.createdAt,
        };
      }),
    );
  },
});

/** هل سبق للحساب الحالي تقييم هذا الحرفي؟ (لتجنّب التكرار) */
export const myReviewFor = query({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("artisanId"), args.artisanId))
      .first();
    if (!review) return null;
    return {
      _id: review._id,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: review.createdAt,
      hidden: review.hidden,
    };
  },
});

