import { env } from "@/config/env";
import { storage } from "@/lib/storage";

/**
 * Event shapes streamed by the backend `/api/agent/chat` SSE endpoint.
 * Keep these in sync with `back-sefidsia/src/modules/agent/agent.service.ts`
 * → `AgentStreamEvent`.
 */
export type AgentTextDelta = { kind: "text_delta"; text: string };
export type AgentToolUse = {
  kind: "tool_use";
  id: string;
  name: string;
  input: unknown;
};
export type AgentToolResult = {
  kind: "tool_result";
  tool_use_id: string;
  output: string;
  is_error: boolean;
};
export type AgentTurnEnd = { kind: "turn_end"; stop_reason: string | null };
export type AgentDone = {
  kind: "done";
  // The full conversation history (raw Anthropic MessageParam[]) to keep
  // for the next turn. We treat it as opaque on the client — only pass
  // it back unchanged in the `history` field of the next request.
  messages: unknown[];
};
export type AgentError = { kind: "error"; message: string };

export type AgentEvent =
  | AgentTextDelta
  | AgentToolUse
  | AgentToolResult
  | AgentTurnEnd
  | AgentDone
  | AgentError;

/**
 * Open a streaming chat turn against the backend. Yields events as they
 * arrive — text deltas, tool calls, tool results, then a final `done`
 * with the updated message history.
 *
 * We use raw `fetch` here (NOT the shared `api` axios instance) because:
 *   1. axios doesn't expose the raw Response stream we need to parse SSE
 *      frames incrementally
 *   2. `EventSource` would handle SSE parsing for us but can't carry an
 *      `Authorization` header, so we'd be forced to pass the JWT as a
 *      query param — visible in server access logs, a real footgun
 *
 * Cancellation: pass `signal` from an AbortController to abort mid-turn
 * (the backend tears down its own upstream stream on socket close).
 */
export async function* streamAgentChat(opts: {
  userText: string;
  history: unknown[];
  signal?: AbortSignal;
}): AsyncGenerator<AgentEvent> {
  const token = storage.get(env.storageKey.accessToken);
  const res = await fetch(`${env.apiUrl}/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      userText: opts.userText,
      history: opts.history,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.message ?? detail;
    } catch {
      /* response body wasn't JSON; keep the status code */
    }
    yield { kind: "error", message: detail };
    return;
  }
  if (!res.body) {
    yield { kind: "error", message: "پاسخی از سرور دریافت نشد" };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by `\n\n`. Pull complete frames out of
      // the buffer; whatever's left is incomplete and waits for more
      // bytes on the next read.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        // Skip comment frames (`: ping`) used as heartbeats.
        if (frame.startsWith(":")) continue;

        // Each frame has a sequence of lines; we only care about the
        // `data:` payload here (the `event:` line is informational —
        // the data itself carries the discriminator `kind`).
        const dataLines: string[] = [];
        for (const line of frame.split("\n")) {
          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
        if (dataLines.length === 0) continue;

        try {
          const parsed = JSON.parse(dataLines.join("\n")) as AgentEvent;
          yield parsed;
        } catch {
          // Malformed frame — surface to user but keep streaming.
          yield { kind: "error", message: "فریم نامعتبر از سرور" };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
