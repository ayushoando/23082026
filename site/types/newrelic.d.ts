import type { EventEmitter } from "node:events";

declare module "newrelic" {
  type NewRelicAgent = EventEmitter & {
    collector?: {
      isConnected?: () => boolean;
    };
  };

  const newrelic: {
    agent?: NewRelicAgent;
  };

  export default newrelic;
}
