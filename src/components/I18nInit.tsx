"use client";
import { useEffect } from "react";
import "@/lib/i18n";

export default function I18nInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import("@/lib/i18n");
  }, []);
  return <>{children}</>;
}
