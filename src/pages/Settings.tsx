import {
  Kicker,
  LoadingBlock,
  Field,
  NativeSelect,
} from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cleanError } from "@/lib/errors";
import { SPECIALTIES, WILAYA_NAMES } from "@/convex/data";
import { useMutation, useQuery } from "convex/react";
import {
  Loader2,
  LogOut,
  Save,
  Settings as SettingsIcon,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

function CustomerSettings() {
  const { user, signOut } = useAuth();
  const updateProfile = useMutation(api.accounts.updateProfile);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setBusy(true);
    try {
      await updateProfile({ name: name.trim() || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(cleanError(e, "تعذّر حفظ التغييرات."));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
      {/* الملف الشخصي */}
      <section className="rounded-lg border border-border p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
            <User className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-medium">الملف الشخصي</h2>
            <p className="text-[11px] text-muted-foreground">
              حساب زبون — تغيير الاسم فقط
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <Field label="الاسم الكامل">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك..."
              disabled={busy}
            />
          </Field>

          <Field label="البريد الإلكتروني" hint="غير قابل للتعديل">
            <Input value={user?.email ?? ""} disabled dir="ltr" />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}

          {saved && (
            <p className="text-xs text-muted-foreground">تم الحفظ بنجاح ✓</p>
          )}

          <Button
            onClick={handleSave}
            disabled={busy}
            className="gap-2 self-start"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </section>

      {/* إجراءات الحساب */}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">إجراءات الحساب</h2>
        <Button
          variant="destructive"
          className="gap-2 self-start"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </Button>
      </section>
    </div>
  );
}

function ArtisanSettings() {
  const { user, signOut } = useAuth();
  const workspace = useQuery(api.artisans.myWorkspace, {});
  const selfUpdate = useMutation(api.artisans.selfUpdate);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artisan = workspace?.artisan;

  const [fullName, setFullName] = useState(artisan?.fullName ?? "");
  const [phone, setPhone] = useState(artisan?.phone ?? "");
  const [specialty, setSpecialty] = useState(artisan?.specialty ?? "");
  const [wilaya, setWilaya] = useState(artisan?.wilaya ?? "");
  const [commune, setCommune] = useState(artisan?.commune ?? "");
  const [bio, setBio] = useState(artisan?.bio ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    artisan?.yearsExperience?.toString() ?? ""
  );

  const handleSave = async () => {
    setError(null);
    setBusy(true);
    try {
      await selfUpdate({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        specialty: specialty.trim() || undefined,
        wilaya: wilaya.trim() || undefined,
        commune: commune.trim() || undefined,
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience
          ? parseInt(yearsExperience, 10)
          : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(cleanError(e, "تعذّر حفظ التغييرات."));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (workspace === undefined) {
    return <LoadingBlock label="جارٍ تحميل ملفك الحرفي..." />;
  }

  if (workspace === null) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm font-medium">لا يوجد ملف حرفي مرتبط بحسابك</p>
        <p className="mt-2 text-xs text-muted-foreground">
          اربط ملفك أولاً من صفحة حساب الحرفي.
        </p>
        <Button asChild className="mt-4" onClick={() => navigate("/my")}>
          <span>الذهاب لحساب الحرفي</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
      {/* تعديل الملف الشخصي */}
      <section className="rounded-lg border border-border p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
            <Wrench className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-medium">تعديل ملفك الحرفي</h2>
            <p className="text-[11px] text-muted-foreground">
              المعلومات التي يراها الزبائن في ملفك العام
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <Field label="الاسم الكامل" required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="محمد بن عمر"
              disabled={busy}
            />
          </Field>

          <Field label="رقم الهاتف" required>
            <Input
              value={phone}
              dir="ltr"
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0551234567"
              disabled={busy}
            />
          </Field>

          <Field label="التخصص">
            <NativeSelect
              value={specialty}
              onChange={setSpecialty}
              placeholder="اختر التخصص"
              options={SPECIALTIES.map((s) => ({ value: s, label: s }))}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="الولاية">
              <NativeSelect
                value={wilaya}
                onChange={setWilaya}
                placeholder="اختر الولاية"
                options={WILAYA_NAMES.map((w) => ({ value: w, label: w }))}
              />
            </Field>

            <Field label="الحي / البلدية">
              <Input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="الحي..."
                disabled={busy}
              />
            </Field>
          </div>

          <Field label="سنوات الخبرة">
            <Input
              type="number"
              min={0}
              max={50}
              value={yearsExperience}
              dir="ltr"
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="0"
              disabled={busy}
            />
          </Field>

          <Field label="نبذة عن خبرتك">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="خبرة 10 سنوات في سباكة المنازل والصيانة..."
              disabled={busy}
            />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}

          {saved && (
            <p className="text-xs text-muted-foreground">تم الحفظ بنجاح ✓</p>
          )}

          <Button
            onClick={handleSave}
            disabled={busy}
            className="gap-2 self-start"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </section>

      {/* إجراءات الحساب */}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">إجراءات الحساب</h2>
        <p className="text-[11px] text-muted-foreground">
          الحساب المرتبط بملفك: {user?.email ?? "—"}. تعديل البريد متاح من
          إدارة التطبيق.
        </p>
        <Button
          variant="destructive"
          className="gap-2 self-start"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </Button>
      </section>
    </div>
  );
}

export default function Settings() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isArtisan = user?.accountType === "artisan";

  if (isLoading) {
    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ التحقق..." />
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell width="narrow">
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-sm font-medium">سجّل الدخول أولاً</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>الإعدادات</Kicker>
        </div>
        <h1 className="mt-4 text-2xl font-semibold md:text-3xl">
          إعدادات الحساب
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {isArtisan
            ? "تعديل معلومات ملفك الحرفي الشخصي وإعدادات الحساب"
            : "تعديل معلومات حسابك الشخصي وإعدادات الدخول"}
        </p>
      </header>

      <section className="mt-8">
        {isArtisan ? <ArtisanSettings /> : <CustomerSettings />}
      </section>
    </PageShell>
  );
}
