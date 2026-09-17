import { cn } from "@/lib/utils";
import { formatRating, initials } from "@/lib/format";
import { Check, ChevronDown, Copy, Star } from "lucide-react";
import { useState, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  الصورة البديلة                                                             */
/* -------------------------------------------------------------------------- */

export function Monogram({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className={cn("size-14 shrink-0 rounded-md object-cover hairline border", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "grid size-14 shrink-0 place-items-center rounded-md bg-secondary text-base font-medium text-secondary-foreground hairline border",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  الشارات                                                                    */
/* -------------------------------------------------------------------------- */

export function PremiumBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background num">
      <span className="size-1.5 rounded-full bg-background" />
      {compact ? "مميز" : "باقة مميزة"}
    </span>
  );
}

const TONES = {
  neutral: "border-border text-muted-foreground",
  ink: "border-foreground/25 text-foreground",
  warn: "border-foreground/35 bg-secondary text-foreground",
  danger: "border-destructive/40 text-destructive",
} as const;

export function StatusChip({
  children,
  tone = "neutral",
  className,
  showDot = true,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {showDot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

/** تسمية صغيرة بخط علوي فوق العناوين */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-medium text-muted-foreground", className)}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  التقييم بالنجوم                                                            */
/* -------------------------------------------------------------------------- */

export function Stars({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            style={{ width: size, height: size }}
            className={cn(
              "shrink-0",
              index <= filled ? "fill-foreground text-foreground" : "text-border",
            )}
          />
        ))}
      </span>
      <span className="num text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{formatRating(value)}</span>
        {typeof count === "number" && ` (${count})`}
      </span>
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="التقييم من 1 إلى 5 نجوم">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          role="radio"
          aria-checked={value === index}
          aria-label={`${index} من 5`}
          disabled={disabled}
          onClick={() => onChange(index)}
          className={cn(
            "grid size-11 place-items-center rounded-md border transition-colors",
            index <= value
              ? "border-foreground bg-foreground text-background"
              : "hairline text-muted-foreground hover:border-foreground/40 hover:text-foreground",
          )}
        >
          <Star className={cn("size-5", index <= value && "fill-current")} />
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  عناوين وأقسام                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  kicker,
  title,
  description,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {kicker && (
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>{kicker}</Kicker>
        </div>
      )}
      <h2 className="text-2xl font-semibold leading-snug text-balance md:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-muted-foreground">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs leading-5 text-destructive">{error}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-md text-xs leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <p className="text-xs text-muted-foreground">{label}</p>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-secondary/70" />
      ))}
    </div>
  );
}

/** قائمة اختيار أصلية: خفيفة، سريعة، وتستعمل منتقي النظام على الهاتف */
export function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none rounded-md border border-input bg-background px-3 py-2.5 text-sm",
          "pe-9 transition-colors hover:border-foreground/30 focus:border-foreground focus:outline-none",
          !value && placeholder && "text-muted-foreground",
          disabled && "opacity-60",
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

/** فاصل شعري رقيق مع نص اختياري */
export function HairlineRule({ label }: { label?: string }) {
  if (!label) return <div className="h-px w-full bg-border" />;
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** سطر قابل للنسخ (رقم الحساب البريدي مثلاً) */
export function CopyRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3">
        <span className={cn("text-sm font-medium", mono && "num")} dir="ltr">
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`نسخ ${label}`}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </span>
    </div>
  );
}

/** سطر بيانات: تسمية + قيمة */
export function DataRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="num text-sm font-medium">{value}</span>
    </div>
  );
}
