"use client";

import Link from "next/link";
import { ArrowRight, LockKey, Sparkle, UserCircle } from "@phosphor-icons/react";

import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";

interface AccessPageProps {
  loginHref: string;
  guestHref: string;
}

export function AccessPage({ loginHref, guestHref }: AccessPageProps) {
  return (
    <section className="scheme-page shell-access-chooser">
      <div className="shell-access-chooser__wash" aria-hidden="true" />
      <div className="shell-container-wide shell-access-chooser__inner">
        <div className="shell-access-chooser__grid">
          <div className="shell-access-chooser__intro">
            <p className="typ-label shell-access-chooser__kicker">One suite, two paths</p>
            <h1 className="typ-display shell-access-chooser__title">
              Enter the workspace with intent.
            </h1>
            <p className="page-copy shell-access-chooser__lead">
              Choose the authenticated member flow or continue as a guest. Both
              paths lead into the same suite chooser before you enter Planner
              or Configurator.
            </p>

            <div className="shell-access-chooser__actions">
              <OpenAssistantButton
                label="Ask AI which path fits"
                className="btn-outline shell-access-chooser__ask"
              />
              <span className="shell-access-chooser__pill">
                <Sparkle size={14} weight="fill" className="shell-access-chooser__pill-icon" />
                Planner and Configurator stay equal at the front door
              </span>
            </div>

            <div className="shell-access-chooser__notes">
              {[
                {
                  title: "Member continuity",
                  body: "Login unlocks Planner, Configurator, dashboard return paths, and downstream member review surfaces.",
                },
                {
                  title: "Honest guest mode",
                  body: "Guest mode keeps the real tools visible while save, import, export, share, and publish stay restricted in place.",
                },
              ].map((item) => (
                <div key={item.title} className="shell-card shell-access-chooser__note">
                  <p className="typ-label text-subtle">{item.title}</p>
                  <p className="page-copy-sm text-body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="shell-card shell-access-chooser__panel">
            <div className="shell-top-accent" aria-hidden="true" />
            <p className="typ-label text-subtle">Choose access mode</p>
            <div className="shell-access-chooser__modes">
              <Link href={loginHref} className="shell-access-chooser__mode shell-access-chooser__mode--member">
                <div className="shell-access-chooser__mode-row">
                  <div>
                    <div className="shell-access-chooser__icon shell-access-chooser__icon--member">
                      <UserCircle size={22} weight="duotone" />
                    </div>
                    <p className="shell-access-chooser__mode-kicker">Login</p>
                    <h2 className="typ-h2 shell-access-chooser__mode-title">Member access</h2>
                    <p className="page-copy-sm">
                      Open the authenticated route, keep recent work available,
                      and continue into member review surfaces after the chooser.
                    </p>
                  </div>
                  <span className="shell-access-chooser__badge">Recommended</span>
                </div>
                <span className="shell-access-chooser__continue">
                  Continue with member login
                  <ArrowRight size={16} weight="bold" />
                </span>
              </Link>

              <Link href={guestHref} className="shell-access-chooser__mode shell-access-chooser__mode--guest">
                <div className="shell-access-chooser__icon shell-access-chooser__icon--guest">
                  <LockKey size={22} weight="duotone" />
                </div>
                <p className="shell-access-chooser__mode-kicker shell-access-chooser__mode-kicker--guest">
                  Guest
                </p>
                <h2 className="typ-h2 shell-access-chooser__mode-title">Guided exploration</h2>
                <p className="page-copy-sm">
                  Browse the same product chooser, then enter restricted live
                  tool surfaces with disabled output and persistence actions
                  explained in place.
                </p>
                <span className="shell-access-chooser__continue shell-access-chooser__continue--guest">
                  Continue as guest
                  <ArrowRight size={16} weight="bold" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
