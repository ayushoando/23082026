"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CaretLeft, CaretRight, MagnifyingGlass, X } from "@phosphor-icons/react";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ClientBadge, type ClientBadgeData } from "@/components/ClientBadge";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { MarketingImage } from "@/components/site/MarketingImage";
import { TrustStrip } from "@/components/home/TrustStrip";
import type { BusinessStats } from "@/lib/types/businessStats";

const FEATURED_CLIENT_PHOTOS = [
  {
    name: "Titan",
    sector: "Corporate & Retail",
    location: "Patna, Bihar",
    summary: "Collaborative office zones with modular seating and meeting layouts.",
    image: "/assets/marketing/clients/Titan/titan-hero.webp",
    tags: ["150+ Workstations", "Executive Cabins", "Acoustic Partitioning"],
  },
  {
    name: "TVS Group",
    sector: "Automotive & Corporate",
    location: "Patna, Bihar",
    summary: "Workspace planning across leadership cabins, desking, and collaboration bays.",
    image: "/assets/marketing/clients/TVS/hero.webp",
    tags: ["Multi-Floor Rollout", "Turnkey Delivery", "Zero Downtime"],
  },
  {
    name: "Franklin Templeton",
    sector: "Financial Services",
    location: "India",
    summary: "Formal workspace setups with consistent finishes and executive-ready detailing.",
    image: "/assets/marketing/clients/FranklinTempleton/franklin-templeton-office.webp",
    tags: ["Conference Systems", "Ergonomic Task Seating", "Global Standards"],
  },
  {
    name: "DMRC",
    sector: "Public Infrastructure",
    location: "New Delhi",
    summary: "Operational office furniture delivery built for high-use enterprise teams.",
    image: "/assets/marketing/clients/DMRC/dmrc.webp",
    tags: ["24/7 Operations", "Heavy-Duty Ergonomics", "10-Year Durability"],
  },
] as const;

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
  heroSubtitle?: string;
  overviewKicker: string;
  overviewTitle: string;
  overviewDescription: string;
  statsKicker?: string;
  stats?: readonly { value: string; label: string }[];
  businessStats?: BusinessStats;
  craftQuote?: string;
  craftAttribution?: string;
  clients: readonly ClientBadgeData[];
  rosterKicker: string;
  rosterTitle?: string;
  rosterDescription?: string;
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
  ctaSecondary: string;
  deliveryQuotesLabel: string;
}

export function TrustedByPageView({
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  overviewKicker,
  overviewTitle,
  overviewDescription,
  businessStats,
  craftQuote,
  craftAttribution,
  clients,
  rosterKicker,
  rosterTitle,
  rosterDescription,
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
  const photosRef = useRef<HTMLElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photoCount = FEATURED_CLIENT_PHOTOS.length;
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? current : (current + 1) % photoCount,
        );
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null ? current : (current - 1 + photoCount) % photoCount,
        );
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, photoCount]);

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
      if (gsapReducedMotion() || !photosRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = photosRef.current?.querySelectorAll("[data-trusted-reveal]");
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
            trigger: photosRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, photosRef);

      return () => ctx.revert();
    },
    { scope: photosRef, dependencies: [motionReady] },
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
            {heroSubtitle ? (
              <p data-trusted-hero-reveal className="trusted-by-hero__subtitle">
                {heroSubtitle}
              </p>
            ) : null}

            <div data-trusted-hero-reveal className="trusted-by-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href="/clients"
                label="Sector-wise clients"
                surface="trusted-by-hero"
                variant="primary"
                context="hero"
              >
                Sector-wise clients
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/portfolio"
                label={ctaSecondary}
                surface="trusted-by-hero"
                variant="outline-light"
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
          {businessStats ? (
            <div className="trusted-by-kpi" data-testid="trusted-by-kpi">
              <TrustStrip stats={businessStats} embedded tone="light" />
            </div>
          ) : null}
          <section ref={rosterRef} className="trusted-by-roster" data-testid="trusted-by-roster">
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

            <div className="mt-8 text-center" data-trusted-reveal>
              <MarketingCtaLink
                href="/clients"
                variant="outline"
                surface="trusted-by-roster"
                label="View all 118 clients across 4 sectors"
              >
                View all 118 clients across 4 sectors →
              </MarketingCtaLink>
            </div>
          </section>
          {craftQuote ? (
            <blockquote data-trusted-reveal className="trusted-by-craft-quote">
              <p className="trusted-by-craft-quote__text">"{craftQuote}"</p>
              {craftAttribution ? (
                <footer className="trusted-by-craft-quote__attribution">— {craftAttribution}</footer>
              ) : null}
            </blockquote>
          ) : null}
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section ref={photosRef} className="trusted-by-photos" data-testid="trusted-by-photos">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p data-trusted-reveal className="home-kicker">
                  Workplace Photography & Case Stories
                </p>
                <h2 data-trusted-reveal className="home-heading mt-2">
                  Featured installations & client delivery
                </h2>
                <p data-trusted-reveal className="page-copy text-body mt-2 max-w-2xl">
                  Real furniture systems deployed across regional headquarters, corporate offices, and operations centres with accountable delivery.
                </p>
              </div>
              <div data-trusted-reveal className="shrink-0">
                <MarketingCtaLink
                  href="/portfolio"
                  label="View full portfolio"
                  surface="trusted-by-photos"
                  variant="outline"
                >
                  View full portfolio →
                </MarketingCtaLink>
              </div>
            </div>

            <section
              ref={quotesRef}
              data-testid="trusted-by-quotes"
              aria-label={deliveryQuotesLabel}
              className="mb-8"
            >
              <p data-trusted-reveal className="home-kicker">
                {quotesKicker}
              </p>
              <h3 data-trusted-reveal className="home-heading mt-2">
                {quotesTitle}
              </h3>
            </section>

            <div className="trusted-by-split-showcase">
              {FEATURED_CLIENT_PHOTOS.map((item, idx) => {
                const isReversed = idx % 2 === 1;
                const clientQuote = quotes[idx] ?? null;

                return (
                  <article
                    key={item.name}
                    data-trusted-reveal
                    className={`trusted-by-split-card${isReversed ? " trusted-by-split-card--reversed" : ""}`}
                  >
                    <button
                      type="button"
                      className="trusted-by-split-card__media"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={`Zoom ${item.name} installation photo`}
                    >
                      <MarketingImage
                        src={item.image}
                        alt={`${item.name} workspace installation`}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="trusted-by-split-card__img object-cover"
                      />
                      <span className="trusted-by-split-card__badge">{item.name}</span>
                      <span className="trusted-by-split-card__zoom" aria-hidden="true">
                        <MagnifyingGlass size={20} weight="bold" />
                      </span>
                    </button>

                    <div className="trusted-by-split-card__content">
                      <div className="trusted-by-split-card__header">
                        <div className="trusted-by-split-card__meta">
                          <span>{item.sector}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.location}</span>
                        </div>
                        <h4 className="trusted-by-split-card__title">{item.name} Headquarters</h4>
                        <p className="trusted-by-split-card__scope">{item.summary}</p>
                      </div>

                      {clientQuote ? (
                        <figure className="clients-pull-quote trusted-by-split-card__quote">
                          <blockquote className="clients-pull-quote__text trusted-by-split-card__quote-text text-pretty">
                            {clientQuote.quote}
                          </blockquote>
                          <figcaption className="clients-pull-quote__attribution trusted-by-split-card__quote-author">
                            {clientQuote.attribution}
                          </figcaption>
                        </figure>
                      ) : null}

                      <div className="trusted-by-split-card__specs">
                        {item.tags.map((tag) => (
                          <span key={tag} className="trusted-by-split-card__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {lightboxIndex !== null ? (
              <div
                className="marketing-photo-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label={`${FEATURED_CLIENT_PHOTOS[lightboxIndex].name} installation photo`}
              >
                <button
                  type="button"
                  className="marketing-photo-lightbox__scrim"
                  aria-label="Close photo"
                  onClick={() => setLightboxIndex(null)}
                />
                <button
                  type="button"
                  className="marketing-photo-lightbox__nav marketing-photo-lightbox__nav--prev"
                  aria-label="Previous photo"
                  onClick={() =>
                    setLightboxIndex((current) =>
                      current === null ? 0 : (current - 1 + photoCount) % photoCount,
                    )
                  }
                >
                  <CaretLeft size={28} weight="bold" />
                </button>
                <img
                  src={FEATURED_CLIENT_PHOTOS[lightboxIndex].image}
                  alt={`${FEATURED_CLIENT_PHOTOS[lightboxIndex].name} workspace installation`}
                  className="marketing-photo-lightbox__img"
                />
                <button
                  type="button"
                  className="marketing-photo-lightbox__nav marketing-photo-lightbox__nav--next"
                  aria-label="Next photo"
                  onClick={() =>
                    setLightboxIndex((current) =>
                      current === null ? 0 : (current + 1) % photoCount,
                    )
                  }
                >
                  <CaretRight size={28} weight="bold" />
                </button>
                <button
                  type="button"
                  className="marketing-photo-lightbox__close"
                  aria-label="Close photo"
                  onClick={() => setLightboxIndex(null)}
                >
                  <X size={22} weight="bold" />
                </button>
              </div>
            ) : null}
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md" borderY>
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
            <ul className="trusted-by-sectors__list">
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
              { href: "/portfolio", label: ctaSecondary, variant: "outline-light" },
              { href: "/clients", label: "Sector-wise clients", variant: "outline-light" },
              { href: "/planning", label: "Workplace planning", variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
