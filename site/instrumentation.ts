import { registerOTel } from "@vercel/otel";
import { registerTelemetry } from "ai";
import { OpenTelemetry } from "@ai-sdk/otel";

async function loadNewRelicAgent() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEW_RELIC_APM_ENABLED !== "1"
  ) {
    return;
  }

  if (!process.env.NEW_RELIC_CONFIG_FILE) {
    const fs = await import(/* webpackIgnore: true */ "node:fs");
    const path = await import(/* webpackIgnore: true */ "node:path");
    const candidates = [
      path.resolve(process.cwd(), "config/observability/newrelic.cjs"),
      path.resolve(process.cwd(), "../config/observability/newrelic.cjs"),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      process.env.NEW_RELIC_CONFIG_FILE = found;
    }
  }

  const { default: newrelic } = await import(
    /* webpackIgnore: true */ "newrelic",
  );
  const agent = newrelic?.agent;
  if (!agent || agent.collector?.isConnected?.()) {
    return;
  }

  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      agent.removeListener("started", done);
      agent.removeListener("errored", done);
      resolve();
    };
    const timer = setTimeout(done, 8000);
    agent.once("started", done);
    agent.once("errored", done);
  });
}

export async function register() {
  await loadNewRelicAgent();

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "oando-web",
  });

  registerTelemetry(new OpenTelemetry());
}
