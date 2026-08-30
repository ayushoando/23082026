"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlannerFurnitureBoq } from "@planner/lib/boq/types";
import { submitPlannerHandoff } from "@planner/lib/plannerApi";
import {
  plannerHandoffRequestSchema,
  type PlannerHandoffRequest,
} from "@planner/lib/handoff/handoffSchema";
import {
  EMPTY_PLANNER_HANDOFF_DRAFT,
  parsePlannerHandoffRecoveryState,
  serializePlannerHandoffRecoveryState,
  type PlannerHandoffDraft,
  type PlannerHandoffRecoveryState,
} from "@planner/lib/handoff/handoffRecovery";
import { usePlannerFocusManager } from "@planner/hooks/usePlannerFocusManager";

interface PlannerHandoffDialogProps {
  boq: PlannerFurnitureBoq;
  onClose: () => void;
}

type HandoffField = keyof PlannerHandoffDraft;
type HandoffErrors = Partial<Record<HandoffField | "form", string>>;

function draftKey(hash: string): string {
  return `planner.handoff.draft.${hash.slice(0, 24)}`;
}

function makeIdempotencyKey(hash: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `handoff-${hash.slice(0, 16)}-${suffix}`.slice(0, 120);
}

function readRecoveryState(hash: string): PlannerHandoffRecoveryState {
  const createIdempotencyKey = () => makeIdempotencyKey(hash);
  if (typeof window === "undefined") {
    return parsePlannerHandoffRecoveryState(null, createIdempotencyKey);
  }
  try {
    return parsePlannerHandoffRecoveryState(
      localStorage.getItem(draftKey(hash)),
      createIdempotencyKey,
    );
  } catch {
    return parsePlannerHandoffRecoveryState(null, createIdempotencyKey);
  }
}

export function PlannerHandoffDialog({ boq, onClose }: PlannerHandoffDialogProps) {
  const [recovery, setRecovery] = useState<PlannerHandoffRecoveryState>(() =>
    readRecoveryState(boq.calculationHash));
  const draft = recovery.draft;
  const referenceId = recovery.confirmation?.referenceId ?? null;
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<HandoffErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const closeDialog = useCallback(() => onClose(), [onClose]);
  const idempotencyKey = recovery.idempotencyKey;

  usePlannerFocusManager({
    open: true,
    containerRef: dialogRef,
    modal: true,
    initialFocusRef: firstFieldRef,
    onClose: closeDialog,
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        draftKey(boq.calculationHash),
        serializePlannerHandoffRecoveryState(recovery),
      );
    } catch {
      // Draft recovery is best effort; the live form remains authoritative.
    }
  }, [boq.calculationHash, recovery]);

  useEffect(() => {
    if (!referenceId) return;
    requestAnimationFrame(() => successRef.current?.focus());
  }, [referenceId]);

  useEffect(() => {
    if (!errors.form) return;
    queueMicrotask(() => formErrorRef.current?.focus());
  }, [errors.form]);

  const update = <K extends HandoffField>(field: K, value: PlannerHandoffDraft[K]) => {
    setRecovery((current) => ({
      ...current,
      draft: { ...current.draft, [field]: value },
    }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const submit = async () => {
    const payload: PlannerHandoffRequest = {
      contact: {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        company: draft.company,
        notes: draft.notes,
      },
      boq: {
        projectId: boq.projectId,
        projectName: boq.projectName,
        calculationHash: boq.calculationHash,
        lines: boq.lines,
        subtotalInr: boq.subtotalInr,
        gstInr: boq.gstInr,
        totalInr: boq.totalInr,
      },
      consent: draft.consent as true,
      inquiryType: draft.inquiryType,
      idempotencyKey,
      projectNotes: draft.notes,
    };
    const parsed = plannerHandoffRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: HandoffErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        const field = path.startsWith("contact.")
          ? path.slice("contact.".length)
          : path;
        if (field in EMPTY_PLANNER_HANDOFF_DRAFT && !nextErrors[field as HandoffField]) {
          nextErrors[field as HandoffField] = issue.message;
        }
      }
      setErrors(nextErrors);
      queueMicrotask(() => {
        dialogRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      const result = await submitPlannerHandoff(parsed.data);
      setRecovery((current) => ({
        ...current,
        confirmation: {
          referenceId: result.referenceId,
          createdAt: result.createdAt,
        },
      }));
    } catch (error: unknown) {
      setErrors({
        form: error instanceof Error
          ? error.message
          : "Your request could not be sent. Your details are preserved; try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="dialog-scrim"
      role="presentation"
      data-testid="planner-handoff-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div
        ref={dialogRef}
        className="dialog planner-handoff"
        data-testid="planner-handoff-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-handoff-title"
        aria-describedby={`planner-handoff-description planner-handoff-instructions${errors.form ? " planner-handoff-form-error" : ""}`}
        aria-busy={busy}
      >
        <header className="planner-handoff__head">
          <strong id="planner-handoff-title">Request quote</strong>
          <button type="button" className="btn btn--sm" onClick={closeDialog} data-testid="handoff-close">
            Close
          </button>
        </header>
        <p id="planner-handoff-description" className="planner-handoff__description">
          Share this BOQ with our team. This does not grant access to your plan.
        </p>
        <p id="planner-handoff-instructions" className="planner-handoff__description">
          Enter your name, at least one contact method, and consent before submitting. Fields with an error are identified below and keep the values you entered.
        </p>
        {referenceId ? (
          <div
            ref={successRef}
            className="planner-handoff__success"
            role="status"
            aria-live="polite"
            tabIndex={-1}
            data-testid="handoff-success"
          >
            <strong>Request received</strong>
            <span>Reference: <span className="planner-disclosed-value">{referenceId}</span></span>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="prop-row" htmlFor="planner-handoff-name">
              <span className="prop-row__label">Name</span>
              <input
                ref={firstFieldRef}
                id="planner-handoff-name"
                className="input"
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "planner-handoff-name-error" : undefined}
                data-testid="handoff-name"
              />
            </label>
            {errors.name ? <p id="planner-handoff-name-error" className="planner-field-error" role="alert">{errors.name}</p> : null}

            <label className="prop-row" htmlFor="planner-handoff-email">
              <span className="prop-row__label">Email</span>
              <input
                id="planner-handoff-email"
                className="input"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) => update("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "planner-handoff-email-error" : undefined}
                data-testid="handoff-email"
              />
            </label>
            {errors.email ? <p id="planner-handoff-email-error" className="planner-field-error" role="alert">{errors.email}</p> : null}

            <label className="prop-row" htmlFor="planner-handoff-phone">
              <span className="prop-row__label">Phone</span>
              <input
                id="planner-handoff-phone"
                className="input"
                type="tel"
                autoComplete="tel"
                value={draft.phone}
                onChange={(event) => update("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "planner-handoff-phone-error" : undefined}
                data-testid="handoff-phone"
              />
            </label>
            {errors.phone ? <p id="planner-handoff-phone-error" className="planner-field-error" role="alert">{errors.phone}</p> : null}

            <label className="prop-row" htmlFor="planner-handoff-company">
              <span className="prop-row__label">Company</span>
              <input
                id="planner-handoff-company"
                className="input"
                autoComplete="organization"
                value={draft.company}
                onChange={(event) => update("company", event.target.value)}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={errors.company ? "planner-handoff-company-error" : undefined}
              />
            </label>
            {errors.company ? <p id="planner-handoff-company-error" className="planner-field-error" role="alert">{errors.company}</p> : null}

            <label className="prop-row" htmlFor="planner-handoff-inquiry">
              <span className="prop-row__label">Inquiry</span>
              <select
                id="planner-handoff-inquiry"
                className="select"
                value={draft.inquiryType}
                onChange={(event) => update("inquiryType", event.target.value as PlannerHandoffDraft["inquiryType"])}
                aria-invalid={Boolean(errors.inquiryType)}
                aria-describedby={errors.inquiryType ? "planner-handoff-inquiry-error" : undefined}
                data-testid="handoff-inquiry"
              >
                <option value="quote">Request a quote</option>
                <option value="design-support">Request design support</option>
                <option value="product-question">Ask a product question</option>
              </select>
            </label>
            {errors.inquiryType ? <p id="planner-handoff-inquiry-error" className="planner-field-error" role="alert">{errors.inquiryType}</p> : null}

            <label className="prop-row" htmlFor="planner-handoff-notes">
              <span className="prop-row__label">Notes</span>
              <textarea
                id="planner-handoff-notes"
                className="input"
                value={draft.notes}
                onChange={(event) => update("notes", event.target.value)}
                aria-invalid={Boolean(errors.notes)}
                aria-describedby={errors.notes ? "planner-handoff-notes-error" : undefined}
                data-testid="handoff-notes"
                rows={3}
              />
            </label>
            {errors.notes ? <p id="planner-handoff-notes-error" className="planner-field-error" role="alert">{errors.notes}</p> : null}

            <label className="planner-consent" htmlFor="planner-handoff-consent">
              <input
                id="planner-handoff-consent"
                type="checkbox"
                checked={draft.consent}
                onChange={(event) => update("consent", event.target.checked)}
                aria-required="true"
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? "planner-handoff-consent-error" : undefined}
                data-testid="handoff-consent"
              />
              <span>I consent to being contacted about this inquiry.</span>
            </label>
            {errors.consent ? <p id="planner-handoff-consent-error" className="planner-field-error" role="alert">{errors.consent}</p> : null}

            {errors.form ? (
              <p ref={formErrorRef} id="planner-handoff-form-error" className="planner-handoff__error" role="alert" tabIndex={-1} data-testid="handoff-error">
                {errors.form} Your entered details are still here.
              </p>
            ) : null}
            <div className="dialog__actions">
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={busy}
                data-testid="handoff-submit"
              >
                {busy ? "Sending…" : errors.form ? "Try again" : "Submit request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
