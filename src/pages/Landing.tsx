import { ArtisanCard } from "@/components/ArtisanCard";
import {
  CopyRow,
  Field,
  Kicker,
  NativeSelect,
  PremiumBadge,
  SectionHeading,
} from "@/components/kit";
import { MobileTabBar, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  CCP_INFO,
  PAYMENT_NOTE,
  PLANS,
  SPECIALTIES,
  WILAYA_NAMES,
} from "@/convex/data";
import { useAuth } from "@/hooks/use-auth";
import { formatDZD, formatNumber } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  BadgeCheck,
  Check,
  Frame,
  Hammer,
  LayoutGrid,
  Layers,
  MapPin,
  Paintbrush,
  LogIn,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Star,
  UserPlus,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { InstallButton } from "@/components/InstallButton";

const SPECIALTY_ICONS: Record<string, typeof Wrench> = {
  "سبّاك": Wrench,
  "كهربائي": Zap,
  "فنّي مكيّفات": Snowflake,
  "نجّار": Hammer,
  "دهّان": Paintbrush,
  "جبس وديكور": Layers,
  "ألمنيوم وزجاج": Frame,
  "بلاط ورخام": LayoutGrid,
};

const STEPS = [
  {
    index: "01",
    title: "ابحث بالحي",
    body: "اختر التخصص والولاية، أو اكتب اسم الحي. النتائج تظهر فوراً وبدون تسجيل دخول.",
  },
  {
    index: "02",
    title: "قارن التقييمات",
    body: "شاهد تقييم الزبائن بالنجوم، التعليقات، وصور الأعمال السابقة (قبل/بعد) قبل اتخاذ القرار.",
  },
  {
    index: "03",
    title: "اتصل مباشرة",
    body: "زر الاتصال يفتح تطبيق الهاتف مباشرة. لا وسطاء ولا عمولة على الخدمة، الاتفاق بينك وبين الحرفي.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { isLoading, isAuthenticated, user } = useAuth();
  const accountHome = user?.accountType === "artisan" ? "/my" : "/dashboard";
  const [specialty, setSpecialty] = useState("");
  const [wilaya, setWilaya] = useState("");

  // روابط مثل /#pricing تفتح القسم المطلوب عند الوصول من صفحة أخرى
  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const stats = useQuery(api.artisans.stats, {});
  const featured = useQuery(api.artisans.search, { limit: 4 });

  const runSearch = () => {
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (wilaya) params.set("wilaya", wilaya);
    const query = params.toString();
    navigate(`/search${query ? `?${query}` : ""}`);
  };

  const topSpecialties = SPECIALTIES.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* ------------------------------------------------------------------ */}
      {/* رسالة ترحيب                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3 md:px-8">
          <p className="text-xs text-muted-foreground">
            مرحباً بك في <span className="font-medium text-foreground">دليل الصنايعية</span> — أوّل دليل حرفيين في الجزائر. ابحث مجاناً واتّصل مباشرة.
          </p>
          {!isLoading && !isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                to="/login?role=customer"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                دخول الزبون
              </Link>
              <Link
                to="/login?role=artisan"
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-85"
              >
                <UserPlus className="size-3" />
                دخول الحرفي
              </Link>
            </div>
          )}
          {!isLoading && isAuthenticated && (
            <Link
              to={accountHome}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-85"
            >
              حسابي
            </Link>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* الواجهة الرئيسية                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-foreground/25" />
                <Kicker>دليل الحرفيين الجزائري · بحث مجاني للزبائن</Kicker>
              </div>

              <h1 className="mt-7 text-[2.1rem] font-semibold leading-[1.3] text-balance md:text-5xl md:leading-[1.22]">
                حرفي موثوق في حيّك، خلال دقيقة واحدة.
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-8 text-muted-foreground md:text-base">
                سبّاك، كهربائي، فنّي مكيّفات، نجّار… ابحث في ولايتك، اطّلع على الأعمال
                والتقييمات، ثم اتصل بالحرفي مباشرة. بدون تسجيل دخول وبدون أي عمولة على
                الخدمة.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/search">
                    <Search className="size-4" />
                    ابحث عن حرفي
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/join">
                    <UserPlus className="size-4" />
                    سجّل كحرفي
                  </Link>
                </Button>
                {!isAuthenticated && (
                  <Button asChild size="lg" variant="outline" className="gap-2">
                    <Link to="/login">
                      <LogIn className="size-4" />
                      تسجيل الدخول
                    </Link>
                  </Button>
                )}
                <InstallButton size="lg" variant="outline" />
              </div>

              {isAuthenticated && (
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>مسجّل الدخول بالفعل.</span>
                  <Link
                    to={accountHome}
                    className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                  >
                    افتح حسابي
                  </Link>
                </div>
              )}

              <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-border pt-7 sm:grid-cols-4">
                {[
                  { label: "حرفي معتمد", value: formatNumber(stats?.artisans ?? 0) },
                  { label: "ولاية مغطّاة", value: formatNumber(stats?.wilayas ?? 0) },
                  { label: "تقييم زبون", value: formatNumber(stats?.reviews ?? 0) },
                  { label: "تخصص", value: formatNumber(SPECIALTIES.length) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="num text-2xl font-semibold">{item.value}</dt>
                    <dd className="mt-1 text-[11px] text-muted-foreground">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* بحث سريع */}
            <div className="lg:pt-6">
              <div className="rounded-lg border border-border p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium">ابحث الآن</p>
                  <span className="text-[11px] text-muted-foreground">بدون تسجيل</span>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  <Field label="التخصص">
                    <NativeSelect
                      value={specialty}
                      onChange={setSpecialty}
                      placeholder="كل التخصصات"
                      options={SPECIALTIES.map((s) => ({ value: s, label: s }))}
                    />
                  </Field>

                  <Field label="الولاية">
                    <NativeSelect
                      value={wilaya}
                      onChange={setWilaya}
                      placeholder="كل الولايات"
                      options={WILAYA_NAMES.map((w) => ({ value: w, label: w }))}
                    />
                  </Field>

                  <Button type="button" onClick={runSearch} className="mt-1 w-full gap-2">
                    <Search className="size-4" />
                    اعرض الحرفيين
                  </Button>
                </div>

                <div className="mt-7 border-t border-border pt-5">
                  <p className="text-[11px] text-muted-foreground">الأكثر طلباً</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topSpecialties.map((item) => (
                      <Link
                        key={item}
                        to={`/search?specialty=${encodeURIComponent(item)}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-foreground/40"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-lg bg-secondary/60 p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-6 text-muted-foreground">
                  كل ملف حرفي يُراجَع يدوياً من الإدارة، ويُفعَّل اشتراكه فقط بعد تأكيد
                  تحويل الدفع. التقييمات المزيفة تُحذف من طرف الإدارة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* التخصصات                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            kicker="التخصصات"
            title="ابحث حسب الصنعة، لا حسب الحظ"
            description="ثمانية تخصصات أساسية تغطّي أكثر أعطال البيت والحرفة اليومية. اختر التخصص ويظهر لك الحرفيون القريبون منك."
          />

          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {SPECIALTIES.map((item) => {
              const Icon = SPECIALTY_ICONS[item] ?? Wrench;
              return (
                <Link
                  key={item}
                  to={`/search?specialty=${encodeURIComponent(item)}`}
                  className="group flex flex-col gap-4 bg-background p-5 transition-colors hover:bg-secondary/60"
                >
                  <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  <span className="text-sm font-medium">{item}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* كيف يعمل                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            kicker="كيف يعمل"
            title="ثلاث خطوات حتى وصول الحرفي"
          />

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.index} className="flex flex-col gap-4 bg-background p-6 md:p-7">
                <span className="num text-3xl font-light text-muted-foreground">
                  {step.index}
                </span>
                <h3 className="text-base font-medium">{step.title}</h3>
                <p className="text-xs leading-7 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* حرفيون بتقييمات عالية                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              kicker="مميزون"
              title="حرفيون بتقييمات عالية"
              description="أصحاب الباقات المميزة والسنوية يظهرون أولاً في الترتيب، مع شارة مميز على بطاقتهم."
            />
            <Link
              to="/search"
              className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              كل النتائج
            </Link>
          </div>

          <div className="mt-8">
            {featured && featured.length > 0 ? (
              featured.map((artisan) => <ArtisanCard key={artisan._id} artisan={artisan} />)
            ) : (
              <div className="rounded-lg border border-dashed px-6 py-12 text-center">
                <p className="text-sm font-medium">لا يوجد حرفيون منشورون بعد</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  كن أول حرفي في دليلك — التسجيل مجاني والاشتراك يبدأ من 1000 دج شهرياً.
                </p>
                <Button asChild className="mt-5">
                  <Link to="/join">سجّل ملفك الآن</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* الباقات والدفع                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="scroll-mt-20 border-b border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <SectionHeading
            kicker="باقات الاشتراك"
            title="ظهورك في الدليل بسعر واضح وصريح"
            description="الاشتراك للحرفيين فقط. الدفع بالتحويل البريدي CCP، ويُفعَّل الحساب بعد تأكيد الإدارة للوصل."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={
                  plan.premium
                    ? "flex flex-col rounded-lg border border-foreground/25 bg-background p-6 md:p-7"
                    : "flex flex-col rounded-lg border border-border bg-background p-6 md:p-7"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">{plan.name}</h3>
                  {plan.badge ? <PremiumBadge compact /> : null}
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="num text-3xl font-semibold">{formatDZD(plan.priceDZD)}</span>
                  <span className="pb-1 text-xs text-muted-foreground">
                    / {plan.periodLabel}
                  </span>
                </div>
                {plan.originalPriceDZD && (
                  <p className="num mt-1 text-xs text-muted-foreground line-through">
                    {formatDZD(plan.originalPriceDZD)}
                  </p>
                )}

                <p className="mt-4 text-xs leading-6 text-muted-foreground">{plan.tagline}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-border pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs leading-6">
                      <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.premium ? "default" : "outline"}
                  className="mt-7 w-full"
                >
                  <Link to="/join">اختر {plan.name}</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 rounded-lg border border-border bg-background p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-foreground/25" />
                <Kicker>الدفع عبر التحويل البريدي CCP</Kicker>
              </div>
              <h3 className="mt-4 text-lg font-semibold">معلومات الحساب البريدية</h3>
              <div className="mt-4">
                <CopyRow label="اسم المستفيد" value={CCP_INFO.beneficiary} mono={false} />
                <CopyRow label="رقم الحساب CCP" value={CCP_INFO.accountNumber} />
                <CopyRow label="المفتاح (clé)" value={CCP_INFO.key} />
                <CopyRow label="رقم RIP" value={CCP_INFO.rip} />
                <CopyRow label="الوكالة" value={CCP_INFO.agency} mono={false} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">خطوات التحويل</h3>
              <ol className="mt-4 flex flex-col gap-4">
                {CCP_INFO.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-[11px] text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-6 text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-start gap-3 rounded-md bg-secondary/70 p-4">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-6 text-muted-foreground">{PAYMENT_NOTE}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* دعوة أخيرة                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-lg border border-foreground/20 p-7 md:p-9">
              <div>
                <Star className="size-4 text-muted-foreground" />
                <h3 className="mt-5 text-xl font-semibold leading-snug">
                  هل لديك خدمة أنجزتها مؤخراً؟
                </h3>
                <p className="mt-3 max-w-md text-xs leading-7 text-muted-foreground">
                  قيّم الحرفي من نجمة إلى خمس، اكتب تعليقك وأضف صورة للنتيجة. تقييمك يساعد
                  الجيران على اختيار الشخص المناسب.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-8 w-fit gap-2">
                <Link to="/search">
                  <Star className="size-4" />
                  ابحث عن الحرفي وقيّمه
                </Link>
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-foreground/20 p-7 md:p-9">
              <div>
                <Wrench className="size-4 text-muted-foreground" />
                <h3 className="mt-5 text-xl font-semibold leading-snug">
                  هل أنت حرفي؟ أضف ملفك اليوم
                </h3>
                <p className="mt-3 max-w-md text-xs leading-7 text-muted-foreground">
                  املأ معلوماتك، ارفع صور أعمالك «قبل/بعد»، واختر باقتك. بعد تأكيد الدفع
                  يظهر ملفك للزبائن في حيّك ويمكنهم الاتصال بك مباشرة.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button asChild className="gap-2">
                  <Link to="/join">
                    <Phone className="size-4" />
                    سجّل ملفك كحرفي
                  </Link>
                </Button>
                {!isAuthenticated && (
                  <Link
                    to="/login?role=artisan"
                    className="text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                  >
                    لدي حساب حرفي — دخول
                  </Link>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 flex items-center gap-2 text-[11px] text-muted-foreground">
            <MapPin className="size-3.5" />
            58 ولاية · 8 تخصصات · دفع بالتحويل البريدي CCP
          </p>

          {/* قسم تحميل التطبيق */}
          <div className="mt-10 rounded-lg border border-foreground/20 p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-6 md:items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-4 text-muted-foreground" />
                  <Kicker>حمّل التطبيق</Kicker>
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-snug">
                  دليل الصنايعية على هاتفك
                </h3>
                <p className="mt-3 max-w-md text-xs leading-7 text-muted-foreground">
                  أضف الموقع إلى شاشة هاتفك_android كتطبيق — يعمل بدون فتح المتصفح، ويسارع
                  التحميل. اضغط الزر وسيظهر لك خيار "إضافة للشاشة الرئيسية".
                </p>
              </div>
              <div className="shrink-0">
                <InstallButton size="lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
