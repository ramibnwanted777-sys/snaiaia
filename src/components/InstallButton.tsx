import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { cn } from "@/lib/utils";
import { Download, Check, Smartphone } from "lucide-react";
import { useState } from "react";

/**
 * زر تحميل/تثبيت التطبيق على الأندرويد.
 * يستخدم PWA install prompt على Chrome/Android،
 * ويعطي رابط مباشر للصفحة على الأجهزة الأخرى.
 */
export function InstallButton({
  variant = "outline",
  size = "default",
  className,
  showLabel = true,
}: {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg" | "sm";
  className?: string;
  showLabel?: boolean;
}) {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else {
      // على الأجهزة الأخرى: افتح تثبيت PWA يدوياً أو شرح التثبيت
      // نفتح نفس الصفحة في نافذة جديدة (الأداة ستضيف للشاشة الرئيسية)
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await (navigator as any).share({
            title: "دليل الصنايعية",
            text: "حمّل تطبيق دليل الصنايعية — ابحث عن حرفي في حيّك",
            url: window.location.href,
          });
        } catch {
          // المستخدم ألغى
        }
      }
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" />
        التطبيق مُثبّت
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleInstall}
      disabled={installing}
    >
      {canInstall ? (
        <Download className="size-4" />
      ) : (
        <Smartphone className="size-4" />
      )}
      {showLabel && (
        canInstall
          ? "تحميل التطبيق للأندرويد"
          : "إضافة للشاشة الرئيسية"
      )}
    </Button>
  );
}
