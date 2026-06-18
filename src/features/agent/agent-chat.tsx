"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
  StopCircle,
  User as UserIcon,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { streamAgentChat, type AgentEvent } from "@/services/agent.service";

/**
 * One turn worth of UI state. We render Claude's reply as a single growing
 * bubble (text deltas append) and surface tool calls as inline cards so
 * the admin can watch which functions the agent is invoking.
 */
type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls: { id: string; name: string; input: unknown; output?: string; error?: boolean }[];
  // Marks the assistant turn as still streaming — gates the spinner.
  streaming?: boolean;
};

const STORAGE_KEY = "ss-admin-agent-history";

/**
 * Storage helpers — we persist the opaque Anthropic `messages` history
 * separately from the UI transcript. On reload we restore the UI from
 * `turns` (rendered shape) and the API history from `messages` (the raw
 * shape the backend needs to keep tool_use blocks aligned).
 */
type Persisted = {
  turns: ChatTurn[];
  history: unknown[];
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") return { turns: [], history: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { turns: [], history: [] };
    return JSON.parse(raw) as Persisted;
  } catch {
    return { turns: [], history: [] };
  }
}

function savePersisted(value: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota or unavailable — silently skip; conversation just won't persist */
  }
}

export function AgentChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount. We defer to `useEffect` because
  // localStorage isn't available during SSR and Next.js would warn about
  // a hydration mismatch otherwise.
  useEffect(() => {
    const persisted = loadPersisted();
    setTurns(persisted.turns);
    setHistory(persisted.history);
    setHydrated(true);
  }, []);

  // Persist after every change once hydrated. Skipping the first run
  // avoids clobbering existing state with the empty initial value.
  useEffect(() => {
    if (!hydrated) return;
    savePersisted({ turns, history });
  }, [hydrated, turns, history]);

  // Auto-scroll to bottom as new text arrives.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  const reset = useCallback(() => {
    setTurns([]);
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;

      const userTurn: ChatTurn = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
        toolCalls: [],
      };
      const assistantId = `a-${Date.now() + 1}`;
      const assistantTurn: ChatTurn = {
        id: assistantId,
        role: "assistant",
        text: "",
        toolCalls: [],
        streaming: true,
      };
      setTurns((prev) => [...prev, userTurn, assistantTurn]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const event of streamAgentChat({
          userText: text,
          history,
          signal: controller.signal,
        })) {
          // Mutate the assistant turn in-place by id. We avoid a closure
          // over `turns` so concurrent updates compose correctly.
          setTurns((prev) =>
            prev.map((t) => {
              if (t.id !== assistantId) return t;
              return applyEvent(t, event);
            }),
          );
          if (event.kind === "done") {
            setHistory(event.messages);
          } else if (event.kind === "error") {
            toast.error(event.message);
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // user clicked stop; nothing to surface
        } else {
          toast.error((err as Error).message ?? "خطای ناشناخته");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        setTurns((prev) =>
          prev.map((t) =>
            t.id === assistantId ? { ...t, streaming: false } : t,
          ),
        );
      }
    },
    [history, streaming],
  );

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">دستیار هوشمند ادمین</span>
        </div>
        <div className="flex items-center gap-1">
          {streaming ? (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <StopCircle className="size-4" />
              توقف
            </Button>
          ) : null}
          {turns.length > 0 && !streaming ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="size-4" />
              مکالمه جدید
            </Button>
          ) : null}
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div ref={scrollerRef} className="px-4 py-4 space-y-4">
          {turns.length === 0 ? (
            <EmptyState />
          ) : (
            turns.map((turn) => <TurnRow key={turn.id} turn={turn} />)
          )}
        </div>
      </ScrollArea>

      <footer className="border-t border-border p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="مثلاً: برچسب‌های در انتظار تأیید را نشانم بده"
            rows={2}
            className="resize-none flex-1"
            disabled={streaming}
          />
          <Button
            type="submit"
            size="sm"
            disabled={streaming || !input.trim()}
            className="shrink-0"
          >
            {streaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            ارسال
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Enter برای ارسال • Shift+Enter برای خط جدید
        </p>
      </footer>
    </Card>
  );
}

/* ----------------------------- helpers ----------------------------- */

/**
 * Fold one streamed event into the assistant turn's UI state. Keeping
 * this pure makes the reducer pattern in `setTurns` easy to reason about.
 */
function applyEvent(turn: ChatTurn, event: AgentEvent): ChatTurn {
  switch (event.kind) {
    case "text_delta":
      return { ...turn, text: turn.text + event.text };
    case "tool_use":
      return {
        ...turn,
        toolCalls: [
          ...turn.toolCalls,
          { id: event.id, name: event.name, input: event.input },
        ],
      };
    case "tool_result":
      return {
        ...turn,
        toolCalls: turn.toolCalls.map((tc) =>
          tc.id === event.tool_use_id
            ? { ...tc, output: event.output, error: event.is_error }
            : tc,
        ),
      };
    case "turn_end":
    case "done":
    case "error":
    default:
      return turn;
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <Sparkles className="size-8 mb-3" />
      <p className="text-sm font-medium text-foreground">
        از من بپرسید چه کاری انجام دهم
      </p>
      <p className="mt-1 text-xs">مثال‌ها:</p>
      <ul className="mt-3 space-y-1 text-xs">
        <li>«برچسب‌های در انتظار تأیید را نشانم بده»</li>
        <li>«آمار کلی پاسخ‌ها چقدر است؟»</li>
        <li>«پاسخ ۱۲۳ را پنهان کن»</li>
      </ul>
    </div>
  );
}

function TurnRow({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";
  return (
    <div
      className={`flex gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div className="shrink-0 size-7 rounded-full bg-muted flex items-center justify-center">
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
        {turn.text ? (
          <div
            className={`inline-block max-w-full rounded-lg px-3 py-2 text-sm leading-7 whitespace-pre-wrap ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {turn.text}
            {turn.streaming && !turn.text ? (
              <Loader2 className="inline size-3 animate-spin" />
            ) : null}
          </div>
        ) : turn.streaming ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            در حال فکر کردن…
          </div>
        ) : null}
        {turn.toolCalls.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {turn.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} call={tc} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToolCallCard({
  call,
}: {
  call: ChatTurn["toolCalls"][number];
}) {
  const [open, setOpen] = useState(false);
  const pending = call.output === undefined;
  return (
    <div className="rounded-md border border-border bg-card text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-accent/40"
      >
        <Wrench className="size-3.5 text-muted-foreground" />
        <code className="font-mono">{call.name}</code>
        {pending ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : call.error ? (
          <span className="text-destructive">خطا</span>
        ) : (
          <span className="text-emerald-600">انجام شد</span>
        )}
        <ChevronDown
          className={`size-3 ms-auto transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-2.5 py-2 space-y-2 bg-muted/30">
          <details>
            <summary className="cursor-pointer text-muted-foreground">
              ورودی
            </summary>
            <pre className="mt-1 overflow-x-auto text-[11px]" dir="ltr">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </details>
          {call.output !== undefined ? (
            <details open>
              <summary className="cursor-pointer text-muted-foreground">
                خروجی
              </summary>
              <pre className="mt-1 overflow-x-auto text-[11px]" dir="ltr">
                {call.output}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
