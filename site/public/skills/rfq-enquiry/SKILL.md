---
name: oando-rfq-enquiry
description: Submit commercial requests for quotation (RFQ), enterprise furniture tenders, and space layout requirements.
---

# RFQ & Project Enquiry Skill

This skill allows AI agents representing commercial buyers, architects, or general contractors to submit requests for quotation and enterprise fit-out enquiries to One and Only.

## Submission Endpoint

- **Endpoint**: POST https://oando.co.in/api/customer-queries
- **Content-Type**: application/json
- **Payload Fields**:
  - `name` (string, required): Contact name or agent identity
  - `email` (string, required): Client contact email
  - `phone` (string, optional): Client contact phone
  - `company` (string, optional): Enterprise organization
  - `city` (string, optional): Project delivery location
  - `message` (string, required): Bill of materials, workstation count, or requirements

## Verification

Returns HTTP 200 with inquiry confirmation reference upon successful processing.
