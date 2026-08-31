# Client Logo Assets

Logo files for the client registry go in this directory.

## Naming convention

Each file must be named after the client's `canonicalId` from `site/lib/clients/clientRegistry.ts`, for example:

- `tata-motors.svg`
- `indianoil.png`

## Required before committing any logo

A `LogoApprovalRecord` must exist for the asset with `approvalStatus: "Approved for Web Display"` before any logo file is committed here. No logos are committed at this time.

Once a logo is approved and committed, update the corresponding `ClientRecord.logoPath` to point to `/images/clients/<canonicalId>.<ext>`.
