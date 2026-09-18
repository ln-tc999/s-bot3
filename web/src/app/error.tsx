"use client";

import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  reset: () => void;
}

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-ink-muted">
        We could not load this page. Try again, and if it keeps happening the
        network may be unavailable.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
