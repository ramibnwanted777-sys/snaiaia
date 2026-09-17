import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

/** نوع الحساب المختار عند تسجيل الدخول: زبون أو حرفي */
export const accountTypeValidator = v.union(
  v.literal("customer"),
  v.literal("artisan"),
);
export type AccountType = Infer<typeof accountTypeValidator>;

/** حالة ملف الحرفي عند الإدارة */
export const artisanStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);
export type ArtisanStatus = Infer<typeof artisanStatusValidator>;

/** حالة اشتراك الحرفي */
export const subscriptionStatusValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("active"),
  v.literal("expired"),
);
export type SubscriptionStatus = Infer<
  typeof subscriptionStatusValidator
>;

/** حالة طلب تأكيد الدفع */
export const requestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);
export type RequestStatus = Infer<typeof requestStatusValidator>;

/** صورة عمل سابق: قبل / بعد */
export const workValidator = v.object({
  caption: v.optional(v.string()),
  beforeId: v.optional(v.id("_storage")),
  afterId: v.optional(v.id("_storage")),
});

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      /** نوع الحساب المختار في صفحة الدخول: زبون أو حرفي */
      accountType: v.optional(accountTypeValidator),
      isBanned: v.optional(v.boolean()),
      banReason: v.optional(v.string()),
      bannedAt: v.optional(v.number()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // الحرفيون المسجّلون في الدليل
    artisans: defineTable({
      fullName: v.string(),
      phone: v.string(),
      specialty: v.string(),
      wilaya: v.string(),
      commune: v.string(),
      bio: v.optional(v.string()),
      yearsExperience: v.optional(v.number()),
      photoId: v.optional(v.id("_storage")),
      works: v.optional(v.array(workValidator)),

      /** إحداثيات موقع العمل (اختيارية) — بدونها يظهر الحرفي في مركز ولايته */
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),

      status: artisanStatusValidator,
      rejectionReason: v.optional(v.string()),
      suspended: v.optional(v.boolean()),
      autoSuspended: v.optional(v.boolean()),
      suspensionReason: v.optional(v.string()),

      planId: v.optional(v.string()),
      subscriptionStatus: subscriptionStatusValidator,
      subscriptionStartedAt: v.optional(v.number()),
      subscriptionExpiresAt: v.optional(v.number()),

      // مجاميع التقييمات محفوظة مسبقاً لترتيب النتائج بسرعة
      ratingSum: v.number(),
      ratingCount: v.number(),

      /** رمز قصير يعرض للحرفي بعد التسجيل لمتابعة ملفه */
      applicationCode: v.string(),
      /** الحساب المرتبط بهذا الملف (بعد ربط الحرفي لحسابه) */
      userId: v.optional(v.id("users")),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_phone", ["phone"])
      .index("by_wilaya", ["wilaya"])
      .index("by_user", ["userId"])
      .index("by_created", ["createdAt"]),

    // طلبات تفعيل الاشتراك بعد تحويل CCP
    subscriptionRequests: defineTable({
      artisanId: v.id("artisans"),
      planId: v.string(),
      amountDZD: v.number(),
      payerName: v.string(),
      ccpReference: v.string(),
      paidAt: v.optional(v.string()),
      receiptId: v.optional(v.id("_storage")),
      note: v.optional(v.string()),
      status: requestStatusValidator,
      /** اسم مستخدم الإدارة الذي راجع الطلب */
      reviewerName: v.optional(v.string()),
      reviewerNote: v.optional(v.string()),
      reviewedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_artisan", ["artisanId"])
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"]),

    // بيانات دخول لوحة الإدارة (بريد إلكتروني + كلمة مرور مُشفّرة)
    adminAuth: defineTable({
      username: v.string(),
      passwordHash: v.string(),
      salt: v.string(),
      /** يبقى صحيحاً بعد إعادة تعيين كلمة المرور حتى يغيّرها المدير */
      mustChangePassword: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_username", ["username"]),

    // جلسات دخول الإدارة
    adminSessions: defineTable({
      token: v.string(),
      username: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }).index("by_token", ["token"]),

    // تقييمات الزبائن بعد الخدمة
    reviews: defineTable({
      artisanId: v.id("artisans"),
      customerName: v.string(),
      customerPhone: v.optional(v.string()),
      rating: v.number(),
      comment: v.optional(v.string()),
      beforeId: v.optional(v.id("_storage")),
      afterId: v.optional(v.id("_storage")),
      hidden: v.boolean(),
      /** حساب الزبون الذي أضاف التقييم (إن كان مسجّل الدخول) */
      userId: v.optional(v.id("users")),
      createdAt: v.number(),
    })
      .index("by_artisan", ["artisanId"])
      .index("by_hidden", ["hidden"])
      .index("by_user", ["userId"])
      .index("by_created", ["createdAt"]),

    // الحرفيون المفضلون عند الزبون
    favorites: defineTable({
      userId: v.id("users"),
      artisanId: v.id("artisans"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_artisan", ["userId", "artisanId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
