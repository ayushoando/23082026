"use client";

import { createElement } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { resolvePhIcon, type PhIconName } from "@planner/components/ui/plannerPhIconMap";

export type { PhIconName } from "@planner/components/ui/plannerPhIconMap";

type PhIconProps = {
  name: PhIconName | string;
  size?: number;
  className?: string;
  weight?: IconProps["weight"];
};

/** OO shell icon — maps stable keys to `@phosphor-icons/react`. */
export function PhIcon({ name, size = 18, className, weight = "regular" }: PhIconProps) {
  return createElement(resolvePhIcon(name), {
    size,
    width: size,
    height: size,
    className,
    weight,
    "aria-hidden": true,
  });
}

export default PhIcon;
