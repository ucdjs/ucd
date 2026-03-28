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

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) {
        return;
      }

      const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts, RECONNECT_MAX_DELAY_MS);
      reconnectAttempts += 1;
      console.debug("[live-updates] schedule reconnect", { delay, reconnectAttempts });
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const cleanupSocket = () => {
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
        socket = null;
      }
    };

    const connect = () => {
      if (disposed) {
        return;
      }

      clearReconnectTimer();
      cleanupSocket();

      const currentSocket = new WebSocket(liveUrl);
      socket = currentSocket;
      console.debug("[live-updates] connect", { liveUrl });

      currentSocket.onopen = () => {
        reconnectAttempts = 0;
        console.debug("[live-updates] open");
        void queryClient.invalidateQueries({
          queryKey: ["sources"],
        });
      };

      currentSocket.onmessage = (event) => {
        if (typeof event.data !== "string") {
          return;
        }

        let rawEvent: unknown;
        try {
          rawEvent = JSON.parse(event.data);
        } catch {
          return;
        }

        const parsed = LiveEventSchema.safeParse(rawEvent);
        if (!parsed.success) {
          console.debug("[live-updates] ignore invalid message", rawEvent);
          return;
        }

        console.debug("[live-updates] message", parsed.data);

        if (parsed.data.type === "source.changed") {
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["sources"],
              exact: true,
            }),
            queryClient.invalidateQueries({
              queryKey: ["sources", parsed.data.sourceId],
            }),
          ]);
        }
      };

      currentSocket.onclose = (event) => {
        console.debug("[live-updates] close", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        if (socket === currentSocket) {
          socket = null;
        }

        scheduleReconnect();
      };

      currentSocket.onerror = () => {
        console.debug("[live-updates] error");
        currentSocket.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      console.debug("[live-updates] dispose");
      clearReconnectTimer();
      cleanupSocket();
    };
  }, [queryClient]);
}
