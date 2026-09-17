import {
  CopyRow,
  EmptyState,
  Field,
  Kicker,
  LoadingBlock,
  Monogram,
  NativeSelect,
  Stars,
  StatusChip,
} from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ADMIN_DEFAULT_EMAIL, ARTISAN_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/convex/data";
import { cleanError } from "@/lib/errors";
import { formatDate, formatDateTime, formatDZD, formatNumber, formatPhone } from "@/lib/format";
import { useAdminSession } from "@/hooks/use-admin-session";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Ban,
  Check,
  Database,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Phone,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

/* -------------------------------------------------------------------------- */
/*  حوارات مساعدة                                                             */
/* -------------------------------------------------------------------------- */

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  placeholder,
  requiredText,
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder?: string;
  requiredText?: string;
  destructive?: boolean;
  onConfirm: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = requiredText ? value.trim() === requiredText : value.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs leading-6">{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={value}
          rows={3}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder ?? "اكتب السبب…"}
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy || !ready}
            className="gap-2"
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(value.trim());
                setValue("");
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[11px] leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border py-5 last:border-b-0 md:flex-row md:items-start md:justify-between">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  بوابة الدخول                                                              */
/* -------------------------------------------------------------------------- */

function CredentialsGate({
  firstRun,
  currentUsername,
  onSuccess,
  expired,
}: {
  firstRun: boolean;
  currentUsername: string | null;
  onSuccess: (token: string) => void;
  expired?: boolean;
}) {
  const login = useAction(api.adminAuth.login);

  const [email, setEmail] = useState(currentUsername ?? ADMIN_DEFAULT_EMAIL);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (email.trim().length < 3) {
      setError("اكتب بريد المدير (3 أحرف على الأقل).");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    if (firstRun && password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    try {
      const result = await login({ email, password });
      onSuccess(result.token);
    } catch (submitError) {
      setError(cleanError(submitError, "تعذّر تسجيل الدخول."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell width="narrow">
      <div className="rounded-lg border border-border p-7 md:p-8">
        <span className="grid size-10 place-items-center rounded-md bg-foreground text-background">
          <LockKeyhole className="size-4" />
        </span>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>لوحة تحكم الإدارة</Kicker>
        </div>

        <h1 className="mt-4 text-xl font-semibold">
          {firstRun ? "أول دخول للمدير" : "تسجيل دخول الإدارة"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {firstRun
            ? `لا يوجد حساب إدارة بعد. ادخل ببريد المدير ${ADMIN_DEFAULT_EMAIL} واختر كلمة مرور — يُنشأ الحساب بهذه البيانات حالاً، ويمكن تغييرها لاحقاً من داخل اللوحة.`
            : "هذه الصفحة محجوزة للإدارة. أدخل البريد الإلكتروني وكلمة المرور للوصول إلى مراجعة الملفات وتأكيد إيصالات الدفع."}
        </p>

        {expired && (
          <p className="mt-5 rounded-md border border-border bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
            انتهت جلستك السابقة، أعد تسجيل الدخول من فضلك.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-5">
          <Field
            label="البريد الإلكتروني للمدير"
            required
            hint={
              currentUsername && !firstRun
                ? `الحساب الحالي: ${currentUsername}`
                : "بريد الإدارة المعتمد"
            }
          >
            <Input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={ADMIN_DEFAULT_EMAIL}
              dir="ltr"
              disabled={busy}
            />
          </Field>

          <Field
            label="كلمة المرور"
            required
            hint={firstRun ? "6 أحرف على الأقل. احتفظ بها في مكان آمن." : undefined}
          >
            <Input
              type="password"
              value={password}
              autoComplete={firstRun ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              dir="ltr"
              disabled={busy}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !firstRun) void submit();
              }}
            />
          </Field>

          {firstRun && (
            <Field label="تأكيد كلمة المرور" required>
              <Input
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="••••••••"
                dir="ltr"
                disabled={busy}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submit();
                }}
              />
            </Field>
          )}

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button onClick={submit} disabled={busy} size="lg" className="gap-2">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {firstRun ? "إنشاء حساب المدير والدخول" : "دخول لوحة التحكم"}
          </Button>

          {!firstRun && (
            <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
              <KeyRound className="mt-1 size-3.5 shrink-0" />
              نسيت كلمة المرور؟ لا يمكن استرجاعها من الواجهة — تعاد من قاعدة البيانات (جدول
              adminAuth) أو عبر إعادة إنشاء المشروع.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ChangeCredentialsDialog({
  token,
  username,
  open,
  onOpenChange,
}: {
  token: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const changeCredentials = useAction(api.adminAuth.changeCredentials);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(username);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setError(null);
    if (newPassword !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setBusy(true);
    try {
      await changeCredentials({
        token,
        currentPassword,
        newPassword,
        newEmail: newEmail.trim() || undefined,
      });
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setTimeout(() => setSaved(false), 2500);
    } catch (submitError) {
      setError(cleanError(submitError, "تعذّر تحديث بيانات الدخول."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">تغيير بيانات دخول الإدارة</DialogTitle>
        <DialogDescription className="text-xs leading-6">
          البريد الحالي: <span dir="ltr">{username}</span> — أدخل كلمة المرور الحالية ثم
          البيانات الجديدة.
        </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="كلمة المرور الحالية" required>
            <Input
              type="password"
              value={currentPassword}
              dir="ltr"
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label="البريد الإلكتروني الجديد" hint="اتركه كما هو إن لم ترغب في تغييره.">
            <Input
              type="email"
              value={newEmail}
              dir="ltr"
              onChange={(event) => setNewEmail(event.target.value)}
            />
          </Field>
          <Field label="كلمة المرور الجديدة" required>
            <Input
              type="password"
              value={newPassword}
              dir="ltr"
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة" required>
            <Input
              type="password"
              value={confirm}
              dir="ltr"
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {saved && <p className="text-xs text-muted-foreground">تم تحديث بيانات الدخول ✓</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  الصفحة                                                                    */
/* -------------------------------------------------------------------------- */

export default function Admin() {
  const status = useQuery(api.admin.authStatus, {});
  const { token, setToken } = useAdminSession();
  const session = useQuery(api.admin.session, token ? { token } : "skip");
  const [expired, setExpired] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token && session && !session.valid) {
      setExpired(true);
      setToken(null);
    }
  }, [token, session, setToken]);

  if (status === undefined) {
    if (timedOut) {
      return (
        <PageShell width="narrow">
          <div className="rounded-lg border border-border bg-background p-7 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">بوابة الإدارة بانتظار ربط قاعدة البيانات</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              لوحة التحكم تتصل مباشرة بقاعدة البيانات Convex. يرجى تفعيل مشروع Convex وربط الرابط في إعدادات Vercel (<code className="font-mono bg-secondary px-1.5 py-0.5 rounded">VITE_CONVEX_URL</code>).
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/">العودة للرئيسية</Link>
              </Button>
              <Button onClick={() => window.location.reload()} variant="default">
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ التحقق من حالة لوحة التحكم…" />
      </PageShell>
    );
  }

  if (!status.configured) {
    return <CredentialsGate firstRun currentUsername={null} onSuccess={setToken} />;
  }

  if (!token) {
    return (
      <CredentialsGate
        firstRun={false}
        currentUsername={status.username}
        onSuccess={setToken}
        expired={expired}
      />
    );
  }

  if (session === undefined || !session.valid || !session.username) {
    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ التحقق من الجلسة…" />
      </PageShell>
    );
  }

  return (
    <AdminDashboard
      token={token}
      username={session.username}
      mustChangePassword={status.mustChangePassword}
      onSignOut={() => setToken(null)}
    />
  );
}

function AdminDashboard({
  token,
  username,
  mustChangePassword,
  onSignOut,
}: {
  token: string;
  username: string;
  mustChangePassword: boolean;
  onSignOut: () => void;
}) {
  const overview = useQuery(api.admin.overview, { adminToken: token });
  const seedDemo = useMutation(api.seed.demo);
  const logout = useAction(api.adminAuth.logout);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  const signOut = async () => {
    try {
      await logout({ token });
    } finally {
      onSignOut();
    }
  };

  return (
    <PageShell>
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/25" />
            <Kicker>لوحة تحكم الإدارة</Kicker>
          </div>
          <h1 className="mt-4 text-2xl font-semibold md:text-3xl">إدارة الدليل والاشتراكات</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            مسجّل الدخول باسم
            <span className="num font-medium text-foreground" dir="ltr">
              {username}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setSeedOpen(true)}
            disabled={seeding}
          >
            {seeding ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
            بيانات تجريبية
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCredentialsOpen(true)}>
            <KeyRound className="size-4" />
            بيانات الدخول
          </Button>
          <Button variant="ghost" className="gap-2" onClick={signOut}>
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>
      </header>

      {mustChangePassword && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-5">
          <p className="flex items-start gap-3 text-xs leading-6 text-destructive">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            كلمة مرور الإدارة جرى إعادة تعيينها. غيّرها الآن — تبقى هذه البيانات قابلة للتخمين
            حتى تتغير.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setCredentialsOpen(true)}
          >
            <KeyRound className="size-3.5" />
            تغيير كلمة المرور
          </Button>
        </section>
      )}

      <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "طلبات تسجيل جديدة", value: overview?.pendingApplications },
          { label: "حرفيون منشورون", value: overview?.approvedArtisans },
          { label: "إيصالات في الانتظار", value: overview?.pendingReceipts },
          { label: "اشتراكات فعّالة", value: overview?.activeSubscriptions },
          { label: "إجمالي الحسابات", value: (overview as any)?.totalUsers },
          { label: "حسابات موقوفة", value: (overview as any)?.bannedUsers },
        ].map((item) => (
          <div key={item.label} className="bg-background px-5 py-5">
            <p className="num text-2xl font-semibold">
              {item.value === undefined ? "—" : formatNumber(item.value)}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      {overview && overview.pendingReceipts === 0 && overview.pendingApplications === 0 && (
        <p className="mt-5 flex flex-wrap items-center gap-2 rounded-md bg-secondary/60 px-5 py-4 text-xs text-muted-foreground">
          <BadgeCheck className="size-4" />
          لا توجد طلبات في الانتظار. مجموع المدفوعات المؤكدة:
          <span className="num font-medium text-foreground">
            {formatDZD(overview.confirmedRevenueDZD)}
          </span>
        </p>
      )}

      <Tabs defaultValue="applications" className="mt-8">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-secondary p-1">
          <TabsTrigger value="applications">طلبات التسجيل</TabsTrigger>
          <TabsTrigger value="receipts">إيصالات CCP</TabsTrigger>
          <TabsTrigger value="artisans">الحرفيون</TabsTrigger>
          <TabsTrigger value="users">إدارة الحسابات والقوانين</TabsTrigger>
          <TabsTrigger value="reviews">التقييمات</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ApplicationsTab token={token} />
        </TabsContent>
        <TabsContent value="receipts">
          <ReceiptsTab token={token} />
        </TabsContent>
        <TabsContent value="artisans">
          <ArtisansTab token={token} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab token={token} />
        </TabsContent>
        <TabsContent value="reviews">
          <ReviewsTab token={token} />
        </TabsContent>
      </Tabs>

      <section className="mt-12 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">حساب الدفع (CCP) المعروض للحرفيين</h2>
        <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
          هذه القيم ثابتة في الشيفرة وتظهر للحرفي في شاشة الاشتراك. عدّلها في ملف
          <span className="num mx-1" dir="ltr">
            src/convex/data.ts
          </span>
          لتطابق حسابك البريدي الحقيقي.
        </p>
        <div className="mt-4">
          <CopyRow label="اسم المستفيد" value="دليل الصنايعية" mono={false} />
          <CopyRow label="رقم الحساب CCP" value="0023456789" />
          <CopyRow label="المفتاح (clé)" value="45" />
        </div>
      </section>

      <ConfirmDialog
        open={seedOpen}
        onOpenChange={setSeedOpen}
        title="إعادة تحميل البيانات التجريبية"
        description="سيتم حذف كل الحرفيين والتقييمات وطلبات الدفع الحالية، ثم إدخال 16 حرفياً و41 تقييماً للتجربة. اكتب «تأكيد» للمتابعة."
        confirmLabel="إعادة التحميل"
        requiredText="تأكيد"
        placeholder="اكتب: تأكيد"
        onConfirm={async () => {
          setSeeding(true);
          try {
            await seedDemo({ reset: true, adminToken: token });
          } finally {
            setSeeding(false);
          }
        }}
      />

      <ChangeCredentialsDialog
        token={token}
        username={username}
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
      />
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  1) طلبات التسجيل                                                          */
/* -------------------------------------------------------------------------- */

function ApplicationsTab({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "">("pending");
  const applications = useQuery(api.admin.applications, {
    adminToken: token,
    ...(status ? { status } : {}),
  });
  const setApplicationStatus = useMutation(api.admin.setApplicationStatus);
  const [rejectId, setRejectId] = useState<Id<"artisans"> | null>(null);

  return (
    <SectionCard
      title="مراجعة طلبات التسجيل"
      description="تحقق من صحة المعلومات والصور قبل نشر الملف. الموافقة لا تُفعّل الاشتراك — التفعيل يتم من تبويب إيصالات CCP."
      actions={
        <div className="w-52">
          <NativeSelect
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              { value: "", label: "كل الطلبات" },
              { value: "pending", label: "قيد المراجعة" },
              { value: "approved", label: "مقبولة" },
              { value: "rejected", label: "مرفوضة" },
            ]}
          />
        </div>
      }
    >
      {applications === undefined ? (
        <div className="pt-6">
          <LoadingBlock label="جارٍ تحميل الطلبات…" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState className="mt-6" title="لا توجد طلبات في هذه الحالة" />
      ) : (
        applications.map((application) => (
          <Row key={application._id}>
            <div className="flex min-w-0 gap-4">
              <Monogram name={application.fullName} url={application.photoUrl} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{application.fullName}</p>
                  <StatusChip
                    tone={
                      application.status === "approved"
                        ? "ink"
                        : application.status === "rejected"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {ARTISAN_STATUS_LABELS[application.status]}
                  </StatusChip>
                  {application.isActive && <StatusChip tone="ink">اشتراك فعّال</StatusChip>}
                  {application.suspended && <StatusChip tone="danger">موقوف</StatusChip>}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {application.specialty} · {application.commune}، {application.wilaya} · خبرة{" "}
                  <span className="num">{application.yearsExperience ?? "—"}</span> سنة
                </p>
                <p className="num mt-1 text-[11px] text-muted-foreground" dir="ltr">
                  {formatPhone(application.phone)}
                </p>
                {application.bio && (
                  <p className="mt-2.5 max-w-xl text-xs leading-6 text-muted-foreground">
                    {application.bio}
                  </p>
                )}
                {application.rejectionReason && (
                  <p className="mt-2 text-[11px] text-destructive">
                    سبب الرفض: {application.rejectionReason}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  {application.works.map((work, index) => (
                    <figure key={index} className="flex items-center gap-2">
                      {[work.beforeUrl, work.afterUrl]
                        .filter((url): url is string => Boolean(url))
                        .map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={work.caption ?? "عمل"}
                              className="size-16 rounded-md object-cover hairline border"
                            />
                          </a>
                        ))}
                      {work.caption && (
                        <figcaption className="max-w-40 text-[10px] leading-5 text-muted-foreground">
                          {work.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <a href={`tel:${application.phone}`}>
                  <Phone className="size-3.5" />
                  اتصال
                </a>
              </Button>
              {application.status !== "approved" && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    setApplicationStatus({
                      adminToken: token,
                      artisanId: application._id,
                      status: "approved",
                    })
                  }
                >
                  <Check className="size-3.5" />
                  موافقة
                </Button>
              )}
              {application.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setRejectId(application._id)}
                >
                  <X className="size-3.5" />
                  رفض
                </Button>
              )}
            </div>
          </Row>
        ))
      )}

      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="رفض طلب التسجيل"
        description="سيظهر سبب الرفض للحرفي في صفحة «حالتي». اكتب سبباً واضحاً وقابلاً للتصحيح."
        confirmLabel="تأكيد الرفض"
        onConfirm={async (reason) => {
          if (!rejectId) return;
          await setApplicationStatus({
            adminToken: token,
            artisanId: rejectId,
            status: "rejected",
            reason,
          });
          setRejectId(null);
        }}
      />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  2) إيصالات CCP                                                            */
/* -------------------------------------------------------------------------- */

function ReceiptsTab({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "">("pending");
  const receipts = useQuery(api.admin.receipts, {
    adminToken: token,
    ...(status ? { status } : {}),
  });
  const reviewReceipt = useMutation(api.admin.reviewReceipt);
  const [rejectId, setRejectId] = useState<Id<"subscriptionRequests"> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const approve = async (requestId: Id<"subscriptionRequests">) => {
    setBusyId(requestId);
    try {
      await reviewReceipt({
        adminToken: token,
        requestId,
        approve: true,
        note: "تمت مطابقة التحويل مع كشف الحساب البريدي",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard
      title="تأكيد إيصالات الدفع (CCP)"
      description="طابق المبلغ واسم الدافع ومرجع التحويل مع كشف الحساب البريدي، ثم فعّل الاشتراك. الموافقة تُفعّل الاشتراك وتنشر الملف إن كان قيد المراجعة."
      actions={
        <div className="w-52">
          <NativeSelect
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              { value: "", label: "كل الطلبات" },
              { value: "pending", label: "في الانتظار" },
              { value: "approved", label: "مؤكّدة" },
              { value: "rejected", label: "مرفوضة" },
            ]}
          />
        </div>
      }
    >
      {receipts === undefined ? (
        <div className="pt-6">
          <LoadingBlock label="جارٍ تحميل الطلبات…" />
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState className="mt-6" title="لا توجد إيصالات في هذه الحالة" />
      ) : (
        receipts.map((receipt) => (
          <Row key={receipt._id}>
            <div className="flex min-w-0 gap-4">
              {receipt.receiptUrl ? (
                <a href={receipt.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={receipt.receiptUrl}
                    alt="إيصال التحويل"
                    className="size-24 rounded-md object-cover hairline border"
                  />
                </a>
              ) : (
                <div className="grid size-24 shrink-0 place-items-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                  بلا صورة
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{receipt.artisanName}</p>
                  <StatusChip
                    tone={
                      receipt.status === "approved"
                        ? "ink"
                        : receipt.status === "rejected"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {REQUEST_STATUS_LABELS[receipt.status]}
                  </StatusChip>
                </div>
                <p className="num mt-1.5 text-xs font-medium">
                  {receipt.planName} · {formatDZD(receipt.amountDZD)}
                </p>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-[11px] text-muted-foreground md:grid-cols-2">
                  <div className="flex gap-2">
                    <dt>اسم الدافع:</dt>
                    <dd className="text-foreground">{receipt.payerName}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>المرجع:</dt>
                    <dd className="num text-foreground" dir="ltr">
                      {receipt.ccpReference}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>الهاتف:</dt>
                    <dd className="num text-foreground" dir="ltr">
                      {formatPhone(receipt.artisanPhone)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>الموقع:</dt>
                    <dd>{receipt.location}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>أُرسل:</dt>
                    <dd>{formatDateTime(receipt.createdAt)}</dd>
                  </div>
                  {receipt.paidAt && (
                    <div className="flex gap-2">
                      <dt>تاريخ التحويل:</dt>
                      <dd className="num">{receipt.paidAt}</dd>
                    </div>
                  )}
                </dl>
                {receipt.note && (
                  <p className="mt-2 max-w-xl rounded-md bg-secondary/60 px-3 py-2 text-[11px] leading-6 text-muted-foreground">
                    ملاحظة الحرفي: {receipt.note}
                  </p>
                )}
                {receipt.reviewerNote && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    ملاحظتك: {receipt.reviewerNote}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {receipt.receiptUrl && (
                <Button asChild size="sm" variant="ghost" className="gap-1.5">
                  <a href={receipt.receiptUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    الإيصال
                  </a>
                </Button>
              )}
              {receipt.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={busyId === receipt._id}
                    onClick={() => approve(receipt._id)}
                  >
                    {busyId === receipt._id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    تأكيد وتفعيل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setRejectId(receipt._id)}
                  >
                    <X className="size-3.5" />
                    رفض
                  </Button>
                </>
              )}
              {receipt.status === "approved" && receipt.reviewedAt && (
                <span className="text-[11px] text-muted-foreground">
                  تم التأكيد {formatDate(receipt.reviewedAt)}
                </span>
              )}
            </div>
          </Row>
        ))
      )}

      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="رفض إيصال الدفع"
        description="اكتب سبب الرفض (مبلغ غير مطابق، صورة غير واضحة…). يظهر السبب للحرفي في سجل طلباته."
        confirmLabel="تأكيد الرفض"
        onConfirm={async (reason) => {
          if (!rejectId) return;
          await reviewReceipt({
            adminToken: token,
            requestId: rejectId,
            approve: false,
            note: reason,
          });
          setRejectId(null);
        }}
      />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  3) إدارة الحرفيين                                                         */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  حوار تعديل الحرفي                                                        */
/* -------------------------------------------------------------------------- */

type ArtisanRow = {
  _id: Id<"artisans">;
  fullName: string;
  phone: string;
  specialty: string;
  wilaya: string;
  commune: string;
  bio: string | null;
  yearsExperience: number | null;
};

function EditArtisanDialog({
  token,
  artisan,
  open,
  onOpenChange,
}: {
  token: string;
  artisan: {
    _id: Id<"artisans">;
    fullName: string;
    phone: string;
    specialty: string;
    wilaya: string;
    commune: string;
    bio: string | null;
    yearsExperience: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateArtisan = useMutation(api.admin.updateArtisan);
  const [fullName, setFullName] = useState(artisan.fullName);
  const [phone, setPhone] = useState(artisan.phone);
  const [specialty, setSpecialty] = useState(artisan.specialty);
  const [wilaya, setWilaya] = useState(artisan.wilaya);
  const [commune, setCommune] = useState(artisan.commune);
  const [bio, setBio] = useState(artisan.bio ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    artisan.yearsExperience?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError("الاسم الكامل مطلوب.");
      return;
    }
    if (!phone.trim()) {
      setError("رقم الهاتف مطلوب.");
      return;
    }
    setBusy(true);
    try {
      await updateArtisan({
        adminToken: token,
        artisanId: artisan._id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        wilaya: wilaya.trim(),
        commune: commune.trim(),
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onOpenChange(false); }, 1500);
    } catch (submitError) {
      setError(cleanError(submitError, "تعذّر حفظ التعديلات."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">تعديل ملف الحرفي</DialogTitle>
          <DialogDescription className="text-xs leading-6">
            تعديل بيانات {artisan.fullName} — التغييرات تظهر فوراً للزبائن.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <Field label="الاسم الكامل" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy} />
            </Field>
            <Field label="رقم الهاتف" required>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" disabled={busy} />
            </Field>
            <Field label="التخصص">
              <NativeSelect
                value={specialty}
                onChange={setSpecialty}
                placeholder="اختر التخصص"
                options={["سبّاك", "كهربائي", "فنّي مكيّفات", "نجّار", "دهّان", "جبس وديكور", "ألمنيوم وزجاج", "بلاط ورخام"].map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الولاية">
                <Input value={wilaya} onChange={(e) => setWilaya(e.target.value)} disabled={busy} />
              </Field>
              <Field label="الحي / البلدية">
                <Input value={commune} onChange={(e) => setCommune(e.target.value)} disabled={busy} />
              </Field>
            </div>
            <Field label="سنوات الخبرة">
              <Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} dir="ltr" disabled={busy} />
            </Field>
            <Field label="نبذة عن الخبرة">
              <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} disabled={busy} />
            </Field>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {error}
          </p>
        )}
        {saved && <p className="text-xs text-muted-foreground">تم حفظ التعديلات ✓</p>}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArtisansTab({ token }: { token: string }) {
  const artisans = useQuery(api.admin.applications, { adminToken: token });
  const setSuspended = useMutation(api.admin.setSuspended);
  const deleteArtisan = useMutation(api.admin.deleteArtisan);
  const [deleteId, setDeleteId] = useState<Id<"artisans"> | null>(null);
  const [editArtisan, setEditArtisan] = useState<ArtisanRow | null>(null);

  return (
    <SectionCard
      title="إدارة الحرفيين"
      description="الإيقاف المؤقت يخفي الملف من نتائج البحث مع الاحتفاظ بالبيانات، بينما الحذف يمسح الملف وتقييماته وطلباته نهائياً."
    >
      {artisans === undefined ? (
        <div className="pt-6">
          <LoadingBlock label="جارٍ تحميل الحرفيين…" />
        </div>
      ) : artisans.length === 0 ? (
        <EmptyState className="mt-6" title="لا يوجد حرفيون مسجّلون بعد" />
      ) : (
        artisans.map((artisan) => (
          <Row key={artisan._id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{artisan.fullName}</p>
                <StatusChip
                  tone={
                    artisan.status === "approved"
                      ? "ink"
                      : artisan.status === "rejected"
                        ? "danger"
                        : "warn"
                  }
                >
                  {ARTISAN_STATUS_LABELS[artisan.status]}
                </StatusChip>
                {artisan.suspended && <StatusChip tone="danger">موقوف</StatusChip>}
                {artisan.planName && (
                  <StatusChip tone={artisan.isActive ? "ink" : "neutral"} showDot={false}>
                    {artisan.planName}
                    {artisan.isActive && artisan.subscriptionExpiresAt
                      ? ` · حتى ${formatDate(artisan.subscriptionExpiresAt)}`
                      : ""}
                  </StatusChip>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {artisan.specialty} · {artisan.commune}، {artisan.wilaya} ·{" "}
                <span className="num" dir="ltr">
                  {formatPhone(artisan.phone)}
                </span>
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4">
                <Stars value={artisan.rating} count={artisan.ratingCount} />
                <span className="num text-[11px] text-muted-foreground">
                  رمز المتابعة {artisan.applicationCode}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <Link to={`/artisan/${artisan._id}`}>
                  <Eye className="size-3.5" />
                  الملف
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setEditArtisan(artisan)}
              >
                <Edit className="size-3.5" />
                تعديل
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  setSuspended({
                    adminToken: token,
                    artisanId: artisan._id,
                    suspended: !artisan.suspended,
                  })
                }
              >
                {artisan.suspended ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                {artisan.suspended ? "إعادة التفعيل" : "إيقاف مؤقت"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(artisan._id)}
              >
                <Trash2 className="size-3.5" />
                حذف
              </Button>
            </div>
          </Row>
        ))
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف ملف الحرفي نهائياً"
        description="سيُحذف الملف مع كل تقييماته وطلبات الدفع. اكتب «حذف» للتأكيد."
        confirmLabel="حذف نهائي"
        requiredText="حذف"
        placeholder="اكتب: حذف"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteArtisan({ adminToken: token, artisanId: deleteId });
          setDeleteId(null);
        }}
      />

      {editArtisan && (
        <EditArtisanDialog
          token={token}
          artisan={editArtisan}
          open={true}
          onOpenChange={(open) => !open && setEditArtisan(null)}
        />
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  4) إدارة حسابات المستخدمين (زبائن وحرفيين) وتطبيق القوانين                */
/* -------------------------------------------------------------------------- */

const VIOLATION_REASONS = [
  "تقييمات كيدية أو تشهير بحرفي",
  "انتحال صفة أو صور أعمال غير حقيقية",
  "سوء معاملة أو احتيال مالي",
  "ألفاظ غير لائقة أو محتوى غير أخلاقي",
  "مخالفة بنود وقوانين الاستخدام العامة",
];

function UsersTab({ token }: { token: string }) {
  const users = useQuery(api.admin.usersList, { adminToken: token });
  const setUserBanned = useMutation(api.admin.setUserBanned);
  const deleteUserAccount = useMutation(api.admin.deleteUserAccount);

  const [filter, setFilter] = useState<"all" | "customer" | "artisan" | "banned">("all");
  const [search, setSearch] = useState("");
  const [banUser, setBanUser] = useState<{ id: Id<"users">; name: string } | null>(null);
  const [banReason, setBanReason] = useState(VIOLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<Id<"users"> | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = (users ?? []).filter((u) => {
    if (filter === "customer" && u.accountType !== "customer") return false;
    if (filter === "artisan" && u.accountType !== "artisan") return false;
    if (filter === "banned" && !u.isBanned) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.linkedArtisanName && u.linkedArtisanName.toLowerCase().includes(q)) ||
        (u.linkedArtisanPhone && u.linkedArtisanPhone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleConfirmBan = async () => {
    if (!banUser) return;
    setBusy(true);
    try {
      const finalReason = customReason.trim() || banReason;
      await setUserBanned({
        adminToken: token,
        userId: banUser.id,
        banned: true,
        reason: finalReason,
      });
      setBanUser(null);
      setCustomReason("");
    } finally {
      setBusy(false);
    }
  };

  const handleUnban = async (userId: Id<"users">) => {
    await setUserBanned({
      adminToken: token,
      userId,
      banned: false,
    });
  };

  return (
    <SectionCard
      title="إدارة الحسابات وتطبيق القوانين"
      description="مراقبة حسابات الزبائن والحرفيين المسجلين. يمكنك توقيف أي حساب فوراً إذا خالف بنود وقوانين التطبيق، أو حذفه نهائياً."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute start-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد…"
              className="h-8 ps-8 text-xs"
            />
          </div>
          <div className="w-36">
            <NativeSelect
              value={filter}
              onChange={(value) => setFilter(value as typeof filter)}
              options={[
                { value: "all", label: "كل الحسابات" },
                { value: "customer", label: "الزبائن" },
                { value: "artisan", label: "الحرفيون" },
                { value: "banned", label: "الموقوفون فقط" },
              ]}
            />
          </div>
        </div>
      }
    >
      {users === undefined ? (
        <div className="pt-6">
          <LoadingBlock label="جارٍ تحميل الحسابات…" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="لا توجد حسابات مطابقة"
          description="جرّب تغيير عبارة البحث أو الفلتر."
        />
      ) : (
        filtered.map((user) => (
          <Row key={user._id}>
            <div className="flex min-w-0 gap-4">
              <Monogram name={user.name} className="size-11 text-xs" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <StatusChip tone={user.accountType === "artisan" ? "ink" : "neutral"}>
                    {user.accountType === "artisan" ? "حرفي" : "زبون"}
                  </StatusChip>
                  {user.isBanned ? (
                    <StatusChip tone="danger">موقوف لمخالفة القوانين</StatusChip>
                  ) : (
                    <StatusChip tone="ink">نشط</StatusChip>
                  )}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email}
                  {user.createdAt && ` · مسجل منذ ${formatDate(user.createdAt)}`}
                </p>

                {user.linkedArtisanName && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    مرتبط بملف الحرفي: <span className="font-medium text-foreground">{user.linkedArtisanName}</span>
                    {user.linkedArtisanPhone && ` (${user.linkedArtisanPhone})`}
                  </p>
                )}

                {user.reviewsCount > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    عدد التقييمات المضافة: <span className="num font-medium text-foreground">{user.reviewsCount}</span>
                  </p>
                )}

                {user.isBanned && user.banReason && (
                  <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                    سبب التوقيف: {user.banReason}
                    {user.bannedAt && ` (${formatDateTime(user.bannedAt)})`}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {user.isBanned ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-foreground"
                  onClick={() => handleUnban(user._id)}
                >
                  <UserCheck className="size-3.5 text-emerald-600" />
                  فك التوقيف
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    setBanUser({
                      id: user._id,
                      name: user.name,
                    })
                  }
                >
                  <Ban className="size-3.5" />
                  توقيف الحساب
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={() => setDeleteUserId(user._id)}
              >
                <Trash2 className="size-3.5" />
                حذف نهائي
              </Button>
            </div>
          </Row>
        ))
      )}

      {/* حوار توقيف الحساب واختيار سبب المخالفة */}
      <Dialog open={Boolean(banUser)} onOpenChange={(open) => !open && setBanUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-destructive">
              <Ban className="size-4" />
              توقيف حساب {banUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs leading-6">
              سيتم منع صاحب الحساب من استخدام المنصة، وتوقيف ملف الحرفي المرتبط به تلقائياً.
              اختر سبب المخالفة ليظهر للمستخدم عند محاولة الدخول.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Field label="سبب المخالفة (حسب بنود وقوانين التطبيق)">
              <NativeSelect
                value={banReason}
                onChange={setBanReason}
                options={VIOLATION_REASONS.map((r) => ({ value: r, label: r }))}
              />
            </Field>

            <Field label="أو اكتب سبباً مخصصاً (اختياري)">
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="تفاصيل إضافية للمخالفة…"
                className="text-xs"
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBanUser(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              className="gap-2"
              onClick={handleConfirmBan}
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              تأكيد توقيف الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار حذف الحساب نهائياً */}
      <ConfirmDialog
        open={Boolean(deleteUserId)}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="حذف حساب المستخدم نهائياً"
        description="سيتم حذف الحساب بالكامل وفك ارتباط أي ملفات. اكتب «حذف» للتأكيد."
        confirmLabel="حذف الحساب"
        requiredText="حذف"
        placeholder="اكتب: حذف"
        onConfirm={async () => {
          if (!deleteUserId) return;
          await deleteUserAccount({ adminToken: token, userId: deleteUserId });
          setDeleteUserId(null);
        }}
      />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  5) إدارة التقييمات                                                        */
/* -------------------------------------------------------------------------- */

function ReviewsTab({ token }: { token: string }) {
  const reviews = useQuery(api.admin.reviews, { adminToken: token });
  const setReviewHidden = useMutation(api.admin.setReviewHidden);
  const deleteReview = useMutation(api.admin.deleteReview);

  return (
    <SectionCard
      title="إدارة التقييمات"
      description="احذف التقييمات المزيفة أو المخالفة، أو أخفها مؤقتاً لحين التحقق. الإخفاء والحذف يعيدان حساب معدّل تقييم الحرفي فوراً."
    >
      {reviews === undefined ? (
        <div className="pt-6">
          <LoadingBlock label="جارٍ تحميل التقييمات…" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState className="mt-6" title="لا توجد تقييمات بعد" />
      ) : (
        reviews.map((review) => (
          <Row key={review._id}>
            <div className="flex min-w-0 gap-4">
              <Monogram name={review.customerName} className="size-10 text-xs" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{review.customerName}</p>
                  {review.hidden && <StatusChip tone="danger">مخفي</StatusChip>}
                  {review.customerPhone && (
                    <span className="num text-[11px] text-muted-foreground" dir="ltr">
                      {formatPhone(review.customerPhone)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  على ملف {review.artisanName} · {formatDateTime(review.createdAt)}
                </p>
                <div className="mt-2">
                  <Stars value={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                )}
                {(review.beforeUrl || review.afterUrl) && (
                  <div className="mt-3 flex gap-2">
                    {[review.beforeUrl, review.afterUrl]
                      .filter((url): url is string => Boolean(url))
                      .map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt="صورة التقييم"
                            className="size-16 rounded-md object-cover hairline border"
                          />
                        </a>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <Link to={`/artisan/${review.artisanId}`}>
                  <ExternalLink className="size-3.5" />
                  الملف
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  setReviewHidden({
                    adminToken: token,
                    reviewId: review._id,
                    hidden: !review.hidden,
                  })
                }
              >
                {review.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                {review.hidden ? "إظهار" : "إخفاء"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => deleteReview({ adminToken: token, reviewId: review._id })}
              >
                <Trash2 className="size-3.5" />
                حذف
              </Button>
            </div>
          </Row>
        ))
      )}
    </SectionCard>
  );
}
