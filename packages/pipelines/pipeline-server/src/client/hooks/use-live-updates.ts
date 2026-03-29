import { sourceQueryOptions } from "#queries/source";
import { sourceOverviewQueryOptions } from "#queries/source-overview";
import { sourcesQueryOptions } from "#queries/sources";
import { LiveEventSchema } from "#shared/schemas/live";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 5_000;

function getLiveUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/live`;
}

export function useLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const liveUrl = getLiveUrl();
    if (!liveUrl) {
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let disposed = false;

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    async function invalidateSources() {
      await queryClient.invalidateQueries({
        queryKey: sourcesQueryOptions().queryKey,
        exact: true,
      });
    }

    async function invalidateSource(sourceId: string) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sourcesQueryOptions().queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: sourceQueryOptions({ sourceId }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: sourceOverviewQueryOptions({ sourceId }).queryKey,
        }),
      ]);
    }

    function cleanupSocket() {
      if (!socket) {
        return;
      }

      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
      socket = null;
    }

    function scheduleReconnect() {
      if (disposed || reconnectTimer) {
        return;
      }

      const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts, RECONNECT_MAX_DELAY_MS);
      reconnectAttempts += 1;
      // eslint-disable-next-line no-console
      console.debug("[live-updates] schedule reconnect", { delay, reconnectAttempts });
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    }

    function connect() {
      if (disposed) {
        return;
      }

      clearReconnectTimer();
      cleanupSocket();

      const currentSocket = new WebSocket(liveUrl!);
      socket = currentSocket;
      // eslint-disable-next-line no-console
      console.debug("[live-updates] connect", { liveUrl });

      currentSocket.onopen = () => {
        if (socket !== currentSocket) {
          return;
        }

        reconnectAttempts = 0;
        // eslint-disable-next-line no-console
        console.debug("[live-updates] open");
      };

      currentSocket.onmessage = (event) => {
        if (socket !== currentSocket || typeof event.data !== "string") {
          return;
        }

        // eslint-disable-next-line no-console
        console.debug("[live-updates] raw message", event.data);

        let rawEvent: unknown;
        try {
          rawEvent = JSON.parse(event.data);
        } catch {
          // eslint-disable-next-line no-console
          console.debug("[live-updates] ignore invalid json", event.data);
          return;
        }

        const parsed = LiveEventSchema.safeParse(rawEvent);
        if (!parsed.success) {
          // eslint-disable-next-line no-console
          console.debug("[live-updates] ignore invalid message", rawEvent);
          return;
        }

        // eslint-disable-next-line no-console
        console.debug("[live-updates] message", parsed.data);

        switch (parsed.data.type) {
          case "ready": {
            void invalidateSources();
            break;
          }
          case "source.changed": {
            void invalidateSource(parsed.data.sourceId);
            break;
          }
        }
      };

      currentSocket.onclose = (event) => {
        if (socket !== currentSocket) {
          return;
        }

        socket = null;
        // eslint-disable-next-line no-console
        console.debug("[live-updates] close", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        scheduleReconnect();
      };

      currentSocket.onerror = () => {
        if (socket !== currentSocket) {
          return;
        }

        // eslint-disable-next-line no-console
        console.debug("[live-updates] error");
        currentSocket.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      // eslint-disable-next-line no-console
      console.debug("[live-updates] dispose");
      clearReconnectTimer();
      cleanupSocket();
    };
  }, [queryClient]);
}
