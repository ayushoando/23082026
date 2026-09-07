"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const phIconMap = {
  minus: Minus,
  plus: Plus,
} as const;

type PhIconName = keyof typeof phIconMap;

function PhIcon({ name, className, size = 14 }: { name: PhIconName; className?: string; size?: number }) {
  const Icon = phIconMap[name];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

type NumberStepperProps = {
  id?: string;
  value: number;
  onChange?: (value: number) => void;
  /** Alias used by older call sites / tests */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
};

/** FOCSS number stepper — no Radix. */
function NumberStepper({
  id,
  value,
  onChange,
  onValueChange,
  min,
  max,
  step = 1,
  className,
  "aria-label": ariaLabel = "Number",
}: NumberStepperProps) {
  const emit = onValueChange ?? onChange ?? (() => undefined);

  const clamp = (n: number) => {
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  return (
    <div className={cn("admin-inline-row", className)} role="group" aria-label={ariaLabel}>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Decrease"
        onClick={() => emit(clamp(value - step))}
      >
        <PhIcon name="minus" size={14} />
      </Button>
      <Input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const nextValue = e.currentTarget.valueAsNumber;
          if (Number.isFinite(nextValue)) {
            emit(clamp(nextValue));
          }
        }}
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Increase"
        onClick={() => emit(clamp(value + step))}
      >
        <PhIcon name="plus" size={14} />
      </Button>
    </div>
  );
}

export { NumberStepper };
