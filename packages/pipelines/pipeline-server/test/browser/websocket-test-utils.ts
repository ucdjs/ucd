import { vi } from "vitest";

export class MockWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readonly url: string;
  readonly protocol = "";
  readonly extensions = "";
  binaryType: BinaryType = "blob";
  bufferedAmount = 0;
  readyState = MockWebSocket.CONNECTING;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    MockWebSocket.instances.push(this);

    queueMicrotask(() => {
      if (this.readyState !== MockWebSocket.CONNECTING) {
        return;
      }

      this.readyState = MockWebSocket.OPEN;
      this.emitOpen();
    });
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

  close() {
    if (this.readyState === MockWebSocket.CLOSING || this.readyState === MockWebSocket.CLOSED) {
      return;
    }

    this.readyState = MockWebSocket.CLOSED;
    this.emitClose();
  }

  emitOpen() {
    const event = new Event("open");
    this.dispatchEvent(event);
    this.onopen?.(event);
  }

  emitMessage(data: unknown) {
    const event = new MessageEvent("message", { data });
    this.dispatchEvent(event);
    this.onmessage?.(event);
  }

  emitError() {
    const event = new Event("error");
    this.dispatchEvent(event);
    this.onerror?.(event);
  }

  emitClose() {
    const event = new Event("close");
    this.dispatchEvent(event);
    this.onclose?.(event);
  }

  static reset() {
    for (const instance of MockWebSocket.instances) {
      instance.readyState = MockWebSocket.CLOSED;
    }

    MockWebSocket.instances = [];
  }
}

export function installMockWebSocket() {
  vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
}

export function getMockWebSockets() {
  return [...MockWebSocket.instances];
}

export function getLatestMockWebSocket(): MockWebSocket {
  const websocket = MockWebSocket.instances.at(-1);
  if (!websocket) {
    throw new Error("Expected an active mock websocket connection.");
  }

  return websocket;
}
