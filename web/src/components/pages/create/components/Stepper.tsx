"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export interface StepDefinition {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepDefinition[];
  current: number;
  /** A step you cannot satisfy yet is not a step you can jump to. */
  isReachable: (index: number) => boolean;
  onSelect: (index: number) => void;
}

export const Stepper = ({
  steps,
  current,
  isReachable,
  onSelect,
}: StepperProps) => (
  <ol className="flex items-start">
    {steps.map((step, index) => {
      const isDone = index < current;
      const isCurrent = index === current;
      const canSelect = isReachable(index) && !isCurrent;

      return (
        <li
          key={step.id}
          className={cn(
            "flex min-w-0 items-start",
            index < steps.length - 1 && "flex-1",
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(index)}
            disabled={!canSelect}
            aria-current={isCurrent ? "step" : undefined}
            className="flex shrink-0 flex-col items-center gap-2 disabled:cursor-default"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 ease-out",
                isDone || isCurrent
                  ? "bg-ink text-ink-inverse"
                  : "border border-line bg-surface text-ink-subtle",
                canSelect && "hover:opacity-80",
              )}
            >
              {isDone ? (
                <CheckIcon size={14} weight="bold" aria-hidden />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-xs whitespace-nowrap",
                isCurrent ? "font-semibold text-ink" : "text-ink-muted",
              )}
            >
              {step.label}
            </span>
          </button>

          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "mx-2 mt-4 h-px flex-1 transition-colors duration-150 ease-out",
                isDone ? "bg-ink" : "bg-line",
              )}
            />
          ) : null}
        </li>
      );
    })}
  </ol>
);
