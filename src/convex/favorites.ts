import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buildCard } from "./lib";

/** حفظ / إزالة حرفي من مفضلة الزبون المسجّل */
export const toggle = mutation({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("سجّل الدخول لحفظ الحرفيين في المفضلة.");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_artisan", (q) =>
        q.eq("userId", userId).eq("artisanId", args.artisanId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    const artisan = await ctx.db.get(args.artisanId);
    if (!artisan) throw new Error("ملف الحرفي غير موجود.");

    await ctx.db.insert("favorites", {
      userId,
      artisanId: args.artisanId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

/** حالة الحفظ لحرفي واحد (null يعني زائر غير مسجّل) */
export const isSaved = query({
  args: { artisanId: v.id("artisans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_artisan", (q) =>
        q.eq("userId", userId).eq("artisanId", args.artisanId),
      )
      .first();
    return Boolean(existing);
  },
});

/** قائمة المفضلة عند الزبون */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const saved = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const cards = await Promise.all(
      saved
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (item) => {
          const artisan = await ctx.db.get(item.artisanId);
          if (!artisan) return null;
          return { ...(await buildCard(ctx, artisan, now)), savedAt: item.createdAt };
        }),
    );

    return cards.filter((card): card is NonNullable<typeof card> => card !== null);
  },
});
