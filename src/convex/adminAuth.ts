"use node";

/**
 * دخول لوحة الإدارة ببريد إلكتروني وكلمة مرور.
 * كلمة المرور تُخزَّن مشفّرة (scrypt + salt) ولا تُحفظ كنص صريح أبداً.
 *
 * أول دخول ببريد المدير (ADMIN_DEFAULT_EMAIL) وبكلمة مرور من اختيارك ينشئ
 * حساب الإدارة. بعد ذلك يُتحقق دائماً من البيانات المخزّنة، ويمكن تغيير
 * البريد وكلمة المرور من زر «بيانات الدخول» داخل اللوحة.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { ADMIN_DEFAULT_EMAIL } from "./data";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 يوماً

interface SessionPayload {
  token: string;
  username: string;
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, expected: string) {
  const attempt = scryptSync(password, salt, 64);
  const stored = Buffer.from(expected, "hex");
  if (stored.length !== attempt.length) return false;
  return timingSafeEqual(attempt, stored);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** المُعرّف: بريد إلكتروني للعادة، أو اسم مستخدم قديم بلا فراغات */
function assertIdentifier(identifier: string) {
  if (identifier.length < 3 || /\s/.test(identifier)) {
    throw new Error("اكتب بريداً إلكترونياً صحيحاً (3 أحرف على الأقل بلا فراغات).");
  }
}

function assertPassword(password: string) {
  if (password.length < 6) {
    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  }
}

async function issueSession(ctx: ActionCtx, username: string): Promise<SessionPayload> {
  const now = Date.now();
  const token = randomBytes(32).toString("hex");
  await ctx.runMutation(internal.adminAuthData.createSession, {
    token,
    username,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return { token, username };
}

/**
 * تسجيل الدخول: أول دخول ببريد المدير يُنشئ الحساب بكلمة المرور المدخلة،
 * وبعد ذلك تُطابَق البيانات مع ما هو مخزّن.
 */
export const login = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<SessionPayload> => {
    const email = normalizeEmail(args.email);
    const record: Doc<"adminAuth"> | null = await ctx.runQuery(
      internal.adminAuthData.credentials,
      { username: email },
    );

    if (record) {
      if (!verifyPassword(args.password, record.salt, record.passwordHash)) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      }
      return await issueSession(ctx, record.username);
    }

    // لا يوجد حساب إدارة بعد — لا يُنشأ إلا ببريد المدير المعلن
    if (email !== ADMIN_DEFAULT_EMAIL) {
      throw new Error(
        `لا يوجد حساب إدارة بعد. ادخل ببريد المدير ${ADMIN_DEFAULT_EMAIL} واختر كلمة مرور من 6 أحرف على الأقل.`,
      );
    }
    assertPassword(args.password);

    const salt = randomBytes(16).toString("hex");
    const created = await ctx.runMutation(internal.adminAuthData.createCredentials, {
      username: email,
      salt,
      passwordHash: hashPassword(args.password, salt),
      createdAt: Date.now(),
    });
    if (!created) {
      throw new Error("أُنشئ حساب الإدارة للتو، أعد تسجيل الدخول.");
    }

    return await issueSession(ctx, email);
  },
});

export const logout = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await ctx.runMutation(internal.adminAuthData.deleteSession, { token: args.token });
    return { ok: true };
  },
});

/**
 * إعادة تعيين بيانات دخول الإدارة (لا تُستدعى من الواجهة — إجراء داخلية فقط).
 * للاستعمال عبر سطر الأوامر إن فُقدت كلمة المرور:
 * bunx convex run adminAuth:resetCredentials '{"email":"admin@dalil.dz","password":"..."}'
 */
export const resetCredentials = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ username: string }> => {
    const email = normalizeEmail(args.email);
    assertIdentifier(email);
    assertPassword(args.password);

    const record: Doc<"adminAuth"> | null = await ctx.runQuery(
      internal.adminAuthData.credentials,
      {},
    );
    const salt = randomBytes(16).toString("hex");
    const passwordHash = hashPassword(args.password, salt);

    if (record) {
      await ctx.runMutation(internal.adminAuthData.updateCredentials, {
        id: record._id,
        username: email,
        salt,
        passwordHash,
        mustChangePassword: true,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.runMutation(internal.adminAuthData.createCredentials, {
        username: email,
        salt,
        passwordHash,
        mustChangePassword: true,
        createdAt: Date.now(),
      });
    }

    // الجلسات القديمة تُبطَل بعد تغيير البيانات
    await ctx.runMutation(internal.adminAuthData.deleteAllSessions, {});

    return { username: email };
  },
});

/** تغيير البريد و/أو كلمة المرور بعد التحقق من كلمة المرور الحالية */
export const changeCredentials = action({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
    newEmail: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ username: string }> => {
    const session: Doc<"adminSessions"> | null = await ctx.runQuery(
      internal.adminAuthData.session,
      { token: args.token },
    );
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("انتهت الجلسة، سجّل الدخول من جديد.");
    }

    const record: Doc<"adminAuth"> | null = await ctx.runQuery(
      internal.adminAuthData.credentials,
      { username: session.username },
    );
    if (!record) throw new Error("حساب الإدارة غير موجود.");

    if (!verifyPassword(args.currentPassword, record.salt, record.passwordHash)) {
      throw new Error("كلمة المرور الحالية غير صحيحة.");
    }

    const email = args.newEmail ? normalizeEmail(args.newEmail) : record.username;
    assertIdentifier(email);
    assertPassword(args.newPassword);

    const salt = randomBytes(16).toString("hex");
    await ctx.runMutation(internal.adminAuthData.updateCredentials, {
      id: record._id,
      username: email,
      salt,
      passwordHash: hashPassword(args.newPassword, salt),
      mustChangePassword: false,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.adminAuthData.renameSession, {
      token: args.token,
      username: email,
    });

    return { username: email };
  },
});
