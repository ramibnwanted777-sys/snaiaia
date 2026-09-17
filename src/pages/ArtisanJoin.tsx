import { ImageUpload } from "@/components/ImageUpload";
import { Field, Kicker, NativeSelect } from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { communesOf, SPECIALTIES, WILAYAS } from "@/convex/data";
import { useAuth } from "@/hooks/use-auth";
import { STORAGE_KEY_ARTISAN, STORAGE_KEY_PHONE } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface WorkDraft {
  caption: string;
  beforeId: Id<"_storage"> | null;
  afterId: Id<"_storage"> | null;
}

const STEP_LABELS = ["المعلومات", "الصور", "التأكيد"];

export default function ArtisanJoin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const register = useMutation(api.artisans.register);
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [wilaya, setWilaya] = useState(params.get("wilaya") ?? "");
  const [commune, setCommune] = useState(params.get("commune") ?? "");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [photoId, setPhotoId] = useState<Id<"_storage"> | null>(null);
  const [works, setWorks] = useState<WorkDraft[]>([{ caption: "", beforeId: null, afterId: null }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ artisanId: string; code: string } | null>(null);

  const communes = communesOf(wilaya);

  const validateStep = (): string | null => {
    if (step === 0) {
      if (fullName.trim().length < 3) return "اكتب الاسم الكامل (3 أحرف على الأقل).";
      if (!/^0[5-7]\d{8}$/.test(phone.replace(/\D/g, ""))) {
        return "رقم هاتف جزائري غير صحيح. مثال: 0551234567";
      }
      if (!specialty) return "اختر تخصصك من القائمة.";
      if (!wilaya) return "اختر الولاية.";
      if (commune.trim().length < 2) return "اكتب الحي أو البلدية.";
    }
    return null;
  };

  const next = () => {
    const problem = validateStep();
    setError(problem);
    if (!problem) setStep((value) => Math.min(value + 1, 2));
  };

  const submit = async () => {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      setStep(0);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        specialty,
        wilaya,
        commune: commune.trim(),
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        photoId: photoId ?? undefined,
        works: works
          .filter((work) => work.caption.trim() || work.beforeId || work.afterId)
          .map((work) => ({
            caption: work.caption.trim() || undefined,
            beforeId: work.beforeId ?? undefined,
            afterId: work.afterId ?? undefined,
          })),
      });

      localStorage.setItem(STORAGE_KEY_ARTISAN, result.artisanId);
      localStorage.setItem(STORAGE_KEY_PHONE, phone.replace(/\D/g, ""));
      setCreated({ artisanId: result.artisanId, code: result.applicationCode });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الطلب، أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  };

  const updateWork = (index: number, patch: Partial<WorkDraft>) => {
    setWorks((current) =>
      current.map((work, i) => (i === index ? { ...work, ...patch } : work)),
    );
  };

  if (created) {
    return (
      <PageShell width="narrow">
        <div className="rounded-lg border border-border p-8">
          <span className="grid size-12 place-items-center rounded-full bg-foreground text-background">
            <Check className="size-5" />
          </span>
          <h1 className="mt-6 text-xl font-semibold">تم استلام طلب التسجيل</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            ملفك الآن <span className="font-medium text-foreground">قيد المراجعة</span>: يتحقق
            فريقنا من معلوماتك قبل نشره للزبائن. الخطوة التالية هي إرسال إيصال تحويل CCP لتفعيل
            اشتراكك وظهور ملفك في نتائج البحث.
          </p>

          <div className="mt-6 rounded-md bg-secondary/70 p-4">
            <p className="text-[11px] text-muted-foreground">رمز متابعة ملفك</p>
            <p className="num mt-1 text-lg font-semibold tracking-widest">{created.code}</p>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
              احتفظ بهذا الرمز، أو تابع ملفك لاحقاً برقم هاتفك من صفحة «حالتي».
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              className="gap-2"
              onClick={() => navigate(`/subscribe/${created.artisanId}`)}
            >
              <ClipboardCheck className="size-4" />
              اختر باقة الاشتراك
            </Button>
            {isAuthenticated ? (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/my">
                  <UserPlus className="size-4" />
                  اربط الملف بحسابي
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2">
                <Link to={`/login?role=artisan&returnTo=/my`}>
                  <UserPlus className="size-4" />
                  أنشئ حساب حرفي لربط الملف
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link to="/me">متابعة برقم الهاتف</Link>
            </Button>
          </div>

          <p className="mt-6 rounded-md bg-secondary/70 p-4 text-[11px] leading-6 text-muted-foreground">
            إن أنشأت حساب حرفي، اربط هذا الملف بحسابك من «حساب الحرفي» برقم هاتفك ورمز المتابعة
            أعلاه، ثم تابع الاشتراك وتقييمات الزبائن من مكان واحد.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <header className="border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>تسجيل حرفي جديد</Kicker>
        </div>
        <h1 className="mt-4 text-2xl font-semibold leading-snug">
          أضف ملفك إلى دليل الصنايعية
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          ثلاث خطوات قصيرة: معلوماتك، صور أعمالك، ثم التأكيد. تُراجَع الملفات يدوياً قبل النشر،
          ويمكنك ربط الملف بحسابك بعد إنشائه لمتابعة الاشتراك من مكان واحد.
        </p>
      </header>

      {/* مؤشر الخطوات */}
      <ol className="mt-7 flex items-center gap-3">
        {STEP_LABELS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => index < step && setStep(index)}
              className={cn(
                "flex flex-1 items-center gap-2.5 border-t-2 pt-3 text-start text-xs transition-colors",
                index <= step ? "border-foreground text-foreground" : "border-border text-muted-foreground",
              )}
            >
              <span className="num text-[11px] text-muted-foreground">0{index + 1}</span>
              <span className={index === step ? "font-medium" : undefined}>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* الخطوة 1 */}
      {step === 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Field label="الاسم واللقب" required className="md:col-span-2">
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="مثال: مراد بن عمار"
            />
          </Field>

          <Field label="رقم الهاتف" required hint="سيظهر للزبائن في زر الاتصال.">
            <Input
              value={phone}
              dir="ltr"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0551234567"
            />
          </Field>

          <Field label="التخصص" required>
            <NativeSelect
              value={specialty}
              onChange={setSpecialty}
              placeholder="اختر تخصصك"
              options={SPECIALTIES.map((item) => ({ value: item, label: item }))}
            />
          </Field>

          <Field label="الولاية" required>
            <NativeSelect
              value={wilaya}
              onChange={(value) => {
                setWilaya(value);
                setCommune("");
              }}
              placeholder="اختر الولاية"
              options={WILAYAS.map((item) => ({ value: item.name, label: `${item.name} (${item.code})` }))}
            />
          </Field>

          <Field label="الحي / البلدية" required hint={communes.length ? "اقتراحات من بلديات الولاية" : undefined}>
            <>
              <Input
                value={commune}
                list="join-communes"
                onChange={(event) => setCommune(event.target.value)}
                placeholder="مثال: باب الوادي"
              />
              <datalist id="join-communes">
                {communes.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </>
          </Field>

          <Field label="سنوات الخبرة">
            <Input
              value={yearsExperience}
              inputMode="numeric"
              onChange={(event) => setYearsExperience(event.target.value.replace(/\D/g, ""))}
              placeholder="مثال: 8"
            />
          </Field>

          <Field
            label="وصف قصير عن خبرتك"
            hint="اكتب ما تتقنه والمناطق التي تخدمها. جملة أو جملتان تكفيان."
            className="md:col-span-2"
          >
            <Textarea
              value={bio}
              rows={4}
              maxLength={400}
              onChange={(event) => setBio(event.target.value)}
              placeholder="مثال: سبّاك منذ 12 سنة، أتدخّل في نفس اليوم داخل بلديات العاصمة: تسريبات، تجديد شبكات، تركيب سخانات."
            />
          </Field>
        </div>
      )}

      {/* الخطوة 2 */}
      {step === 1 && (
        <div className="mt-8 flex flex-col gap-8">
          <ImageUpload
            label="صورة شخصية"
            value={photoId}
            onChange={setPhotoId}
            hint="صورة واضحة لوجهك أو لشعار ورشتك. تُضغط تلقائياً قبل الرفع."
          />

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">صور أعمال سابقة (قبل / بعد)</p>
                <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                  أضف حتى 4 أعمال. الصور قبل/بعد ترفع ثقة الزبون كثيراً.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={works.length >= 4}
                onClick={() =>
                  setWorks((current) => [...current, { caption: "", beforeId: null, afterId: null }])
                }
              >
                <Plus className="size-3.5" />
                إضافة عمل
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-5">
              {works.map((work, index) => (
                <div key={index} className="rounded-lg border border-border p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="num text-[11px] text-muted-foreground">
                      عمل رقم {index + 1}
                    </span>
                    {works.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setWorks((current) => current.filter((_, i) => i !== index))
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        حذف
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ImageUpload
                      label="قبل"
                      compact
                      value={work.beforeId}
                      onChange={(id) => updateWork(index, { beforeId: id })}
                    />
                    <ImageUpload
                      label="بعد"
                      compact
                      value={work.afterId}
                      onChange={(id) => updateWork(index, { afterId: id })}
                    />
                  </div>

                  <Input
                    className="mt-4"
                    value={work.caption}
                    maxLength={140}
                    onChange={(event) => updateWork(index, { caption: event.target.value })}
                    placeholder="وصف مختصر: مثال — تجديد شبكة مياه لشقة F3"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* الخطوة 3 */}
      {step === 2 && (
        <div className="mt-8">
          <div className="rounded-lg border border-border">
            <dl className="divide-y divide-border">
              {[
                { label: "الاسم واللقب", value: fullName },
                { label: "رقم الهاتف", value: phone, ltr: true },
                { label: "التخصص", value: specialty },
                { label: "الموقع", value: `${commune}، ${wilaya}` },
                { label: "سنوات الخبرة", value: yearsExperience || "—", num: true },
                { label: "صور الأعمال", value: `${works.length}`, num: true },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd
                    className={cn("text-sm font-medium", row.num && "num")}
                    dir={row.ltr ? "ltr" : undefined}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {bio.trim() && (
            <p className="mt-5 rounded-lg bg-secondary/60 p-5 text-xs leading-7 text-muted-foreground">
              {bio}
            </p>
          )}

          <p className="mt-5 text-[11px] leading-6 text-muted-foreground">
            بإرسال الطلب توافق على نشر معلوماتك (الاسم، التخصص، الحي، رقم الهاتف، صور الأعمال)
            في الدليل العام بعد مراجعة الإدارة.
          </p>
        </div>
      )}

      {/* أزرار التنقل */}
      <div className="mt-9 flex items-center justify-between gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          disabled={step === 0 || busy}
          onClick={() => setStep((value) => Math.max(value - 1, 0))}
        >
          <ArrowRight className="size-4" />
          السابق
        </Button>

        {step < 2 ? (
          <Button type="button" className="gap-2" onClick={next}>
            التالي
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <Button type="button" className="gap-2" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            إرسال الطلب
          </Button>
        )}
      </div>

      <p className="mt-6 text-[11px] leading-6 text-muted-foreground">
        {isAuthenticated ? (
          <>
            ملفك مسجّل مسبقاً؟ اربطه بحسابك من{" "}
            <Link
              to="/my"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              حساب الحرفي
            </Link>
            {" "}
            أو ابحث عنه برقم الهاتف من{" "}
            <Link
              to="/me"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              صفحة «حالتي»
            </Link>
            .
          </>
        ) : (
          <>
            مسجّل من قبل؟ ادخل بحساب الحرفي من{" "}
            <Link
              to="/login?role=artisan&returnTo=/my"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              صفحة الدخول
            </Link>{" "}
            لربط ملفك ومتابعة اشتراكك، أو ابحث عن ملفك برقم الهاتف من{" "}
            <Link
              to="/me"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              صفحة «حالتي»
            </Link>
            .
          </>
        )}
      </p>
    </PageShell>
  );
}
