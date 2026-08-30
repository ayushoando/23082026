"use client";

import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Heading,
} from "react-aria-components";
import type { ReactNode } from "react";

type OoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Stable id for the dialog's supporting description. */
  descriptionId?: string;
  children: ReactNode;
  /** FOCSS dialog panel class extras */
  className?: string;
};

/** Minimal FOCSS-styled React Aria modal dialog. */
export function OoDialog({
  open,
  onOpenChange,
  title,
  descriptionId,
  children,
  className,
}: OoDialogProps) {
  return (
    <AriaModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      className="dialog-scrim"
    >
      <AriaModal className={className ? `dialog ${className}` : "dialog"}>
        <AriaDialog aria-describedby={descriptionId}>
          {title ? <Heading slot="title" className="dialog__title">{title}</Heading> : null}
          {children}
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
