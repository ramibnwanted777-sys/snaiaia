import { ArtisanCard } from "@/components/ArtisanCard";
import { EmptyState, Field, Kicker, LoadingBlock, NativeSelect } from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { communesOf, SPECIALTIES, WILAYA_NAMES } from "@/convex/data";
import { formatNumber } from "@/lib/format";
import { useQuery } from "convex/react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();

  const specialty = params.get("specialty") ?? "";
  const wilaya = params.get("wilaya") ?? "";
  const commune = params.get("commune") ?? "";
  const q = params.get("q") ?? "";

  const results = useQuery(api.artisans.search, {
    specialty: specialty || undefined,
    wilaya: wilaya || undefined,
    commune: commune || undefined,
    q: q || undefined,
  });

  const communes = useMemo(() => communesOf(wilaya), [wilaya]);
  const hasFilters = Boolean(specialty || wilaya || commune || q);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const joinParams = new URLSearchParams();
  if (wilaya) joinParams.set("wilaya", wilaya);
  if (commune) joinParams.set("commune", commune);
  const joinLink = `/join${joinParams.toString() ? `?${joinParams.toString()}` : ""}`;

  return (
    <PageShell>
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>البحث للزبائن · بدون تسجيل دخول</Kicker>
        </div>
        <h1 className="text-2xl font-semibold leading-snug md:text-3xl">
          ابحث عن حرفي في ولايتك
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          حدّد التخصص والولاية، وأضف اسم الحي للوصول إلى أقرب حرفي إليك. الترتيب يضع
          الباقات المميزة أولاً ثم الأعلى تقييماً.
        </p>
      </header>

      {/* الفلاتر */}
      <section className="mt-8 rounded-lg border border-border p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            معايير البحث
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              إزالة الفلاتر
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="التخصص">
            <NativeSelect
              value={specialty}
              onChange={(value) => update("specialty", value)}
              placeholder="كل التخصصات"
              options={SPECIALTIES.map((item) => ({ value: item, label: item }))}
            />
          </Field>

          <Field label="الولاية">
            <NativeSelect
              value={wilaya}
              onChange={(value) => update("wilaya", value)}
              placeholder="كل الولايات"
              options={WILAYA_NAMES.map((item) => ({ value: item, label: item }))}
            />
          </Field>

          <Field label="الحي / البلدية" hint={communes.length ? "اقتراحات من بلديات الولاية" : undefined}>
            <>
              <Input
                value={commune}
                list="commune-options"
                placeholder="مثال: باب الوادي"
                onChange={(event) => update("commune", event.target.value)}
              />
              <datalist id="commune-options">
                {communes.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </>
          </Field>

          <Field label="اسم الحرفي أو كلمة مفتاحية">
            <Input
              value={q}
              placeholder="مثال: تسريب، سخّان…"
              onChange={(event) => update("q", event.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* النتائج */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm font-medium">
            {results === undefined ? (
              "جارٍ البحث…"
            ) : results.length === 0 ? (
              "لا توجد نتائج"
            ) : (
              <>
                <span className="num">{formatNumber(results.length)}</span> حرفيًا في هذه النتائج
              </>
            )}
          </p>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <SearchIcon className="size-3.5" />
            الترتيب: المميزون أولاً، ثم الأعلى تقييماً
          </p>
        </div>

        <div className="mt-2">
          {results === undefined ? (
            <div className="pt-6">
              <LoadingBlock label="جارٍ تحميل الحرفيين…" />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="لم نجد حرفياً بهذه المعايير"
              description="جرّب توسيع البحث إلى الولاية كلها أو تغيير التخصص. وإن كنت حرفياً في هذا الحي، يستطيع سكان الحي أن يجدوك هنا بعد التسجيل."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                    إعادة ضبط البحث
                  </Button>
                  <Button asChild>
                    <Link to={joinLink}>سجّل حرفياً في هذا الحي</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            results.map((artisan) => <ArtisanCard key={artisan._id} artisan={artisan} />)
          )}
        </div>
      </section>

      <section className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary/60 px-6 py-5">
        <p className="text-xs leading-6 text-muted-foreground">
          لم تجد الحرفي المناسب؟ سجّل حرفياً تعرفه — التسجيل مجاني والاشتراك من 1000 دج شهرياً.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={joinLink}>أضف حرفياً</Link>
        </Button>
      </section>
    </PageShell>
  );
}
