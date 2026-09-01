# Client Logo Assets

Logo files referenced by `site/lib/clients/clientRegistry.ts` are served from
the marketing asset path `/assets/marketing/client-logos/…`. In production the
Cloudflare Worker resolves `/assets/*` from the R2 bucket (mirrored by
`scripts/mirror-assets-to-r2.mjs`); `site/public/assets/marketing/client-logos/`
is the local dev copy of the same keys.

> Historical note: this folder (`/images/clients/`) was the naming target of
> the original client-showcase plan. The live registry standardised on
> `/assets/marketing/client-logos/`, so this README stays as the policy note
> only — do not commit logo files here.

## Naming convention

Each file is named after the client's `canonicalId` from `clientRegistry.ts`,
for example:

- `state-bank-of-india.svg`
- `tata-motors.svg`

## Required before committing any logo

A `LogoApprovalRecord` must exist for the asset with `approvalStatus:
"Approved for Web Display"` before any logo file is committed. No logos are
committed in this repository directory at this time.

Once a logo is approved, it is published under
`/assets/marketing/client-logos/<canonicalId>.<ext>` (mirrored to R2) and the
matching `ClientRecord.logoPath` points there. Cards without a `logoPath`
render the initials fallback, so a missing logo is a visual degradation, never
an error.
