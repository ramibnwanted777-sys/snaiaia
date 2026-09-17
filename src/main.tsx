import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Search = lazy(() => import("./pages/Search.tsx"));
const ArtisanProfile = lazy(() => import("./pages/ArtisanProfile.tsx"));
const ReviewForm = lazy(() => import("./pages/ReviewForm.tsx"));
const ArtisanJoin = lazy(() => import("./pages/ArtisanJoin.tsx"));
const Subscribe = lazy(() => import("./pages/Subscribe.tsx"));
const MyStatus = lazy(() => import("./pages/MyStatus.tsx"));
const ArtisanAccount = lazy(() => import("./pages/ArtisanAccount.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getConvexUrl(): string {
  const raw = import.meta.env.VITE_CONVEX_URL;
  if (typeof raw === "string" && (raw.startsWith("http://") || raw.startsWith("https://"))) {
    return raw.trim();
  }
  // Safe absolute URL fallback to prevent "Provided address was not an absolute URL" crash
  return "https://placeholder.convex.cloud";
}

const convex = new ConvexReactClient(getConvexUrl());

function MissingEnvBanner() {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return sessionStorage.getItem("dismissed_env_banner") === "true";
    } catch {
      return false;
    }
  });

  const raw = import.meta.env.VITE_CONVEX_URL;
  const isConfigured = typeof raw === "string" && (raw.startsWith("http://") || raw.startsWith("https://"));
  if (isConfigured || dismissed) return null;

  return (
    <aside className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
      <div className="flex-1 text-center">
        ⚠️ تنبيه: لم يتم ضبط رابط قاعدة البيانات <code className="rounded bg-amber-500/20 px-1.5 py-0.5">VITE_CONVEX_URL</code> في إعدادات Vercel أو ملف <code className="rounded bg-amber-500/20 px-1.5 py-0.5">.env.local</code> بعد.
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem("dismissed_env_banner", "true");
          } catch {}
        }}
        className="ms-3 rounded px-2 py-0.5 font-bold hover:bg-amber-500/20 transition-colors"
        aria-label="إغلاق التنبيه"
        title="إغلاق التنبيه"
      >
        ✕
      </button>
    </aside>
  );
}

// تسجيل Service Worker لدعم PWA وعمل التطبيق بدون إنترنت
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <MissingEnvBanner />
        <BrowserRouter>
          <RouteSyncer />
          <ScrollToTop />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<Search />} />
              <Route path="/artisan/:artisanId" element={<ArtisanProfile />} />
              <Route path="/artisan/:artisanId/review" element={<ReviewForm />} />
              <Route path="/join" element={<ArtisanJoin />} />
              <Route path="/subscribe/:artisanId" element={<Subscribe />} />
              <Route path="/me" element={<MyStatus />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/rules" element={<Terms />} />
              {/* صفحة دخول واحدة للزبون والحرفي */}
              <Route path="/login" element={<AuthPage />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/my"
                element={
                  <RequireAuth>
                    <ArtisanAccount />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />
              {/* لوحة التحكم لها بوابة دخول خاصة */}
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
