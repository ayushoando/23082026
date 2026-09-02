"use client";

import { createElement } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { resolvePhIcon, type PhIconName } from "@studio/components/ui/studioPhIconMap";

export type { PhIconName } from "@studio/components/ui/studioPhIconMap";

type PhIconProps = {
  name: PhIconName | string;
  size?: number;
  className?: string;
  weight?: IconProps["weight"];
};

/** OO shell icon — maps stable keys to `@phosphor-icons/react`. */
export function PhIcon({ name, size = 20, className, weight = "regular" }: PhIconProps) {
  return createElement(resolvePhIcon(name), {
    size,
    className,
    weight,
    "aria-hidden": true,
  });
}

export default PhIcon;
