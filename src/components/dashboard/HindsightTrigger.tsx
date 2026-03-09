"use client";

import { useEffect, useRef } from "react";
import { processHindsightChecks } from "@/lib/services/hindsight";
import { useRouter } from "next/navigation";

export default function HindsightTrigger() {
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    processHindsightChecks().then((count) => {
      if (count > 0) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
