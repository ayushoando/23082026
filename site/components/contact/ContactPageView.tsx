"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Envelope as Mail, MapPin, Phone, WhatsappLogo } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { CustomerQueryForm } from "@/components/contact/CustomerQueryForm";
import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { OfficeMap } from "@/components/shared/OfficeMap";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { CONTACT_HERO_IMAGE, CONTACT_HERO_MEDIA } from "@/features/site/data/contactPage";
import { SITE_CONTACT } from "@/features/site/data/contact";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

/** Skip entrance motion under md — mobile needs instant, solid UI (no opacity/y stuck states). */
function contactMotionDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (gsapReducedMotion()) return true;
  return window.matchMedia("(max-width: 47.99rem)").matches;
}

type ContactOffice = { title: string; lines: string[] };

export interface ContactPageViewProps {
  intent: string | null;
  source: string | null;
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  sectionTitle: string;
  introTitle: string;
  resourceDeskLead: string;
  resourceDeskCta: string;
  resourceDeskTail: string;
  quickDeskKicker: string;
  quickDeskTitle: string;
  quickDeskDescription: string;
  quickDeskPrimaryCta: string;
  quickDeskSecondaryCta: string;
  channelRegionLabel: string;
  channelQuotesLabel: string;
  channelSupportLabel: string;
  channelEmailLabel: string;
  channelsAriaLabel: string;
  offices: ContactOffice[];
}

/**
 * Signature beat: bronze rule scale-X draw, then form-band entrance (desktop only).
 * Mobile: no GSAP — form and copy paint fully visible immediately.
 */
export function ContactPageView({
  intent,
  source,
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle: _heroSubtitle,
  sectionTitle,
  introTitle,
  resourceDeskLead,
  resourceDeskCta,
  resourceDeskTail,
  quickDeskKicker,
  quickDeskTitle,
  quickDeskDescription,
  quickDeskPrimaryCta,
  quickDeskSecondaryCta,
  channelRegionLabel,
  channelQuotesLabel,
  channelSupportLabel,
  channelEmailLabel,
  channelsAriaLabel,
  offices,
}: ContactPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const bronzeRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || contactMotionDisabled() || !heroRef.current) {
        return;
      }

      const revealTargets = heroRef.current.querySelectorAll("[data-contact-hero-reveal]");
      if (!revealTargets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(revealTargets, {
          y: GSAP_REVEAL.y,
          opacity: GSAP_REVEAL.opacity,
          duration: GSAP_REVEAL.duration,
          stagger: GSAP_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          clearProps: "opacity,transform",
        });
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef, dependencies: [motionReady] },
  );

  useGSAP(
    () => {
      if (!motionReady || contactMotionDisabled()) {
        return;
      }

      const rule = bronzeRef.current?.querySelector(".about-craft-quote__rule");
      const formBand = mainRef.current?.querySelector("[data-contact-form-reveal]");
      if (!rule && !formBand) {
        return;
      }

      const ctx = gsap.context(() => {
        if (rule) {
          gsap.from(rule, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: GSAP_EASE_OUT,
            clearProps: "transform",
            scrollTrigger: {
              trigger: bronzeRef.current,
              start: "top 90%",
              once: true,
            },
          });
        }

        if (formBand) {
          gsap.set(formBand, { opacity: 1, clearProps: "opacity" });
          gsap.from(formBand, {
            y: GSAP_SCROLL_REVEAL.y,
            duration: GSAP_SCROLL_REVEAL.duration,
            ease: GSAP_EASE_OUT,
            clearProps: "transform",
            scrollTrigger: {
              trigger: formBand,
              start: "top 88%",
              once: true,
            },
          });
        }
      }, mainRef);

      return () => ctx.revert();
    },
    { scope: mainRef, dependencies: [motionReady] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="contact-hero"
        aria-labelledby="contact-hero-heading"
        data-testid="contact-hero"
      >
        <EditorialHeroMedia
          prefix="contact"
          image={CONTACT_HERO_IMAGE}
          media={CONTACT_HERO_MEDIA}
        />
        <div className="contact-hero__scrim" aria-hidden="true" />

        <div className="contact-hero__layout">
          <div className="contact-hero__copy">
            <p
              data-contact-hero-reveal
              className="home-kicker contact-hero__kicker text-accent-soft"
            >
              {heroKicker}
            </p>
            <h1
              id="contact-hero-heading"
              className="home-hero-title-route contact-hero__title text-inverse text-start"
            >
              <span data-contact-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p
              data-contact-hero-reveal
              className="contact-hero__lead text-inverse-body mt-4 max-w-2xl"
            >
              Share your team size, city, and scope. Our workspace planning desk reviews your requirements and follows up with tailored options and direct manufacturer pricing.
            </p>
            <div data-contact-hero-reveal className="contact-hero__actions mt-6 flex flex-wrap gap-3">
              <a
                href="#enquiry-form"
                className="btn-primary inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-11"
              >
                Start Project Brief
              </a>
              <a
                href="https://wa.me/919031022875?text=Hi%2C%20I%20would%20like%20to%20consult%20on%20an%20office%20furniture%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-light inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-11 text-inverse"
              >
                <WhatsappLogo size={18} weight="fill" className="contact-hero__whatsapp-icon" />
                WhatsApp Consultation
              </a>
            </div>
          </div>
        </div>

        <div ref={bronzeRef} className="contact-hero__bronze" aria-hidden="true">
          <div className="contact-hero__bronze-inner">
            <span className="about-craft-quote__rule" />
          </div>
        </div>
      </section>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <section ref={mainRef} className="contact-main" data-testid="contact-main">
            {/* Left Column: Media + Structured Channels */}
            <div className="contact-summary">
              {/* High-res verified installation / showroom media */}
              <div className="contact-photo-card" data-testid="contact-photo-card">
                <Image
                  src="/assets/marketing/clients/Titan/titan-hero.webp"
                  alt="One and Only workplace installation for Titan Corporate"
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 56rem) 45vw, 100vw"
                  className="contact-photo-card__img"
                />
                <div className="contact-photo-card__scrim" aria-hidden="true" />
                <div className="contact-photo-card__caption">
                  <span className="contact-photo-card__badge">Verified Installation</span>
                  <p className="contact-photo-card__title">Titan Corporate Headquarters · Patna</p>
                </div>
              </div>

              <div className="contact-summary__intro">
                <p className="home-kicker">{sectionTitle}</p>
                <h2 className="home-heading mt-2">{introTitle}</h2>
                <p className="page-copy-sm text-body mt-3 max-w-prose">
                  {resourceDeskLead}{" "}
                  <Link
                    href="/downloads"
                    className="font-semibold text-primary transition-colors hover:text-primary-hover min-h-11 inline-flex items-center"
                  >
                    {resourceDeskCta}
                  </Link>{" "}
                  {resourceDeskTail}
                </p>
              </div>

              <div className="contact-offices">
                {offices.map((office) => (
                  <article key={office.title} className="contact-office-card">
                    <h3 className="contact-office-card__title">{office.title}</h3>
                    <address className="page-copy-sm text-body not-italic">
                      {office.lines.map((line) => (
                        <p key={`${office.title}-${line}`} className="m-0">
                          {line}
                        </p>
                      ))}
                    </address>
                  </article>
                ))}
              </div>

              <div
                className="contact-channels-panel"
                role="region"
                aria-label={channelsAriaLabel}
              >
                <div className="contact-channel">
                  <MapPin className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelRegionLabel}</p>
                    <p className="page-copy text-body">{SITE_CONTACT.regionLine}</p>
                  </div>
                </div>
                <div className="contact-channel">
                  <Phone className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelQuotesLabel}</p>
                    <a
                      href={`tel:${SITE_CONTACT.salesPhone.replace(/\s+/g, "")}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.salesPhone}
                    </a>
                  </div>
                </div>
                <div className="contact-channel">
                  <Phone className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelSupportLabel}</p>
                    <a
                      href={`tel:${SITE_CONTACT.supportPhone.replace(/\s+/g, "")}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.supportPhone}
                    </a>
                  </div>
                </div>
                <div className="contact-channel">
                  <Mail className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelEmailLabel}</p>
                    <a
                      href={`mailto:${SITE_CONTACT.salesEmail}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.salesEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Consultation Banner */}
              <a
                href="https://wa.me/919031022875?text=Hi%2C%20I%20would%20like%20to%20consult%20on%20an%20office%20furniture%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="contact-whatsapp-card group"
              >
                <div className="contact-whatsapp-card__icon-wrap" aria-hidden="true">
                  <WhatsappLogo size={26} weight="fill" className="text-white" />
                </div>
                <div className="contact-whatsapp-card__copy">
                  <span className="contact-whatsapp-card__title">Direct WhatsApp Consultation</span>
                  <span className="contact-whatsapp-card__detail">Fastest response · Connect directly with our planning lead</span>
                </div>
                <ArrowRight
                  size={18}
                  weight="bold"
                  className="contact-whatsapp-card__arrow group-hover:translate-x-1 transition-transform text-primary"
                  aria-hidden="true"
                />
              </a>
            </div>

            {/* Right Column: Polished Enquiry Form Card */}
            <div
              id="enquiry-form"
              className="contact-form-band"
              data-testid="contact-form-band"
              data-contact-form-reveal
            >
              <div className="contact-form-card">
                <div className="contact-quick-desk" data-testid="contact-quick-desk">
                  <p className="home-kicker">{quickDeskKicker}</p>
                  <h2 className="contact-form-band__title">{quickDeskTitle}</h2>
                  <p className="page-copy-sm text-body">{quickDeskDescription}</p>
                  <div className="contact-quick-desk__actions">
                    <MarketingCtaLink
                      href="/downloads"
                      label={quickDeskPrimaryCta}
                      surface="contact-quick-desk"
                      variant="outline"
                      className="w-full justify-center sm:w-auto"
                    >
                      {quickDeskPrimaryCta}
                    </MarketingCtaLink>
                    <MarketingCtaLink
                      href="/planning"
                      label={quickDeskSecondaryCta}
                      surface="contact-quick-desk"
                      variant="primary"
                      className="w-full justify-center sm:w-auto"
                    >
                      {quickDeskSecondaryCta}
                    </MarketingCtaLink>
                  </div>
                </div>

                <div className="contact-form-card__form-wrap mt-6">
                  <CustomerQueryForm intent={intent} source={source} />
                </div>
              </div>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      {/* Office location & map section */}
      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <OfficeMap heading="Patna Headquarters & Showroom" />
        </HomeSectionInner>
      </HomeSection>

      {/* Next Step Route CTA band */}
      <section
        className="about-cta-ink contact-next-steps"
        aria-labelledby="contact-next-steps-heading"
        data-testid="contact-next-steps"
      >
        <div className="home-shell-xl">
          <div className="contact-next-steps__header">
            <p className="typ-label text-inverse-muted">Next steps</p>
            <h2 id="contact-next-steps-heading" className="home-heading mt-2 text-inverse">
              Explore installations, verified clients &amp;{" "}
              <span className="text-accent-italic-on-dark">planning tools</span>
            </h2>
          </div>

          <div className="contact-next-steps__grid mt-8">
            <Link href="/portfolio" className="contact-step-card group">
              <span className="contact-step-card__badge">Installs &amp; Proof</span>
              <h3 className="contact-step-card__title">Completed Portfolio</h3>
              <p className="contact-step-card__desc">
                High-resolution photography from over 120 turnkey office installations across India.
              </p>
              <div className="contact-step-card__link">
                <span>Browse portfolio</span>
                <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/clients" className="contact-step-card group">
              <span className="contact-step-card__badge">Client Roster</span>
              <h3 className="contact-step-card__title">Verified Clients</h3>
              <p className="contact-step-card__desc">
                Curated directory across government, enterprise, banking, and education sectors.
              </p>
              <div className="contact-step-card__link">
                <span>View client directory</span>
                <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/planner" className="contact-step-card group">
              <span className="contact-step-card__badge">Spatial CAD</span>
              <h3 className="contact-step-card__title">Oando Planner</h3>
              <p className="contact-step-card__desc">
                Lay out workstation clusters, meeting rooms, and task seating directly on a floor grid.
              </p>
              <div className="contact-step-card__link">
                <span>Launch planner</span>
                <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
