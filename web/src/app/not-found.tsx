import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-ink-subtle">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Index not found
      </h1>
      <p className="max-w-sm text-sm text-ink-muted">
        No index is published at this name. It may have expired or never
        existed.
      </p>
      <ButtonLink href="/explore">Back to explore</ButtonLink>
    </div>
  );
}
