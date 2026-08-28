# Research practice

Use this workflow to investigate repository questions without turning external recommendations or historical notes into unsupported current facts. The outcome is a traceable claim with a source, location, observed value, status, and stated evidence gap.

## Source order

1. Apply the current user instruction.
2. Inspect the owning live source or configuration.
3. Apply the process floor in [`AGENTS.md`](../AGENTS.md).
4. Use the relevant handbook under [`Agents/`](./INDEX.md).
5. Use durable references under [`docs/`](../docs/README.md).
6. Consult a current official external source only for the subject it governs.

## Research procedure

1. Define one question and the claim type: command, path, version, route, schema, persistence, deployment, observability, analytics, security, date, or other.
2. Identify the expected owning source before searching broadly.
3. Record the exact source path, location, and observed value.
4. Compare competing statements by authority. If live evidence does not resolve a same-level conflict, mark `pending-owner-validation`.
5. For external guidance, record publisher, title, canonical HTTPS URL, UTC access time, displayed update date when available, applicability, and supersession status.
6. Paraphrase source guidance in original wording and retain descriptive attribution.
7. Classify the result as observed, configured, present-but-unverified, planned, historical, deprecated, blocked, or pending-owner-validation.
8. Recheck every dependent claim when its source changes.

## Evidence boundaries

- Static inspection proves only what was observed in files.
- A declared command proves that the command exists, not that it passes.
- Generated evidence and prior logs do not prove current behavior without the originating command and current observation.
- Browser behavior requires fresh browser evidence from `http://localhost:3000`.
- Tests, typechecks, gates, builds, coverage, browser checks, and test-like commands require exact current-session authorization and enabled-hook permission.
- Do not send repository code, secrets, credentials, customer data, or personally identifiable information to external services.

## Citation and accessibility rules

Use descriptive link text, expand acronyms at first use, label status in text, and use language-tagged fences when the language is known. Official guidance includes [W3C writing guidance](https://www.w3.org/WAI/tips/writing/), [Google guidance for accessible documentation](https://developers.google.com/style/accessibility), [Microsoft guidance for scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/), and [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/).
