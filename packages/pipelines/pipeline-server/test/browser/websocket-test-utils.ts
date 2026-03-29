import type { LiveEvent } from "#shared/schemas/live";
import { mswServer, ws } from "#test-utils/msw";

const LIVE_UPDATES_URL = "ws://localhost/api/live";

export const liveUpdatesSocket = ws.link(LIVE_UPDATES_URL);

export function mockLiveUpdatesSocket() {
  mswServer.use(liveUpdatesSocket.addEventListener("connection", ({ client }) => {
    client.send(JSON.stringify({
      type: "ready",
      workspaceId: "test",
      occurredAt: new Date().toISOString(),
    } satisfies Extract<LiveEvent, { type: "ready" }>));
  }));
}

export function emitLiveUpdate(event: LiveEvent) {
  liveUpdatesSocket.broadcast(JSON.stringify(event));
}
