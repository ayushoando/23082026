import {
  formatSitePostalAddress,
  googleMapsEmbedSrc,
  googleMapsOpenHref,
  SITE_CONTACT,
} from "@/features/site/data/contact";

type OfficeMapProps = {
  heading?: string;
};

export function OfficeMap({ heading = "Visit us" }: OfficeMapProps) {
  const address = formatSitePostalAddress().replace(/\n/g, ", ");
  const title = `${SITE_CONTACT.brandNameSpoken} on Google Maps`;

  return (
    <figure className="office-map" data-testid="office-map">
      {heading ? <figcaption className="office-map__heading">{heading}</figcaption> : null}
      <div className="office-map__frame">
        <iframe
          title={title}
          src={googleMapsEmbedSrc()}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="office-map__caption">
        <span>{address}</span>
        {" · "}
        <a href={googleMapsOpenHref()} target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
      </p>
    </figure>
  );
}
