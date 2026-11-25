"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted">We couldn&apos;t load this page. Please try again.</p>
        {error.digest && <p className="mt-1 text-xs text-muted">Reference: {error.digest}</p>}
        <Button className="mt-6" size="lg" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
