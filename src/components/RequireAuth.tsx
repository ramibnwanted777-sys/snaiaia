import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  if (user?.isBanned) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-7 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            تم توقيف هذا الحساب
          </h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            تم توقيف حسابك من قبل إدارة المنصة لمخالفة بنود وشروط الاستخدام.
          </p>
          {user.banReason && (
            <div className="mt-4 rounded-md border border-destructive/20 bg-background/80 p-3 text-start">
              <p className="text-[11px] font-medium text-destructive">سبب التوقيف:</p>
              <p className="mt-1 text-xs text-foreground">{user.banReason}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/terms"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-xs font-medium text-foreground hover:bg-secondary"
            >
              الاطلاع على بنود وقوانين التطبيق
            </a>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex h-9 items-center justify-center rounded-md text-xs text-muted-foreground hover:text-foreground"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
