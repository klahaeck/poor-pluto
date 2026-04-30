"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

const SUGGESTED_PROMPTS = [
  "How do you cope with being reclassified over and over?",
  "What does the Sun feel like from that far away?",
  "Do you still feel close to Charon when everything else feels distant?",
  "What do people on Earth usually get wrong about you?",
];

export default function Home() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );
  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    transport,
  });
  const [input, setInput] = useState("");
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const typingIndicatorShownAtRef = useRef<number | null>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !isBusy;
  const lastMessage = messages.at(-1);
  const isAwaitingPlutoResponse =
    status === "submitted" ||
    (status === "streaming" && lastMessage?.role === "user");

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, status, showTypingIndicator]);

  useEffect(() => {
    if (isAwaitingPlutoResponse || !showTypingIndicator) {
      return;
    }

    const shownAt = typingIndicatorShownAtRef.current ?? Date.now();
    const visibleForMs = Date.now() - shownAt;
    const hideDelayMs = Math.max(500 - visibleForMs, 0);

    const timerId = window.setTimeout(() => {
      setShowTypingIndicator(false);
      typingIndicatorShownAtRef.current = null;
    }, hideDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isAwaitingPlutoResponse, showTypingIndicator]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();

    if (!text || isBusy) {
      return;
    }

    typingIndicatorShownAtRef.current = Date.now();
    setShowTypingIndicator(true);
    void sendMessage({ text });
    setInput("");
  }

  function submitSuggestion(text: string) {
    if (isBusy) {
      return;
    }

    typingIndicatorShownAtRef.current = Date.now();
    setShowTypingIndicator(true);
    void sendMessage({ text });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function resetConversation() {
    stop();
    setInput("");
    setMessages([]);
    setShowTypingIndicator(false);
    typingIndicatorShownAtRef.current = null;
  }

  return (
    <main className="min-h-screen bg-transparent text-zinc-100">
      <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col px-3 py-3 sm:px-5 lg:px-6">
        <section className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            {messages.length > 0 ? (
              <ConversationHeader onReset={resetConversation} />
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
              {messages.length === 0 ? (
                <EmptyState
                  disabled={isBusy}
                  onSuggestionClick={submitSuggestion}
                />
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isAwaitingPlutoResponse && showTypingIndicator ? (
                    <TypingIndicator />
                  ) : null}
                </div>
              )}
              <div ref={scrollAnchorRef} />
            </div>

            {error ? (
              <div className="border-t border-[#ffb4a8]/20 bg-[#321816] px-4 py-3 text-sm text-[#ffd2ca] sm:px-6">
                {error.message}
              </div>
            ) : null}

            <form
              onSubmit={submitMessage}
              className="shrink-0 rounded-lg bg-[#111722] p-3 sm:p-4"
            >
              <div className="flex items-end gap-3">
                <label className="sr-only" htmlFor="chat-input">
                  Message Pluto
                </label>
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  disabled={isBusy}
                  rows={1}
                  placeholder="Ask Pluto anything..."
                  className="max-h-36 min-h-12 flex-1 resize-none rounded-lg border border-white/10 bg-[#080b12] px-4 py-3 text-base leading-6 text-white outline-none transition focus:border-[#8fd5ff] focus:ring-2 focus:ring-[#8fd5ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {isBusy ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="h-12 rounded-lg border border-white/15 px-5 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="h-12 rounded-lg bg-[#8fd5ff] px-5 text-sm font-semibold text-[#080b12] transition hover:bg-[#a8e0ff] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  >
                    Send
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function ConversationHeader({ onReset }: { onReset: () => void }) {
  return (
    <header className="animate-conversation-header shrink-0 border-b border-white/10 pb-4 pt-2 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          aria-label="Return to homepage view"
          className="cursor-pointer rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#8fd5ff]/50"
        >
          <Image
            src="/pluto.svg"
            alt=""
            width={72}
            height={72}
            priority
            className="animate-pluto-soft-float h-16 w-16 drop-shadow-[0_18px_36px_rgba(143,213,255,0.25)]"
          />
        </button>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer text-sm font-medium uppercase tracking-[0.24em] text-[#8fd5ff] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fd5ff]/50"
          >
            Poor Pluto
          </button>
          <p className="mx-auto max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            A quiet chat with the most emotionally battered entity in the solar system.
          </p>
        </div>
      </div>
    </header>
  );
}

function EmptyState({
  disabled,
  onSuggestionClick,
}: {
  disabled: boolean;
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-6 py-10 text-center">
      <Image
        src="/pluto.svg"
        alt=""
        width={96}
        height={96}
        className="animate-pluto-soft-float h-24 w-24 drop-shadow-[0_18px_36px_rgba(143,213,255,0.25)]"
        priority
      />
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#8fd5ff]">
          Poor Pluto
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Start a conversation with Pluto.
        </h2>
        <p className="mx-auto max-w-xl text-base leading-7 text-zinc-400">
          A quiet chat with the most emotionally battered entity in the solar system.
        </p>
      </div>

      <div className="grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestionClick(prompt)}
            className="cursor-pointer rounded-lg border border-white/10 bg-white/4 px-4 py-3 text-left text-sm leading-5 text-zinc-200 transition hover:border-[#8fd5ff]/50 hover:bg-[#122736] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser ? (
        <Image
          src="/pluto.svg"
          alt=""
          width={32}
          height={32}
          className="mt-1 h-8 w-8 shrink-0"
        />
      ) : null}
      <div
        className={`max-w-[min(82%,44rem)] rounded-lg border px-4 py-3 text-sm leading-6 shadow-lg ${
          isUser
            ? "border-[#8fd5ff]/45 bg-[#8fd5ff] text-[#080b12] shadow-[#8fd5ff]/15"
            : "border-white/10 bg-[#171d27] text-zinc-100 shadow-black/20"
        }`}
      >
        {!isUser && <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] opacity-70">
          Pluto
        </p>}
        <div className="space-y-2 whitespace-pre-wrap wrap-break-words">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return <p key={`${message.id}-${index}`}>{part.text}</p>;
            }

            if (part.type === "reasoning") {
              return null;
            }

            return null;
          })}
        </div>
      </div>
    </article>
  );
}

function TypingIndicator() {
  return (
    <article className="flex gap-3">
      <Image
        src="/pluto.svg"
        alt=""
        width={32}
        height={32}
        className="mt-1 h-8 w-8 shrink-0"
      />
      <div className="max-w-[min(82%,44rem)] rounded-lg border border-white/10 bg-[#171d27] px-4 py-3 text-sm leading-6 text-zinc-100 shadow-lg shadow-black/20">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] opacity-70">
          Pluto
        </p>
        <div className="flex items-center pt-2 text-zinc-300">
          {/* <span>Pluto is typing...</span> */}
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8fd5ff]/80" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8fd5ff]/80 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8fd5ff]/80 [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </article>
  );
}

