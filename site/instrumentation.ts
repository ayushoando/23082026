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

  const { default: newrelic } = await import("newrelic");
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
    serviceName: process.env.OTEL_SERVICE_NAME ?? "ai-planner-backend",
  });

  registerTelemetry(new OpenTelemetry());
}
