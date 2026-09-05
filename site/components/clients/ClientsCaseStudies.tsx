"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

import { MarketingImage } from "@/components/site/MarketingImage";

export type ClientCaseStudy = {
  id: string;
  name: string;
  location: string;
  summary: string;
  photos: string[];
};

type ClientsCaseStudiesProps = {
  clients: ClientCaseStudy[];
};

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return ((index % length) + length) % length;
}

function secondaryPhotoIndexes(photoCount: number, primaryIndex: number): number[] {
  if (photoCount <= 1) {
    return [];
  }
  const indexes: number[] = [];
  for (let offset = 1; offset < photoCount && indexes.length < 2; offset += 1) {
    indexes.push(wrapIndex(primaryIndex + offset, photoCount));
  }
  return indexes;
}

/**
 * Photography-forward case mosaic — static layout.
 * Signature motion lives on ClientsProofStrip (one beat per page).
 */
export function ClientsCaseStudies({ clients }: ClientsCaseStudiesProps) {
  return (
    <div className="clients-work">
      {clients.map((client, index) => (
        <CaseStudyArticle key={client.id} client={client} index={index} />
      ))}
    </div>
  );
}

function CaseStudyArticle({
  client,
  index,
}: {
  client: ClientCaseStudy;
  index: number;
}) {
  const photos = client.photos;
  const mosaicRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const [mosaicIndex, setMosaicIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((photoIndex: number) => {
    if (photos.length === 0) {
      return;
    }
    setLightboxIndex(wrapIndex(photoIndex, photos.length));
  }, [photos.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const stepLightbox = useCallback(
    (delta: number) => {
      if (photos.length <= 1) {
        return;
      }
      setLightboxIndex((current) => wrapIndex((current ?? 0) + delta, photos.length));
    },
    [photos.length],
  );

  const scrollMosaic = useCallback((delta: number) => {
    const node = mosaicRef.current;
    if (!node) {
      return;
    }
    const distance = Math.max(node.clientWidth * 0.55, 160);
    node.scrollBy({ left: delta * distance, behavior: "smooth" });
  }, []);

  const stepMosaic = useCallback(
    (delta: number) => {
      if (photos.length <= 1) {
        return;
      }
      setMosaicIndex((current) => wrapIndex(current + delta, photos.length));
      scrollMosaic(delta);
    },
    [photos.length, scrollMosaic],
  );

  const lightboxOpen = lightboxIndex !== null;

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const dialog = lightboxRef.current;
    if (!dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [lightboxOpen]);

  if (photos.length === 0) {
    return null;
  }

  const secondaryIndexes = secondaryPhotoIndexes(photos.length, mosaicIndex);
  const mosaicVariant =
    secondaryIndexes.length === 0 ? "clients-work__mosaic--solo" : "clients-work__mosaic--dual";
  const activeLightboxIndex = lightboxIndex ?? 0;
  const lightboxPhoto = photos[activeLightboxIndex];
  const canBrowse = photos.length > 1;
  const primaryPhoto = photos[mosaicIndex] ?? photos[0];

  return (
    <article
      id={`portfolio-project-${client.id}`}
      className="clients-work__case portfolio-case"
      aria-labelledby={`clients-work-${client.id}`}
    >
      <div className="clients-work-caption">
        <p className="clients-work__index home-kicker text-contrast-accent" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h2 id={`clients-work-${client.id}`} className="clients-work__title home-heading">
          {client.name}
        </h2>
        <p className="clients-work__location typ-body text-muted">{client.location}</p>
        <p className="clients-work-caption__scope page-copy text-body">{client.summary}</p>
      </div>

      <div
        ref={mosaicRef}
        className={`clients-work__mosaic portfolio-case__mosaic overflow-x-auto ${mosaicVariant}`}
      >
        <div
          className={
            secondaryIndexes.length > 0
              ? "clients-work__media clients-work__media--primary portfolio-case__media"
              : "clients-work__media clients-work__media--primary clients-work__media--primary-solo portfolio-case__media"
          }
        >
          <MarketingImage
            src={primaryPhoto}
            alt={`${client.name} installed workplace — primary view`}
            sizes={secondaryIndexes.length > 0 ? "(max-width: 768px) 100vw, 58vw" : "100vw"}
            className="portfolio-case__img object-cover"
            priority={index < 2}
          />
          <button
            type="button"
            className="portfolio-case__zoom"
            aria-label={`Zoom ${client.name} photo ${mosaicIndex + 1} of ${photos.length}`}
            onClick={() => openLightbox(mosaicIndex)}
          />
        </div>
        {secondaryIndexes.map((photoIndex, slotIndex) => (
          <div
            key={`${photos[photoIndex]}-${photoIndex}`}
            className={
              secondaryIndexes.length === 1
                ? "clients-work__media clients-work__media--secondary clients-work__media--secondary-solo portfolio-case__media"
                : "clients-work__media clients-work__media--secondary portfolio-case__media"
            }
          >
            <MarketingImage
              src={photos[photoIndex] ?? primaryPhoto}
              alt={`${client.name} installed workplace — detail ${slotIndex + 2}`}
              sizes="(max-width: 768px) 50vw, 42vw"
              className="portfolio-case__img object-cover"
              loading="eager"
            />
            <button
              type="button"
              className="portfolio-case__zoom"
              aria-label={`Zoom ${client.name} photo ${photoIndex + 1} of ${photos.length}`}
              onClick={() => openLightbox(photoIndex)}
            />
          </div>
        ))}
      </div>

      {canBrowse ? (
        <div className="clients-work__mosaic-nav mt-3 flex items-center gap-2">
          <button
            type="button"
            className="shell-icon-button h-11 w-11 min-h-11 min-w-11"
            aria-label={`Previous ${client.name} photo`}
            onClick={() => stepMosaic(-1)}
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
          <p className="typ-body text-muted" aria-live="polite">
            <span className="sr-only">
              {`Photo ${mosaicIndex + 1} of ${photos.length} for ${client.name}`}
            </span>
            <span aria-hidden="true">
              {mosaicIndex + 1} / {photos.length}
            </span>
          </p>
          <button
            type="button"
            className="shell-icon-button h-11 w-11 min-h-11 min-w-11"
            aria-label={`Next ${client.name} photo`}
            onClick={() => stepMosaic(1)}
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {lightboxOpen && lightboxPhoto ? (
        <dialog
          ref={lightboxRef}
          className="portfolio-lightbox is-open"
          aria-label={`${client.name} photo ${activeLightboxIndex + 1} of ${photos.length}`}
          onClose={closeLightbox}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              event.currentTarget.close();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              stepLightbox(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              stepLightbox(1);
            }
          }}
        >
          <div className="portfolio-lightbox__stage">
            <MarketingImage
              src={lightboxPhoto}
              alt={`${client.name} installed workplace — photo ${activeLightboxIndex + 1} of ${photos.length}`}
              sizes="100vw"
              className="portfolio-lightbox__img"
            />
          </div>
          {canBrowse ? (
            <button
              type="button"
              className="btn btn-outline-light portfolio-lightbox__prev"
              aria-label={`Previous ${client.name} photo`}
              onClick={() => stepLightbox(-1)}
            >
              <CaretLeft size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
          {canBrowse ? (
            <button
              type="button"
              className="btn btn-outline-light portfolio-lightbox__next"
              aria-label={`Next ${client.name} photo`}
              onClick={() => stepLightbox(1)}
            >
              <CaretRight size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-outline-light portfolio-lightbox__close"
            aria-label="Close photo"
            onClick={() => lightboxRef.current?.close()}
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </dialog>
      ) : null}
    </article>
  );
}
