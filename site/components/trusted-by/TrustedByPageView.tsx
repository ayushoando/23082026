"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ClientBadge, type ClientBadgeData } from "@/components/ClientBadge";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";

import {
  TRUSTED_BY_HERO_IMAGE,
  TRUSTED_BY_HERO_MEDIA,
} from "@/features/site/data/trustedByPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export interface TrustedByPageViewProps {
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  overviewKicker: string;
  overviewTitle: string;
  overviewDescription: string;
  statsKicker: string;
  clients: readonly ClientBadgeData[];
  rosterKicker: string;
  quotesKicker: string;
  quotesTitle: string;
  quotes: readonly { quote: string; attribution: string }[];
  sectors: readonly string[];
  sectorsKicker: string;
  sectorsTitle: string;
  sectorsDescription: string;
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  deliveryQuotesLabel: string;
}

export function TrustedByPageView({
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle: _heroSubtitle,
  overviewKicker,
  overviewTitle,
  overviewDescription,
  statsKicker: _statsKicker,
  clients,
  rosterKicker,
  quotesKicker,
  quotesTitle,
  quotes,
  sectors,
  sectorsKicker,
  sectorsTitle,
  sectorsDescription,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
  deliveryQuotesLabel,
}: TrustedByPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const rosterRef = useRef<HTMLElement>(null);
  const quotesRef = useRef<HTMLElement>(null);
  const sectorsRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !heroRef.current) {
        return;
      }

      const revealTargets = heroRef.current.querySelectorAll("[data-trusted-hero-reveal]");
      if (!revealTargets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(revealTargets, {
          y: GSAP_REVEAL.y,
          duration: GSAP_REVEAL.duration,
          stagger: GSAP_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
        });

        const media = heroRef.current?.querySelector(".trusted-by-hero__media");
        if (media) {
          gsap.to(media, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef, dependencies: [motionReady] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !storyRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = storyRef.current?.querySelectorAll("[data-trusted-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, storyRef);

      return () => ctx.revert();
    },
    { scope: storyRef },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !rosterRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = rosterRef.current?.querySelectorAll("[data-trusted-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: rosterRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, rosterRef);

      return () => ctx.revert();
    },
    { scope: rosterRef, dependencies: [clients] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !quotesRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = quotesRef.current?.querySelectorAll("[data-trusted-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: quotesRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, quotesRef);

      return () => ctx.revert();
    },
    { scope: quotesRef, dependencies: [quotes] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectorsRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = sectorsRef.current?.querySelectorAll("[data-trusted-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: sectorsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, sectorsRef);

      return () => ctx.revert();
    },
    { scope: sectorsRef, dependencies: [sectors] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="trusted-by-hero"
        aria-labelledby="trusted-by-hero-heading"
        data-testid="trusted-by-hero"
      >
        <EditorialHeroMedia
          prefix="trusted-by"
          image={TRUSTED_BY_HERO_IMAGE}
          media={TRUSTED_BY_HERO_MEDIA}
        />
        <div className="trusted-by-hero__scrim" aria-hidden="true" />

        <div className="trusted-by-hero__layout">
          <div className="trusted-by-hero__copy">
            <h1 id="trusted-by-hero-heading" className="trusted-by-hero__title">
              <span data-trusted-hero-reveal className="block">
                {heroTitleLead}
                {"\u00A0"}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>

            <div data-trusted-hero-reveal className="trusted-by-hero__actions">
              <MarketingCtaLink
                href="/clients"
                label={ctaSecondary}
                surface="trusted-by-hero"
                variant="primary"
                context="hero"
              >
                {ctaSecondary}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={storyRef} className="trusted-by-story" data-testid="trusted-by-story">
            <div className="trusted-by-story__copy">
              <p data-trusted-reveal className="home-kicker">
                {overviewKicker}
              </p>
              <h2 data-trusted-reveal className="home-heading">
                {overviewTitle}
              </h2>
              <p data-trusted-reveal className="trusted-by-story__lead">
                {overviewDescription}
              </p>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={rosterRef} className="trusted-by-roster" data-testid="trusted-by-roster">
            <h2 data-trusted-reveal className="home-kicker">
              {rosterKicker}
            </h2>
            <div
              className="client-badge-group client-badge-group--dense"
              aria-label={rosterKicker}
            >
              {clients.map((client) => (
                <div key={client.name} data-trusted-reveal>
                  <ClientBadge
                    name={client.name}
                    sector={client.sector}
                    location={client.location}
                    logoSrc={client.logoSrc}
                  />
                </div>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <section
        ref={quotesRef}
        className="clients-trust-strip scheme-accent-wash"
        aria-label={deliveryQuotesLabel}
        data-testid="trusted-by-quotes"
      >
        <div className="home-shell-xl">
          <p data-trusted-reveal className="home-kicker">
            {quotesKicker}
          </p>
          <h2 data-trusted-reveal className="home-heading mt-3 mb-8">
            {quotesTitle}
          </h2>
          <div className="clients-pull-quotes">
            {quotes.map((item) => (
              <figure key={item.attribution} data-trusted-reveal className="clients-pull-quote">
                <blockquote className="clients-pull-quote__text text-balance">
                  {item.quote}
                </blockquote>
                <figcaption className="clients-pull-quote__attribution">{item.attribution}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section ref={sectorsRef} className="trusted-by-sectors" data-testid="trusted-by-sectors">
            <p data-trusted-reveal className="home-kicker">
              {sectorsKicker}
            </p>
            <h2 data-trusted-reveal className="home-heading mt-3 mb-4 max-w-xl">
              {sectorsTitle}
            </h2>
            <p data-trusted-reveal className="page-copy text-body max-w-xl">
              {sectorsDescription}
            </p>
            <ul className="trusted-by-sectors__list" >
              {sectors.map((sector) => (
                <li key={sector} data-trusted-reveal className="trusted-by-sector-row">
                  {sector}
                </li>
              ))}
            </ul>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={ctaKicker}
            title={
              <>
                {ctaTitleLead}
                {"\u00A0"}
                <span className="text-accent-italic-on-dark">{ctaTitleAccent}</span>
              </>
            }
            description={ctaDescription}
            actions={[
              { href: "/contact", label: ctaPrimary, variant: "primary" },
              { href: "/clients", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
