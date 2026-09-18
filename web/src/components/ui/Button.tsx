import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-ink-inverse hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-hover",
  ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
};

interface ButtonProps extends Omit<ComponentProps<"button">, "className"> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) => (
  <button
    type="button"
    className={cn(BASE_CLASS, VARIANT_CLASS[variant], className)}
    {...props}
  >
    {children}
  </button>
);

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export const ButtonLink = ({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) => (
  <Link
    className={cn(BASE_CLASS, VARIANT_CLASS[variant], className)}
    {...props}
  >
    {children}
  </Link>
);
