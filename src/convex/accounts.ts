import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { accountTypeValidator } from "./schema";

/**
 * يحفظ نوع الحساب الذي اختاره المستخدم في صفحة الدخول (زبون أو حرفي).
 * يُستدعى مباشرة بعد نجاح التحقق من البريد، ويمكن تغييره لاحقاً بتسجيل الدخول
 * من النوع الآخر.
 */
export const setAccountType = mutation({
  args: { accountType: accountTypeValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("سجّل الدخول أولاً لاختيار نوع الحساب.");

    await ctx.db.patch(userId, { accountType: args.accountType });
    return args.accountType;
  },
});

/** تحديث الملف الشخصي للمستخدم (الاسم فقط للزبون) */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("سجّل الدخول أولاً.");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim() || undefined;
    if (Object.keys(patch).length === 0) return;
    await ctx.db.patch(userId, patch);
  },
});
