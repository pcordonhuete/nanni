"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function UpgradeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast("Suscripción activada. ¡Bienvenida a Nanni!");
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router, toast]);

  return null;
}
