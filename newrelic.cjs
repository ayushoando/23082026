'use strict';

// Server APM is opt-in through NEW_RELIC_APM_ENABLED=1.  The Browser agent
// remains a separate same-origin loader under site/app/newrelic.js/route.ts.
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'oando-tech-stack'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  agent_enabled: process.env.NEW_RELIC_APM_ENABLED === '1',
  logging: {
    enabled: false,
  },
  application_logging: {
    forwarding: { enabled: false },
    local_decorating: { enabled: false },
  },
  allow_all_headers: false,
  attributes: {
    exclude: [
      'request.headers.*',
      'response.headers.*',
      'request.parameters.*',
    ],
  },
  transaction_tracer: {
    attributes: {
      exclude: [
        'request.headers.*',
        'response.headers.*',
        'request.parameters.*',
      ],
    },
  },
  transaction_events: {
    attributes: {
      exclude: [
        'request.headers.*',
        'response.headers.*',
        'request.parameters.*',
      ],
    },
  },
  error_collector: {
    attributes: {
      exclude: [
        'request.headers.*',
        'response.headers.*',
        'request.parameters.*',
      ],
    },
  },
  opentelemetry: {
    enabled: true,
    traces: { enabled: true },
    metrics: { enabled: true },
  },
  // Next.js already emits native OTel spans; these agent instrumentations
  // would duplicate them, especially for native fetch/undici calls.
  instrumentation: {
    http: { enabled: false },
    next: { enabled: false },
    undici: { enabled: false },
  },
};
