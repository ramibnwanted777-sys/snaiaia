import { Kicker } from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Clock,
  FileText,
  HelpCircle,
  Scale,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router";

export default function Terms() {
  return (
    <PageShell width="narrow">
      <header className="border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>سياسات وشروط الاستخدام</Kicker>
        </div>
        <h1 className="mt-4 text-2xl font-semibold md:text-3xl">
          قوانين وبنود استخدام دليل الصنايعية
        </h1>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          آخر تحديث: {new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long" })}
          · تنطبق هذه القوانين على كافة مستخدمي المنصة من زبائن وحرفيين لضمان بيئة موثوقة ونزيهة.
        </p>
      </header>

      <div className="mt-8 space-y-10 text-xs leading-7 text-muted-foreground">
        {/* 1. مقدمة وأحكام عامة */}
        <section className="rounded-xl border border-border bg-card p-6 text-foreground">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <Scale className="size-4 text-foreground" />
            <h2>1. أحكام عامة ومفهوم المنصة</h2>
          </div>
          <p className="mt-3 leading-7 text-muted-foreground">
            «دليل الصنايعية» هو منصة رقمية جزائرية تهدف إلى تسهيل الوصول إلى الحرفيين وأصحاب المهن الحرة
            في الأحياء والبلديات عبر ولايات الوطن. المنصة تعمل كدليل وسيط مجاني للزبائن، ولا تتقاضى أي
            عمولات أو نسب من أتعاب الحرفيين، كما أن الاتفاق على السعر وتفاصيل الخدمة يتم مباشرة بين الزبون
            والحرفي دون أي مسؤولية مالية أو تشغيلية على إدارة المنصة.
          </p>
        </section>

        {/* 2. قوانين الحرفيين */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wrench className="size-4" />
            <h2>2. قوانين والتزامات الحرفيين (الصنايعية)</h2>
          </div>
          <div className="grid gap-3">
            {[
              {
                title: "صحة البيانات والصفة المهنية",
                desc: "يلتزم الحرفي بتقديم اسمه الحقيقي، رقم هاتفه الشخصي، تخصصه الدقيق، والولاية والبلدية التي ينشط فيها فعلياً. يُمنع انتحال الشخصيات أو تسجيل أرقام هواتف غير مملوكة له.",
              },
              {
                title: "مصداقية صور الأعمال (قبل / بعد)",
                desc: "يُمنع منعاً باتاً سرقة أو نسخ صور الأعمال من الإنترنت أو من حسابات حرفيين آخرين. كل صورة يرفعها الحرفي يجب أن تكون من إنجازه الفعلي، ومخالفة ذلك تؤدي إلى توقيف الحساب فوراً.",
              },
              {
                title: "الوفاء بالاتفاقات والمواعيد",
                desc: "يلتزم الحرفي باحترام مواعيد العمل المتفق عليها مع الزبائن، والنزاهة في تحديد الأسعار دون استغلال أو مغالاة، وحسن السيرة والتعامل اللائق داخل بيوت ومحلات الزبائن.",
              },
              {
                title: "التوقيف التلقائي فور انتهاء مدة الباقة",
                desc: "تنتهي مدة ظهور الملف الشخصي تلقائياً فور انقضاء مدة الباقة المشترك فيها (شهرية أو سنوية). عند انتهاء المدة يتم إيقاف ظهور الملف من نتائج البحث والخريطة تلقائياً لحين تجديد الاشتراك.",
              },
            ].map((rule, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 bg-secondary/30">
                <p className="font-medium text-foreground">{rule.title}</p>
                <p className="mt-1 leading-6">{rule.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. قوانين الزبائن والتقييمات */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="size-4" />
            <h2>3. قوانين والتزامات الزبائن</h2>
          </div>
          <div className="grid gap-3">
            {[
              {
                title: "المصداقية في التقييمات",
                desc: "التقييم وسيلة أمان للمجتمع؛ يجب أن يعكس التقييم تجربة حقيقية تمت بين الزبون والحرفي. يُمنع التقييم العشوائي أو التقييم الكيدي غير المبني على تعامل فعلي.",
              },
              {
                title: "منع التشهير والألفاظ غير اللائقة",
                desc: "يُحظر كتابة أي تعليق يتضمن سباً، شتماً، تشهيراً، أو ألفاظاً نابية. تحتفظ الإدارة بحق إخفاء أي تقييم مخالف وحظر الحساب المسؤول عنه.",
              },
              {
                title: "احترام خصوصية الحرفي",
                desc: "يُرجى التواصل مع الحرفيين في أوقات العمل المعقولة، وعدم إزعاجهم بطلبات وهمية.",
              },
            ].map((rule, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 bg-secondary/30">
                <p className="font-medium text-foreground">{rule.title}</p>
                <p className="mt-1 leading-6">{rule.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. صلاحيات الإدارة وغلق الحسابات */}
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-foreground">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Ban className="size-4" />
            <h2>4. صلاحيات الإدارة وحظر الحسابات المخالفة</h2>
          </div>
          <p className="mt-3 leading-7 text-muted-foreground">
            تتمتع إدارة «دليل الصنايعية» بالصلاحية الكاملة والمطلقة لمراقبة جودة المنصة وحماية مستخدميها:
          </p>
          <ul className="mt-3 list-disc space-y-2 pe-5 text-muted-foreground">
            <li>
              يحق للإدارة <strong className="text-foreground">توقيف، تجميد، أو غلق وحذف أي حساب بشكل نهائي</strong> (سواء كان حساب حرفي أو زبون) فور ارتكاب أي مخالفة للبنود، أو ثبوت شكاوى احتيال أو سوء معاملة.
            </li>
            <li>
              في حال تم غلق أو توقيف حساب حرفي لمخالفة القوانين، <strong className="text-foreground">لا يحق له المطالبة باسترجاع قيمة الاشتراك</strong> المدفوع.
            </li>
            <li>
              يتم توقيف الحسابات تلقائياً فور انتهاء مدة الاشتراك، ويمكن إعادة تفعيلها فور تأكيد تحويل التجديد.
            </li>
          </ul>
        </section>

        {/* 5. الاشتراكات والدفع */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BadgeCheck className="size-4" />
            <h2>5. سياسة الاشتراكات والتحويل البريدي (CCP)</h2>
          </div>
          <p className="leading-7">
            يتم دفع رسوم الباقات عبر التحويل البريدي (CCP) أو تطبيق BaridiMob. بعد إتمام التحويل يقوم
            الحرفي برفع صورة الوصل وإدخال رقم الحوالة، وتتولى الإدارة المراجعة اليدوية وتأكيد الاشتراك في
            أسرع وقت. تفعيل الباقة يضمن للحرفي الظهور خلال كامل المدة المحددة (شهر أو سنة).
          </p>
        </section>

        {/* ختام وتواصل */}
        <section className="border-t border-border pt-6">
          <p className="text-muted-foreground">
            لأي استفسارات حول الشروط والقوانين أو للإبلاغ عن أي مخالفة، يرجى التواصل مع إدارة المنصة.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/search">تصفح الدليل</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/join">الانضمام كحرفي</Link>
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

