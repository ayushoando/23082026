"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { useTranslations } from "next-intl";
import { HomeMarketingLayout } from "@/components/home/layout";
import { MOTION_EASE, hoverLift, staggerContainer, staggerItem } from "@/lib/helpers/motion";
import { PlannerFloorplanHero } from "./PlannerFloorplanHero";
import { PLANNER_LANDING_ICONS } from "./plannerLandingIcons";
import { PLANNER_HERO, PLANNER_LANDING_FEATURES } from "./plannerLandingData";

export function PlannerLandingPage() {
  const t = useTranslations("plannerLanding");
  const features = PLANNER_LANDING_FEATURES.map((feature) => {
    if (feature.slug === "measure") {
      return { ...feature, title: t("featureMeasure"), tagline: t("featureMeasureTag") };
    }
    if (feature.slug === "catalog") {
      return { ...feature, title: t("featureCatalog"), tagline: t("featureCatalogTag") };
    }
    if (feature.slug === "ai-assist") {
      return { ...feature, title: t("featureAi"), tagline: t("featureAiTag") };
    }
    return { ...feature, title: t("featurePdf"), tagline: t("featurePdfTag") };
  });
  const steps = [
    { step: "01", title: t("step1") },
    { step: "02", title: t("step2") },
    { step: "03", title: t("step3") },
  ];
  return (
    <HomeMarketingLayout>
      <PlannerFloorplanHero />

      <section className="home-section--soft border-t border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="home-heading">
              {t("whatItDoesLead")}
              {"\u00A0"}
              <span className="text-accent-italic">{t("whatItDoesAccent")}</span>
            </h2>
            <Link
              href={PLANNER_HERO.featuresCta.href}
              className="planner-landing-features-link typ-label inline-flex shrink-0 gap-2 text-muted hover:text-strong"
            >
              {t("featuresCta")}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <motion.div
            className="planner-landing-features"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {features.map((feature) => {
              const Icon = PLANNER_LANDING_ICONS[feature.slug];
              return (
                <motion.div key={feature.slug} variants={staggerItem}>
                  <Link href={feature.href} className="planner-landing-feature-link">
                    <motion.div
                      className="planner-landing-feature group"
                      variants={hoverLift}
                      initial="rest"
                      whileHover="hover"
                    >
                      <span className="planner-landing-feature__icon home-why-icon">
                        {Icon ? <Icon size={28} weight="duotone" aria-hidden="true" /> : null}
                      </span>
                      <h3 className="home-why-card__title">{feature.title}</h3>
                      <p className="home-why-card__tagline">{feature.tagline}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section className="home-section--white border-t border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-8 max-w-2xl">
            <h2 className="home-heading">
              {t("howItWorksLead")}
              {"\u00A0"}
              <span className="text-accent-italic">{t("howItWorksAccent")}</span>
            </h2>
          </div>
          <motion.div
            className="planner-landing-steps"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {steps.map((item) => (
              <motion.div key={item.step} variants={staggerItem} className="h-full">
                <article className="planner-landing-step h-full">
                  <p className="planner-landing-step__num">{item.step}</p>
                  <h3 className="typ-h3 mt-3 text-strong">{item.title}</h3>
                </article>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="home-section--accent-dark section-y-sm">
        <div className="home-shell-xl">
          <div className="planner-landing-cta">
            <h2 className="planner-landing-cta__title">{t("bottomCta")}</h2>
            <div className="home-actions planner-landing-cta__actions">
              <Link
                href={PLANNER_HERO.primaryCta.href}
                className="btn-hero-primary btn-primary shadow-theme-panel"
              >
                {t("primaryCta")}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </HomeMarketingLayout>
  );
}
