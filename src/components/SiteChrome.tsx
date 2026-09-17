import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { InstallButton } from "@/components/InstallButton";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search as SearchIcon,
  UserPlus,
  ClipboardList,
  LogIn,
  LayoutDashboard,
  Star,
  Settings,
  Shield,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

const NAV = [
  { to: "/search", label: "البحث عن حرفي" },
  { to: "/#pricing", label: "الباقات" },
  { to: "/join", label: "انضم كحرفي" },
  { to: "/terms", label: "القوانين والبنود" },
];

export function SiteHeader() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const isArtisan = user?.accountType === "artisan";
  const accountHome = isArtisan ? "/my" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="دليل الصنايعية" className="h-8 w-8 md:h-9 md:w-9" />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">دليل الصنايعية</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                صنعة موثوقة في حيّك
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => {
              const [path] = item.to.split("#");
              const active = pathname === path;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "text-xs md:text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* أزرار الشريط العلوي - قياسات موحدة ودقيقة */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {!isLoading && isAuthenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 sm:px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Link to="/settings" className="flex items-center gap-1.5">
                  <Settings className="size-3.5" />
                  <span className="hidden sm:inline">الإعدادات</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 sm:px-3.5 text-xs font-medium"
              >
                <Link to={accountHome} className="flex items-center gap-1.5">
                  <LayoutDashboard className="size-3.5" />
                  {isArtisan ? "مساحة الحرفي" : "حسابي"}
                </Link>
              </Button>

              {!isArtisan ? (
                <Button
                  asChild
                  size="sm"
                  className="h-9 px-3.5 sm:px-4 text-xs font-medium gap-1.5 shadow-none"
                >
                  <Link to="/search">
                    <Search className="size-3.5" />
                    <span>البحث عن حرفي</span>
                  </Link>
                </Button>
              ) : null}
            </>
          ) : !isLoading ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 sm:px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Link to="/login" className="flex items-center gap-1.5">
                  <LogIn className="size-3.5" />
                  <span>دخول</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 sm:px-3.5 text-xs font-medium gap-1.5"
              >
                <Link to="/join">
                  <UserPlus className="size-3.5" />
                  <span className="hidden xs:inline">سجّل كحرفي</span>
                  <span className="xs:hidden">حرفي</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 sm:px-4 text-xs font-medium gap-1.5 shadow-none"
              >
                <Link to="/search">
                  <Search className="size-3.5" />
                  <span>ابحث عن حرفي</span>
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { isAuthenticated, user } = useAuth();
  const accountHome = user?.accountType === "artisan" ? "/my" : "/dashboard";

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="دليل الصنايعية" className="h-8 w-8" />
            <span className="text-sm font-semibold">دليل الصنايعية</span>
          </div>
          <p className="mt-4 max-w-sm text-xs leading-6 text-muted-foreground">
            دليل جزائري يربط الحرفيين بالزبائن في نفس الحي. البحث مجاني للزبائن، والانضمام
            متاح لكل حرفي بعد التحقق من هويته.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">للزبائن</p>
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">
            البحث عن حرفي
          </Link>
          {isAuthenticated ? (
            <Link
              to={accountHome}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              حسابي
            </Link>
          ) : (
            <Link
              to="/login?role=customer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              دخول / إنشاء حساب زبون
            </Link>
          )}
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            المفضلة وتقييماتي
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">للحرفيين</p>
          <Link to="/join" className="text-sm text-muted-foreground hover:text-foreground">
            تسجيل حرفي جديد
          </Link>
          {isAuthenticated ? (
            <Link to={accountHome} className="text-sm text-muted-foreground hover:text-foreground">
              حسابي
            </Link>
          ) : (
            <Link
              to="/login?role=artisan"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              دخول / إنشاء حساب حرفي
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">عن المنصة</p>
          <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            قوانين وبنود الاستخدام
          </Link>
          <Link to="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">
            باقات الاشتراك
          </Link>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            بوابة الإدارة
          </Link>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} دليل الصنايعية — الجزائر</span>
            <Link to="/terms" className="text-[11px] text-muted-foreground underline hover:text-foreground">
              الشروط والقوانين
            </Link>
            <span className="text-[11px] text-muted-foreground">الدفع بالتحويل البريدي CCP · تأكيد يدوي من الإدارة</span>
          </div>
          <InstallButton size="sm" variant="ghost" showLabel />
        </div>
      </div>
    </footer>
  );
}

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { isLoading, isAuthenticated, user } = useAuth();
  const isArtisan = user?.accountType === "artisan";
  const isCustomer = user?.accountType === "customer";

  // Shown only when not logged in
  const loggedOutTabs = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/search", label: "بحث", icon: SearchIcon },
    { to: "/login?role=customer", label: "دخول الزبون", icon: LogIn },
    { to: "/login?role=artisan", label: "دخول الحرفي", icon: UserPlus },
  ];

  // Shown for customers
  const customerTabs = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/search", label: "بحث", icon: SearchIcon },
    { to: "/dashboard", label: "حسابي", icon: LayoutDashboard },
    { to: "/settings", label: "الإعدادات", icon: Settings },
  ];

  // Shown for artisans
  const artisanTabs = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/search", label: "بحث", icon: SearchIcon },
    { to: "/my", label: "ملفي", icon: UserPlus },
    { to: "/settings", label: "الإعدادات", icon: Settings },
  ];

  const tabs = !isLoading && isAuthenticated
    ? (isArtisan ? artisanTabs : customerTabs)
    : loggedOutTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {tabs.map((tab, i) => {
          // Deduplicate last two tabs if they point to same path
          if (i > 0 && tabs[i - 1].to === tab.to) return null;
          const active = pathname === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={`${tab.to}-${i}`}
              to={tab.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageShell({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "narrow";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main
        className={cn(
          "mx-auto w-full flex-1 px-5 pb-28 pt-10 md:px-8 md:pb-20",
          width === "narrow" ? "max-w-3xl" : "max-w-6xl",
          className,
        )}
      >
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
