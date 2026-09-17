/**
 * دوال داخلية (غير متاحة للعميل) لتخزين بيانات دخول الإدارة والجلسات.
 * تُستدعى فقط من دوال adminAuth.ts التي تشتغل على بيئة Node.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/** قراءة حساب الإدارة (الأول) أو البحث باسم المستخدم */
export const credentials = internalQuery({
  args: { username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.username === undefined) {
      return await ctx.db.query("adminAuth").first();
    }
    return await ctx.db
      .query("adminAuth")
      .withIndex("by_username", (q) => q.eq("username", args.username as string))
      .first();
  },
});

export const createCredentials = internalMutation({
  args: {
    username: v.string(),
    salt: v.string(),
    passwordHash: v.string(),
    mustChangePassword: v.optional(v.boolean()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminAuth").first();
    if (existing) return null;
    return await ctx.db.insert("adminAuth", { ...args, updatedAt: args.createdAt });
  },
});

export const updateCredentials = internalMutation({
  args: {
    id: v.id("adminAuth"),
    username: v.string(),
    salt: v.string(),
    passwordHash: v.string(),
    mustChangePassword: v.optional(v.boolean()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      username: args.username,
      salt: args.salt,
      passwordHash: args.passwordHash,
      mustChangePassword: args.mustChangePassword ?? false,
      updatedAt: args.updatedAt,
    });
  },
});

export const session = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const createSession = internalMutation({
  args: {
    token: v.string(),
    username: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("adminSessions").collect();
    for (const item of all) {
      if (item.expiresAt < args.createdAt) await ctx.db.delete(item._id);
    }
    await ctx.db.insert("adminSessions", args);
  },
});

export const deleteSession = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (record) await ctx.db.delete(record._id);
  },
});

/** إبطال كل جلسات الإدارة (بعد إعادة تعيين بيانات الدخول مثلاً) */
export const deleteAllSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("adminSessions").collect();
    for (const item of all) await ctx.db.delete(item._id);
  },
});

export const renameSession = internalMutation({
  args: { token: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (record) await ctx.db.patch(record._id, { username: args.username });
  },
});
