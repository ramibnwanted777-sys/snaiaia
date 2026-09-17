import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { planById } from "./data";
import { randomCode, recomputeRating, requireAdmin, THIRTY_DAYS } from "./lib";

const DAY = 24 * 60 * 60 * 1000;

interface ReviewSeed {
  name: string;
  rating: number;
  comment: string;
}

interface ArtisanSeed {
  fullName: string;
  phone: string;
  specialty: string;
  wilaya: string;
  commune: string;
  bio: string;
  yearsExperience: number;
  status: "pending" | "approved" | "rejected";
  planId?: string;
  subscription?: "none" | "pending" | "active" | "expired";
  startedDaysAgo?: number;
  works: string[];
  reviews: ReviewSeed[];
}

const ARTISANS: ArtisanSeed[] = [
  {
    fullName: "مراد بن عمار",
    phone: "0551214478",
    specialty: "سبّاك",
    wilaya: "الجزائر",
    commune: "باب الوادي",
    bio: "أعمل في السباكة منذ 12 سنة: تسريبات المياه، تجديد الشبكات، تركيب السخانات وتصريف الانسدادات. أتدخّل في نفس اليوم داخل بلديات العاصمة.",
    yearsExperience: 12,
    status: "approved",
    planId: "premium",
    subscription: "active",
    startedDaysAgo: 12,
    works: [
      "تجديد شبكة المياه لشقة F3 — باب الوادي",
      "تركيب سخّان غازي مع الحماية — القصبة",
      "إصلاح تسريب في الجدار دون تكسير واسع — حسين داي",
    ],
    reviews: [
      { name: "أمينة ح.", rating: 5, comment: "جاء في نفس الساعة وحدّد المشكل بدقة. الأثمنة واضحة قبل البدء." },
      { name: "سمير ط.", rating: 5, comment: "عمل نظيف وشرح لي سبب التسريب. أنصح به لكل سكان الحي." },
      { name: "كريم ب.", rating: 4, comment: "خدمة جيدة، تأخّر قليلاً بسبب الازدحام." },
      { name: "نوال ص.", rating: 5, comment: "أعاد لي الماء الساخن في نفس المساء. شكراً." },
    ],
  },
  {
    fullName: "سمير حجاج",
    phone: "0662419087",
    specialty: "كهربائي",
    wilaya: "الجزائر",
    commune: "القبة",
    bio: "كهربائي مباني: لوحات كهربائية، إعادة تأهيل الشبكات القديمة، تركيب الإنارة والمنافذ، وتشخيص انقطاعات التيار.",
    yearsExperience: 8,
    status: "approved",
    planId: "basic",
    subscription: "active",
    startedDaysAgo: 20,
    works: ["إعادة تأهيل لوحة كهربائية لبناء كامل — القبة", "تركيب إنارة LED لمقهى — بئر مراد رايس"],
    reviews: [
      { name: "عبد الحق م.", rating: 5, comment: "شخّص المشكل في عشر دقائق بعد ما فشل غيري في حله." },
      { name: "هدى ب.", rating: 4, comment: "عمل مرتّب وسعر معقول." },
      { name: "ياسين ك.", rating: 5, comment: "محترم وشرح لي كيف أتجنّب رجوع المشكل." },
    ],
  },
  {
    fullName: "ياسين بلقاسم",
    phone: "0770556123",
    specialty: "فنّي مكيّفات",
    wilaya: "وهران",
    commune: "بئر الجير",
    bio: "تركيب وصيانة وتنظيف المكيّفات، تعبئة الغاز، وإصلاح أعطال الوحدات الخارجية. خدمة المؤسسات والمنازل.",
    yearsExperience: 10,
    status: "approved",
    planId: "premium",
    subscription: "active",
    startedDaysAgo: 5,
    works: [
      "تركيب مكيّف 18000 وحدة في صالون — بئر الجير",
      "تنظيف وصيانة 6 مكيّفات لمكتب — وهران الوسط",
    ],
    reviews: [
      { name: "إلياس ز.", rating: 5, comment: "تركيب نظيف واختبار كامل قبل المغادرة." },
      { name: "فاطمة ل.", rating: 5, comment: "فنّي محترف، نصيحة: احجزوه قبل الصيف." },
      { name: "مراد أ.", rating: 4, comment: "خدمة جيدة، وصل متأخراً نصف ساعة." },
      { name: "رضا ن.", rating: 5, comment: "أصلح عطلاً استمر شهراً. شكراً." },
    ],
  },
  {
    fullName: "عبد القادر مسعودي",
    phone: "0668341220",
    specialty: "نجّار",
    wilaya: "قسنطينة",
    commune: "الخروب",
    bio: "نجارة الألمنيوم والخشب: خزائن، أسرّة، مطابخ مجهّزة، وتصليح الأبواب والنوافذ. ورشة خاصة مع أخذ المقاسات في المنزل.",
    yearsExperience: 15,
    status: "approved",
    planId: "basic",
    subscription: "active",
    startedDaysAgo: 27,
    works: ["مطبخ خشبي بمقاس حسب الطلب — الخروب", "تصليح أبواب قديمة بدل تغييرها — قسنطينة"],
    reviews: [
      { name: "سعاد م.", rating: 5, comment: "أخذ المقاسات بدقة والخزانة جاءت كما في الرسم تماماً." },
      { name: "بلال ح.", rating: 5, comment: "خشب ممتاز وتشطيب راقٍ." },
      { name: "أحمد ر.", rating: 4, comment: "الجودة تستحق، لكن التوقيت أخذ أسبوعاً أكثر من المتفق." },
    ],
  },
  {
    fullName: "فؤاد زيتوني",
    phone: "0559071234",
    specialty: "سبّاك",
    wilaya: "البليدة",
    commune: "أولاد يعيش",
    bio: "كشف التسريبات بأجهزة دقيقة، تجديد شبكات الصرف، وتركيب الحمّامات الكاملة. بدون تكسير غير ضروري.",
    yearsExperience: 6,
    status: "approved",
    planId: "yearly",
    subscription: "active",
    startedDaysAgo: 40,
    works: ["كشف تسريب تحت البلاط دون تكسير كامل — أولاد يعيش", "تركيب حمّام كامل — بوفاريك"],
    reviews: [
      { name: "محمد و.", rating: 5, comment: "أهم شيء: لم يكسّر إلا في المكان اللازم فقط." },
      { name: "ليلى ب.", rating: 5, comment: "نظيف في عمله ويترك المكان مرتّباً." },
      { name: "عمار ج.", rating: 5, comment: "اتصلت به صباحاً وجاء مساء نفس اليوم." },
      { name: "سفيان ت.", rating: 4, comment: "خدمة ممتازة وسعر في المتناول." },
      { name: "خديجة ن.", rating: 5, comment: "موثوق، أوصي به بشدة." },
    ],
  },
  {
    fullName: "كريم أوبيش",
    phone: "0776290451",
    specialty: "كهربائي",
    wilaya: "سطيف",
    commune: "العلمة",
    bio: "كهرباء المنازل والمحلات: تمديد الأسلاك، تركيب العدّادات الفرعية، وإصلاح الأجهزة الكهربائية المنزلية.",
    yearsExperience: 5,
    status: "approved",
    planId: "basic",
    subscription: "active",
    startedDaysAgo: 9,
    works: ["تمديد كهرباء لمحل تجاري — العلمة"],
    reviews: [
      { name: "ناصر ع.", rating: 4, comment: "عمل جيد واحترم السعر المتفق عليه." },
      { name: "سميرة د.", rating: 5, comment: "شرح لي المشكل بلغة سهلة ولم يستغل جهلي." },
    ],
  },
  {
    fullName: "حكيم داودي",
    phone: "0661123399",
    specialty: "دهّان",
    wilaya: "عنابة",
    commune: "البوني",
    bio: "دهن داخلي وخارجي، ديكورات جدارية وورق حائط، مع تحضير الجدران ومعالجة الرطوبة قبل الدهن.",
    yearsExperience: 9,
    status: "approved",
    planId: "premium",
    subscription: "pending",
    works: ["دهن شقة F4 بالكامل — البوني", "معالجة رطوبة ودهن خارجي — سيدي عمار"],
    reviews: [
      { name: "وليد ق.", rating: 5, comment: "أحسن دهّان تعاملت معه في عنابة." },
      { name: "أمنة ب.", rating: 4, comment: "النتيجة جميلة، غطّى الأثاث جيداً." },
    ],
  },
  {
    fullName: "نبيل شريف",
    phone: "0554312908",
    specialty: "جبس وديكور",
    wilaya: "تيزي وزو",
    commune: "عزازقة",
    bio: "أسقف جبسية، إنارة مخفية، فواصل وديكورات عصرية. تصميم ثلاثي الأبعاد قبل التنفيذ.",
    yearsExperience: 11,
    status: "approved",
    planId: "premium",
    subscription: "active",
    startedDaysAgo: 15,
    works: ["سقف جبسي مع إنارة مخفية — عزازقة", "ديكور جبس لصالة استقبال — ذراع بن خدة"],
    reviews: [
      { name: "رشيد أ.", rating: 5, comment: "الديكور خرج أجمل من الصور التي أرسلها." },
      { name: "تيزيري ح.", rating: 5, comment: "دقيق في المواعيد ونظيف في الورشة." },
      { name: "نادية م.", rating: 4, comment: "جيد جداً، طلب دفعة مسبقة قبل البدء." },
    ],
  },
  {
    fullName: "رشيد عماري",
    phone: "0778823410",
    specialty: "ألمنيوم وزجاج",
    wilaya: "وهران",
    commune: "السانية",
    bio: "تركيب النوافذ والأبواب الألمنيومية، الحواجز الزجاجية، وتصليح المفصلات والأقفال.",
    yearsExperience: 7,
    status: "approved",
    planId: "basic",
    subscription: "active",
    startedDaysAgo: 3,
    works: ["تركيب نوافذ ألمنيوم لشقة — السانية"],
    reviews: [
      { name: "كمال ب.", rating: 4, comment: "قياسات دقيقة وتركيب سريع." },
      { name: "سارة ع.", rating: 5, comment: "أصلح باباً كان يعلّق منذ سنة. ممتاز." },
    ],
  },
  {
    fullName: "توفيق بن ناصر",
    phone: "0665704321",
    specialty: "بلاط ورخام",
    wilaya: "بجاية",
    commune: "أقبو",
    bio: "تبليط الأرضيات والجدران، تركيب الرخام والغرانيت، وتصليح البلاط المتخلخل دون تغيير الأرضية كاملة.",
    yearsExperience: 14,
    status: "approved",
    planId: "premium",
    subscription: "active",
    startedDaysAgo: 22,
    works: ["تبليط مطبخ وحمّام — أقبو", "تركيب رخام لمدخل عمارة — بجاية"],
    reviews: [
      { name: "علي ص.", rating: 5, comment: "استقامة مثالية في الرخام، لا فراغات ولا فواصل غير متساوية." },
      { name: "حسيبة ل.", rating: 5, comment: "خبير حقيقي، نصحني بنوعية رخام أفضل وأنسب للرطوبة." },
      { name: "عبد النور ت.", rating: 5, comment: "خدمة راقية وسعر مدروس." },
    ],
  },
  {
    fullName: "جلول مزيان",
    phone: "0553119876",
    specialty: "نجّار",
    wilaya: "باتنة",
    commune: "عين التوتة",
    bio: "أثاث خشبي حسب الطلب وأبواب داخلية، مع ترميم القطع القديمة بدل رميها.",
    yearsExperience: 4,
    status: "pending",
    subscription: "none",
    works: ["ترميم خزانة قديمة — عين التوتة"],
    reviews: [],
  },
  {
    fullName: "عمر صحراوي",
    phone: "0770445566",
    specialty: "فنّي مكيّفات",
    wilaya: "ورقلة",
    commune: "حاسي مسعود",
    bio: "صيانة مكيّفات المؤسسات وحقول العمل، عقود صيانة دورية وتنظيف بالماء المضغوط.",
    yearsExperience: 3,
    status: "approved",
    planId: "basic",
    subscription: "active",
    startedDaysAgo: 6,
    works: ["عقد صيانة شهرية لـ 12 مكيّفاً — حاسي مسعود"],
    reviews: [
      { name: "ميلود ب.", rating: 4, comment: "سريع ومنظّم، والأثمنة مكتوبة مسبقاً." },
      { name: "صالح خ.", rating: 5, comment: "التزم بعقد الصيانة شهرياً بدون تأخير." },
    ],
  },
  {
    fullName: "لخضر بوعزة",
    phone: "0669221188",
    specialty: "كهربائي",
    wilaya: "تيبازة",
    commune: "حجوط",
    bio: "20 سنة خبرة في كهرباء البنايات، معاينة مجانية قبل الشروع في العمل وتقدير مكتوب للتكلفة.",
    yearsExperience: 20,
    status: "approved",
    subscription: "none",
    works: ["إعادة تأهيل كهرباء فيلا — حجوط"],
    reviews: [
      { name: "ربيعة ف.", rating: 5, comment: "معاينة مجانية وقدّم لي تقديراً مكتوباً. نادر هذه الأيام." },
      { name: "بلقاسم د.", rating: 5, comment: "خبرة تُرى في التفاصيل." },
      { name: "أمال ح.", rating: 4, comment: "متقن في عمله." },
    ],
  },
  {
    fullName: "سفيان طيبي",
    phone: "0557884412",
    specialty: "سبّاك",
    wilaya: "سطيف",
    commune: "عين ولمان",
    bio: "سباك مبتدئ لكن دقيق: تركيب الصنابير، إصلاح الصرفات، وتركيب المضخات.",
    yearsExperience: 2,
    status: "pending",
    subscription: "none",
    works: ["تركيب مضخة مياه — عين ولمان"],
    reviews: [],
  },
  {
    fullName: "منير قدور",
    phone: "0772330019",
    specialty: "دهّان",
    wilaya: "تلمسان",
    commune: "منصورة",
    bio: "دهن الشقق والمحلات، وتشطيبات بالرخام الصناعي للحوائط. خبرة 17 سنة.",
    yearsExperience: 17,
    status: "approved",
    planId: "basic",
    subscription: "expired",
    startedDaysAgo: 45,
    works: ["دهن محلين تجاريين — منصورة"],
    reviews: [
      { name: "إبراهيم س.", rating: 4, comment: "عمل جيد جداً في وقته." },
      { name: "ياسمين أ.", rating: 5, comment: "أنهى شقة F3 في ثلاثة أيام ونصف." },
    ],
  },
  {
    fullName: "زكرياء حملاوي",
    phone: "0664117722",
    specialty: "بلاط ورخام",
    wilaya: "بسكرة",
    commune: "طولقة",
    bio: "تبليط واجهات وأرضيات، وإصلاح الشقوق في الجدران والسلالم.",
    yearsExperience: 9,
    status: "approved",
    planId: "premium",
    subscription: "active",
    startedDaysAgo: 8,
    works: ["تبليط واجهة محل — طولقة", "إصلاح سلالم عمارة — بسكرة"],
    reviews: [
      { name: "عمر ر.", rating: 5, comment: "واجهة المحل تغيّرت تماماً. احترافية عالية." },
      { name: "لينة ع.", rating: 4, comment: "خدمة جيدة وأسعار معقولة." },
      { name: "جمال ق.", rating: 5, comment: "أنجز العمل قبل الموعد." },
    ],
  },
];

/**
 * بيانات تجريبية لعرض التطبيق.
 * تُنفَّذ تلقائياً إذا كانت قاعدة البيانات فارغة، أو بواسطة الإدارة مع reset.
 */
export const demo = mutation({
  args: { reset: v.optional(v.boolean()), adminToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("artisans").collect();
    if (existing.length > 0) {
      if (!args.reset) return { inserted: 0, skipped: true };
      await requireAdmin(ctx, args.adminToken);
      for (const artisan of existing) {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_artisan", (q) => q.eq("artisanId", artisan._id))
          .collect();
        for (const review of reviews) await ctx.db.delete(review._id);
        const requests = await ctx.db
          .query("subscriptionRequests")
          .withIndex("by_artisan", (q) => q.eq("artisanId", artisan._id))
          .collect();
        for (const request of requests) await ctx.db.delete(request._id);
        await ctx.db.delete(artisan._id);
      }
    }

    const now = Date.now();
    let reviewCount = 0;

    for (let i = 0; i < ARTISANS.length; i += 1) {
      const seed = ARTISANS[i];
      const plan = planById(seed.planId);
      const active = seed.subscription === "active";
      const startedAt = seed.startedDaysAgo ? now - seed.startedDaysAgo * DAY : undefined;

      const artisanId = await ctx.db.insert("artisans", {
        fullName: seed.fullName,
        phone: seed.phone,
        specialty: seed.specialty,
        wilaya: seed.wilaya,
        commune: seed.commune,
        bio: seed.bio,
        yearsExperience: seed.yearsExperience,
        works: seed.works.map((caption) => ({ caption })),
        status: seed.status,
        planId: seed.planId,
        subscriptionStatus: seed.subscription ?? "none",
        subscriptionStartedAt: active ? startedAt : undefined,
        subscriptionExpiresAt:
          seed.subscription === "active" && startedAt && plan
            ? startedAt + plan.months * THIRTY_DAYS
            : seed.subscription === "expired"
              ? now - 3 * DAY
              : undefined,
        ratingSum: 0,
        ratingCount: 0,
        applicationCode: randomCode(),
        createdAt: now - (i + 1) * 3 * DAY,
      });

      for (let j = 0; j < seed.reviews.length; j += 1) {
        const review = seed.reviews[j];
        await ctx.db.insert("reviews", {
          artisanId,
          customerName: review.name,
          rating: review.rating,
          comment: review.comment,
          hidden: false,
          createdAt: now - (j + 1) * 2 * DAY,
        });
        reviewCount += 1;
      }

      await recomputeRating(ctx, artisanId);

      if (seed.subscription === "pending" && plan && seed.planId) {
        await ctx.db.insert("subscriptionRequests", {
          artisanId,
          planId: seed.planId,
          amountDZD: plan.priceDZD,
          payerName: seed.fullName,
          ccpReference: `CCP-${randomCode()}`,
          status: "pending",
          createdAt: now - DAY,
        });
      }
    }

    return { inserted: ARTISANS.length, reviews: reviewCount, skipped: false };
  },
});
